#!/usr/bin/env python
import os
import re
import time
import sys
import threading
import queue
import requests

# Try importing camera/LPR dependencies (only needed if using license plate recognition)
try:
    import cv2
    import easyocr
    import numpy as np
    LPR_AVAILABLE = True
except ImportError:
    LPR_AVAILABLE = False
    print("Note: Camera/LPR libraries (cv2, easyocr, numpy) not installed.")
    print("      RFID gate access will still work. LPR camera features are disabled.")

# Try importing serial (pyserial)
try:
    import serial
    import serial.tools.list_ports
except ImportError:
    print("Warning: 'pyserial' is not installed. Running in Serial Simulation Mode.")
    serial = None

# ==========================================
# CONFIGURATION CONSTANTS
# ==========================================
# Change this to match your Laravel server URL.
# If running via "php artisan serve", it is usually http://127.0.0.1:8000/api
# If running via XAMPP Apache directly, it could be http://localhost/Nextgen-Operations-for-Detection-Security-Logic/server/public/api
API_BASE_URL = "http://127.0.0.1:8000/api"

# API Credentials for manual sync polling (Requires a valid Security Guard or Admin account)
API_USERNAME = "guard_default"  # Replace with a valid username from your database
API_PASSWORD = "password123"    # Replace with the corresponding password

# Camera Setup
# Entrance ESP32-CAM stream (used for LPR at gate entry)
ENTRANCE_CAMERA_SOURCE = "http://192.168.2.105:81/stream"
# Exit ESP32-CAM stream (monitoring only on guard dashboard)
EXIT_CAMERA_SOURCE = "http://192.168.2.105:81/stream"
# Active camera for LPR processing
CAMERA_SOURCE = ENTRANCE_CAMERA_SOURCE

# Serial Configuration
SERIAL_PORT = None      # Set to a specific port (e.g., 'COM3' or '/dev/ttyUSB0'), or None to auto-detect Arduino
BAUD_RATE = 9600

# OCR/LPR Settings
COOLDOWN_PERIOD = 10     # Seconds to wait before verifying the same license plate again
CONFIDENCE_THRESHOLD = 0.5 # Minimum confidence score (0.0 to 1.0) to accept OCR read

# ==========================================
# GLOBAL STATE
# ==========================================
token = None
headers = {}
arduino = None
gate_state = "closed"   # Matches physical state: "open" or "closed"
last_scanned_plates = {} # Key: plate_number, Value: timestamp
command_queue = queue.Queue()
running = True

# ==========================================
# ARDUINO SERIAL CONNECTION
# ==========================================
def find_arduino_port():
    """Scans system serial ports to auto-detect a connected Arduino."""
    if serial is None:
        return None
    
    ports = list(serial.tools.list_ports.comports())
    for p in ports:
        # Check description or hardware IDs for Arduino
        desc = p.description.lower()
        hwid = p.hwid.lower()
        if "arduino" in desc or "ch340" in desc or "usb serial" in desc or "ftdi" in desc:
            print(f"Auto-detected Arduino on port: {p.device}")
            return p.device
    
    # Fallback to the first available COM/tty port if any
    if ports:
        print(f"No explicit Arduino device name found. Trying first available port: {ports[0].device}")
        return ports[0].device
    return None

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
        time.sleep(2) # Wait for Arduino to reset
        print(f"Connected to Arduino on port {port} at {BAUD_RATE} baud.")
        return True
    except Exception as e:
        print(f"Error opening serial port {port}: {e}. Running in Simulation Mode.")
        arduino = None
        return False

def send_arduino_command(cmd):
    """Sends a single character command ('O', 'X', 'C', 'Z') to the Arduino."""
    global gate_state
    if cmd in ['O', 'X']:
        gate_state = "open"
    elif cmd in ['C', 'Z']:
        gate_state = "closed"

    if arduino and arduino.is_open:
        try:
            arduino.write(cmd.encode())
            print(f"[Serial -> Arduino] Sent: '{cmd}'")
        except Exception as e:
            print(f"Serial write error: {e}")
    else:
        print(f"[Serial Simulation] Arduino received command: '{cmd}' (State: {gate_state.upper()})")

