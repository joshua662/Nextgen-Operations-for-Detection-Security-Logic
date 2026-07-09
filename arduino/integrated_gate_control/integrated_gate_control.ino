#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>

// --- Configuration Flags ---
// Set to 1 to allow any scanned RFID card to open the gates immediately (Local Offline Bypass).
// Set to 0 to require authorization from the Python/Laravel server before opening.
#define STANDALONE_MODE 0

// Set to 1 to enable dual RFID readers (one at entrance, one at exit)
// Set to 0 if only using a single RFID reader
#define DUAL_RFID_READERS 0

// Set to 1 so ultrasonic sensors open the matching gate when an object is detected.
#define SENSOR_AUTO_OPEN_GATES 1

// --- Pin Definitions (Restored original pins for servos & sensors to match existing wiring) ---
const int ENTRANCE_TRIG_PIN = 3;
const int ENTRANCE_ECHO_PIN = 4;
const int ENTRANCE_SERVO_PIN = 5;

const int EXIT_SERVO_PIN = 8;
const int EXIT_TRIG_PIN = 6;
const int EXIT_ECHO_PIN = 7;

// RFID RC522 SPI pins (SCK: 13, MISO: 12, MOSI: 11 are implicit)
#define RST_PIN         9
#define SS_ENTRANCE_PIN 10
#define SS_EXIT_PIN     2   // SS Pin for Exit RFID Reader (only used if DUAL_RFID_READERS is 1)

// Relocated LED pins to avoid conflicts with RFID SPI (D9, D10)
const int GREEN_LED_PIN = A0; // Move green LED to Analog pin A0 (digital output mode)
const int RED_LED_PIN = A1;   // Move red LED to Analog pin A1 (digital output mode)

// --- Gate State Constants ---
// If your servo is mounted in reverse, swap only that gate's OPEN/CLOSED values.
const int ENTRANCE_GATE_CLOSED_ANGLE = 0;
const int ENTRANCE_GATE_OPEN_ANGLE = 90;
const int EXIT_GATE_CLOSED_ANGLE = 0;
const int EXIT_GATE_OPEN_ANGLE = 90;

// SG90 standard pulse width range (microseconds)
const int SERVO_MIN_US = 544;
const int SERVO_MAX_US = 2400;

// --- Distance Thresholds ---
const int MAX_DETECTION_DIST_CM = 30;  // Open gate when object is within 30cm
const int MIN_DETECTION_DIST_CM = 3;   // Ignores hardware noise/glitches under 3cm

const unsigned long SENSOR_POLL_INTERVAL_MS = 100;
const unsigned long VEHICLE_CLEAR_GRACE_MS = 1500; // Time gate stays open after object leaves
const unsigned long GATE_MAX_OPEN_MS = 8000;        // Force-close if a sensor/server state gets stuck
const unsigned long RFID_SCAN_COOLDOWN_MS = 5000;  // Prevents one card tap from creating repeated IN/OUT logs

// --- Servos ---
Servo entranceServo;
int entranceServoAngle = ENTRANCE_GATE_CLOSED_ANGLE;
int exitServoAngle = EXIT_GATE_CLOSED_ANGLE;
unsigned long lastServoRefreshUs = 0;

bool isEntranceOpen = false;
unsigned long entranceLastSeenAt = 0;
unsigned long entranceOpenedAt = 0;
bool entranceVehicleSeen = false;

bool isExitOpen = false;
unsigned long exitLastSeenAt = 0;
unsigned long exitOpenedAt = 0;
bool exitVehicleSeen = false;

unsigned long lastSensorCheckMs = 0;

// --- RFID Reader(s) ---
MFRC522 rfidEntrance(SS_ENTRANCE_PIN, RST_PIN);
#if DUAL_RFID_READERS
MFRC522 rfidExit(SS_EXIT_PIN, RST_PIN);
#endif

unsigned long lastRfidScanMs = 0;
String lastRfidUid = "";

// Direction toggle state (Only used in STANDALONE_MODE when DUAL_RFID_READERS is 0)
// true = open Entrance (IN) next, false = open Exit (OUT) next
bool localToggleDirection = true; 

