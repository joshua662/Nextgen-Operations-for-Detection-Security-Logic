#include <SPI.h>
#include <MFRC522.h>

#define RST_PIN  9
#define SS_PIN   10

MFRC522 mfrc522(SS_PIN, RST_PIN);

// 🔑 Slot 1: Permanently locked to your White Card (4‑byte UID)
const byte cardUID[4] = {0xB1, 0xA3, 0xCC, 0x0A};

// 🔑 Slot 2: Dynamically catches your Keychain Fob
byte fobUID[10];        // allow up to 10 bytes
byte fobUIDSize = 0;    // actual length of fob UID
bool fobIsRegistered = false;

// 🔄 Login/Logout state
bool whiteCardLoggedIn = false;
bool fobLoggedIn = false;

// ⏱️ Cooldown
unsigned long lastScanTime = 0;
const unsigned long scanCooldown = 500;

// --- Helper: Toggle login/logout ---
void toggleAccess(bool &state, const char *label) {
  state = !state;
  if (state) {
    Serial.print(F("🔓 LOGIN! ("));
    Serial.print(label);
    Serial.println(F(")"));
  } else {
    Serial.print(F("🔒 LOGOUT! ("));
    Serial.print(label);
    Serial.println(F(")"));
  }
}

// --- Helper: Compare UIDs ---
bool compareUID(byte *uid1, byte size1, byte *uid2, byte size2) {
  if (size1 != size2) return false;
  for (byte i = 0; i < size1; i++) {
    if (uid1[i] != uid2[i]) return false;
  }
  return true;
}

void sendUidToSerial(const char *prefix, byte *uid, byte size) {
  Serial.print(prefix);
  Serial.print(':');
  for (byte i = 0; i < size; i++) {
    if (uid[i] < 0x10) {
      Serial.print('0');
    }
    Serial.print(uid[i], HEX);
  }
  Serial.println();
}

void setup() {
  Serial.begin(115200);
  while (!Serial) { ; }

  SPI.begin();
  mfrc522.PCD_Init();
  delay(4);
  mfrc522.PCD_SetAntennaGain(mfrc522.RxGain_38dB);

  Serial.println(F("======================================="));
  Serial.println(F("--- 🔓 DUAL-ACCESS CONTROLLER READY ---"));
  Serial.println(F("1. Scan White Card to verify."));
  Serial.println(F("2. Scan Blue Fob to permanently register it."));
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

  bool isWhiteCard = (mfrc522.uid.size == 4 &&
                      memcmp(mfrc522.uid.uidByte, cardUID, 4) == 0);

  bool isRegisteredFob = fobIsRegistered &&
                         compareUID(mfrc522.uid.uidByte, mfrc522.uid.size,
                                    fobUID, fobUIDSize);

  // --- Unified LOGIN / LOGOUT ---
  if (isWhiteCard) {
    if (!whiteCardLoggedIn) {
      sendUidToSerial("RFID_IN", mfrc522.uid.uidByte, mfrc522.uid.size);
    } else {
      sendUidToSerial("RFID_OUT", mfrc522.uid.uidByte, mfrc522.uid.size);
    }
    toggleAccess(whiteCardLoggedIn, "White Card");
  }
  else if (isRegisteredFob) {
    sendUidToSerial("RFID", mfrc522.uid.uidByte, mfrc522.uid.size);
    toggleAccess(fobLoggedIn, "Keychain Fob");
  }
  else if (!fobIsRegistered) {
    memcpy(fobUID, mfrc522.uid.uidByte, mfrc522.uid.size);
    fobUIDSize = mfrc522.uid.size;
    fobIsRegistered = true;
    fobLoggedIn = true;
    sendUidToSerial("RFID", mfrc522.uid.uidByte, mfrc522.uid.size);
    Serial.println(F("✨ KEYCHAIN FOB REGISTERED INDEFINITELY!"));
    Serial.println(F("🔓 LOGIN! (Keychain Fob)"));
  }
  else {
    sendUidToSerial("RFID", mfrc522.uid.uidByte, mfrc522.uid.size);
    Serial.println(F("🔒 ACCESS DENIED! Unknown tag."));
  }

  // Properly halt card
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
}