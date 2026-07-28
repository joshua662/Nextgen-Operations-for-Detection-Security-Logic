import '../core/constants/api_constants.dart';

class User {
  final int id;
  final String name;
  final String email;
  final String? avatar;
  final String? role;
  final String? slug;
  final String? plateNumber;
  final String? contactNumber;
  final String? deletedAt;
  final String? createdAt;
  final String? updatedAt;

  // Extended profile fields from server
  final String? firstName;
  final String? lastName;
  final String? username;
  final String? address;
  final String? age;
  final String? rfidUid;
  final String? carModel;
  final String? carColor;

  const User({
    required this.id,
    required this.name,
    required this.email,
    this.avatar,
    this.role,
    this.slug,
    this.plateNumber,
    this.contactNumber,
    this.deletedAt,
    this.createdAt,
    this.updatedAt,
    this.firstName,
    this.lastName,
    this.username,
    this.address,
    this.age,
    this.rfidUid,
    this.carModel,
    this.carColor,
  });

  bool get isDeleted => deletedAt != null;

  String get avatarUrl {
    if (avatar == null || avatar!.isEmpty) return '';
    if (avatar!.startsWith('http://') || avatar!.startsWith('https://')) {
      final uri = Uri.tryParse(avatar!);
      if (uri != null && (uri.host == 'localhost' || uri.host == '127.0.0.1')) {
        final domainUri = Uri.tryParse(ApiConstants.domain);
        if (domainUri != null) {
          return uri
              .replace(
                scheme: domainUri.scheme,
                host: domainUri.host,
                port: domainUri.hasPort ? domainUri.port : null,
              )
              .toString();
        }
      }
      return avatar!;
    }
    final cleanPath = avatar!.startsWith('/') ? avatar!.substring(1) : avatar!;
    if (cleanPath.startsWith('storage/')) {
      return '${ApiConstants.domain}/$cleanPath';
    }
    return '${ApiConstants.storageUrl}/$cleanPath';
  }

  String get initials {
    final parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.isNotEmpty ? name[0].toUpperCase() : '?';
  }

  factory User.fromJson(Map<String, dynamic> json) {
    final fName = json['first_name'] as String? ?? '';
    final lName = json['last_name'] as String? ?? '';
    final combinedName = (fName.isNotEmpty || lName.isNotEmpty)
        ? '$fName $lName'.trim()
        : (json['name'] as String? ?? '');

    // Parse age: can be int or string from server
    String? ageStr;
    if (json['age'] != null) {
      ageStr = json['age'].toString();
    }

    return User(
      id: json['user_id'] as int? ?? json['id'] as int? ?? 0,
      name: combinedName,
      email: json['email'] as String? ?? '',
      avatar: json['profile_picture'] as String? ?? json['avatar'] as String?,
      role: json['role'] as String?,
      slug: json['slug'] as String?,
      plateNumber: json['plate_number'] as String?,
      contactNumber: json['contact_number'] as String?,
      deletedAt: json['deleted_at'] as String?,
      createdAt: json['created_at'] as String?,
      updatedAt: json['updated_at'] as String?,
      firstName: fName.isNotEmpty ? fName : null,
      lastName: lName.isNotEmpty ? lName : null,
      username: json['username'] as String?,
      address: json['address'] as String?,
      age: ageStr,
      rfidUid: json['rfid_uid'] as String?,
      carModel: json['car_model'] as String?,
      carColor: json['car_color'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      if (avatar != null) 'avatar': avatar,
      if (role != null) 'role': role,
      if (slug != null) 'slug': slug,
      if (plateNumber != null) 'plate_number': plateNumber,
      if (contactNumber != null) 'contact_number': contactNumber,
    };
  }

  User copyWith({
    int? id,
    String? name,
    String? email,
    String? avatar,
    String? role,
    String? slug,
    String? plateNumber,
    String? contactNumber,
    String? deletedAt,
    String? createdAt,
    String? updatedAt,
    String? firstName,
    String? lastName,
    String? username,
    String? address,
    String? age,
    String? rfidUid,
    String? carModel,
    String? carColor,
  }) {
    return User(
      id: id ?? this.id,
      name: name ?? this.name,
      email: email ?? this.email,
      avatar: avatar ?? this.avatar,
      role: role ?? this.role,
      slug: slug ?? this.slug,
      plateNumber: plateNumber ?? this.plateNumber,
      contactNumber: contactNumber ?? this.contactNumber,
      deletedAt: deletedAt ?? this.deletedAt,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      username: username ?? this.username,
      address: address ?? this.address,
      age: age ?? this.age,
      rfidUid: rfidUid ?? this.rfidUid,
      carModel: carModel ?? this.carModel,
      carColor: carColor ?? this.carColor,
    );
  }

  @override
  bool operator ==(Object other) => other is User && other.id == id;

  @override
  int get hashCode => id.hashCode;
}
