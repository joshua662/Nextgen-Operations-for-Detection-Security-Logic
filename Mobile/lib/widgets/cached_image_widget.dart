import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';

import '../core/constants/app_colors.dart';

/// Wraps [CachedNetworkImage] with loading placeholder and error fallback.
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
    if (url == null || url.isEmpty) {
      return _placeholder();
    }

    Widget image = CachedNetworkImage(
      imageUrl: url,
      width: width,
      height: height,
      fit: fit,
      placeholder: (context, url) => _shimmer(),
      errorWidget: (context, url, error) => errorWidget ?? _placeholder(),
    );

    if (borderRadius != null) {
      image = ClipRRect(borderRadius: borderRadius!, child: image);
    }

    return image;
  }

  Widget _shimmer() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.divider,
        borderRadius: borderRadius,
      ),
    );
  }

  Widget _placeholder() {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.divider,
        borderRadius: borderRadius,
      ),
      child: const Icon(Icons.person_outline, color: AppColors.textSecondary),
    );
  }
}

/// Circular avatar variant of [CachedImageWidget] with initials fallback.
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
                key: ValueKey(imageUrl!),
                imageUrl: imageUrl!,
                width: radius * 2,
                height: radius * 2,
                fit: BoxFit.cover,
                placeholder: (_, _) => _initialsWidget(),
                errorWidget: (_, _, _) => _initialsWidget(),
              ),
            )
          : _initialsWidget(),
    );
  }

  Widget _initialsWidget() {
    return Icon(
      Icons.person_rounded,
      size: radius * 1.1,
      color: AppColors.primary,
    );
  }
}
