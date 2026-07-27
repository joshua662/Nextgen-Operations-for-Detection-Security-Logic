import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/router/app_router.dart';
import '../../core/utils/toast_helper.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/cached_image_widget.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(title: Text(AppStrings.profile)),
      body: authAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (user) {
          if (user == null) return const SizedBox.shrink();
          return SingleChildScrollView(
            padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 24.h),
            child: Column(
              children: [
                UserAvatarWidget(
                  imageUrl: user.avatarUrl.isEmpty ? null : user.avatarUrl,
                  initials: user.initials,
                  radius: 48.r,
                ),
                SizedBox(height: 16.h),
                Text(user.name, style: Theme.of(context).textTheme.headlineMedium),
                SizedBox(height: 4.h),
                Text(user.email, style: Theme.of(context).textTheme.bodyMedium),
                if (user.role != null) ...[
                  SizedBox(height: 8.h),
                  Container(
                    padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 4.h),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withAlpha(26),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: AppColors.primary.withAlpha(77)),
                    ),
                    child: Text(user.role!,
                        style: TextStyle(fontSize: 12.sp, fontWeight: FontWeight.w600, color: AppColors.primary)),
                  ),
                ],
                SizedBox(height: 32.h),
                const Divider(),
                SizedBox(height: 16.h),
                _ProfileTile(icon: Icons.badge_outlined, label: 'User ID', value: '#${user.id}'),
                if (user.slug != null)
                  _ProfileTile(icon: Icons.link, label: 'Slug', value: user.slug!),
                if (user.createdAt != null)
                  _ProfileTile(icon: Icons.calendar_today_outlined, label: 'Member since', value: _formatDate(user.createdAt!)),
                SizedBox(height: 32.h),
                AppButton(
                  label: 'Edit Profile',
                  icon: const Icon(Icons.edit_outlined, color: Colors.white, size: 20),
                  onPressed: () async {
                    await Navigator.of(context).pushNamed(AppRouter.editUser, arguments: user);
                    ref.read(authProvider.notifier).refresh();
                  },
                ),
                SizedBox(height: 12.h),
                AppButton(
                  label: AppStrings.logout,
                  icon: const Icon(Icons.logout, color: Colors.white, size: 20),
                  backgroundColor: AppColors.error,
                  onPressed: () => _confirmLogout(context, ref),
                ),
                SizedBox(height: 24.h),
              ],
            ),
          );
        },
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.day}/${dt.month}/${dt.year}';
    } catch (_) {
      return iso;
    }
  }

  Future<void> _confirmLogout(BuildContext context, WidgetRef ref) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
    if (confirm == true && context.mounted) {
      await ref.read(authProvider.notifier).logout();
      if (context.mounted) {
        ToastHelper.showInfo(context, AppStrings.logoutSuccess);
        Navigator.of(context).pushNamedAndRemoveUntil(AppRouter.login, (_) => false);
      }
    }
  }
}

class _ProfileTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _ProfileTile({required this.icon, required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 8.h),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(color: AppColors.primary.withAlpha(26), borderRadius: BorderRadius.circular(8)),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        title: Text(label, style: TextStyle(fontSize: 12.sp, color: AppColors.textSecondary)),
        subtitle: Text(value,
            style: TextStyle(fontSize: 15.sp, fontWeight: FontWeight.w500, color: Theme.of(context).colorScheme.onSurface)),
      ),
    );
  }
}