void setup() {
  Serial.begin(9600);

  // Initialize Ultrasonic Sensor Pins
  pinMode(ENTRANCE_TRIG_PIN, OUTPUT);
  pinMode(ENTRANCE_ECHO_PIN, INPUT);
  pinMode(EXIT_TRIG_PIN, OUTPUT);
  pinMode(EXIT_ECHO_PIN, INPUT);

  // Initialize LED Pins
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  
  // Set default LED states (RED on, GREEN off)
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, HIGH);

  // Set sensor trigger pins low
  digitalWrite(ENTRANCE_TRIG_PIN, LOW);
  digitalWrite(EXIT_TRIG_PIN, LOW);

  // D5 uses Servo library; D8 needs manual pulses (Uno Servo library does not drive D8)
  pinMode(EXIT_SERVO_PIN, OUTPUT);
  entranceServo.attach(ENTRANCE_SERVO_PIN, SERVO_MIN_US, SERVO_MAX_US);
  entranceServoAngle = ENTRANCE_GATE_CLOSED_ANGLE;
  exitServoAngle = EXIT_GATE_CLOSED_ANGLE;
  delay(50);
  forceCloseAllGates();
  
  isEntranceOpen = false;
  isExitOpen = false;

  // Initialize SPI Bus and RFID Reader(s)
  SPI.begin();
  
  rfidEntrance.PCD_Init();
  delay(4);
  rfidEntrance.PCD_SetAntennaGain(rfidEntrance.RxGain_38dB);

#if DUAL_RFID_READERS
  rfidExit.PCD_Init();
  delay(4);
  rfidExit.PCD_SetAntennaGain(rfidExit.RxGain_38dB);
#endif

  delay(500);
  Serial.println(F("--- SYSTEM LIVE: INTEGRATED RFID & GATE CONTROLLER ---"));
  
  // Perform Startup Diagnostics Check on MFRC522 Chip
  Serial.println(F("Performing RFID reader diagnostic check..."));
  rfidEntrance.PCD_DumpVersionToSerial();
  
  #if STANDALONE_MODE
  Serial.println(F("--- MODE: STANDALONE OFFLINE BYPASS ENABLED ---"));
  #else
  Serial.println(F("--- MODE: ONLINE AUTHORIZATION REQUIRED ---"));
  #endif
  
  // Indicate system ready: GREEN LED on, RED LED off
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(GREEN_LED_PIN, HIGH);
}

void loop() {
  refreshServos();

  // 1. Poll ultrasonic sensors at specified intervals
  if (millis() - lastSensorCheckMs >= SENSOR_POLL_INTERVAL_MS) {
    lastSensorCheckMs = millis();
    updateEntranceSensor();
    updateExitSensor();
    enforceGateTimeouts();
  }

  // 2. Process any incoming commands over Serial (e.g. from Python server)
  handleSerialCommands();

  // 3. Scan for RFID tags
  scanRfidTags();
}

void handleSerialCommands() {
  while (Serial.available() > 0) {
    char command = Serial.read();
    if (command == '\r' || command == '\n') {
      continue;
    }

    switch (command) {
      case 'O':
        Serial.println(F(">> Server Response: Authorized LOGIN"));
        openEntranceGate();
        break;
      case 'X':
        Serial.println(F(">> Server Response: Authorized LOGOUT"));
        openExitGate();
        break;
      case 'C':
        closeEntranceGate();
        break;
      case 'Z':
        closeExitGate();
        break;
      default:
        Serial.print(F("Unknown serial command: "));
        Serial.println(command);
        break;
    }
  }
}

void openEntranceGate() {
  entranceServoAngle = ENTRANCE_GATE_OPEN_ANGLE;
  entranceServo.write(entranceServoAngle);
  if (!isEntranceOpen) {
    isEntranceOpen = true;
    entranceOpenedAt = millis();
    entranceVehicleSeen = false;
  }
  entranceLastSeenAt = millis();
  Serial.println(F(">> LOGIN: Entrance Gate Opened"));
}

