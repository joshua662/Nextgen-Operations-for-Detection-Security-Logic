import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/auth/login_state.dart';
import '../models/user_model.dart';
import 'auth_provider.dart';

class LoginNotifier extends Notifier<LoginState> {
  @override
  LoginState build() => const LoginIdle();

  Future<void> login(String email, String password) async {
    if (state is LoginLoading) return;
    state = const LoginLoading();

    try {
      final service = ref.read(authServiceProvider);
      final user = await service.login(email.trim(), password);
      await ref.read(authProvider.notifier).setUser(user);
      state = LoginSuccess(user);
    } on DioException catch (e) {
      state = LoginError(_parseDioError(e));
    } catch (e) {
      state = LoginError(e.toString());
    }
  }

  void reset() => state = const LoginIdle();

  String _parseDioError(DioException e) {
    final data = e.response?.data;
    if (data is Map) {
      return data['message'] as String? ??
          data['error'] as String? ??
          'Login failed';
    }
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.receiveTimeout:
        return 'Connection timed out. Check your network.';
      case DioExceptionType.connectionError:
        return 'Cannot reach server. Check your API URL.';
      default:
        return e.message ?? 'An error occurred';
    }
  }
}

final loginProvider = NotifierProvider<LoginNotifier, LoginState>(
  LoginNotifier.new,
);

// Helper: currently logged-in User (non-nullable, must be used inside authenticated zone)
final currentUserProvider = Provider<User>((ref) {
  final user = ref.watch(authProvider).value;
  if (user == null) throw StateError('No authenticated user');
  return user;
});
