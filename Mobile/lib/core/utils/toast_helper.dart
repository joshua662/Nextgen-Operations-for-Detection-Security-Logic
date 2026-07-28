import 'dart:async';
import 'package:flutter/material.dart';

import '../../widgets/modals/toast_message.dart';

/// App-wide toast helper that displays premium dark-glass overlay toasts
/// matching Client's ToastMessage design via Flutter's [OverlayState].
///
/// Using [OverlayEntry] ensures toasts float over screen content and modals
/// without creating competing [Navigator] routes or breaking modal pop logic.
class ToastHelper {
  ToastHelper._();

  static OverlayEntry? _currentEntry;
  static Timer? _timer;

  static void _showOverlay(
    BuildContext context, {
    required String title,
    required String message,
    required bool isFailed,
    Duration duration = const Duration(seconds: 3),
  }) {
    _timer?.cancel();
    if (_currentEntry != null) {
      try {
        _currentEntry?.remove();
      } catch (_) {}
      _currentEntry = null;
    }

    final overlayState = Overlay.maybeOf(context);
    if (overlayState == null) return;

    late OverlayEntry entry;
    entry = OverlayEntry(
      builder: (ctx) {
        return Material(
          color: Colors.transparent,
          child: Stack(
            children: [
              Positioned.fill(
                child: GestureDetector(
                  onTap: () {
                    _timer?.cancel();
                    try {
                      entry.remove();
                    } catch (_) {}
                    if (_currentEntry == entry) _currentEntry = null;
                  },
                  child: Container(
                    color: Colors.black.withAlpha(80),
                  ),
                ),
              ),
              Center(
                child: ToastMessage(
                  title: title,
                  message: message,
                  isFailed: isFailed,
                  autoDismissDuration: duration,
                  onClose: () {
                    _timer?.cancel();
                    try {
                      entry.remove();
                    } catch (_) {}
                    if (_currentEntry == entry) _currentEntry = null;
                  },
                ),
              ),
            ],
          ),
        );
      },
    );

    _currentEntry = entry;
    overlayState.insert(entry);
  }

  static void showSuccess(BuildContext context, String message) {
    _showOverlay(
      context,
      title: 'Success',
      message: message,
      isFailed: false,
    );
  }

  static void showError(BuildContext context, String message) {
    _showOverlay(
      context,
      title: 'Action failed',
      message: message,
      isFailed: true,
    );
  }

  static void showInfo(BuildContext context, String message) {
    _showOverlay(
      context,
      title: 'Info',
      message: message,
      isFailed: false,
    );
  }

  static void showWarning(BuildContext context, String message) {
    _showOverlay(
      context,
      title: 'Warning',
      message: message,
      isFailed: true,
      duration: const Duration(seconds: 4),
    );
  }
}
