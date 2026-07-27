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
      appBar: AppBar(title: Text(AppStrings.home)),
      body: authAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (user) => RefreshIndicator(
          onRefresh: () => ref.read(usersProvider.notifier).refresh(),
          child: ListView(
            padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 20.h),
            children: [
              // Welcome card
              Container(
                padding: EdgeInsets.all(20.r),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.primary, Color(0xFF3B82F6)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16.r),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary.withAlpha(77),
                      blurRadius: 16,
                      offset: const Offset(0, 6),
                    ),
                  ],
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Welcome back,',
                              style: TextStyle(fontSize: 13.sp, color: Colors.white70)),
                          SizedBox(height: 4.h),
                          Text(user?.name ?? 'User',
                              style: TextStyle(
                                fontSize: 22.sp,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              )),
                          if (user?.role != null) ...[
                            SizedBox(height: 4.h),
                            Container(
                              padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 3.h),
                              decoration: BoxDecoration(
                                color: Colors.white24,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(user!.role!,
                                  style: TextStyle(fontSize: 11.sp, color: Colors.white, fontWeight: FontWeight.w600)),
                            ),
                          ],
                        ],
                      ),
                    ),
                    UserAvatarWidget(
                      imageUrl: (user?.avatarUrl.isEmpty ?? true) ? null : user?.avatarUrl,
                      initials: user?.initials ?? '?',
                      radius: 32.r,
                    ),
                  ],
                ),
              ),

              SizedBox(height: 24.h),

              Text('Overview', style: Theme.of(context).textTheme.titleLarge),
              SizedBox(height: 12.h),

              usersAsync.when(
                loading: () => const LinearProgressIndicator(),
                error: (_, __) => const SizedBox.shrink(),
                data: (users) {
                  final activeCount = users.where((u) => !u.isDeleted).length;
                  final deletedCount = users.where((u) => u.isDeleted).length;
                  return Row(
                    children: [
                      Expanded(child: _StatCard(icon: Icons.people_rounded, label: 'Total', value: '${users.length}', color: AppColors.primary)),
                      SizedBox(width: 12.w),
                      Expanded(child: _StatCard(icon: Icons.check_circle_outline, label: 'Active', value: '$activeCount', color: AppColors.success)),
                      SizedBox(width: 12.w),
                      Expanded(child: _StatCard(icon: Icons.delete_outline, label: 'Deleted', value: '$deletedCount', color: AppColors.error)),
                    ],
                  );
                },
              ),

              SizedBox(height: 24.h),
              Text('System', style: Theme.of(context).textTheme.titleLarge),
              SizedBox(height: 12.h),
              _InfoTile(
                icon: Icons.security_rounded,
                title: AppStrings.appName,
                subtitle: 'Nextgen Operations for Detection Security Logic',
              ),
              _InfoTile(
                icon: Icons.api_rounded,
                title: 'API Connected',
                subtitle: 'Laravel REST API',
                trailing: Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(color: AppColors.success, shape: BoxShape.circle),
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

  const _StatCard({required this.icon, required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(14.r),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(color: color.withAlpha(51)),
        boxShadow: [BoxShadow(color: Colors.black.withAlpha(13), blurRadius: 8, offset: const Offset(0, 2))],
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 24),
          SizedBox(height: 8.h),
          Text(value, style: TextStyle(fontSize: 22.sp, fontWeight: FontWeight.bold, color: color)),
          SizedBox(height: 2.h),
          Text(label, style: TextStyle(fontSize: 10.sp, color: AppColors.textSecondary), textAlign: TextAlign.center),
        ],
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Widget? trailing;

  const _InfoTile({required this.icon, required this.title, required this.subtitle, this.trailing});

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
        title: Text(title, style: const TextStyle(fontWeight: FontWeight.w600)),
        subtitle: Text(subtitle),
        trailing: trailing,
      ),
    );
  }
}
