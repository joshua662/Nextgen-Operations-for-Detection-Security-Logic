import 'package:dio/dio.dart';

import '../core/constants/api_constants.dart';
import '../models/user_model.dart';

class UserService {
  final Dio _dio;

  UserService(this._dio);

  /// Fetch paginated list of users. Pass [includeDeleted] to include soft-deleted.
  Future<List<User>> getUsers({bool includeDeleted = false}) async {
    final response = await _dio.get(
      ApiConstants.users,
      queryParameters: includeDeleted ? {'with_trashed': true} : null,
    );
    final data = response.data;
    List<dynamic> list;
    if (data is List) {
      list = data;
    } else if (data is Map) {
      list =
          data['data'] as List<dynamic>? ??
          data['users'] as List<dynamic>? ??
          [];
    } else {
      list = [];
    }
    return list.map((e) => User.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Fetch a single user by slug.
  Future<User> getUser(String slug) async {
    final response = await _dio.get(ApiConstants.userShow(slug));
    final data = response.data;
    if (data is Map<String, dynamic>) {
      final userData =
          data['data'] as Map<String, dynamic>? ??
          data['user'] as Map<String, dynamic>? ??
          data;
      return User.fromJson(userData);
    }
    throw Exception('Unexpected response for getUser');
  }

  /// Create a new user. [formData] should be a FormData with multipart fields.
  Future<User> createUser(Map<String, dynamic> fields, {String? imagePath}) async {
    final formData = FormData();
    fields.forEach((key, value) {
      if (value != null) formData.fields.add(MapEntry(key, value.toString()));
    });
    if (imagePath != null) {
      formData.files.add(
        MapEntry('avatar', await MultipartFile.fromFile(imagePath, filename: 'avatar.jpg')),
      );
    }
    final response = await _dio.post(ApiConstants.users, data: formData);
    final data = response.data;
    if (data is Map<String, dynamic>) {
      final userData =
          data['data'] as Map<String, dynamic>? ??
          data['user'] as Map<String, dynamic>? ??
          data;
      return User.fromJson(userData);
    }
    throw Exception('Unexpected response for createUser');
  }

  /// Update an existing user by ID.
  Future<User> updateUser(
    int id,
    Map<String, dynamic> fields, {
    String? imagePath,
  }) async {
    final formData = FormData();
    // Laravel requires _method override for PUT with multipart
    formData.fields.add(const MapEntry('_method', 'PUT'));
    fields.forEach((key, value) {
      if (value != null) formData.fields.add(MapEntry(key, value.toString()));
    });
    if (imagePath != null) {
      formData.files.add(
        MapEntry('avatar', await MultipartFile.fromFile(imagePath, filename: 'avatar.jpg')),
      );
    }
    final response = await _dio.post(ApiConstants.userUpdate(id), data: formData);
    final data = response.data;
    if (data is Map<String, dynamic>) {
      final userData =
          data['data'] as Map<String, dynamic>? ??
          data['user'] as Map<String, dynamic>? ??
          data;
      return User.fromJson(userData);
    }
    throw Exception('Unexpected response for updateUser');
  }

  /// Soft-delete a user by ID.
  Future<void> deleteUser(int id) async {
    await _dio.delete(ApiConstants.userDelete(id));
  }

  /// Restore a soft-deleted user by ID.
  Future<User> restoreUser(int id) async {
    final response = await _dio.post(ApiConstants.userRestore(id));
    final data = response.data;
    if (data is Map<String, dynamic>) {
      final userData =
          data['data'] as Map<String, dynamic>? ??
          data['user'] as Map<String, dynamic>? ??
          data;
      return User.fromJson(userData);
    }
    throw Exception('Unexpected response for restoreUser');
  }
}
