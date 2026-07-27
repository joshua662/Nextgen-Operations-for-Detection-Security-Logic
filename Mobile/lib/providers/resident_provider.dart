import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/dio_client.dart';
import '../models/gate_log_model.dart';
import '../models/notification_model.dart';
import '../models/update_request_model.dart';
import '../services/resident_service.dart';

final residentServiceProvider = Provider<ResidentService>((ref) {
  final dio = ref.watch(dioProvider);
  return ResidentService(dio);
});

final gateStatusProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final service = ref.watch(residentServiceProvider);
  return service.getGateStatus();
});

final myGateLogsProvider = FutureProvider<List<GateLogModel>>((ref) async {
  final service = ref.watch(residentServiceProvider);
  return service.getMyGateLogs();
});

final notificationsProvider =
    FutureProvider<List<NotificationModel>>((ref) async {
  final service = ref.watch(residentServiceProvider);
  return service.getNotifications();
});

final myUpdateRequestsProvider =
    FutureProvider<List<UpdateRequestModel>>((ref) async {
  final service = ref.watch(residentServiceProvider);
  return service.getMyUpdateRequests();
});
