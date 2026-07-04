#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>

// =============================================
// PIN DEFINITIONS (matches wiring diagram)
// =============================================

// RFID RC522
#define RFID_RST_PIN  9
#define RFID_SS_PIN   10
// SPI pins (D11=MOSI, D12=MISO, D13=SCK) are used automatically

// Entrance gate
const int ENTRANCE_SERVO_PIN = 5;
const int ENTRANCE_TRIG_PIN  = 3;
const int ENTRANCE_ECHO_PIN  = 4;

// Exit gate
const int EXIT_SERVO_PIN = 8;
const int EXIT_TRIG_PIN  = 6;
const int EXIT_ECHO_PIN  = 7;

// Gate angles
const int GATE_CLOSED_ANGLE = 0;
const int GATE_OPEN_ANGLE   = 90;

// =============================================
// TIMING CONSTANTS
// =============================================
const unsigned long SENSOR_POLL_MS     = 100;
const unsigned long VEHICLE_GRACE_MS   = 3000;  // Keep gate open 3s after vehicle clears
const unsigned long RFID_COOLDOWN_MS   = 2000;  // Prevent double-scan
const unsigned long GATE_AUTO_CLOSE_MS = 8000;  // Auto-close gate after 8s if no vehicle detected
const int MAX_DETECT_CM = 60;
const int MIN_DETECT_CM = 3;

// =============================================
// OBJECTS
// =============================================
MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN);
Servo entranceServo;
Servo exitServo;

// =============================================
// STATE
// =============================================
bool isEntranceOpen = false;
bool isExitOpen     = false;

unsigned long entranceLastSeen  = 0;
unsigned long exitLastSeen      = 0;
unsigned long entranceOpenedAt  = 0;
unsigned long exitOpenedAt      = 0;
unsigned long lastSensorCheck   = 0;
unsigned long lastRfidScan      = 0;

// Track if gate was opened by RFID (vs serial command)
bool entranceRfidOpened = false;
bool exitRfidOpened     = false;

// =============================================
// SETUP
// =============================================
void setup() {
  Serial.begin(9600);

  // Ultrasonic pins
  pinMode(ENTRANCE_TRIG_PIN, OUTPUT);
  pinMode(ENTRANCE_ECHO_PIN, INPUT);
  pinMode(EXIT_TRIG_PIN, OUTPUT);
  pinMode(EXIT_ECHO_PIN, INPUT);

  digitalWrite(ENTRANCE_TRIG_PIN, LOW);
  digitalWrite(EXIT_TRIG_PIN, LOW);

  // Servos
  entranceServo.attach(ENTRANCE_SERVO_PIN);
  exitServo.attach(EXIT_SERVO_PIN);
  entranceServo.write(GATE_CLOSED_ANGLE);
  exitServo.write(GATE_CLOSED_ANGLE);

  // RFID
  SPI.begin();
  mfrc522.PCD_Init();
  delay(10);
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_max);

  delay(500);
  Serial.println(F("READY"));
  Serial.println(F("--- GATE CONTROL + RFID SYSTEM ONLINE ---"));
}

// =============================================
// MAIN LOOP
// =============================================
void loop() {
  // 1. Check for serial commands from Python bridge
  handleSerialCommands();

  // 2. Scan for RFID cards
  handleRfidScan();

  // 3. Poll ultrasonic sensors for auto-close
  if (millis() - lastSensorCheck >= SENSOR_POLL_MS) {
    lastSensorCheck = millis();
    handleEntranceSensor();
    handleExitSensor();
  }
}

// =============================================
// SERIAL COMMAND HANDLER
// Receives commands from Python lpr_gate_controller.py:
//   'O' = Open entrance gate
//   'C' = Close entrance gate
//   'X' = Open exit gate
//   'Z' = Close exit gate
// =============================================
void handleSerialCommands() {
  while (Serial.available() > 0) {
    char cmd = Serial.read();

    switch (cmd) {
      case 'O':
        openEntrance();
        Serial.println(F(">> ENTRANCE GATE OPEN (COMMAND)"));
        break;
      case 'C':
        closeEntrance();
        Serial.println(F(">> ENTRANCE GATE CLOSED (COMMAND)"));
        break;
      case 'X':
        openExit();
        Serial.println(F(">> EXIT GATE OPEN (COMMAND)"));
        break;
      case 'Z':
        closeExit();
        Serial.println(F(">> EXIT GATE CLOSED (COMMAND)"));
        break;
    }
  }
}

