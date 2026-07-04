/**
 * Nextgen Operations - Gate Security System
 * ESP32-CAM video streaming server (AI-Thinker Model)
 *
 * ONE sketch for both gate cameras — set CAMERA_ROLE before uploading:
 *   "ENTRANCE"  → flash to the entrance ESP32-CAM
 *   "EXIT"      → flash to the exit ESP32-CAM
 *
 * Stream URL format (matches guard dashboard):
 *   http://<device-ip>:81/stream
 *
 * Instructions:
 * 1. Set CAMERA_ROLE, WiFi SSID, and password below.
 * 2. Select board: "ESP32 Wrover Module" (or "AI Thinker ESP32-CAM").
 * 3. Select Partition Scheme: "Huge APP (3MB No OTA/1MB SPIFFS)".
 * 4. Connect ESP32-CAM via the ESP32-CAM-MB micro-USB port to upload.
 * 5. Copy the stream URL from Serial Monitor into the matching dashboard camera.
 */

#include "esp_camera.h"
#include <WiFi.h>
#include "esp_http_server.h"
#include "board_config.h"

// ==========================================
// DEVICE ROLE — change before each upload
// ==========================================
#define CAMERA_ROLE_ENTRANCE 1
#define CAMERA_ROLE_EXIT 2

// Set to CAMERA_ROLE_ENTRANCE or CAMERA_ROLE_EXIT
#define CAMERA_ROLE CAMERA_ROLE_ENTRANCE

const int STREAM_PORT = 81;

#if CAMERA_ROLE == CAMERA_ROLE_ENTRANCE
  const char* CAMERA_LOCATION = "ENTRANCE";
  const char* DASHBOARD_LABEL = "Entrance Camera";
  #define DEFAULT_STATIC_IP_4 104
#elif CAMERA_ROLE == CAMERA_ROLE_EXIT
  const char* CAMERA_LOCATION = "EXIT";
  const char* DASHBOARD_LABEL = "Exit Camera";
  #define DEFAULT_STATIC_IP_4 105
#else
  #error "Set CAMERA_ROLE to CAMERA_ROLE_ENTRANCE or CAMERA_ROLE_EXIT"
#endif

// Optional static IP — set USE_STATIC_IP true for a fixed LAN address.
#define USE_STATIC_IP true
IPAddress staticIP(192, 168, 2, DEFAULT_STATIC_IP_4);
IPAddress gatewayIP(192, 168, 2, 1);
IPAddress subnetMask(255, 255, 255, 0);

// ==========================================
// WIFI CREDENTIALS (Configure these!)
// ==========================================
const char* ssid = "MERCUSYS_D066";
const char* password = "31393928";

// ==========================================
// CAMERA PIN DEFINITIONS (AI-THINKER MODEL)
// ==========================================
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

#define PART_BOUNDARY "123456789000000000000987654321"
static const char* _stream_content_type = "multipart/x-mixed-replace;boundary=" PART_BOUNDARY;
static const char* _stream_boundary = "\r\n--" PART_BOUNDARY "\r\n";
static const char* _stream_part = "Content-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n";

httpd_handle_t stream_httpd = NULL;

static esp_err_t stream_handler(httpd_req_t *req){
  camera_fb_t * fb = NULL;
  esp_err_t res = ESP_OK;
  size_t _jpg_buf_len = 0;
  uint8_t * _jpg_buf = NULL;
  char * part_buf[64];

  res = httpd_resp_set_type(req, _stream_content_type);
  if(res != ESP_OK){
    return res;
  }

  while(true){
    fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      res = ESP_FAIL;
    } else {
      if(fb->format != PIXFORMAT_JPEG){
        bool jpeg_converted = frame2jpg(fb, 80, &_jpg_buf, &_jpg_buf_len);
        esp_camera_fb_return(fb);
        fb = NULL;
        if(!jpeg_converted){
          Serial.println("JPEG compression failed");
          res = ESP_FAIL;
        }
      } else {
        _jpg_buf_len = fb->len;
        _jpg_buf = fb->buf;
      }
    }
    if(res == ESP_OK){
      size_t hlen = snprintf((char *)part_buf, 64, _stream_part, _jpg_buf_len);
      res = httpd_resp_send_chunk(req, (const char *)part_buf, hlen);
    }
    if(res == ESP_OK){
      res = httpd_resp_send_chunk(req, (const char *)_jpg_buf, _jpg_buf_len);
    }
    if(res == ESP_OK){
      res = httpd_resp_send_chunk(req, _stream_boundary, strlen(_stream_boundary));
    }
    if(fb){
      esp_camera_fb_return(fb);
      fb = NULL;
      _jpg_buf = NULL;
    } else if(_jpg_buf){
      free(_jpg_buf);
      _jpg_buf = NULL;
    }
    if(res != ESP_OK){
      break;
    }
  }
  return res;
}

void startCameraServer(){
  httpd_config_t config = HTTPD_DEFAULT_CONFIG();
  config.server_port = STREAM_PORT;

  httpd_uri_t stream_uri = {
    .uri       = "/stream",
    .method    = HTTP_GET,
    .handler   = stream_handler,
    .user_ctx  = NULL
  };

  Serial.printf("[%s] Starting stream server on port: '%d'\n", CAMERA_LOCATION, config.server_port);
  if (httpd_start(&stream_httpd, &config) == ESP_OK) {
    httpd_register_uri_handler(stream_httpd, &stream_uri);
  }
}

void setup() {
  Serial.begin(115200);
  Serial.setDebugOutput(true);
  Serial.println();
  Serial.printf("[%s] ESP32-CAM booting (%s)...\n", CAMERA_LOCATION, DASHBOARD_LABEL);

  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if(psramFound()){
    config.frame_size = FRAMESIZE_SVGA;
    config.jpeg_quality = 12;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_VGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("[%s] Camera init failed with error 0x%x\n", CAMERA_LOCATION, err);
    return;
  }

  sensor_t * s = esp_camera_sensor_get();
  s->set_framesize(s, FRAMESIZE_SVGA);

  WiFi.mode(WIFI_STA);
#if USE_STATIC_IP
  WiFi.config(staticIP, gatewayIP, subnetMask);
#endif
  WiFi.begin(ssid, password);
  Serial.printf("[%s] Connecting to WiFi", CAMERA_LOCATION);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.printf("[%s] WiFi connected!\n", CAMERA_LOCATION);
  Serial.printf("[%s] %s Stream URL: http://", CAMERA_LOCATION, DASHBOARD_LABEL);
  Serial.print(WiFi.localIP());
  Serial.printf(":%d/stream\n", STREAM_PORT);
  Serial.printf("[%s] Paste this URL into the guard dashboard (%s).\n", CAMERA_LOCATION, DASHBOARD_LABEL);

  startCameraServer();
}

void loop() {
  delay(1000);
}
