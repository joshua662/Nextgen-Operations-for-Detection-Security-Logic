import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../widgets/image_cropper_dialog.dart';

class ImageHelper {
  static final ImagePicker _picker = ImagePicker();

  /// Picks an image from [source] and presents an interactive crop dialog.
  /// Returns the path of the cropped image file, or null if cancelled.
  static Future<String?> pickAndCropImage(
    BuildContext context, {
    ImageSource source = ImageSource.gallery,
  }) async {
    final XFile? pickedFile = await _picker.pickImage(
      source: source,
      maxWidth: 1600,
      maxHeight: 1600,
      imageQuality: 92,
    );
    if (pickedFile == null) return null;

    if (!context.mounted) return pickedFile.path;

    final croppedPath = await ImageCropperDialog.show(context, pickedFile.path);
    return croppedPath;
  }
}
