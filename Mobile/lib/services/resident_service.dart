import 'package:dio/dio.dart';

import '../core/constants/api_constants.dart';
import '../models/gate_log_model.dart';
import '../models/notification_model.dart';
import '../models/update_request_model.dart';

class ResidentService {
  final Dio _dio;

  ResidentService(this._dio);

  /// Get current gate status (OPEN / CLOSED)
  Future<Map<String, dynamic>> getGateStatus() async {
    final response = await _dio.get(ApiConstants.gateStatus);
    return response.data as Map<String, dynamic>;
  }

  /// Get personal gate logs
  Future<List<GateLogModel>> getMyGateLogs() async {
    try {
      final response = await _dio.get(ApiConstants.myGateLogs);
      final data = response.data;
      List rawList = [];
      if (data is Map && data['logs'] != null) {
        if (data['logs']['data'] is List) {
          rawList = data['logs']['data'] as List;
        } else if (data['logs'] is List) {
          rawList = data['logs'] as List;
        }
      } else if (data is List) {
        rawList = data;
      }
      return rawList
          .map((e) => GateLogModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  /// Get notifications
  Future<List<NotificationModel>> getNotifications() async {
    try {
      final response = await _dio.get(ApiConstants.notifications);
      final data = response.data;
      List rawList = [];
      if (data is Map && data['notifications'] != null) {
        if (data['notifications']['data'] is List) {
          rawList = data['notifications']['data'] as List;
        } else if (data['notifications'] is List) {
          rawList = data['notifications'] as List;
        }
      } else if (data is List) {
        rawList = data;
      }
      return rawList
          .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  /// Mark all notifications as read
  Future<void> markAllNotificationsRead() async {
    try {
      await _dio.put(ApiConstants.markAllNotificationsRead);
    } catch (_) {}
  }

  /// Get update requests
  Future<List<UpdateRequestModel>> getMyUpdateRequests() async {
    try {
      final response = await _dio.get(ApiConstants.myUpdateRequests);
      final data = response.data;
      List rawList = [];
      if (data is Map && data['requests'] != null) {
        if (data['requests']['data'] is List) {
          rawList = data['requests']['data'] as List;
        } else if (data['requests'] is List) {
          rawList = data['requests'] as List;
        }
      } else if (data is List) {
        rawList = data;
      }
      return rawList
          .map((e) => UpdateRequestModel.fromJson(e as Map<String, dynamic>))
          .toList();
    } catch (_) {
      return [];
    }
  }

  /// Submit a new guest access or profile update request
  Future<Map<String, dynamic>> submitUpdateRequest(
      Map<String, dynamic> payload) async {
    final response = await _dio.post(
      ApiConstants.submitUpdateRequest,
      data: payload,
    );
    return response.data as Map<String, dynamic>;
  }
}
