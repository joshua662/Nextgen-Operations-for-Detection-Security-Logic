/**
 * Nextgen Operations - Gate Security System
 * Arduino Gate Controller (Servo, Ultrasonic Safety Sensor, & RFID Reader)
 * 
 * Hardware Connections:
 * - Servo Motor: Signal to Pin 5 (PWM)  [MOVED from Pin 9 to avoid SPI conflicts]
 * - Green LED (Access Granted): Pin 6 (via 220 ohm resistor)
 * - Red LED (Access Denied / Idle): Pin 7 (via 220 ohm resistor)
 * - Ultrasonic Sensor HC-SR04:
 *   - VCC: 5V
 *   - GND: GND
 *   - Trig Pin: Pin 3  [MOVED from Pin 11 to keep SPI free]
 *   - Echo Pin: Pin 4  [MOVED from Pin 12 to keep SPI free]
 * - RFID MFRC522 Reader (SPI):
 *   - VCC: 3.3V (Do NOT connect to 5V!)
 *   - RST: Pin 9
 *   - GND: GND
 *   - MISO: Pin 12
 *   - MOSI: Pin 11
 *   - SCK: Pin 13
 *   - SDA (SS): Pin 10
 */

#include <SPI.h>
#include <MFRC522.h>
#include <Servo.h>

// Pin Definitions
const int SERVO_PIN = 5;       // Moved to Pin 5 (SPI uses 11, 12, 13)
const int RED_LED_PIN = 7;
const int GREEN_LED_PIN = 6;
const int TRIG_PIN = 3;        // Moved to Pin 3 to clear Pin 11 (MOSI)
const int ECHO_PIN = 4;        // Moved to Pin 4 to clear Pin 12 (MISO)
const int RFID_SS_PIN = 10;
const int RFID_RST_PIN = 9;

// Gate State constants
const int GATE_CLOSED_ANGLE = 0;   // Degrees
const int GATE_OPEN_ANGLE = 90;    // Degrees
const int SAFETY_DISTANCE_CM = 30; // Min distance in cm to safely close the gate

Servo gateServo;
MFRC522 mfrc522(RFID_SS_PIN, RFID_RST_PIN); // Create MFRC522 instance

bool isGateOpen = false;
bool vehiclePassed = false;

void setup() {
  // Initialize Serial communication
  Serial.begin(9600);
  
  // Initialize SPI Bus and RFID Reader
  SPI.begin();
  mfrc522.PCD_Init();
  
  // Initialize pins
  pinMode(RED_LED_PIN, OUTPUT);
  pinMode(GREEN_LED_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  // Attach Servo motor and initialize to closed position
  gateServo.attach(SERVO_PIN);
  gateServo.write(GATE_CLOSED_ANGLE);
  
  // Initial LED status
  digitalWrite(RED_LED_PIN, HIGH);
  digitalWrite(GREEN_LED_PIN, LOW);
  
  Serial.println("READY"); // Signal Python script we are online
}

void loop() {
  // 1. Scan for RFID cards
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    String cardUID = "";
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      if (mfrc522.uid.uidByte[i] < 0x10) cardUID += "0";
      cardUID += String(mfrc522.uid.uidByte[i], HEX);
    }
    cardUID.toUpperCase();
    
    // Print card UID to serial so Python can intercept and verify it
    Serial.print("RFID:");
    Serial.println(cardUID);
    
    // Halt PICC to stop reading the card repeatedly
    mfrc522.PICC_HaltA();
    mfrc522.PCD_StopCrypto1();
  }

  // 2. Listen for commands from the Python bridge
  if (Serial.available() > 0) {
    char cmd = Serial.read();
    
    if (cmd == 'O') {
      openGate();
    } else if (cmd == 'C') {
      closeGate();
    }
  }

  // 3. Intelligent Auto-Close and Presence Detection logic
  if (isGateOpen) {
    long distance = getDistance();
    
    // Check if vehicle is currently passing through the gate
    if (distance > 0 && distance < SAFETY_DISTANCE_CM) {
      if (!vehiclePassed) {
        Serial.println("VEHICLE_DETECTED");
        vehiclePassed = true;
      }
    }
    
    // Check if the vehicle has successfully cleared the sensor after passing
    if (vehiclePassed && distance >= SAFETY_DISTANCE_CM) {
      delay(1500); // Small grace period for the vehicle's rear end to clear
      Serial.println("PASSED");
      closeGate();
      vehiclePassed = false;
    }
  }
  
  delay(100); // Small cycle delay to avoid excessive CPU loops
}

/**
 * Commands the Servo to open the gate and updates status LEDs
 */
void openGate() {
  if (!isGateOpen) {
    gateServo.write(GATE_OPEN_ANGLE);
    digitalWrite(GREEN_LED_PIN, HIGH);
    digitalWrite(RED_LED_PIN, LOW);
    isGateOpen = true;
    vehiclePassed = false; // Reset passing state
    Serial.println("STATUS:OPEN");
  }
}

/**
 * Commands the Servo to close the gate, checking the safety distance first
 */
void closeGate() {
  long distance = getDistance();
  
  // Safety check: Don't close if a vehicle is blocking the sensor
  if (distance > 0 && distance < SAFETY_DISTANCE_CM) {
    Serial.println("BLOCKED");
    
    // Flash LEDs to indicate blockage warning
    for (int i = 0; i < 3; i++) {
      digitalWrite(RED_LED_PIN, HIGH);
      digitalWrite(GREEN_LED_PIN, HIGH);
      delay(200);
      digitalWrite(RED_LED_PIN, LOW);
      digitalWrite(GREEN_LED_PIN, LOW);
      delay(200);
    }
    
    // Restore open state LEDs
    digitalWrite(GREEN_LED_PIN, HIGH);
    digitalWrite(RED_LED_PIN, LOW);
    return;
  }
  
  if (isGateOpen) {
    gateServo.write(GATE_CLOSED_ANGLE);
    digitalWrite(RED_LED_PIN, HIGH);
    digitalWrite(GREEN_LED_PIN, LOW);
    isGateOpen = false;
    vehiclePassed = false;
    Serial.println("STATUS:CLOSED");
  }
}

/**
 * Triggers the Ultrasonic sensor to measure distance in centimeters
 */
long getDistance() {
  // Clean trigger pin
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  
  // Send 10 microsecond pulse
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  // Read echo time in microseconds
  long duration = pulseIn(ECHO_PIN, HIGH, 30000); // 30ms timeout (~5 meters max)
  
  if (duration == 0) {
    return -1; // Out of range or timeout
  }
  
  // Convert duration to distance in centimeters (speed of sound is ~343 m/s)
  long distance = duration * 0.034 / 2;
  return distance;
}
