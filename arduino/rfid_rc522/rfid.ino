#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN  9
#define SS_PIN   10

MFRC522 mfrc522(SS_PIN, RST_PIN);

unsigned long lastScanTime = 0;
const unsigned long scanCooldown = 500;

void sendUidToSerial(byte *uid, byte size) {
  Serial.print("RFID:");
  for (byte i = 0; i < size; i++) {
    if (uid[i] < 0x10) {
      Serial.print('0');
    }
    Serial.print(uid[i], HEX);
  }
  Serial.println();
}

void setup() {
  Serial.begin(9600);

  SPI.begin();
  mfrc522.PCD_Init();
  delay(4);
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_38dB);

  Serial.println(F("======================================="));
  Serial.println(F("--- 🔓 RFID GATE CONTROLLER READY ---"));
  Serial.println(F("Scan any registered RFID tag to trigger gate verification."));
  Serial.println(F("======================================="));
}

void loop() {
  if (millis() - lastScanTime < scanCooldown) return;
  if (!mfrc522.PICC_IsNewCardPresent()) return;
  if (!mfrc522.PICC_ReadCardSerial()) return;

  lastScanTime = millis();

  Serial.print(F("Scanned UID:"));
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
    Serial.print(mfrc522.uid.uidByte[i], HEX);
  }
  Serial.println();

  sendUidToSerial(mfrc522.uid.uidByte, mfrc522.uid.size);

  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}