def serial_reader_thread():
    """Background thread that listens for signals sent by the Arduino (e.g. vehicle passed, blocked)."""
    global running, gate_state
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
                        print("Vehicle successfully passed entrance. Updating Laravel status to closed...")
                        sync_gate_status_with_laravel("closed")
                    elif line == "EXIT_PASSED":
                        print("Vehicle successfully passed exit. Updating Laravel status...")
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

# ==========================================
# LARAVEL BACKEND API COMMUNICATION
# ==========================================
def login_to_laravel():
    """Logs in to the Laravel backend using credentials to obtain a Sanctum auth token."""
    global token, headers
    print(f"Authenticating with Laravel API at {API_BASE_URL}...")
    
    login_url = f"{API_BASE_URL}/auth/login"
    payload = {
        "username": API_USERNAME,
        "password": API_PASSWORD
    }
    
    try:
        response = requests.post(login_url, json=payload, timeout=5)
        if response.status_code == 200:
            data = response.json()
            token = data.get("token")
            headers = {
                "Authorization": f"Bearer {token}",
                "Accept": "application/json"
            }
            print("Successfully authenticated with Laravel backend!")
            return True
        else:
            print(f"Authentication failed (HTTP {response.status_code}): {response.text}")
            print("Running in Local LPR Offline mode (Verify requests will fail, but local prints will work).")
            return False
    except Exception as e:
        print(f"Network error authenticating with Laravel: {e}")
        print("Running in Local LPR Offline mode.")
        return False

def verify_plate_with_laravel(plate_number, direction="IN"):
    """Sends a verification request to the public Laravel LPR endpoint."""
    verify_url = f"{API_BASE_URL}/gate/verify"
    payload = {
        "plate_number": plate_number,
        "direction": direction
    }
    
    print(f"Verifying plate '{plate_number}' with Laravel API...")
    try:
        # Note: public endpoint doesn't strictly need headers, but we include them anyway
        response = requests.post(verify_url, json=payload, headers=headers, timeout=5)
        if response.status_code == 200:
            res_data = response.json()
            authorized = res_data.get("authorized", False)
            laravel_gate_status = res_data.get("gate_status", "closed")
            
            print(f"API Result: Authorized={authorized}, Gate Status={laravel_gate_status}")
            return authorized
        else:
            print(f"Verification request failed (HTTP {response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"Network error during plate verification: {e}")
        return False

def sync_gate_status_with_laravel(status):
    """Updates the Laravel gate status (useful when the Arduino auto-closes after vehicle passes)."""
    global gate_state
    gate_state = status
    
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

def dashboard_sync_thread():
    """Background thread to poll Laravel gate status. 
    This enables opening the gate from the admin web panel button."""
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
                    
                    # If backend gate status differs from physical/local gate state, command the Arduino
                    if backend_gate_status != gate_state:
                        print(f"Dashboard state mismatch! Backend: {backend_gate_status.upper()}, Local: {gate_state.upper()}")
                        if backend_gate_status == "open":
                            send_arduino_command('O')
                        else:
                            send_arduino_command('C')
            except Exception as e:
                # Silently catch sync network errors and retry
                pass
        time.sleep(SYNC_INTERVAL_SECONDS := 2)

# ==========================================
# LICENSE PLATE RECOGNITION (LPR) LOOP
# ==========================================
def preprocess_plate_contour(frame):
    """Optional pre-processing to extract a cropped image of potential license plates (speeds up OCR)."""
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    # Apply bilateral filter to preserve edges while removing noise
    blur = cv2.bilateralFilter(gray, 11, 17, 17)
    # Canny Edge Detection
    edged = cv2.Canny(blur, 30, 200)
    
    # Find contours
    contours, _ = cv2.findContours(edged.copy(), cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:10]
    
    screenCnt = None
    for c in contours:
        # Approximate the contour
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.018 * peri, True)
        
        # A license plate is a 4-sided polygon
        if len(approx) == 4:
            screenCnt = approx
            break
            
    if screenCnt is not None:
        # Create mask
        mask = np.zeros(gray.shape, np.uint8)
        new_image = cv2.drawContours(mask, [screenCnt], 0, 255, -1)
        new_image = cv2.bitwise_and(frame, frame, mask=mask)
        
        # Crop the plate region
        (x, y) = np.where(mask == 255)
        (topx, topy) = (np.min(x), np.min(y))
        (bottomx, bottomy) = (np.max(x), np.max(y))
        cropped = gray[topx:bottomx+1, topy:bottomy+1]
        return cropped, (topy, topx, bottomy, bottomx)
        
    return None, None