// =============================================
// RFID SCAN HANDLER
// Reads card UID and sends it to Python via Serial
// Format: "RFID:XX XX XX XX" (hex bytes, space-separated)
// The direction is determined by which gate is currently open:
//   - If entrance is closed -> scan means someone wants IN
//   - If entrance is open   -> scan means someone wants OUT
// =============================================
void handleRfidScan() {
  if (millis() - lastRfidScan < RFID_COOLDOWN_MS) return;
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  lastRfidScan = millis();

  // Build UID hex string
  String uidStr = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    if (i > 0) uidStr += " ";
    if (mfrc522.uid.uidByte[i] < 0x10) uidStr += "0";
    uidStr += String(mfrc522.uid.uidByte[i], HEX);
  }
  uidStr.toUpperCase();

  // Determine direction based on current gate state
  // If entrance gate is closed, this is an IN scan
  // If entrance gate is already open, this is an OUT scan
  String direction = isEntranceOpen ? "OUT" : "IN";

  // Send to Python bridge via Serial
  // Format: RFID_IN:XX XX XX XX  or  RFID_OUT:XX XX XX XX
  Serial.print(F("RFID_"));
  Serial.print(direction);
  Serial.print(F(":"));
  Serial.println(uidStr);

  // Halt card to prepare for next read
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}

// =============================================
// GATE CONTROL FUNCTIONS
// =============================================
void openEntrance() {
  if (!isEntranceOpen) {
    entranceServo.write(GATE_OPEN_ANGLE);
    isEntranceOpen = true;
    entranceOpenedAt = millis();
    entranceLastSeen = millis();
  }
}

void closeEntrance() {
  if (isEntranceOpen) {
    entranceServo.write(GATE_CLOSED_ANGLE);
    isEntranceOpen = false;
    entranceRfidOpened = false;
    Serial.println(F("PASSED"));
  }
}

void openExit() {
  if (!isExitOpen) {
    exitServo.write(GATE_OPEN_ANGLE);
    isExitOpen = true;
    exitOpenedAt = millis();
    exitLastSeen = millis();
  }
}

void closeExit() {
  if (isExitOpen) {
    exitServo.write(GATE_CLOSED_ANGLE);
    isExitOpen = false;
    exitRfidOpened = false;
    Serial.println(F("EXIT_PASSED"));
  }
}

// =============================================
// ULTRASONIC SENSOR HANDLERS
// Auto-close gates when vehicle has cleared
// =============================================
void handleEntranceSensor() {
  if (!isEntranceOpen) return;

  long dist = getDistance(ENTRANCE_TRIG_PIN, ENTRANCE_ECHO_PIN);
  unsigned long now = millis();

  if (dist >= MIN_DETECT_CM && dist <= MAX_DETECT_CM) {
    // Vehicle still under gate — keep it open
    entranceLastSeen = now;
  } else if (now - entranceLastSeen >= VEHICLE_GRACE_MS) {
    // Vehicle has cleared, close gate
    closeEntrance();
    Serial.println(F(">> ENTRANCE GATE CLOSED (AUTO)"));
  }

  // Safety: auto-close if open too long with no detection
  if (now - entranceOpenedAt >= GATE_AUTO_CLOSE_MS && now - entranceLastSeen >= VEHICLE_GRACE_MS) {
    closeEntrance();
    Serial.println(F(">> ENTRANCE GATE CLOSED (TIMEOUT)"));
  }
}

void handleExitSensor() {
  if (!isExitOpen) return;

  long dist = getDistance(EXIT_TRIG_PIN, EXIT_ECHO_PIN);
  unsigned long now = millis();

  if (dist >= MIN_DETECT_CM && dist <= MAX_DETECT_CM) {
    exitLastSeen = now;
  } else if (now - exitLastSeen >= VEHICLE_GRACE_MS) {
    closeExit();
    Serial.println(F(">> EXIT GATE CLOSED (AUTO)"));
  }

  if (now - exitOpenedAt >= GATE_AUTO_CLOSE_MS && now - exitLastSeen >= VEHICLE_GRACE_MS) {
    closeExit();
    Serial.println(F(">> EXIT GATE CLOSED (TIMEOUT)"));
  }
}

// =============================================
// ULTRASONIC DISTANCE READING
// =============================================
long getDistance(int trigPin, int echoPin) {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH, 30000);
  if (duration == 0) return 999;  // No echo = far away
  return duration * 0.034 / 2;
}