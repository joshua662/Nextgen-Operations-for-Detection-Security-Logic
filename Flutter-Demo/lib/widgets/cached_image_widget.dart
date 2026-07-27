import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/constants/app_colors.dart';

class CachedImageWidget extends StatelessWidget {
  final String? imageUrl;
  final double? width;
  final double? height;
  final BoxFit fit;
  final BorderRadius? borderRadius;
  final Widget? errorWidget;

  const CachedImageWidget({
    super.key,
    this.imageUrl,
    this.width,
    this.height,
    this.fit = BoxFit.cover,
    this.borderRadius,
    this.errorWidget,
  });

  @override
  Widget build(BuildContext context) {
    final url = imageUrl;
    if (url == null || url.isEmpty) return _placeholder();

    Widget image = CachedNetworkImage(
      imageUrl: url,
      width: width,
      height: height,
      fit: fit,
      placeholder: (_, __) => _shimmer(),
      errorWidget: (_, __, ___) => errorWidget ?? _placeholder(),
    );

    if (borderRadius != null) {
      image = ClipRRect(borderRadius: borderRadius!, child: image);
    }
    return image;
  }

  Widget _shimmer() => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(color: AppColors.divider, borderRadius: borderRadius),
      );

  Widget _placeholder() => Container(
        width: width,
        height: height,
        decoration: BoxDecoration(color: AppColors.divider, borderRadius: borderRadius),
        child: const Icon(Icons.person_outline, color: AppColors.textSecondary),
      );
}

class UserAvatarWidget extends StatelessWidget {
  final String? imageUrl;
  final String initials;
  final double radius;

  const UserAvatarWidget({
    super.key,
    this.imageUrl,
    required this.initials,
    this.radius = 24,
  });

  @override
  Widget build(BuildContext context) {
    final hasImage = imageUrl != null && imageUrl!.isNotEmpty;
    return CircleAvatar(
      radius: radius,
      backgroundColor: AppColors.primary.withAlpha(30),
      child: hasImage
          ? ClipOval(
              child: CachedNetworkImage(
                imageUrl: imageUrl!,
                width: radius * 2,
                height: radius * 2,
                fit: BoxFit.cover,
                placeholder: (_, __) => _initialsWidget(),
                errorWidget: (_, __, ___) => _initialsWidget(),
              ),
            )
          : _initialsWidget(),
    );
  }

  Widget _initialsWidget() => Text(
        initials,
        style: TextStyle(
          fontSize: radius * 0.6,
          fontWeight: FontWeight.bold,
          color: AppColors.primary,
        ),
      );
}
