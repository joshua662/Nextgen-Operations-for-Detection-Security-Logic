import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/network/dio_client.dart';
import '../models/user_model.dart';
import '../services/user_service.dart';

// ── UserService provider ──────────────────────────────────────────────────────
final userServiceProvider = Provider<UserService>((ref) {
  final dio = ref.watch(dioProvider);
  return UserService(dio);
});

// ── Users list async state ────────────────────────────────────────────────────
class UsersNotifier extends AsyncNotifier<List<User>> {
  bool _includeDeleted = false;

  @override
  Future<List<User>> build() async {
    return _fetch();
  }

  Future<List<User>> _fetch() {
    final service = ref.read(userServiceProvider);
    return service.getUsers(includeDeleted: _includeDeleted);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  void toggleShowDeleted() {
    _includeDeleted = !_includeDeleted;
    refresh();
  }

  Future<void> deleteUser(int id) async {
    final service = ref.read(userServiceProvider);
    await service.deleteUser(id);
    await refresh();
  }

  Future<void> restoreUser(int id) async {
    final service = ref.read(userServiceProvider);
    await service.restoreUser(id);
    await refresh();
  }
}

final usersProvider = AsyncNotifierProvider<UsersNotifier, List<User>>(
  () => UsersNotifier(),
);

// ── Single user by slug ───────────────────────────────────────────────────────
final userBySlugProvider = FutureProvider.family<User, String>((ref, slug) {
  final service = ref.watch(userServiceProvider);
  return service.getUser(slug);
});
