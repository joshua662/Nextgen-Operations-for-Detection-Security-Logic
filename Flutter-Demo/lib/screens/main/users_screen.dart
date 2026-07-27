import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/router/app_router.dart';
import '../../core/utils/toast_helper.dart';
import '../../providers/user_provider.dart';
import '../../widgets/app_loading.dart';
import '../../widgets/user_card.dart';

class UsersScreen extends ConsumerStatefulWidget {
  const UsersScreen({super.key});

  @override
  ConsumerState<UsersScreen> createState() => _UsersScreenState();
}

class _UsersScreenState extends ConsumerState<UsersScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final usersAsync = ref.watch(usersProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(AppStrings.users),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(usersProvider.notifier).refresh(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          await Navigator.of(context).pushNamed(AppRouter.createUser);
          ref.read(usersProvider.notifier).refresh();
        },
        icon: const Icon(Icons.person_add_outlined),
        label: const Text('New User'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(16.w, 12.h, 16.w, 0),
            child: TextField(
              controller: _searchCtrl,
              onChanged: (v) => setState(() => _query = v.toLowerCase()),
              decoration: InputDecoration(
                hintText: 'Search users...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _query.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchCtrl.clear();
                          setState(() => _query = '');
                        },
                      )
                    : null,
              ),
            ),
          ),
          SizedBox(height: 8.h),
          Expanded(
            child: usersAsync.when(
              loading: () => const AppLoading(),
              error: (e, _) => Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                    SizedBox(height: 12.h),
                    const Text('Failed to load users'),
                    SizedBox(height: 8.h),
                    ElevatedButton(
                      onPressed: () => ref.read(usersProvider.notifier).refresh(),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
              data: (users) {
                final filtered = _query.isEmpty
                    ? users
                    : users.where((u) =>
                        u.name.toLowerCase().contains(_query) ||
                        u.email.toLowerCase().contains(_query)).toList();

                if (filtered.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.people_outline, size: 56, color: AppColors.textSecondary.withAlpha(128)),
                        SizedBox(height: 12.h),
                        Text(_query.isEmpty ? 'No users yet' : 'No results found',
                            style: Theme.of(context).textTheme.bodyMedium),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => ref.read(usersProvider.notifier).refresh(),
                  child: ListView.builder(
                    padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 8.h),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final user = filtered[index];
                      return UserCard(
                        user: user,
                        onTap: () => Navigator.of(context).pushNamed(AppRouter.viewUser, arguments: user),
                        onEdit: () async {
                          await Navigator.of(context).pushNamed(AppRouter.editUser, arguments: user);
                          ref.read(usersProvider.notifier).refresh();
                        },
                        onDelete: () => _confirmDelete(user.id, user.name),
                        onRestore: user.isDeleted ? () => _restore(user.id) : null,
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmDelete(int id, String name) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete User'),
        content: Text('Are you sure you want to delete "$name"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirm == true && mounted) {
      try {
        await ref.read(usersProvider.notifier).deleteUser(id);
        if (mounted) ToastHelper.showSuccess(context, 'User deleted');
      } catch (e) {
        if (mounted) ToastHelper.showError(context, 'Failed to delete user');
      }
    }
  }

  Future<void> _restore(int id) async {
    try {
      await ref.read(usersProvider.notifier).restoreUser(id);
      if (mounted) ToastHelper.showSuccess(context, 'User restored');
    } catch (e) {
      if (mounted) ToastHelper.showError(context, 'Failed to restore user');
    }
  }
}
