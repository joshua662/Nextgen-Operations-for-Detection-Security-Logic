import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/router/app_router.dart';
import '../../core/utils/image_helper.dart';
import '../../core/utils/toast_helper.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/cached_image_widget.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _updateProfilePhoto(
      BuildContext context, WidgetRef ref, User user) async {
    final croppedPath = await ImageHelper.pickAndCropImage(context);
    if (croppedPath == null) return;

    try {
      if (context.mounted) {
        ToastHelper.showInfo(context, 'Uploading profile picture...');
      }
      final authService = ref.read(authServiceProvider);
      final updatedUser = await authService.updateProfile(
        {},
        imagePath: croppedPath,
      );
      await ref.read(authProvider.notifier).setUser(updatedUser);
      if (context.mounted) {
        ToastHelper.showSuccess(context, 'Profile picture updated!');
      }
    } catch (e) {
      if (context.mounted) {
        ToastHelper.showError(context, 'Failed to update photo: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authProvider);

    return Scaffold(
      body: authAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (user) {
          if (user == null) return const SizedBox.shrink();

          return CustomScrollView(
            slivers: [
              // ── Gradient header with avatar ────────────────────────────
              SliverAppBar(
                expandedHeight: 260.h,
                pinned: true,
                centerTitle: true,
                backgroundColor: const Color(0xFF0A0E27),
                elevation: 0,
                title: Text(
                  AppStrings.profile,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16.sp,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                flexibleSpace: FlexibleSpaceBar(
                  background: Stack(
                    children: [
                      Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFF0A0E27), Color(0xFF1D4ED8)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                        ),
                      ),
                      // Decorative circle
                      Positioned(
                        right: -30.r,
                        top: -30.r,
                        child: Container(
                          width: 140.r,
                          height: 140.r,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: Colors.white.withAlpha(12),
                          ),
                        ),
                      ),
                      Positioned.fill(
                        child: SafeArea(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.center,
                            children: [
                              SizedBox(height: 48.h),
                              // Avatar with camera badge
                              GestureDetector(
                                onTap: () =>
                                    _updateProfilePhoto(context, ref, user),
                                child: Stack(
                                  alignment: Alignment.bottomRight,
                                  children: [
                                    Container(
                                      decoration: BoxDecoration(
                                        shape: BoxShape.circle,
                                        boxShadow: [
                                          BoxShadow(
                                            color: AppColors.primary.withAlpha(80),
                                            blurRadius: 20,
                                            spreadRadius: 2,
                                          ),
                                        ],
                                        border: Border.all(
                                          color: Colors.white.withAlpha(80),
                                          width: 3,
                                        ),
                                      ),
                                      child: UserAvatarWidget(
                                        imageUrl: user.avatarUrl.isEmpty
                                            ? null
                                            : user.avatarUrl,
                                        initials: user.initials,
                                        radius: 40.r,
                                      ),
                                    ),
                                    Container(
                                      padding: EdgeInsets.all(5.r),
                                      decoration: const BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                      child: Icon(
                                        Icons.camera_alt_rounded,
                                        size: 14.r,
                                        color: Colors.white,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              SizedBox(height: 10.h),
                              Text(
                                user.name,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 20.sp,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              ),
                              SizedBox(height: 4.h),
                              Text(
                                user.email,
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 13.sp,
                                  color: Colors.white60,
                                ),
                              ),
                              if (user.role != null) ...[
                                SizedBox(height: 8.h),
                                Container(
                                  padding: EdgeInsets.symmetric(
                                    horizontal: 14.w,
                                    vertical: 4.h,
                                  ),
                                  decoration: BoxDecoration(
                                    color: Colors.white.withAlpha(30),
                                    borderRadius: BorderRadius.circular(20),
                                    border: Border.all(
                                      color: Colors.white.withAlpha(60),
                                    ),
                                  ),
                                  child: Text(
                                    user.role![0].toUpperCase() + user.role!.substring(1),
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 11.sp,
                                      fontWeight: FontWeight.w700,
                                      color: Colors.white,
                                      letterSpacing: 0.5,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Body ──────────────────────────────────────────────────
              SliverPadding(
                padding: EdgeInsets.fromLTRB(16.w, 20.h, 16.w, 32.h),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // ── Info section ─────────────────────────────────────
                    _SectionLabel(label: 'Account Details'),
                    SizedBox(height: 10.h),
                    _ProfileTile(
                      icon: Icons.badge_outlined,
                      label: 'User ID',
                      value: '#${user.id}',
                      iconColor: AppColors.primary,
                    ),
                    if (user.slug != null)
                      _ProfileTile(
                        icon: Icons.link_rounded,
                        label: 'Slug',
                        value: user.slug!,
                        iconColor: AppColors.info,
                      ),
                    if (user.createdAt != null)
                      _ProfileTile(
                        icon: Icons.calendar_today_rounded,
                        label: 'Member since',
                        value: _formatDate(user.createdAt!),
                        iconColor: AppColors.success,
                      ),

                    SizedBox(height: 28.h),

                    // ── Actions ──────────────────────────────────────────
                    _SectionLabel(label: 'Actions'),
                    SizedBox(height: 10.h),

                    // Edit profile
                    _ActionTile(
                      icon: Icons.edit_rounded,
                      label: 'Edit Profile',
                      color: AppColors.primary,
                      onTap: () async {
                        await Navigator.of(context).pushNamed(
                          AppRouter.editUser,
                          arguments: user,
                        );
                        ref.read(authProvider.notifier).refresh();
                      },
                    ),

                    SizedBox(height: 8.h),

                    // Logout
                    _ActionTile(
                      icon: Icons.logout_rounded,
                      label: AppStrings.logout,
                      color: AppColors.error,
                      onTap: () => _confirmLogout(context, ref),
                    ),
                  ]),
                ),
              ),
            ],
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
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(20),
        ),
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
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
        Navigator.of(context).pushNamedAndRemoveUntil(
          AppRouter.login,
          (_) => false,
        );
      }
    }
  }
}

class _SectionLabel extends StatelessWidget {
  final String label;
  const _SectionLabel({required this.label});

  @override
  Widget build(BuildContext context) {
    return Text(
      label,
      style: TextStyle(
        fontSize: 13.sp,
        fontWeight: FontWeight.w700,
        color: AppColors.textSecondary,
        letterSpacing: 0.5,
      ),
    );
  }
}

class _ProfileTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color iconColor;

  const _ProfileTile({
    required this.icon,
    required this.label,
    required this.value,
    this.iconColor = AppColors.primary,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 8.h),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(
          color: Theme.of(context).dividerColor.withAlpha(60),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding:
            EdgeInsets.symmetric(horizontal: 16.w, vertical: 4.h),
        leading: Container(
          width: 38.r,
          height: 38.r,
          decoration: BoxDecoration(
            color: iconColor.withAlpha(22),
            borderRadius: BorderRadius.circular(10.r),
          ),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        title: Text(
          label,
          style: TextStyle(
            fontSize: 11.sp,
            color: AppColors.textSecondary,
            fontWeight: FontWeight.w500,
          ),
        ),
        subtitle: Text(
          value,
          style: TextStyle(
            fontSize: 15.sp,
            fontWeight: FontWeight.w600,
            color: Theme.of(context).colorScheme.onSurface,
          ),
        ),
      ),
    );
  }
}

class _ActionTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14.r),
        child: Container(
          padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 16.h),
          decoration: BoxDecoration(
            color: color.withAlpha(18),
            borderRadius: BorderRadius.circular(14.r),
            border: Border.all(color: color.withAlpha(50)),
          ),
          child: Row(
            children: [
              Container(
                width: 38.r,
                height: 38.r,
                decoration: BoxDecoration(
                  color: color.withAlpha(30),
                  borderRadius: BorderRadius.circular(10.r),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              SizedBox(width: 14.w),
              Text(
                label,
                style: TextStyle(
                  fontSize: 15.sp,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
              const Spacer(),
              Icon(
                Icons.chevron_right_rounded,
                color: color.withAlpha(150),
                size: 20,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
