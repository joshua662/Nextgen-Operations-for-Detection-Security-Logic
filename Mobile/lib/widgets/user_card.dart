import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../core/constants/app_colors.dart';
import '../models/user_model.dart';
import 'cached_image_widget.dart';

/// A card widget for displaying a [User] in a list.
class UserCard extends StatelessWidget {
  final User user;
  final VoidCallback? onTap;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final VoidCallback? onRestore;

  const UserCard({
    super.key,
    required this.user,
    this.onTap,
    this.onEdit,
    this.onDelete,
    this.onRestore,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDeleted = user.isDeleted;

    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12.r),
        child: Padding(
          padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
          child: Row(
            children: [
              // Avatar
              UserAvatarWidget(
                imageUrl: user.avatarUrl.isEmpty ? null : user.avatarUrl,
                initials: user.initials,
                radius: 24.r,
              ),
              SizedBox(width: 12.w),

              // Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            user.name,
                            style: theme.textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w600,
                              decoration: isDeleted
                                  ? TextDecoration.lineThrough
                                  : null,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (isDeleted)
                          _Badge(
                            label: 'Deleted',
                            color: AppColors.error,
                          )
                        else if (user.role != null)
                          _Badge(
                            label: user.role!,
                            color: _roleColor(user.role!),
                          ),
                      ],
                    ),
                    SizedBox(height: 2.h),
                    Text(
                      user.email,
                      style: theme.textTheme.bodySmall,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),

              // Actions
              PopupMenuButton<String>(
                icon: const Icon(Icons.more_vert, size: 20),
                onSelected: (value) {
                  switch (value) {
                    case 'edit':
                      onEdit?.call();
                    case 'delete':
                      onDelete?.call();
                    case 'restore':
                      onRestore?.call();
                  }
                },
                itemBuilder: (_) => [
                  const PopupMenuItem(
                    value: 'edit',
                    child: ListTile(
                      leading: Icon(Icons.edit_outlined),
                      title: Text('Edit'),
                      dense: true,
                    ),
                  ),
                  if (isDeleted)
                    const PopupMenuItem(
                      value: 'restore',
                      child: ListTile(
                        leading: Icon(Icons.restore, color: AppColors.success),
                        title: Text('Restore'),
                        dense: true,
                      ),
                    )
                  else
                    PopupMenuItem(
                      value: 'delete',
                      child: ListTile(
                        leading: const Icon(Icons.delete_outline, color: AppColors.error),
                        title: Text(
                          'Delete',
                          style: TextStyle(color: AppColors.error),
                        ),
                        dense: true,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _roleColor(String role) {
    switch (role.toLowerCase()) {
      case 'admin':
        return AppColors.primary;
      case 'moderator':
        return AppColors.secondary;
      default:
        return AppColors.textSecondary;
    }
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
      decoration: BoxDecoration(
        color: color.withAlpha(26),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withAlpha(77)),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 10.sp,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