def clean_plate_text(text):
    """Cleans up the text read by OCR to match plate formatting (alphanumeric, no spaces/special chars)."""
    cleaned = re.sub(r'[^A-Za-z0-9]', '', text)
    return cleaned.upper()

def lpr_main():
    global running
    print("\nInitializing EasyOCR Reader...")
    # Initialize EasyOCR English reader (CPU by default, uses GPU automatically if PyTorch CUDA is setup)
    reader = easyocr.Reader(['en'], gpu=True)
    print("EasyOCR loaded successfully!")
    
    print(f"Connecting to video source: {CAMERA_SOURCE}...")
    cap = cv2.VideoCapture(CAMERA_SOURCE)
    
    if not cap.isOpened():
        print(f"Error: Could not open camera stream/source {CAMERA_SOURCE}.")
        running = False
        return
        
    print("\nNextgen Operations LPR Gate Controller is running!")
    print("Press 'q' in the camera window to exit.")
    
    while running:
        ret, frame = cap.read()
        if not ret:
            print("Failed to grab camera frame. Retrying...")
            time.sleep(1)
            continue
            
        # 1. License Plate Localization & Recognition
        # To make LPR faster and more reliable, we can run OCR on a cropped plate region, 
        # or fall back to OCR on the center half of the frame where cars pass.
        h, w, _ = frame.shape
        roi = frame[int(h*0.3):int(h*0.8), int(w*0.2):int(w*0.8)] # Region of interest: Center region
        
        # Render ROI rectangle box for reference
        cv2.rectangle(frame, (int(w*0.2), int(h*0.3)), (int(w*0.8), int(h*0.8)), (255, 255, 0), 2)
        
        # Perform OCR on ROI
        results = reader.readtext(roi)
        
        for (bbox, text, prob) in results:
            if prob >= CONFIDENCE_THRESHOLD:
                cleaned_plate = clean_plate_text(text)
                
                # Basic plate format check: must be at least 4 characters
                if len(cleaned_plate) >= 4:
                    # Map ROI coordinates back to full frame
                    pts = np.array(bbox, dtype=np.int32)
                    pts[:, 0] += int(w*0.2)
                    pts[:, 1] += int(h*0.3)
                    
                    # Draw bounding box and text on video stream
                    cv2.polylines(frame, [pts], True, (0, 255, 0), 2)
                    cv2.putText(frame, f"{cleaned_plate} ({prob:.2f})", (pts[0][0], pts[0][1] - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
                    
                    # Cooldown logic to prevent spamming the database
                    current_time = time.time()
                    if (cleaned_plate not in last_scanned_plates or 
                            (current_time - last_scanned_plates[cleaned_plate]) > COOLDOWN_PERIOD):
                        
                        last_scanned_plates[cleaned_plate] = current_time
                        print(f"\n[LPR Detected] Plate: {cleaned_plate} (Confidence: {prob:.2f})")
                        
                        # Verify plate in background to keep video feed real-time
                        verify_thread = threading.Thread(
                            target=process_plate_verification, 
                            args=(cleaned_plate,)
                        )
                        verify_thread.daemon = True
                        verify_thread.start()
        
        # Display the video frame
        cv2.imshow("Gate LPR Security Feed", frame)
        
        # Handle keypresses
        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            print("Exiting application...")
            running = False
            break
            
    cap.release()
    cv2.destroyAllWindows()

def process_plate_verification(plate_number):
    """Processes plate verification and opens gate if authorized."""
    authorized = verify_plate_with_laravel(plate_number, direction="IN")
    if authorized:
        print(f"ACCESS GRANTED for plate: {plate_number}")
        send_arduino_command('O')
        
        # If no ultrasonic sensor is connected to close the gate automatically,
        # we trigger a fallback timer (e.g. 7 seconds) in Python to send close command.
        if arduino is None:
            time.sleep(7)
            print("Simulation: Timer expired, closing gate...")
            send_arduino_command('C')
    else:
        print(f"ACCESS DENIED for plate: {plate_number}")

import re


def normalize_rfid_uid(rfid_uid: str) -> str:
    return re.sub(r'[^A-Fa-f0-9]', '', rfid_uid).upper()


def process_rfid_verification(rfid_uid, direction=None):
    """Processes RFID verification and opens the correct gate if authorized."""
    normalized_uid = normalize_rfid_uid(rfid_uid)
    verify_url = f"{API_BASE_URL}/gate/verify"
    payload = {
        "rfid_card_uid": normalized_uid,
    }
    if direction:
        payload["direction"] = direction

    print(f"Verifying RFID '{normalized_uid}' with Laravel API...")
    print(f"Request payload: {payload}")
    try:
        response = requests.post(verify_url, json=payload, headers=headers, timeout=5)
        if response.status_code == 200:
            res_data = response.json()
            print(f"Verify response: {res_data}")
            authorized = res_data.get("authorized", False)
            gate_command = res_data.get("gate_command")
            gate_action = res_data.get("gate_action")
            resident_user = res_data.get("resident_username") or res_data.get("resident_name")

            if authorized and gate_command:
                if resident_user:
                    print(f"ACCESS GRANTED for RFID: {normalized_uid} -> Resident: {resident_user}")
                else:
                    print(f"ACCESS GRANTED for RFID: {normalized_uid}")
                print(f"Backend gate action: {gate_action}")
                send_arduino_command(gate_command)
                if arduino is None:
                    close_cmd = 'C' if gate_command == 'O' else 'Z'
                    time.sleep(7)
                    print(f"Simulation: Timer expired, closing gate...")
                    send_arduino_command(close_cmd)
            else:
                print(f"ACCESS DENIED for RFID: {normalized_uid}")
        else:
            print(f"RFID verification failed (HTTP {response.status_code}): {response.text}")
    except Exception as e:
        print(f"Network error during RFID verification: {e}")

# ==========================================
# APPLICATION ENTRYPOINT
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
    # Thread to read responses from Arduino
    reader_t = threading.Thread(target=serial_reader_thread)
    reader_t.daemon = True
    reader_t.start()
    
    # Thread to sync manual toggles from Laravel Admin Dashboard
    sync_t = threading.Thread(target=dashboard_sync_thread)
    sync_t.daemon = True
    sync_t.start()
    
    # 4. Run Main LPR Loop or RFID-only mode
    try:
        if LPR_AVAILABLE:
            lpr_main()
        else:
            print("\n=============================================")
            print("  Running in RFID-ONLY mode (no camera LPR)")
            print("  RFID scans will be processed via Serial.")
            print("  Press Ctrl+C to stop.")
            print("=============================================\n")
            # Keep the main thread alive so background threads (serial reader, dashboard sync) keep running
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
