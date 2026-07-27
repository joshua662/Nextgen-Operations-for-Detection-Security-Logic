import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/dio_client.dart';
import '../core/storage/secure_storage.dart';
import '../models/user_model.dart';
import '../services/auth_service.dart';

// ── SecureStorage provider ────────────────────────────────────────────────────
final secureStorageProvider = Provider<SecureStorage>((ref) => SecureStorage());

// ── AuthService provider ──────────────────────────────────────────────────────
final authServiceProvider = Provider<AuthService>((ref) {
  final dio = ref.watch(dioProvider);
  final storage = ref.watch(secureStorageProvider);
  return AuthService(dio, storage);
});

// ── Auth state (current logged-in user) ───────────────────────────────────────
class AuthNotifier extends AsyncNotifier<User?> {
  @override
  Future<User?> build() async {
    final storage = ref.watch(secureStorageProvider);
    final hasToken = await storage.hasToken();
    if (!hasToken) return null;

    try {
      final service = ref.read(authServiceProvider);
      return await service.me();
    } catch (_) {
      await storage.deleteToken();
      return null;
    }
  }

  Future<void> setUser(User user) async {
    state = AsyncData(user);
  }

  Future<void> logout() async {
    final service = ref.read(authServiceProvider);
    await service.logout();
    state = const AsyncData(null);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    try {
      final service = ref.read(authServiceProvider);
      final user = await service.me();
      state = AsyncData(user);
    } catch (e) {
      state = AsyncError(e, StackTrace.current);
    }
  }
}

final authProvider = AsyncNotifierProvider<AuthNotifier, User?>(() => AuthNotifier());
