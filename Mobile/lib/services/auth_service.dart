import 'package:dio/dio.dart';

import '../core/constants/api_constants.dart';
import '../core/storage/secure_storage.dart';
import '../models/user_model.dart';

class AuthService {
  final Dio _dio;
  final SecureStorage _storage;

  AuthService(this._dio, this._storage);

  /// Login with email/username and password. Saves token on success and returns the User.
  Future<User> login(String email, String password) async {
    final response = await _dio.post(
      ApiConstants.login,
      data: {
        'username': email,
        'email': email,
        'login': email,
        'password': password,
      },
    );

    final data = response.data;
    final token = data['token'] as String? ?? data['access_token'] as String?;
    if (token == null || token.isEmpty) {
      throw Exception('No token returned from server');
    }

    await _storage.saveToken(token);

    final userData =
        data['user'] as Map<String, dynamic>? ??
        data['data'] as Map<String, dynamic>?;

    if (userData == null) {
      // Fetch user separately if not bundled
      return await me();
    }

    return User.fromJson(userData);
  }

  /// Resident Quick Login using Plate Number and Contact Number.
  Future<User> residentLoginByPlate(
      String plateNumber, String contactNumber) async {
    final response = await _dio.post(
      ApiConstants.residentLogin,
      data: {
        'plate_number': plateNumber,
        'contact_number': contactNumber,
      },
    );

    final data = response.data;
    final token = data['token'] as String? ?? data['access_token'] as String?;
    if (token == null || token.isEmpty) {
      throw Exception('No token returned from server');
    }

    await _storage.saveToken(token);

    final userData =
        data['user'] as Map<String, dynamic>? ??
        data['data'] as Map<String, dynamic>?;

    if (userData == null) {
      return await me();
    }

    return User.fromJson(userData);
  }

  /// Logout the current user. Deletes the stored token.
  Future<void> logout() async {
    try {
      await _dio.post(ApiConstants.logout);
    } catch (_) {
      // Best-effort — always clear token locally
    } finally {
      await _storage.deleteToken();
    }
  }

  /// Fetch the currently authenticated user.
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

  /// Register a new Resident account.
  Future<Map<String, dynamic>> registerResident(
    Map<String, dynamic> payload, {
    String? imagePath,
  }) async {
    dynamic body;
    if (imagePath != null && imagePath.isNotEmpty) {
      final formData = FormData.fromMap(payload);
      formData.files.add(
        MapEntry(
          'profile_picture',
          await MultipartFile.fromFile(
            imagePath,
            filename: imagePath.split('/').last,
          ),
        ),
      );
      body = formData;
    } else {
      body = payload;
    }

    final response = await _dio.post(
      ApiConstants.residentRegister,
      data: body,
    );
    return response.data as Map<String, dynamic>;
  }

  /// Register a new Security Guard account.
  Future<Map<String, dynamic>> registerSecurityGuard(
    Map<String, dynamic> payload, {
    String? imagePath,
  }) async {
    dynamic body;
    if (imagePath != null && imagePath.isNotEmpty) {
      final formData = FormData.fromMap(payload);
      formData.files.add(
        MapEntry(
          'profile_picture',
          await MultipartFile.fromFile(
            imagePath,
            filename: imagePath.split('/').last,
          ),
        ),
      );
      body = formData;
    } else {
      body = payload;
    }

    final response = await _dio.post(
      ApiConstants.securityGuardRegister,
      data: body,
    );
    return response.data as Map<String, dynamic>;
  }

  /// Update the current user's profile.
  Future<User> updateProfile(
    Map<String, dynamic> payload, {
    String? imagePath,
  }) async {
    dynamic body;
    if (imagePath != null && imagePath.isNotEmpty) {
      final formData = FormData.fromMap({
        ...payload,
        '_method': 'PUT',
      });
      formData.files.add(
        MapEntry(
          'profile_picture',
          await MultipartFile.fromFile(
            imagePath,
            filename: imagePath.split(RegExp(r'[/\\]')).last,
          ),
        ),
      );
      body = formData;
    } else {
      body = payload;
    }

    final response = await _dio.post(
      ApiConstants.updateProfile,
      data: body,
    );
    final data = response.data;
    if (data is Map<String, dynamic>) {
      final userData =
          data['user'] as Map<String, dynamic>? ??
          data['data'] as Map<String, dynamic>? ??
          data;
      return User.fromJson(userData);
    }
    throw Exception('Unexpected response format for /auth/profile');
  }

  /// Request password reset link.
  Future<void> forgotPassword(String email) async {
    await _dio.post(
      ApiConstants.forgotPassword,
      data: {'email': email},
    );
  }
}