void closeEntranceGate() {
  entranceServoAngle = ENTRANCE_GATE_CLOSED_ANGLE;
  entranceServo.write(entranceServoAngle);
  isEntranceOpen = false;
  entranceOpenedAt = 0;
  Serial.println(F(">> ENTRANCE GATE CLOSED (0 DEGREES)"));
}

void openExitGate() {
  exitServoAngle = EXIT_GATE_OPEN_ANGLE;
  pulseExitServoNow();
  if (!isExitOpen) {
    isExitOpen = true;
    exitOpenedAt = millis();
    exitVehicleSeen = false;
  }
  exitLastSeenAt = millis();
  Serial.println(F(">> LOGOUT: Exit Gate Opened"));
}

void closeExitGate() {
  exitServoAngle = EXIT_GATE_CLOSED_ANGLE;
  pulseExitServoNow();
  isExitOpen = false;
  exitOpenedAt = 0;
  Serial.println(F(">> EXIT GATE CLOSED (0 DEGREES)"));
}

void forceCloseAllGates() {
  entranceServoAngle = ENTRANCE_GATE_CLOSED_ANGLE;
  exitServoAngle = EXIT_GATE_CLOSED_ANGLE;
  entranceServo.write(entranceServoAngle);
  pulseExitServoNow();
  delay(400);
  entranceServo.write(entranceServoAngle);
  pulseExitServoNow();
  isEntranceOpen = false;
  isExitOpen = false;
  entranceOpenedAt = 0;
  exitOpenedAt = 0;
  entranceVehicleSeen = false;
  exitVehicleSeen = false;
}

void pulseExitServoNow() {
  int pulseUs = map(exitServoAngle, 0, 180, SERVO_MIN_US, SERVO_MAX_US);
  digitalWrite(EXIT_SERVO_PIN, HIGH);
  delayMicroseconds(pulseUs);
  digitalWrite(EXIT_SERVO_PIN, LOW);
  lastServoRefreshUs = micros();
}

void refreshServos() {
  if (micros() - lastServoRefreshUs < 20000) {
    return;
  }
  lastServoRefreshUs = micros();

  entranceServo.write(entranceServoAngle);
  pulseExitServoNow();
}

void enforceGateTimeouts() {
  unsigned long now = millis();

  if (isEntranceOpen && entranceOpenedAt > 0 && now - entranceOpenedAt >= GATE_MAX_OPEN_MS) {
    Serial.println(F(">> ENTRANCE GATE FORCE CLOSED (timeout)"));
    closeEntranceGate();
    Serial.println(F("PASSED"));
  }

  if (isExitOpen && exitOpenedAt > 0 && now - exitOpenedAt >= GATE_MAX_OPEN_MS) {
    Serial.println(F(">> EXIT GATE FORCE CLOSED (timeout)"));
    closeExitGate();
    Serial.println(F("EXIT_PASSED"));
  }
}

void updateEntranceSensor() {
  long distance = getDistance(ENTRANCE_TRIG_PIN, ENTRANCE_ECHO_PIN);
  unsigned long now = millis();

  bool objectDetected = (distance > 0 && distance <= MAX_DETECTION_DIST_CM);

  if (objectDetected) {
    #if SENSOR_AUTO_OPEN_GATES
    openEntranceGate();
    #endif
    entranceLastSeenAt = now;
    entranceVehicleSeen = true;
  } else if (isEntranceOpen && entranceVehicleSeen && (now - entranceLastSeenAt >= VEHICLE_CLEAR_GRACE_MS)) {
    closeEntranceGate();
    Serial.println(F("PASSED"));
  }
}

void updateExitSensor() {
  long distance = getDistance(EXIT_TRIG_PIN, EXIT_ECHO_PIN);
  unsigned long now = millis();

  bool objectDetected = (distance > 0 && distance <= MAX_DETECTION_DIST_CM);

  if (objectDetected) {
    #if SENSOR_AUTO_OPEN_GATES
    openExitGate();
    #endif
    exitLastSeenAt = now;
    exitVehicleSeen = true;
  } else if (isExitOpen && exitVehicleSeen && (now - exitLastSeenAt >= VEHICLE_CLEAR_GRACE_MS)) {
    closeExitGate();
    Serial.println(F("EXIT_PASSED"));
  }
}

long getDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) {
    return -1;
  }
  return duration * 0.034 / 2;
}

void scanRfidTags() {
#if DUAL_RFID_READERS
  // Poll entrance RFID reader
  if (rfidEntrance.PICC_IsNewCardPresent() && rfidEntrance.PICC_ReadCardSerial()) {
    if (!shouldProcessRfidScan(rfidEntrance.uid.uidByte, rfidEntrance.uid.size)) {
      rfidEntrance.PICC_HaltA();
      rfidEntrance.PCD_StopCrypto1();
    } else {
      handleRfidScan(rfidEntrance.uid.uidByte, rfidEntrance.uid.size, "IN");

      #if STANDALONE_MODE
      openEntranceGate();
      #endif

      rfidEntrance.PICC_HaltA();
      rfidEntrance.PCD_StopCrypto1();
    }
  }

  // Poll exit RFID reader
  if (rfidExit.PICC_IsNewCardPresent() && rfidExit.PICC_ReadCardSerial()) {
    if (!shouldProcessRfidScan(rfidExit.uid.uidByte, rfidExit.uid.size)) {
      rfidExit.PICC_HaltA();
      rfidExit.PCD_StopCrypto1();
    } else {
      handleRfidScan(rfidExit.uid.uidByte, rfidExit.uid.size, "OUT");

      #if STANDALONE_MODE
      openExitGate();
      #endif

      rfidExit.PICC_HaltA();
      rfidExit.PCD_StopCrypto1();
    }
  }
#else
  // Poll single RFID reader
  if (rfidEntrance.PICC_IsNewCardPresent() && rfidEntrance.PICC_ReadCardSerial()) {
    if (!shouldProcessRfidScan(rfidEntrance.uid.uidByte, rfidEntrance.uid.size)) {
      rfidEntrance.PICC_HaltA();
      rfidEntrance.PCD_StopCrypto1();
      return;
    }
    
    #if STANDALONE_MODE
    // In standalone mode, alternate opening entrance (login) and exit (logout) gates locally
    if (localToggleDirection) {
      handleRfidScan(rfidEntrance.uid.uidByte, rfidEntrance.uid.size, "IN");
      openEntranceGate();
      localToggleDirection = false; // Next scan opens exit
    } else {
      handleRfidScan(rfidEntrance.uid.uidByte, rfidEntrance.uid.size, "OUT");
      openExitGate();
      localToggleDirection = true; // Next scan opens entrance
    }
    #else
    // Standard mode: sends "RFID:<UID>" to server; server replies O=login or X=logout
    handleRfidScan(rfidEntrance.uid.uidByte, rfidEntrance.uid.size, nullptr);
    #endif
    
    rfidEntrance.PICC_HaltA();
    rfidEntrance.PCD_StopCrypto1();
  }
#endif
}

String formatRfidUid(byte *uid, byte size) {
  String value = "";
  for (byte i = 0; i < size; i++) {
    if (uid[i] < 0x10) {
      value += "0";
    }
    value += String(uid[i], HEX);
  }
  value.toUpperCase();
  return value;
}

bool shouldProcessRfidScan(byte *uid, byte size) {
  unsigned long now = millis();
  String currentUid = formatRfidUid(uid, size);

  if (currentUid == lastRfidUid && now - lastRfidScanMs < RFID_SCAN_COOLDOWN_MS) {
    Serial.print(F("RFID duplicate ignored:"));
    Serial.println(currentUid);
    return false;
  }

  lastRfidUid = currentUid;
  lastRfidScanMs = now;
  return true;
}

void handleRfidScan(byte *uid, byte size, const char* direction) {
  String formattedUid = formatRfidUid(uid, size);

  // Output scanned tag to Serial in standard logs format
  Serial.print(F("Scanned UID:"));
  Serial.println(formattedUid);

  // Send action prefix for Laravel/Python API verification
  if (direction != NULL) {
    Serial.print(F("RFID_"));
    Serial.print(direction);
    Serial.print(F(":"));
  } else {
    Serial.print(F("RFID:"));
  }

  Serial.println(formattedUid);
}
