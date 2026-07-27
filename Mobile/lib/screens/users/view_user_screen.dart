import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_colors.dart';
import '../../models/user_model.dart';
import '../../widgets/cached_image_widget.dart';

class ViewUserScreen extends StatelessWidget {
  const ViewUserScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = ModalRoute.of(context)!.settings.arguments as User;

    return Scaffold(
      appBar: AppBar(title: const Text('User Details')),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 24.h),
        child: Column(
          children: [
            // Avatar
            UserAvatarWidget(
              imageUrl: user.avatarUrl.isEmpty ? null : user.avatarUrl,
              initials: user.initials,
              radius: 52.r,
            ),

            SizedBox(height: 16.h),

            Text(
              user.name,
              style: Theme.of(context).textTheme.headlineMedium,
              textAlign: TextAlign.center,
            ),

            SizedBox(height: 4.h),

            Text(
              user.email,
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),

            if (user.role != null) ...[
              SizedBox(height: 10.h),
              _RoleBadge(role: user.role!),
            ],

            if (user.isDeleted) ...[
              SizedBox(height: 10.h),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 6.h),
                decoration: BoxDecoration(
                  color: AppColors.error.withAlpha(26),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: AppColors.error.withAlpha(77)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(
                      Icons.delete_outline,
                      color: AppColors.error,
                      size: 16,
                    ),
                    SizedBox(width: 6.w),
                    Text(
                      'Deleted Account',
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: AppColors.error,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],

            SizedBox(height: 32.h),
            const Divider(),
            SizedBox(height: 16.h),

            _DetailRow(icon: Icons.badge_outlined, label: 'ID', value: '#${user.id}'),
            if (user.slug != null)
              _DetailRow(icon: Icons.link, label: 'Slug', value: user.slug!),
            if (user.role != null)
              _DetailRow(
                icon: Icons.shield_outlined,
                label: 'Role',
                value: user.role![0].toUpperCase() + user.role!.substring(1),
              ),
            if (user.createdAt != null)
              _DetailRow(
                icon: Icons.calendar_today_outlined,
                label: 'Joined',
                value: _formatDate(user.createdAt!),
              ),
            if (user.updatedAt != null)
              _DetailRow(
                icon: Icons.update_outlined,
                label: 'Last Updated',
                value: _formatDate(user.updatedAt!),
              ),
          ],
        ),
      ),
    );
  }

  String _formatDate(String iso) {
    try {
      final dt = DateTime.parse(iso).toLocal();
      return '${dt.day}/${dt.month}/${dt.year} ${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
    } catch (_) {
      return iso;
    }
  }
}

class _RoleBadge extends StatelessWidget {
  final String role;
  const _RoleBadge({required this.role});

  Color _color() {
    switch (role.toLowerCase()) {
      case 'admin':
        return AppColors.primary;
      case 'moderator':
        return AppColors.secondary;
      default:
        return AppColors.textSecondary;
    }
  }

  @override
  Widget build(BuildContext context) {
    final color = _color();
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 5.h),
      decoration: BoxDecoration(
        color: color.withAlpha(26),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(77)),
      ),
      child: Text(
        role[0].toUpperCase() + role.substring(1),
        style: TextStyle(
          fontSize: 12.sp,
          color: color,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _DetailRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 8.h),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: AppColors.primary.withAlpha(26),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: AppColors.primary, size: 20),
        ),
        title: Text(
          label,
          style: TextStyle(fontSize: 11.sp, color: AppColors.textSecondary),
        ),
        subtitle: Text(
          value,
          style: TextStyle(
            fontSize: 15.sp,
            fontWeight: FontWeight.w500,
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ),
    );
  }
}
