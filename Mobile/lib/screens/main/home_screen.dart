import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../providers/auth_provider.dart';
import '../../providers/user_provider.dart';
import '../../widgets/cached_image_widget.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authProvider);
    final usersAsync = ref.watch(usersProvider);

    return Scaffold(
      backgroundColor: Theme.of(context).scaffoldBackgroundColor,
      body: authAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (user) => RefreshIndicator(
          onRefresh: () => ref.read(usersProvider.notifier).refresh(),
          child: CustomScrollView(
            slivers: [
              // ── Sticky header with gradient ────────────────────────────
              SliverAppBar(
                automaticallyImplyLeading: false,
                expandedHeight: 180.h,
                pinned: true,
                elevation: 0,
                backgroundColor: const Color(0xFF0D1B4B),
                flexibleSpace: FlexibleSpaceBar(
                  background: Container(
                    decoration: const BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Color(0xFF0A0E27), Color(0xFF1D4ED8)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                    ),
                    child: SafeArea(
                      child: Padding(
                        padding: EdgeInsets.fromLTRB(20.w, 16.h, 20.w, 0),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text(
                                    'Welcome back,',
                                    style: TextStyle(
                                      fontSize: 13.sp,
                                      color: Colors.white60,
                                    ),
                                  ),
                                  SizedBox(height: 4.h),
                                  Text(
                                    user?.name ?? '—',
                                    style: TextStyle(
                                      fontSize: 24.sp,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  SizedBox(height: 8.h),
                                  if (user?.role != null)
                                    Container(
                                      padding: EdgeInsets.symmetric(
                                        horizontal: 10.w,
                                        vertical: 3.h,
                                      ),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withAlpha(40),
                                        borderRadius:
                                            BorderRadius.circular(20),
                                        border: Border.all(
                                          color: Colors.white.withAlpha(60),
                                        ),
                                      ),
                                      child: Text(
                                        user!.role!,
                                        style: TextStyle(
                                          fontSize: 11.sp,
                                          color: Colors.white,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            SizedBox(width: 16.w),
                            Container(
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: Colors.white.withAlpha(80),
                                  width: 2,
                                ),
                                boxShadow: [
                                  BoxShadow(
                                    color: Colors.black.withAlpha(60),
                                    blurRadius: 12,
                                  ),
                                ],
                              ),
                              child: UserAvatarWidget(
                                imageUrl: user?.avatarUrl.isEmpty == true
                                    ? null
                                    : user?.avatarUrl,
                                initials: user?.initials ?? '?',
                                radius: 30.r,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),

              // ── Body content ───────────────────────────────────────────
              SliverPadding(
                padding: EdgeInsets.fromLTRB(16.w, 20.h, 16.w, 24.h),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    // ── Quick stats ──────────────────────────────────────
                    Row(
                      children: [
                        Icon(
                          Icons.bar_chart_rounded,
                          size: 16,
                          color: AppColors.textSecondary,
                        ),
                        SizedBox(width: 6.w),
                        Text(
                          'Overview',
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ],
                    ),
                    SizedBox(height: 12.h),
                    usersAsync.when(
                      loading: () => ClipRRect(
                        borderRadius: BorderRadius.circular(8.r),
                        child: const LinearProgressIndicator(),
                      ),
                      error: (_, _) => const SizedBox.shrink(),
                      data: (users) {
                        final activeCount =
                            users.where((u) => !u.isDeleted).length;
                        final deletedCount =
                            users.where((u) => u.isDeleted).length;
                        return Row(
                          children: [
                            Expanded(
                              child: _StatCard(
                                icon: Icons.people_rounded,
                                label: 'Total',
                                value: '${users.length}',
                                color: AppColors.primary,
                              ),
                            ),
                            SizedBox(width: 10.w),
                            Expanded(
                              child: _StatCard(
                                icon: Icons.verified_user_rounded,
                                label: 'Active',
                                value: '$activeCount',
                                color: AppColors.success,
                              ),
                            ),
                            SizedBox(width: 10.w),
                            Expanded(
                              child: _StatCard(
                                icon: Icons.person_off_rounded,
                                label: 'Deleted',
                                value: '$deletedCount',
                                color: AppColors.error,
                              ),
                            ),
                          ],
                        );
                      },
                    ),

                    SizedBox(height: 28.h),

                    // ── System info ──────────────────────────────────────
                    Row(
                      children: [
                        Icon(
                          Icons.info_outline_rounded,
                          size: 16,
                          color: AppColors.textSecondary,
                        ),
                        SizedBox(width: 6.w),
                        Text(
                          'System',
                          style: Theme.of(context)
                              .textTheme
                              .titleLarge
                              ?.copyWith(
                                fontWeight: FontWeight.w700,
                              ),
                        ),
                      ],
                    ),
                    SizedBox(height: 12.h),
                    _InfoTile(
                      icon: Icons.security_rounded,
                      title: AppStrings.appName,
                      subtitle:
                          'Nextgen Operations for Detection Security Logic',
                      iconColor: AppColors.primary,
                    ),
                    _InfoTile(
                      icon: Icons.api_rounded,
                      title: 'API Connected',
                      subtitle: 'Laravel REST API',
                      iconColor: AppColors.success,
                      trailing: Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: AppColors.success,
                          shape: BoxShape.circle,
                        ),
                      ),
                    ),
                    _InfoTile(
                      icon: Icons.phone_android_rounded,
                      title: 'Platform',
                      subtitle: 'Flutter Mobile App',
                      iconColor: AppColors.info,
                    ),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: EdgeInsets.symmetric(vertical: 16.h, horizontal: 10.w),
      decoration: BoxDecoration(
        color: color.withAlpha(isDark ? 25 : 18),
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: color.withAlpha(60)),
        boxShadow: [
          BoxShadow(
            color: color.withAlpha(isDark ? 25 : 15),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withAlpha(30),
              shape: BoxShape.circle,
            ),
            child: Icon(icon, color: color, size: 20),
          ),
          SizedBox(height: 10.h),
          Text(
            value,
            style: TextStyle(
              fontSize: 22.sp,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          SizedBox(height: 2.h),
          Text(
            label,
            style: TextStyle(
              fontSize: 10.sp,
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color iconColor;
  final Widget? trailing;

  const _InfoTile({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.iconColor = AppColors.primary,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 10.h),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(14.r),
        border: Border.all(
          color: Theme.of(context).dividerColor.withAlpha(60),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: ListTile(
        contentPadding:
            EdgeInsets.symmetric(horizontal: 16.w, vertical: 4.h),
        leading: Container(
          width: 40.r,
          height: 40.r,
          decoration: BoxDecoration(
            color: iconColor.withAlpha(22),
            borderRadius: BorderRadius.circular(10.r),
          ),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        title: Text(
          title,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 14.sp,
          ),
        ),
        subtitle: Text(
          subtitle,
          style: TextStyle(
            fontSize: 12.sp,
            color: AppColors.textSecondary,
          ),
        ),
        trailing: trailing,
      ),
    );
  }
}
