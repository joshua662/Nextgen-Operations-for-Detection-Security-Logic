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
    final firstName = json['first_name'] as String? ?? '';
    final lastName = json['last_name'] as String? ?? '';
    final combinedName = (firstName.isNotEmpty || lastName.isNotEmpty)
        ? '$firstName $lastName'.trim()
        : (json['name'] as String? ?? '');

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
    );
  }

  @override
  bool operator ==(Object other) => other is User && other.id == id;

  @override
  int get hashCode => id.hashCode;
}
