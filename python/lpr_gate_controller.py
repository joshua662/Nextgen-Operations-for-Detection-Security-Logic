#!/usr/bin/env python
import os
import re
import time
import sys
import threading
import queue
import requests

# Try importing camera/LPR dependencies
try:
    import cv2
    import easyocr
    import numpy as np
    LPR_AVAILABLE = True
except ImportError:
    LPR_AVAILABLE = False
    print("Note: Camera/LPR libraries (cv2, easyocr, numpy) not fully installed.")
    print("      RFID gate access will still work. LPR camera features are disabled.")

# Try importing serial (pyserial)
try:
    import serial
    import serial.tools.list_ports
except ImportError:
    print("Warning: 'pyserial' is not installed. Running in Serial Simulation Mode.")
    serial = None

# ==========================================
# ENVIRONMENT CONFIGURATION LOADER
# ==========================================
def load_env_file():
    """Loads environment variables from the server/.env file if it exists."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    paths = [
        os.path.join(script_dir, "../server/.env"),
        os.path.join(script_dir, ".env"),
        os.path.join(os.getcwd(), "server/.env"),
        os.path.join(os.getcwd(), ".env")
    ]
    for path in paths:
        if os.path.exists(path):
            print(f"Loading environment variables from: {os.path.abspath(path)}")
            try:
                with open(path, "r") as f:
                    for line in f:
                        line = line.strip()
                        if not line or line.startswith("#"):
                            continue
                        if "=" in line:
                            key, val = line.split("=", 1)
                            val = val.strip().strip('"').strip("'")
                            os.environ[key.strip()] = val
                break
            except Exception as e:
                print(f"Error loading env file {path}: {e}")

# Load server environment variables first
load_env_file()

# ==========================================
# CONFIGURATION CONSTANTS
# ==========================================
API_BASE_URL = os.environ.get("API_BASE_URL", "http://127.0.0.1:8000/api")
API_USERNAME = os.environ.get("API_USERNAME", "johndoe")
API_PASSWORD = os.environ.get("API_PASSWORD", "johndoe")
API_LOGIN_PATH = os.environ.get("API_LOGIN_PATH", "/auth/admin/login")

# Camera Setup
# Entrance ESP32-CAM stream (used for LPR at gate entry)
ENTRANCE_CAMERA_SOURCE = os.environ.get("ESP32_CAM_ENTRANCE_STREAM_URL") or os.environ.get("ESP32_CAM_STREAM_URL") or "http://192.168.2.100:81/stream"
# Exit ESP32-CAM stream (monitoring only on guard dashboard)
EXIT_CAMERA_SOURCE = os.environ.get("ESP32_CAM_EXIT_STREAM_URL") or "http://192.168.2.105:81/stream"
# Active camera for LPR processing
CAMERA_SOURCE = ENTRANCE_CAMERA_SOURCE

# Serial Configuration
SERIAL_PORT = os.environ.get("SERIAL_PORT") or None
BAUD_RATE = 9600

# OCR/LPR Settings
COOLDOWN_PERIOD = 10     
CONFIDENCE_THRESHOLD = 0.5 

# ==========================================
# GLOBAL STATE
# ==========================================
token = None
headers = {}
arduino = None
gate_state = "closed"
entrance_gate_state = "closed"
exit_gate_state = "closed"
last_scanned_plates = {}
running = True
lpr_lock = threading.Lock()

# ==========================================
# ARDUINO SERIAL CONNECTION
# ==========================================
def find_arduino_port():
    if serial is None:
        return None
    ports = list(serial.tools.list_ports.comports())
    if not ports:
        return None
    for p in ports:
        desc = p.description.lower()
        if any(kw in desc for kw in ["arduino", "ch340", "usb serial", "ftdi", "cp210", "usb-to-uart", "uart", "prolific", "ser"]):
            print(f"Auto-detected Arduino on port: {p.device} ({p.description})")
            return p.device
    print(f"Fallback: Auto-detecting first available port: {ports[0].device} ({ports[0].description})")
    return ports[0].device

def init_serial():
    global arduino
    if serial is None:
        print("Serial module not available. Running in Simulation Mode.")
        return False
    port = SERIAL_PORT or find_arduino_port()
    if not port:
        print("Error: No serial port found. Connect your Arduino or set SERIAL_PORT in config. Running in Simulation Mode.")
        return False
    try:
        arduino = serial.Serial(port, BAUD_RATE, timeout=1)
        time.sleep(2)
        print(f"Connected to Arduino on port {port} at {BAUD_RATE} baud.")
        return True
    except Exception as e:
        print(f"Error opening serial port {port}: {e}. Running in Simulation Mode.")
        arduino = None
        return False

def close_command_for_gate(gate_command):
    return 'C' if gate_command == 'O' else 'Z'

def send_arduino_command(cmd):
    global gate_state, entrance_gate_state, exit_gate_state
    if cmd == 'O':
        entrance_gate_state = "open"
        gate_state = "open"
    elif cmd == 'X':
        exit_gate_state = "open"
        gate_state = "open"
    elif cmd == 'C':
        entrance_gate_state = "closed"
        gate_state = "closed" if exit_gate_state == "closed" else "open"
    elif cmd == 'Z':
        exit_gate_state = "closed"
        gate_state = "closed" if entrance_gate_state == "closed" else "open"

    if arduino and arduino.is_open:
        try:
            arduino.write(cmd.encode())
            print(f"[Serial -> Arduino] Sent: '{cmd}'")
        except Exception as e:
            print(f"Serial write error: {e}")
    else:
        print(f"[Serial Simulation] Arduino received command: '{cmd}' (State: {gate_state.upper()})")

# ==========================================
# LARAVEL BACKEND API COMMUNICATION
# ==========================================
def login_to_laravel():
    global token, headers
    print(f"Authenticating with Laravel API at {API_BASE_URL}...")
    login_attempts = [
        API_LOGIN_PATH,
        "/auth/admin/login",
        "/auth/login",
    ]
    seen_paths = set()
    payload = {
        "username": API_USERNAME,
        "password": API_PASSWORD
    }
    for login_path in login_attempts:
        if login_path in seen_paths:
            continue
        seen_paths.add(login_path)
        login_url = f"{API_BASE_URL}{login_path}"
        try:
            response = requests.post(login_url, json=payload, timeout=5)
            if response.status_code == 200:
                data = response.json()
                token = data.get("token")
                headers = {
                    "Authorization": f"Bearer {token}",
                    "Accept": "application/json"
                }
                print(f"Successfully authenticated with Laravel backend via {login_path}!")
                return True
            print(f"Authentication via {login_path} failed (HTTP {response.status_code}): {response.text}")
        except Exception as e:
            print(f"Network error authenticating via {login_path}: {e}")
    print("Warning: Dashboard sync is disabled until authentication succeeds. RFID/LPR verification still works.")
    return False

def sync_gate_status_with_laravel(status):
    global gate_state, entrance_gate_state, exit_gate_state
    gate_state = status
    if status == "closed":
        entrance_gate_state = "closed"
        exit_gate_state = "closed"
    if not token:
        return
    toggle_url = f"{API_BASE_URL}/gate/toggle"
    payload = {"gate_status": status}
    try:
        response = requests.put(toggle_url, json=payload, headers=headers, timeout=3)
        if response.status_code == 200:
            print(f"Successfully synced gate status '{status}' to Laravel.")
        else:
            print(f"Failed to sync gate status (HTTP {response.status_code}): {response.text}")
    except Exception as e:
        print(f"Network error syncing gate status: {e}")

# ==========================================
# CAMERA SNAPSHOT CAPTURE HELPERS
# ==========================================
def resolve_capture_urls(stream_url):
    if not stream_url:
        return []

    trimmed = stream_url.strip().rstrip("/")
    candidates = []

    if re.search(r"/stream/?$", trimmed, flags=re.I):
        candidates.append(re.sub(r"/stream/?$", "/capture", trimmed, flags=re.I))
        candidates.append(re.sub(r"/stream/?$", "/jpg", trimmed, flags=re.I))

    if ":81" in trimmed:
        without_stream_port = trimmed.replace(":81", "")
        candidates.append(re.sub(r"/stream/?$", "/capture", without_stream_port, flags=re.I))
        candidates.append(re.sub(r"/stream/?$", "/jpg", without_stream_port, flags=re.I))

    candidates.append(trimmed)

    unique_candidates = []
    seen = set()
    for url in candidates:
        if url and url not in seen:
            seen.add(url)
            unique_candidates.append(url)
    return unique_candidates

def capture_snapshot_from_camera(direction):
    """Fetches a single JPEG frame from the camera corresponding to the direction."""
    source = EXIT_CAMERA_SOURCE if direction == "OUT" else ENTRANCE_CAMERA_SOURCE
    if not source:
        return None

    capture_urls = resolve_capture_urls(source)
    print(f"Attempting to capture snapshot for {direction or 'IN'} gate from camera source: {source}")
    for capture_url in capture_urls:
        try:
            response = requests.get(
                capture_url,
                timeout=1.0,
                headers={"Accept": "image/*"},
            )
            content_type = response.headers.get("Content-Type", "")
            if response.status_code == 200 and content_type.startswith("image/"):
                return response.content
            print(
                f"HTTP snapshot failed for {capture_url} "
                f"(status: {response.status_code}, content-type: {content_type})"
            )
        except Exception as e:
            print(f"Error fetching HTTP snapshot from {capture_url}: {e}")

    # Avoid blocking the gate verification threads with OpenCV video capture fallback
    return None

# ==========================================
# RFID VERIFICATION LOGIC
# ==========================================
def normalize_rfid_uid(rfid_uid: str) -> str:
    return re.sub(r'[^A-Fa-f0-9]', '', rfid_uid).upper()

def process_rfid_verification(rfid_uid, direction=None):
    """Processes RFID verification and opens the correct gate if authorized."""
    normalized_uid = normalize_rfid_uid(rfid_uid)
    verify_url = f"{API_BASE_URL}/gate/verify"
    
    # Prepare files and data for multipart form data
    data = {
        "rfid_card_uid": normalized_uid,
    }
    if direction:
        data["direction"] = direction

    image_bytes = capture_snapshot_from_camera(direction)
    files = {}
    if image_bytes:
        files = {
            "capture_image": ("capture.jpg", image_bytes, "image/jpeg")
        }

    print(f"Verifying RFID '{normalized_uid}' with Laravel API...")
    print(f"Request payload: {data} (with capture image: {bool(image_bytes)})")
    try:
        req_headers = headers.copy()
        if "Content-Type" in req_headers:
            del req_headers["Content-Type"]

        if files:
            response = requests.post(verify_url, data=data, files=files, headers=req_headers, timeout=10)
        else:
            response = requests.post(verify_url, json=data, headers=headers, timeout=5)

        if response.status_code == 200:
            res_data = response.json()
            print(f"Verify response: {res_data}")
            authorized = res_data.get("authorized", False)
            gate_command = res_data.get("gate_command")
            gate_action = res_data.get("gate_action")
            resident_user = res_data.get("resident_username") or res_data.get("resident_name")

            if authorized:
                resolved_direction = (res_data.get("direction") or direction or "IN").upper()
                gate_command = gate_command or ('O' if resolved_direction == 'IN' else 'X')
                if resident_user:
                    print(f"ACCESS GRANTED for RFID: {normalized_uid} -> Resident: {resident_user}")
                else:
                    print(f"ACCESS GRANTED for RFID: {normalized_uid}")
                print(f"Backend gate action: {gate_action} | Direction: {resolved_direction} | Command: {gate_command}")

                send_arduino_command(gate_command)

                if arduino is None:
                    time.sleep(7)
                    print("Simulation: Timer expired, closing gate...")
                    send_arduino_command(close_command_for_gate(gate_command))
            else:
                print(f"ACCESS DENIED for RFID: {normalized_uid}")
        else:
            print(f"RFID verification failed (HTTP {response.status_code}): {response.text}")
    except Exception as e:
        print(f"Network error during RFID verification: {e}")

# ==========================================
# LICENSE PLATE RECOGNITION (LPR) LOGIC
# ==========================================
def preprocess_plate_contour(frame):
    if not LPR_AVAILABLE:
        return None, None
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    blur = cv2.bilateralFilter(gray, 11, 17, 17)
    edged = cv2.Canny(blur, 30, 200)
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]
    
    screenCnt = None
    for c in contours:
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.018 * peri, True)
        if len(approx) == 4:
            screenCnt = approx
            break
            
    if screenCnt is not None:
        mask = np.zeros(gray.shape, np.uint8)
        new_image = cv2.drawContours(mask, [screenCnt], 0, 255, -1)
        new_image = cv2.bitwise_and(frame, frame, mask=mask)
        (x, y) = np.where(mask == 255)
        (topx, topy) = (np.min(x), np.min(y))
        (bottomx, bottomy) = (np.max(x), np.max(y))
        cropped = gray[topx:bottomx+1, topy:bottomy+1]
        return cropped, (topy, topx, bottomy, bottomx)
    return None, None

def clean_plate_text(text):
    cleaned = re.sub(r'[^A-Za-z0-9]', '', text)
    return cleaned.upper()

def verify_plate_with_laravel(plate_number, direction="IN", image_bytes=None):
    verify_url = f"{API_BASE_URL}/gate/verify"
    data = {
        "plate_number": plate_number,
        "direction": direction
    }
    files = {}
    if image_bytes:
        files = {
            "capture_image": ("capture.jpg", image_bytes, "image/jpeg")
        }
    print(f"Verifying plate '{plate_number}' with Laravel API...")
    try:
        req_headers = headers.copy()
        if "Content-Type" in req_headers:
            del req_headers["Content-Type"]
        if files:
            response = requests.post(verify_url, data=data, files=files, headers=req_headers, timeout=10)
        else:
            response = requests.post(verify_url, json=data, headers=headers, timeout=5)
            
        if response.status_code == 200:
            res_data = response.json()
            authorized = res_data.get("authorized", False)
            laravel_gate_status = res_data.get("gate_status", "closed")
            print(
                f"API Result: Authorized={authorized}, Gate Status={laravel_gate_status}, "
                f"Direction={res_data.get('direction')}, Command={res_data.get('gate_command')}"
            )
            return res_data
        else:
            print(f"Verification request failed (HTTP {response.status_code}): {response.text}")
            return None
    except Exception as e:
        print(f"Network error during plate verification: {e}")
        return None

def process_plate_verification(plate_number, frame=None, direction="IN"):
    image_bytes = None
    if frame is not None and LPR_AVAILABLE:
        try:
            success, encoded = cv2.imencode('.jpg', frame)
            if success:
                image_bytes = encoded.tobytes()
        except Exception as e:
            print(f"Error encoding frame for plate verification: {e}")

    result = verify_plate_with_laravel(plate_number, direction=direction, image_bytes=image_bytes)
    if not result:
        print(f"ACCESS DENIED for plate: {plate_number}")
        return

    authorized = result.get("authorized", False)
    if authorized:
        resolved_direction = (result.get("direction") or direction or "IN").upper()
        gate_command = result.get("gate_command") or ('O' if resolved_direction == 'IN' else 'X')
        print(f"ACCESS GRANTED for plate: {plate_number} | Direction: {resolved_direction} | Command: {gate_command}")
        send_arduino_command(gate_command)
        if arduino is None:
            time.sleep(7)
            print("Simulation: Timer expired, closing gate...")
            send_arduino_command(close_command_for_gate(gate_command))
    else:
        print(f"ACCESS DENIED for plate: {plate_number}")

def process_lpr_frame(frame, reader, direction):
    global last_scanned_plates
    if frame is None:
        return

    # Save the frame to public storage for multi-client sharing via Laravel
    try:
        filename = "camera_entrance.jpg" if direction.upper() == "IN" else "camera_exit.jpg"
        script_dir = os.path.dirname(os.path.abspath(__file__))
        storage_path = os.path.abspath(os.path.join(script_dir, "../server/public", filename))
        os.makedirs(os.path.dirname(storage_path), exist_ok=True)
        cv2.imwrite(storage_path, frame)
    except Exception:
        pass
    try:
        h, w, _ = frame.shape
        roi = frame[int(h*0.3):int(h*0.8), int(w*0.2):int(w*0.8)]
        
        # Serialize EasyOCR execution using the global lock to prevent race conditions or GPU out-of-memory
        with lpr_lock:
            results = reader.readtext(roi)

        for (bbox, text, prob) in results:
            if prob >= CONFIDENCE_THRESHOLD:
                cleaned_plate = clean_plate_text(text)
                if len(cleaned_plate) >= 4:
                    current_time = time.time()
                    # Cache plates based on name and direction to allow dual verification
                    cache_key = f"{cleaned_plate}_{direction}"
                    if (cache_key not in last_scanned_plates or
                            (current_time - last_scanned_plates[cache_key]) > COOLDOWN_PERIOD):
                        last_scanned_plates[cache_key] = current_time
                        print(f"\n[LPR Detected] Plate: {cleaned_plate} | Gate: {direction} (Confidence: {prob:.2f})")

                        frame_copy = frame.copy()
                        verify_thread = threading.Thread(
                            target=process_plate_verification,
                            args=(cleaned_plate, frame_copy, direction)
                        )
                        verify_thread.daemon = True
                        verify_thread.start()
    except Exception as e:
        print(f"LPR frame processing error ({direction} gate): {e}")

def lpr_main(camera_source, direction):
    global last_scanned_plates, running
    if not LPR_AVAILABLE:
        print(f"Camera/LPR dependencies unavailable. Staying in RFID-only mode for {direction} gate.")
        while running:
            time.sleep(1)
        return

    reader = None
    cap = None

    while running:
        try:
            if reader is None:
                print(f"\nInitializing EasyOCR Reader for {direction} gate...")
                try:
                    reader = easyocr.Reader(['en'], gpu=True)
                except Exception:
                    print(f"GPU unavailable for EasyOCR ({direction} gate). Falling back to CPU mode.")
                    reader = easyocr.Reader(['en'], gpu=False)
                print(f"EasyOCR for {direction} gate loaded successfully!")

            # Check if source is a web-based MJPEG stream
            use_custom_mjpeg = isinstance(camera_source, str) and (
                camera_source.startswith("http://") or camera_source.startswith("https://")
            )

            if use_custom_mjpeg:
                print(f"Connecting to {direction} MJPEG source via custom HTTP reader: {camera_source}...")
                try:
                    response = requests.get(camera_source, stream=True, timeout=5)
                    if response.status_code != 200:
                        print(f"[ERROR] {direction} Camera at {camera_source} is NOT CONNECTED (HTTP {response.status_code})! Retrying in 5 seconds...")
                        time.sleep(5)
                        continue
                except Exception as e:
                    print(f"[ERROR] {direction} Camera at {camera_source} is OFFLINE / UNREACHABLE! Retrying in 5 seconds...")
                    time.sleep(5)
                    continue

                print(f"[SUCCESS] {direction} Camera at {camera_source} is CONNECTED and active!")
                print(f"\nNextgen Operations LPR Gate Controller (Custom HTTP MJPEG Reader) for {direction} gate is running!")
                bytes_data = bytes()

                # Process MJPEG multipart boundary stream chunk by chunk
                for chunk in response.iter_content(chunk_size=4096):
                    if not running:
                        break
                    bytes_data += chunk
                    
                    # Locate boundaries of JPEG frames (\xff\xd8 and \xff\xd9)
                    while True:
                        a = bytes_data.find(b'\xff\xd8')
                        b = bytes_data.find(b'\xff\xd9')
                        if a != -1 and b != -1 and a < b:
                            jpg_bytes = bytes_data[a:b+2]
                            bytes_data = bytes_data[b+2:]
                            
                            # Decode byte stream into OpenCV frame image
                            try:
                                frame = cv2.imdecode(np.frombuffer(jpg_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
                                if frame is not None:
                                    process_lpr_frame(frame, reader, direction)
                            except Exception:
                                pass
                        else:
                            # Clear older buffered data if it's invalid/corrupt
                            if len(bytes_data) > 65536:
                                bytes_data = bytes_data[-1024:]
                            break
                    time.sleep(0.001)

            else:
                print(f"Connecting to {direction} video source: {camera_source}...")
                cap = cv2.VideoCapture(camera_source)
                if not cap.isOpened():
                    print(f"[ERROR] {direction} Video source {camera_source} is OFFLINE / UNREACHABLE! Retrying in 5 seconds...")
                    if cap:
                        cap.release()
                    cap = None
                    time.sleep(5)
                    continue

                print(f"[SUCCESS] {direction} Video source {camera_source} is CONNECTED and active!")
                print(f"\nNextgen Operations LPR Gate Controller for {direction} gate is running!")
                while running:
                    ret, frame = cap.read()
                    if not ret:
                        print(f"Failed to grab camera frame ({direction} gate). Retrying...")
                        break

                    process_lpr_frame(frame, reader, direction)
                    time.sleep(0.01)

                if cap is not None:
                    cap.release()
                    cap = None

            if running:
                print(f"Camera feed disconnected/stream ended for {direction} gate. Retrying in 5 seconds...")
                time.sleep(5)

        except KeyboardInterrupt:
            print("\nShutdown signal received.")
            running = False
            break
        except Exception as e:
            print(f"Unexpected camera/LPR error: {e}. Retrying in 5 seconds...")
            if cap is not None:
                try:
                    cap.release()
                except Exception:
                    pass
                cap = None
            reader = None
            time.sleep(5)

    try:
        cv2.destroyAllWindows()
    except Exception:
        pass

# ==========================================
# SERIAL READER & SYNC THREADS
# ==========================================
def serial_reader_thread():
    """Background thread that listens for signals sent by the Arduino (e.g. vehicle passed, blocked)."""
    global running, gate_state, entrance_gate_state, exit_gate_state
    print("Serial reader background thread started.")
    
    while running:
        if arduino and arduino.is_open:
            try:
                if arduino.in_waiting > 0:
                    line = arduino.readline().decode('utf-8').strip()
                    if not line:
                        continue
                    
                    print(f"[Arduino -> Serial] {line}")
                    
                    if line == "PASSED":
                        print("Vehicle successfully passed entrance. Updating gate status to closed...")
                        entrance_gate_state = "closed"
                        gate_state = "closed" if exit_gate_state == "closed" else "open"
                        sync_gate_status_with_laravel("closed")
                    elif line == "EXIT_PASSED":
                        print("Vehicle successfully passed exit. Updating gate status to closed...")
                        exit_gate_state = "closed"
                        gate_state = "closed" if entrance_gate_state == "closed" else "open"
                        sync_gate_status_with_laravel("closed")
                    elif line == "BLOCKED":
                        print("WARNING: Gate close attempt blocked! Vehicle still under the gate.")
                        sync_gate_status_with_laravel("open")
                    elif line.startswith("STATUS:"):
                        status = line.split(":")[1].lower()
                        if status in ["open", "closed"]:
                            gate_state = status
                    elif line.startswith("RFID_IN:") or line.startswith("RFID_OUT:"):
                        if line.startswith("RFID_IN:"):
                            rfid_uid = line[len("RFID_IN:"):].strip()
                            direction = "IN"
                        else:
                            rfid_uid = line[len("RFID_OUT:"):].strip()
                            direction = "OUT"
                        print(f"\n[RFID Card Tapped] UID: {rfid_uid} | Direction: {direction}")
                        verify_thread = threading.Thread(
                            target=process_rfid_verification,
                            args=(rfid_uid, direction)
                        )
                        verify_thread.daemon = True
                        verify_thread.start()
                    elif line.startswith("RFID:"):
                        rfid_uid = line.split(":", 1)[1].strip()
                        print(f"\n[RFID Card Tapped] UID: {rfid_uid}")
                        verify_thread = threading.Thread(
                            target=process_rfid_verification,
                            args=(rfid_uid, None)
                        )
                        verify_thread.daemon = True
                        verify_thread.start()
            except Exception as e:
                print(f"Serial read error: {e}")
                time.sleep(2)
        else:
            time.sleep(0.5)

def dashboard_sync_thread():
    """Background thread to poll Laravel gate status."""
    global running, gate_state
    print("Dashboard status synchronization thread started.")
    status_url = f"{API_BASE_URL}/gate/status"
    
    while running:
        if token:
            try:
                response = requests.get(status_url, headers=headers, timeout=3)
                if response.status_code == 200:
                    data = response.json()
                    backend_gate_status = data.get("gate_status", "closed")
                    
                    if backend_gate_status != gate_state:
                        print(f"Dashboard state mismatch! Backend: {backend_gate_status.upper()}, Local: {gate_state.upper()}")
                        if backend_gate_status == "open":
                            send_arduino_command('O')
                        else:
                            send_arduino_command('C')
                            send_arduino_command('Z')
            except Exception:
                pass
        time.sleep(2)

# ==========================================
# MAIN ENTRYPOINT
# ==========================================
if __name__ == "__main__":
    print("==================================================")
    print("  Nextgen Operations - Gate LPR Bridge Service  ")
    print("==================================================")
    
    # 1. Initialize Serial Communication with Arduino
    init_serial()
    
    # 2. Login to Laravel Backend
    login_to_laravel()
    
    # 3. Start Background Threads
    reader_t = threading.Thread(target=serial_reader_thread)
    reader_t.daemon = True
    reader_t.start()
    
    sync_t = threading.Thread(target=dashboard_sync_thread)
    sync_t.daemon = True
    sync_t.start()

    if LPR_AVAILABLE:
        # Spawn concurrent LPR monitoring threads for both Entrance and Exit cameras
        entrance_lpr_t = threading.Thread(target=lpr_main, args=(ENTRANCE_CAMERA_SOURCE, "IN"))
        entrance_lpr_t.daemon = True
        entrance_lpr_t.start()

        exit_lpr_t = threading.Thread(target=lpr_main, args=(EXIT_CAMERA_SOURCE, "OUT"))
        exit_lpr_t.daemon = True
        exit_lpr_t.start()

        print("\nEntrance and Exit Camera/LPR threads started in background. RFID serial listener is active.")
    else:
        print("\n=============================================")
        print("  Running in RFID-ONLY mode (no camera LPR)")
        print("  RFID scans will be processed via Serial.")
        print("  Press Ctrl+C to stop.")
        print("=============================================\n")

    # 4. Keep service alive until interrupted
    try:
        while running:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutdown signal received.")
    finally:
        running = False
        if arduino and arduino.is_open:
            arduino.close()
            print("Serial port closed.")
        print("Service stopped. Goodbye!")
