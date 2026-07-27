import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../core/constants/app_colors.dart';
import '../core/constants/app_strings.dart';

/// App logo/branding widget shown on Splash and Login screens.
class AppLogo extends StatelessWidget {
  final double? iconSize;
  final bool showTagline;

  const AppLogo({super.key, this.iconSize, this.showTagline = true});

  @override
  Widget build(BuildContext context) {
    final size = iconSize ?? 72.r;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.primary, AppColors.secondary],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(size * 0.25),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withAlpha(77),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Icon(
            Icons.security_rounded,
            color: Colors.white,
            size: size * 0.55,
          ),
        ),
        SizedBox(height: 16.h),
        Text(
          AppStrings.appName,
          style: TextStyle(
            fontSize: 26.sp,
            fontWeight: FontWeight.bold,
            color: Theme.of(context).colorScheme.onSurface,
            letterSpacing: 0.5,
          ),
        ),
        if (showTagline) ...[
          SizedBox(height: 4.h),
          Text(
            AppStrings.appTagline,
            style: TextStyle(
              fontSize: 13.sp,
              color: Theme.of(context).colorScheme.onSurface.withAlpha(153),
              letterSpacing: 1.2,
            ),
          ),
        ],
      ],
    );
  }
}
