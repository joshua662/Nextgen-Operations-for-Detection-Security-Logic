#include <Servo.h>

// --- Pin Definitions (UNCHANGED) ---
const int ENTRANCE_SERVO_PIN = 5;
const int ENTRANCE_TRIG_PIN = 3;
const int ENTRANCE_ECHO_PIN = 4;

const int EXIT_SERVO_PIN = 8;
const int EXIT_TRIG_PIN = 6;
const int EXIT_ECHO_PIN = 7;

const int GREEN_LED_PIN = 9;
const int RED_LED_PIN = 10;

// Gate State constants
const int GATE_CLOSED_ANGLE = 0;
const int GATE_OPEN_ANGLE = 90;

// --- Distance Thresholds ---
const int MAX_DETECTION_DIST_CM = 60;  // Triggers gate if hand is closer than 60cm
const int MIN_DETECTION_DIST_CM = 3;   // Ignores 1cm/2cm hardware noise/glitches

const unsigned long SENSOR_POLL_INTERVAL_MS = 100;
const unsigned long VEHICLE_CLEAR_GRACE_MS = 1500; // Time gate stays open after object leaves

Servo entranceServo;
Servo exitServo;

bool isEntranceOpen = false;
unsigned long entranceLastSeenAt = 0;

bool isExitOpen = false;
unsigned long exitLastSeenAt = 0;

unsigned long lastSensorCheckMs = 0;

void setup() {
  Serial.begin(9600);

  pinMode(ENTRANCE_TRIG_PIN, OUTPUT);
  pinMode(ENTRANCE_ECHO_PIN, INPUT);
  pinMode(EXIT_TRIG_PIN, OUTPUT);
  pinMode(EXIT_ECHO_PIN, INPUT);

  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(RED_LED_PIN, OUTPUT);
  
  digitalWrite(GREEN_LED_PIN, LOW);
  digitalWrite(RED_LED_PIN, HIGH);

  digitalWrite(ENTRANCE_TRIG_PIN, LOW);
  digitalWrite(EXIT_TRIG_PIN, LOW);

  entranceServo.attach(ENTRANCE_SERVO_PIN);
  exitServo.attach(EXIT_SERVO_PIN);

  entranceServo.write(GATE_CLOSED_ANGLE);
  exitServo.write(GATE_CLOSED_ANGLE);
  
  isEntranceOpen = false;
  isExitOpen = false;

  delay(500);
  Serial.println("--- SYSTEM LIVE: SERIAL GATE CONTROLLER ---");
  digitalWrite(RED_LED_PIN, LOW);
  digitalWrite(GREEN_LED_PIN, HIGH);
}

void loop() {
  if (millis() - lastSensorCheckMs >= SENSOR_POLL_INTERVAL_MS) {
    lastSensorCheckMs = millis();
    updateEntranceSensor();
    updateExitSensor();
  }

  handleSerialCommands();
}

void handleSerialCommands() {
  while (Serial.available() > 0) {
    char command = Serial.read();
    if (command == '
' || command == '
') {
      continue;
    }

    switch (command) {
      case 'O':
        openEntranceGate();
        break;
      case 'X':
        openExitGate();
        break;
      case 'C':
        closeEntranceGate();
        break;
      case 'Z':
        closeExitGate();
        break;
      default:
        Serial.print("Unknown serial command: ");
        Serial.println(command);
        break;
    }
  }
}

void openEntranceGate() {
  entranceServo.write(GATE_OPEN_ANGLE);
  isEntranceOpen = true;
  entranceLastSeenAt = millis();
  Serial.println(">> ENTRANCE GATE OPEN (COMMAND)");
}

void closeEntranceGate() {
  entranceServo.write(GATE_CLOSED_ANGLE);
  isEntranceOpen = false;
  Serial.println(">> ENTRANCE GATE CLOSED (COMMAND)");
}

void openExitGate() {
  exitServo.write(GATE_OPEN_ANGLE);
  isExitOpen = true;
  exitLastSeenAt = millis();
  Serial.println(">> EXIT GATE OPEN (COMMAND)");
}

void closeExitGate() {
  exitServo.write(GATE_CLOSED_ANGLE);
  isExitOpen = false;
  Serial.println(">> EXIT GATE CLOSED (COMMAND)");
}

void updateEntranceSensor() {
  long distance = getDistance(ENTRANCE_TRIG_PIN, ENTRANCE_ECHO_PIN);
  unsigned long now = millis();
  
  if (distance < MIN_DETECTION_DIST_CM) return;

  bool objectDetected = (distance <= MAX_DETECTION_DIST_CM);

  if (objectDetected) {
    entranceLastSeenAt = now;
    if (!isEntranceOpen) {
      entranceServo.write(GATE_OPEN_ANGLE);
      isEntranceOpen = true;
      Serial.println(">> ENTRANCE GATE OPEN (90 DEGREES)");
    }
  } else if (isEntranceOpen && (now - entranceLastSeenAt >= VEHICLE_CLEAR_GRACE_MS)) {
    entranceServo.write(GATE_CLOSED_ANGLE);
    isEntranceOpen = false;
    Serial.println(">> ENTRANCE GATE CLOSED (0 DEGREES)");
  }
}

void updateExitSensor() {
  long distance = getDistance(EXIT_TRIG_PIN, EXIT_ECHO_PIN);
  unsigned long now = millis();

  if (distance < MIN_DETECTION_DIST_CM) return;

  bool objectDetected = (distance <= MAX_DETECTION_DIST_CM);

  if (objectDetected) {
    exitLastSeenAt = now;
    if (!isExitOpen) {
      exitServo.write(GATE_OPEN_ANGLE);
      isExitOpen = true;
      Serial.println(">> EXIT GATE OPEN (90 DEGREES)");
    }
  } else if (isExitOpen && (now - exitLastSeenAt >= VEHICLE_CLEAR_GRACE_MS)) {
    exitServo.write(GATE_CLOSED_ANGLE);
    isExitOpen = false;
    Serial.println(">> EXIT GATE CLOSED (0 DEGREES)");
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
