import '../core/constants/api_constants.dart';

class User {
  final int id;
  final String name;
  final String email;
  final String? avatar;
  final String? role;
  final String? slug;
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
        if (domainUri != null && domainUri.host != uri.host) {
          return uri
              .replace(
                scheme: domainUri.scheme,
                host: domainUri.host,
                port: domainUri.port,
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
    return User(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      avatar: json['avatar'] as String?,
      role: json['role'] as String?,
      slug: json['slug'] as String?,
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
    };
  }

  User copyWith({
    int? id,
    String? name,
    String? email,
    String? avatar,
    String? role,
    String? slug,
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
