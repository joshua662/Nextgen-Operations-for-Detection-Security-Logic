import 'package:dio/dio.dart';

import '../core/constants/api_constants.dart';
import '../core/storage/secure_storage.dart';
import '../models/user_model.dart';

class AuthService {
  final Dio _dio;
  final SecureStorage _storage;

  AuthService(this._dio, this._storage);

  Future<User> login(String email, String password) async {
    final response = await _dio.post(
      ApiConstants.login,
      data: {'email': email, 'password': password},
    );

    final data = response.data as Map<String, dynamic>;
    final token = data['token'] as String? ?? data['access_token'] as String?;
    if (token == null || token.isEmpty) {
      throw Exception('No token returned from server');
    }

    await _storage.saveToken(token);

    final userData =
        data['user'] as Map<String, dynamic>? ??
        data['data'] as Map<String, dynamic>?;

    if (userData == null) return await me();
    return User.fromJson(userData);
  }

  Future<void> logout() async {
    try {
      await _dio.post(ApiConstants.logout);
    } catch (_) {
      // Best-effort — always clear token locally
    } finally {
      await _storage.deleteToken();
    }
  }

  Future<User> me() async {
    final response = await _dio.get(ApiConstants.user);
    final data = response.data;
    if (data is Map<String, dynamic>) {
      final userData =
          data['user'] as Map<String, dynamic>? ??
          data['data'] as Map<String, dynamic>? ??
          data;
      return User.fromJson(userData);
    }
    throw Exception('Unexpected response format for /me');
  }
}
