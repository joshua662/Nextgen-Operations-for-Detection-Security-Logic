class GateLogModel {
  final int id;
  final String direction; // 'IN' or 'OUT'
  final String? plateNumber;
  final String status; // 'granted', 'denied', 'unauthorized'
  final String loggedAt;

  GateLogModel({
    required this.id,
    required this.direction,
    this.plateNumber,
    required this.status,
    required this.loggedAt,
  });

  factory GateLogModel.fromJson(Map<String, dynamic> json) {
    return GateLogModel(
      id: json['log_id'] as int? ?? json['id'] as int? ?? 0,
      direction: (json['direction'] as String? ?? 'IN').toUpperCase(),
      plateNumber: json['plate_number'] as String? ?? json['plate'] as String?,
      status: json['status'] as String? ?? 'granted',
      loggedAt: json['logged_at'] as String? ??
          json['created_at'] as String? ??
          '',
    );
  }
}
