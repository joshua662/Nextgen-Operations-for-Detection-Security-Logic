import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_colors.dart';
import '../../models/notification_model.dart';
import '../../providers/resident_provider.dart';
import '../../widgets/skeleton_loader.dart';

class ResidentNotificationsScreen extends ConsumerWidget {
  const ResidentNotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifsAsync = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(residentServiceProvider).markAllNotificationsRead();
              // ignore: unused_result
              ref.refresh(notificationsProvider);
            },
            child: const Text(
              'Mark Read',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
      body: notifsAsync.when(
        loading: () => const SkeletonListLoader(count: 5),
        error: (e, _) => Center(child: Text('Failed to load notifications: $e')),
        data: (notifications) {
          if (notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.notifications_off_outlined,
                    size: 48.r,
                    color: AppColors.textSecondary.withAlpha(120),
                  ),
                  SizedBox(height: 12.h),
                  Text(
                    'No notifications',
                    style: TextStyle(
                      fontSize: 14.sp,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(notificationsProvider),
            child: ListView.builder(
              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final notif = notifications[index];
                return _NotificationTile(notif: notif);
              },
            ),
          );
        },
      ),
    );
  }
}

class _NotificationTile extends StatelessWidget {
  final NotificationModel notif;
  const _NotificationTile({required this.notif});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 8.h),
      decoration: BoxDecoration(
        color: notif.isRead
            ? Theme.of(context).cardColor
            : AppColors.primary.withAlpha(15),
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(
          color: notif.isRead
              ? Theme.of(context).dividerColor.withAlpha(40)
              : AppColors.primary.withAlpha(60),
        ),
      ),
      child: ListTile(
        leading: Container(
          width: 36.r,
          height: 36.r,
          decoration: BoxDecoration(
            color: AppColors.primary.withAlpha(25),
            shape: BoxShape.circle,
          ),
          child: Icon(
            Icons.notifications_rounded,
            color: AppColors.primary,
            size: 18.r,
          ),
        ),
        title: Text(
          notif.title,
          style: TextStyle(
            fontSize: 14.sp,
            fontWeight: notif.isRead ? FontWeight.w500 : FontWeight.bold,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(height: 2.h),
            Text(
              notif.message,
              style: TextStyle(
                fontSize: 12.sp,
                color: AppColors.textSecondary,
              ),
            ),
            SizedBox(height: 4.h),
            Text(
              notif.createdAt,
              style: TextStyle(
                fontSize: 10.sp,
                color: AppColors.textSecondary.withAlpha(150),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
