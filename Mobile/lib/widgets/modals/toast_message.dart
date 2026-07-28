import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

/// Premium dark-glass toast overlay matching Client's ToastMessage component.
///
/// Displays a centered overlay card with envelope icon, success/failure badge,
/// title, message text, scale-in/out animation, and auto-dismiss.
class ToastMessage extends StatefulWidget {
  final String title;
  final String message;
  final bool isFailed;
  final Duration autoDismissDuration;
  final VoidCallback? onClose;

  const ToastMessage({
    super.key,
    required this.title,
    required this.message,
    this.isFailed = false,
    this.autoDismissDuration = const Duration(seconds: 3),
    this.onClose,
  });

  /// Show a toast overlay as a dialog.
  static Future<void> show(
    BuildContext context, {
    String? title,
    required String message,
    bool isFailed = false,
    Duration autoDismissDuration = const Duration(seconds: 3),
  }) {
    return showDialog<void>(
      context: context,
      barrierDismissible: true,
      barrierColor: Colors.black.withAlpha(120),
      builder: (ctx) {
        return ToastMessage(
          title: title ?? (isFailed ? 'Action failed' : 'Success'),
          message: message,
          isFailed: isFailed,
          autoDismissDuration: autoDismissDuration,
          onClose: () => Navigator.of(ctx).pop(),
        );
      },
    );
  }

  @override
  State<ToastMessage> createState() => _ToastMessageState();
}

class _ToastMessageState extends State<ToastMessage>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnim;
  late Animation<double> _fadeAnim;
  Timer? _dismissTimer;
  bool _isClosing = false;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 300),
    );

    // Client uses cubic-bezier(0.34, 1.56, 0.64, 1) for modal-panel-in
    _scaleAnim = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(
        parent: _animController,
        curve: const Cubic(0.34, 1.56, 0.64, 1.0),
      ),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOut,
    );

    _animController.forward();

    if (widget.autoDismissDuration > Duration.zero) {
      _dismissTimer = Timer(widget.autoDismissDuration, () {
        if (mounted) _animateClose();
      });
    }
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    _animController.dispose();
    super.dispose();
  }

  Future<void> _animateClose() async {
    if (_isClosing) return;
    _isClosing = true;
    await _animController.reverse();
    if (mounted) {
      if (widget.onClose != null) {
        widget.onClose!();
      } else {
        Navigator.of(context).pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animController,
      builder: (context, child) {
        return FadeTransition(
          opacity: _fadeAnim,
          child: ScaleTransition(
            scale: _scaleAnim,
            child: Dialog(
              backgroundColor: Colors.transparent,
              elevation: 0,
              insetPadding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 24.h),
              child: GestureDetector(
                onTap: _animateClose,
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(24.r),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
                    child: Container(
                      constraints: BoxConstraints(maxWidth: 400.w),
                      padding: EdgeInsets.symmetric(
                        horizontal: 32.w,
                        vertical: 36.h,
                      ),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [
                            Color(0xB3141030), // rgba(20,16,48,0.7)
                            Color(0xCC0E0C24), // rgba(14,12,36,0.8)
                          ],
                        ),
                        borderRadius: BorderRadius.circular(24.r),
                        border: Border.all(
                          color: Colors.white.withAlpha(25),
                          width: 1,
                        ),
                        boxShadow: const [
                          BoxShadow(
                            color: Color(0x8C000000), // rgba(0,0,0,0.55)
                            blurRadius: 64,
                            offset: Offset(0, 32),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // ── Envelope Icon with Badge ────────────────────────
                          SizedBox(
                            height: 80.r,
                            width: 80.r,
                            child: Stack(
                              alignment: Alignment.center,
                              children: [
                                // Envelope icon
                                Icon(
                                  Icons.mark_email_unread_outlined,
                                  color: const Color(0xFFE4E4E7), // zinc-200
                                  size: 48.r,
                                ),
                                // Badge — checkmark or X
                                Positioned(
                                  top: 0,
                                  right: 0,
                                  child: Container(
                                    width: 30.r,
                                    height: 30.r,
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF18181B), // zinc-900
                                      shape: BoxShape.circle,
                                      border: Border.all(
                                        color: const Color(0xFF13112A),
                                        width: 2.5,
                                      ),
                                    ),
                                    child: Icon(
                                      widget.isFailed
                                          ? Icons.close_rounded
                                          : Icons.check_rounded,
                                      color: widget.isFailed
                                          ? const Color(0xFFEF4444) // red-500
                                          : const Color(0xFF10B981), // emerald-500
                                      size: 16.r,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: 18.h),

                          // ── Title ──────────────────────────────────────────
                          Text(
                            widget.title,
                            style: TextStyle(
                              fontSize: 20.sp,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFFF4F4F5), // zinc-100
                              letterSpacing: -0.3,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          SizedBox(height: 12.h),

                          // ── Message ────────────────────────────────────────
                          ConstrainedBox(
                            constraints: BoxConstraints(maxWidth: 280.w),
                            child: Text(
                              widget.message,
                              style: TextStyle(
                                fontSize: 13.5.sp,
                                color: const Color(0xCCD4D4D8), // zinc-300/80
                                height: 1.6,
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
