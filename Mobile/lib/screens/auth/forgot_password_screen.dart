import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/router/app_router.dart';
import '../../core/utils/toast_helper.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/auth/auth_input_field.dart';
import '../../widgets/auth/auth_page_layout.dart';
import '../../widgets/modals/success_modal.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  bool _isLoading = false;

  late AnimationController _staggerController;
  late Animation<double> _headerFade;
  late Animation<double> _formFade;

  @override
  void initState() {
    super.initState();
    _staggerController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );

    // Header (logo, title, subtitle) — fades in first (0% → 60%)
    _headerFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _staggerController,
        curve: const Interval(0.0, 0.6, curve: Curves.easeOut),
      ),
    );

    // Form section — fades in with delay (25% → 100%)
    _formFade = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _staggerController,
        curve: const Interval(0.25, 1.0, curve: Curves.easeOut),
      ),
    );

    _staggerController.forward();
  }

  @override
  void dispose() {
    _staggerController.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final email = _emailCtrl.text.trim();
    setState(() {
      _isLoading = true;
    });

    try {
      final authService = ref.read(authServiceProvider);
      await authService.forgotPassword(email);

      if (mounted) {
        setState(() => _isLoading = false);

        // Show Success Modal matching Client works!
        await SuccessModal.show(
          context,
          title: 'Credentials Sent!',
          message: 'We have successfully sent your new password to $email.',
          secondaryMessage: 'Please check your inbox or spam folder for the credentials.',
          autoDismissDuration: const Duration(seconds: 4),
        );

        if (mounted) {
          Navigator.of(context).pushReplacementNamed(AppRouter.login);
        }
      }
    } on DioException catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        final msg = e.response?.data is Map
            ? (e.response?.data['message'] ?? 'An error occurred.')
            : 'Failed to send reset link. Please try again.';
        ToastHelper.showError(context, msg.toString());
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoading = false);
        ToastHelper.showError(context, 'Failed to send reset link.');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthPageLayout(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Header Section (stagger fade-in) ──────────────────────────────
          FadeTransition(
            opacity: _headerFade,
            child: Column(
              children: [
          // ── Brand Logo ───────────────────────────────────────────────────────
          Image.asset(
            'assets/images/pdp-logo-invert.png',
            height: 64.h,
            fit: BoxFit.contain,
            errorBuilder: (_, _, _) => Icon(
              Icons.lock_reset_rounded,
              size: 56.r,
              color: Colors.white,
            ),
          ),
          SizedBox(height: 16.h),

          // ── Title & Subtitle ────────────────────────────────────────────────
          Text(
            'Forgot Password?',
            style: TextStyle(
              fontSize: 22.sp,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: -0.5,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 8.h),
          Text(
            "Enter your registered email address and we'll send you instructions to reset your password.",
            style: TextStyle(
              fontSize: 13.sp,
              color: const Color(0xE0DDD6FE), // text-violet-200/88
              height: 1.4,
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 28.h),
              ],
            ),
          ),

          // ── Form Section (stagger fade-in with delay) ────────────────────
          FadeTransition(
            opacity: _formFade,
            child: Column(
              children: [
          // ── Form ─────────────────────────────────────────────────────────────
          Form(
            key: _formKey,
            child: Column(
              children: [
                AuthInputField(
                  label: 'Email address',
                  hint: 'you@example.com',
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  required: true,
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) {
                      return 'Email address is required';
                    }
                    if (!v.contains('@') || !v.contains('.')) {
                      return 'Please enter a valid email address';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 12.h),

                // ── Submit Button (White Pill) ─────────────────────────────────
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : _submit,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: const Color(0xFF0F172A), // slate-900
                      disabledBackgroundColor: Colors.white60,
                      elevation: 8,
                      shadowColor: const Color(0x4D000000),
                      padding: EdgeInsets.symmetric(vertical: 14.h),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(30.r),
                      ),
                    ),
                    child: _isLoading
                        ? SizedBox(
                            height: 20.r,
                            width: 20.r,
                            child: const CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Color(0xFF0F172A),
                            ),
                          )
                        : Text(
                            'Send Reset Link',
                            style: TextStyle(
                              fontSize: 14.sp,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 0.3,
                            ),
                          ),
                  ),
                ),
                SizedBox(height: 20.h),

                // ── Back to Login Link ─────────────────────────────────────────
                GestureDetector(
                  onTap: () => Navigator.of(context).pushReplacementNamed(AppRouter.login),
                  child: Text(
                    'Back to Log In',
                    style: TextStyle(
                      fontSize: 13.sp,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xF2DDD6FE),
                      decoration: TextDecoration.underline,
                      decorationColor: const Color(0xF2DDD6FE),
                    ),
                  ),
                ),
              ],
            ),
          ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
