import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_colors.dart';

import '../../providers/auth_provider.dart';
import '../../providers/resident_provider.dart';
import '../../widgets/cached_image_widget.dart';

class ResidentHomeScreen extends ConsumerWidget {
  final Function(int)? onNavigateTab;

  const ResidentHomeScreen({super.key, this.onNavigateTab});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authAsync = ref.watch(authProvider);
    final gateAsync = ref.watch(gateStatusProvider);
    final logsAsync = ref.watch(myGateLogsProvider);

    return Scaffold(
      body: authAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Error: $e')),
        data: (user) {
          return RefreshIndicator(
            onRefresh: () async {
              // ignore: unused_result
              ref.refresh(gateStatusProvider.future);
              // ignore: unused_result
              ref.refresh(myGateLogsProvider.future);
            },
            child: CustomScrollView(
              slivers: [
                // ── Sticky Header with User Banner ───────────────────────
                SliverAppBar(
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
                                      user?.name ?? 'Resident',
                                      style: TextStyle(
                                        fontSize: 22.sp,
                                        fontWeight: FontWeight.bold,
                                        color: Colors.white,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    SizedBox(height: 6.h),
                                    if (user?.plateNumber != null)
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
                                          'Plate: ${user!.plateNumber!}',
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
                                  initials: user?.initials ?? 'R',
                                  radius: 28.r,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                // ── Main Content Body ─────────────────────────────────────
                SliverPadding(
                  padding: EdgeInsets.fromLTRB(16.w, 20.h, 16.w, 24.h),
                  sliver: SliverList(
                    delegate: SliverChildListDelegate([
                      // ── Gate Status & Member Card Banner ────────────────
                      gateAsync.when(
                        loading: () => const SizedBox.shrink(),
                        error: (_, _) => const SizedBox.shrink(),
                        data: (gate) {
                          final isOpen =
                              gate['is_open'] == true || gate['status'] == 'open';
                          return Container(
                            padding: EdgeInsets.all(16.r),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: isOpen
                                    ? [const Color(0xFF16A34A), const Color(0xFF15803D)]
                                    : [const Color(0xFF2563EB), const Color(0xFF1D4ED8)],
                                begin: Alignment.topLeft,
                                end: Alignment.bottomRight,
                              ),
                              borderRadius: BorderRadius.circular(16.r),
                              boxShadow: [
                                BoxShadow(
                                  color: (isOpen ? AppColors.success : AppColors.primary)
                                      .withAlpha(60),
                                  blurRadius: 12,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  isOpen
                                      ? Icons.sensor_door_rounded
                                      : Icons.security_rounded,
                                  color: Colors.white,
                                  size: 32.r,
                                ),
                                SizedBox(width: 14.w),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        'Gate Status: ${isOpen ? "OPEN" : "CLOSED"}',
                                        style: TextStyle(
                                          fontSize: 16.sp,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.white,
                                        ),
                                      ),
                                      SizedBox(height: 2.h),
                                      Text(
                                        'Automatic RFID & Plate Recognition Active',
                                        style: TextStyle(
                                          fontSize: 11.sp,
                                          color: Colors.white70,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),

                      SizedBox(height: 20.h),

                      // ── Quick Actions ──────────────────────────────────
                      Text(
                        'Quick Actions',
                        style: TextStyle(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 12.h),

                      Row(
                        children: [
                          Expanded(
                            child: _QuickTile(
                              icon: Icons.history_rounded,
                              label: 'Gate Logs',
                              color: AppColors.primary,
                              onTap: () => onNavigateTab?.call(1),
                            ),
                          ),
                          SizedBox(width: 10.w),
                          Expanded(
                            child: _QuickTile(
                              icon: Icons.note_add_rounded,
                              label: 'Guest Pass',
                              color: AppColors.secondary,
                              onTap: () => onNavigateTab?.call(2),
                            ),
                          ),
                          SizedBox(width: 10.w),
                          Expanded(
                            child: _QuickTile(
                              icon: Icons.notifications_rounded,
                              label: 'Alerts',
                              color: AppColors.info,
                              onTap: () => onNavigateTab?.call(3),
                            ),
                          ),
                        ],
                      ),

                      SizedBox(height: 24.h),

                      // ── Access Overview Statistics ──────────────────────
                      Text(
                        'Recent Access Activity',
                        style: TextStyle(
                          fontSize: 16.sp,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 12.h),

                      logsAsync.when(
                        loading: () => const Center(
                          child: CircularProgressIndicator(),
                        ),
                        error: (e, _) => const SizedBox.shrink(),
                        data: (logs) {
                          if (logs.isEmpty) {
                            return Container(
                              padding: EdgeInsets.all(20.r),
                              decoration: BoxDecoration(
                                color: Theme.of(context).cardColor,
                                borderRadius: BorderRadius.circular(14.r),
                                border: Border.all(
                                  color: Theme.of(context)
                                      .dividerColor
                                      .withAlpha(40),
                                ),
                              ),
                              child: Center(
                                child: Text(
                                  'No recent gate logs.',
                                  style: TextStyle(
                                    fontSize: 13.sp,
                                    color: AppColors.textSecondary,
                                  ),
                                ),
                              ),
                            );
                          }

                          return Column(
                            children: logs.take(4).map((log) {
                              final isEntry = log.direction == 'IN';
                              final color = isEntry
                                  ? AppColors.success
                                  : AppColors.primary;
                              return Container(
                                margin: EdgeInsets.only(bottom: 8.h),
                                decoration: BoxDecoration(
                                  color: Theme.of(context).cardColor,
                                  borderRadius: BorderRadius.circular(12.r),
                                  border: Border.all(
                                    color: Theme.of(context)
                                        .dividerColor
                                        .withAlpha(40),
                                  ),
                                ),
                                child: ListTile(
                                  leading: Container(
                                    width: 36.r,
                                    height: 36.r,
                                    decoration: BoxDecoration(
                                      color: color.withAlpha(25),
                                      shape: BoxShape.circle,
                                    ),
                                    child: Icon(
                                      isEntry
                                          ? Icons.arrow_downward_rounded
                                          : Icons.arrow_upward_rounded,
                                      color: color,
                                      size: 18.r,
                                    ),
                                  ),
                                  title: Text(
                                    isEntry ? 'Gate Entry' : 'Gate Exit',
                                    style: TextStyle(
                                      fontSize: 13.sp,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  subtitle: Text(
                                    log.loggedAt,
                                    style: TextStyle(
                                      fontSize: 11.sp,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          );
                        },
                      ),
                    ]),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _QuickTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickTile({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 16.h, horizontal: 10.w),
        decoration: BoxDecoration(
          color: color.withAlpha(20),
          borderRadius: BorderRadius.circular(14.r),
          border: Border.all(color: color.withAlpha(50)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withAlpha(30),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20.r),
            ),
            SizedBox(height: 8.h),
            Text(
              label,
              style: TextStyle(
                fontSize: 12.sp,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
