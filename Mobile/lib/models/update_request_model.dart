import 'dart:convert';

class UpdateRequestModel {
  final int id;
  final String requestType; // 'guest_access', 'profile_update', etc.
  final String status; // 'pending', 'approved', 'rejected'
  final String? notes;
  final String createdAt;
  final String? guestName;
  final String? guestPlateNumber;
  final String? accessReason;
  final String? accessDate;
  final Map<String, dynamic> requestedChanges;

  UpdateRequestModel({
    required this.id,
    required this.requestType,
    required this.status,
    this.notes,
    required this.createdAt,
    this.guestName,
    this.guestPlateNumber,
    this.accessReason,
    this.accessDate,
    required this.requestedChanges,
  });

  bool get isGuestAccess =>
      requestType == 'guest_access' ||
      guestName != null ||
      guestPlateNumber != null;
  bool get isApproved => status.toLowerCase() == 'approved';
  bool get isRejected => status.toLowerCase() == 'rejected';
  bool get isPending => status.toLowerCase() == 'pending';

  factory UpdateRequestModel.fromJson(Map<String, dynamic> json) {
    Map<String, dynamic> changes = {};
    final rawChanges = json['requested_changes'];
    if (rawChanges is Map<String, dynamic>) {
      changes = rawChanges;
    } else if (rawChanges is String && rawChanges.isNotEmpty) {
      try {
        final decoded = jsonDecode(rawChanges);
        if (decoded is Map<String, dynamic>) {
          changes = decoded;
        }
      } catch (_) {}
    }

    final rType = (changes['request_type'] as String?) ??
        (json['request_type'] as String?) ??
        'guest_access';

    return UpdateRequestModel(
      id: json['update_request_id'] as int? ??
          json['request_id'] as int? ??
          json['id'] as int? ??
          0,
      requestType: rType,
      status: json['status'] as String? ?? 'pending',
      notes: json['admin_notes'] as String? ?? json['message'] as String?,
      createdAt: json['created_at'] as String? ?? '',
      guestName: (changes['guest_name'] as String?) ??
          (json['guest_name'] as String?),
      guestPlateNumber: (changes['guest_plate_number'] as String?) ??
          (json['guest_plate_number'] as String?),
      accessReason: (changes['access_reason'] as String?) ??
          (json['access_reason'] as String?),
      accessDate: (changes['access_date'] as String?) ??
          (json['access_date'] as String?),
      requestedChanges: changes,
    );
  }
}
