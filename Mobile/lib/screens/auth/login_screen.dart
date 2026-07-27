import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/router/app_router.dart';
import '../../core/utils/toast_helper.dart';
import '../../models/auth/login_state.dart';
import '../../providers/login_provider.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();

  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  late AnimationController _bgController;
  late AnimationController _contentController;
  late Animation<double> _fadeIn;
  late Animation<Offset> _slideUp;

  @override
  void initState() {
    super.initState();
    _bgController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat(reverse: true);

    _contentController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeIn = CurvedAnimation(
      parent: _contentController,
      curve: Curves.easeOut,
    );
    _slideUp = Tween<Offset>(
      begin: const Offset(0, 0.12),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _contentController, curve: Curves.easeOutCubic),
    );
    _contentController.forward();
  }

  @override
  void dispose() {
    _bgController.dispose();
    _contentController.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    ref
        .read(loginProvider.notifier)
        .login(_emailCtrl.text, _passwordCtrl.text);
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<LoginState>(loginProvider, (_, next) {
      if (next is LoginSuccess) {
        ref.read(loginProvider.notifier).reset();
        Navigator.of(context).pushReplacementNamed(AppRouter.main);
      } else if (next is LoginError) {
        ToastHelper.showError(context, next.message);
      }
    });

    final loginState = ref.watch(loginProvider);
    final isLoading = loginState is LoginLoading;

    return Scaffold(
      body: Stack(
        children: [
          // ── Animated gradient background ───────────────────────────────
          AnimatedBuilder(
            animation: _bgController,
            builder: (_, _) {
              return Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: const [
                      Color(0xFF0A0E27),
                      Color(0xFF0D1B4B),
                      Color(0xFF1A1040),
                    ],
                    stops: [
                      0.0,
                      0.5 + 0.2 * math.sin(_bgController.value * math.pi),
                      1.0,
                    ],
                  ),
                ),
              );
            },
          ),

          // ── Decorative background circles ──────────────────────────────
          Positioned(
            top: -80.r,
            right: -60.r,
            child: AnimatedBuilder(
              animation: _bgController,
              builder: (_, _) => Opacity(
                opacity: 0.15 + 0.08 * math.sin(_bgController.value * math.pi),
                child: Container(
                  width: 220.r,
                  height: 220.r,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 40.h,
            left: -70.r,
            child: AnimatedBuilder(
              animation: _bgController,
              builder: (_, _) => Opacity(
                opacity: 0.10 + 0.07 * math.cos(_bgController.value * math.pi),
                child: Container(
                  width: 180.r,
                  height: 180.r,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.secondary,
                  ),
                ),
              ),
            ),
          ),

          // ── Main content ───────────────────────────────────────────────
          SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 480),
                child: SingleChildScrollView(
                  padding:
                      EdgeInsets.symmetric(horizontal: 28.w, vertical: 24.h),
                  child: FadeTransition(
                    opacity: _fadeIn,
                    child: SlideTransition(
                      position: _slideUp,
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            SizedBox(height: 32.h),

                            // ── Logo ─────────────────────────────────────────
                            Center(
                              child: Container(
                                width: 72.r,
                                height: 72.r,
                                decoration: BoxDecoration(
                                  gradient: const LinearGradient(
                                    colors: [
                                      Color(0xFF1E90FF),
                                      Color(0xFF7C3AED),
                                    ],
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  ),
                                  borderRadius: BorderRadius.circular(20.r),
                                  boxShadow: [
                                    BoxShadow(
                                      color: AppColors.primary.withAlpha(100),
                                      blurRadius: 24,
                                      offset: const Offset(0, 8),
                                    ),
                                  ],
                                ),
                                child: Icon(
                                  Icons.security_rounded,
                                  color: Colors.white,
                                  size: 36.r,
                                ),
                              ),
                            ),

                            SizedBox(height: 28.h),

                            // ── Welcome text ──────────────────────────────────
                            Text(
                              AppStrings.welcomeBack,
                              style: TextStyle(
                                fontSize: 30.sp,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: -0.5,
                              ),
                            ),
                            SizedBox(height: 6.h),
                            Text(
                              AppStrings.loginSubtitle,
                              style: TextStyle(
                                fontSize: 14.sp,
                                color: Colors.white60,
                              ),
                            ),

                            SizedBox(height: 32.h),

                            // ── Glass card ────────────────────────────────────
                            Container(
                              padding: EdgeInsets.all(24.r),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(13),
                                borderRadius: BorderRadius.circular(24.r),
                                border: Border.all(
                                  color: Colors.white.withAlpha(30),
                                ),
                              ),
                              child: Column(
                                children: [
                                  // Email / Username
                                  _DarkInputField(
                                    label: AppStrings.email,
                                    hint: 'you@example.com or username',
                                    controller: _emailCtrl,
                                    prefixIcon: Icons.email_outlined,
                                    validator: (v) {
                                      if (v == null || v.trim().isEmpty) {
                                        return 'Email or username is required';
                                      }
                                      return null;
                                    },
                                  ),

                                  SizedBox(height: 18.h),

                                  // Password
                                  _DarkInputField(
                                    label: AppStrings.password,
                                    hint: '••••••••',
                                    controller: _passwordCtrl,
                                    obscureText: true,
                                    prefixIcon: Icons.lock_outlined,
                                    validator: (v) {
                                      if (v == null || v.isEmpty) {
                                        return 'Password is required';
                                      }
                                      return null;
                                    },
                                  ),
                                ],
                              ),
                            ),

                            SizedBox(height: 28.h),

                            // ── Login button ──────────────────────────────────
                            _GradientButton(
                              label: AppStrings.login,
                              isLoading: isLoading,
                              onPressed: _submit,
                              icon: Icons.login_rounded,
                            ),

                            SizedBox(height: 24.h),

                            // ── Sign Up Link ──────────────────────────────────
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  "Don't have an account? ",
                                  style: TextStyle(
                                    fontSize: 13.sp,
                                    color: Colors.white60,
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () => Navigator.of(context)
                                      .pushNamed(AppRouter.register),
                                  child: Text(
                                    'Sign Up',
                                    style: TextStyle(
                                      fontSize: 13.sp,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            SizedBox(height: 40.h),

                            // ── Footer ────────────────────────────────────────
                            Center(
                              child: Column(
                                children: [
                                  Container(
                                    width: 40.w,
                                    height: 1,
                                    color: Colors.white24,
                                  ),
                                  SizedBox(height: 16.h),
                                  Text(
                                    'NODSL',
                                    style: TextStyle(
                                      fontSize: 13.sp,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white54,
                                      letterSpacing: 2,
                                    ),
                                  ),
                                  SizedBox(height: 4.h),
                                  Text(
                                    'Nextgen Operations for\nDetection Security Logic',
                                    textAlign: TextAlign.center,
                                    style: TextStyle(
                                      fontSize: 10.sp,
                                      color: Colors.white30,
                                      height: 1.5,
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            SizedBox(height: 24.h),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Dark-themed input for the login card ──────────────────────────────────────
class _DarkInputField extends StatefulWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final bool obscureText;
  final String? Function(String?)? validator;
  final IconData prefixIcon;

  const _DarkInputField({
    required this.label,
    this.hint,
    this.controller,
    this.obscureText = false,
    this.validator,
    required this.prefixIcon,
  });

  @override
  State<_DarkInputField> createState() => _DarkInputFieldState();
}

class _DarkInputFieldState extends State<_DarkInputField> {
  late bool _obscure;

  @override
  void initState() {
    super.initState();
    _obscure = widget.obscureText;
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: TextStyle(
            fontSize: 12.sp,
            fontWeight: FontWeight.w600,
            color: Colors.white70,
            letterSpacing: 0.5,
          ),
        ),
        SizedBox(height: 8.h),
        TextFormField(
          controller: widget.controller,
          obscureText: _obscure,
          validator: widget.validator,
          style: TextStyle(fontSize: 15.sp, color: Colors.white),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: TextStyle(color: Colors.white30, fontSize: 14.sp),
            prefixIcon:
                Icon(widget.prefixIcon, color: Colors.white38, size: 20),
            suffixIcon: widget.obscureText
                ? IconButton(
                    icon: Icon(
                      _obscure ? Icons.visibility_off : Icons.visibility,
                      color: Colors.white38,
                      size: 20,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  )
                : null,
            filled: true,
            fillColor: Colors.white.withAlpha(18),
            contentPadding:
                EdgeInsets.symmetric(horizontal: 16.w, vertical: 14.h),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: BorderSide(color: Colors.white.withAlpha(30)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: BorderSide(color: Colors.white.withAlpha(30)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide:
                  const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12.r),
              borderSide: const BorderSide(color: AppColors.error),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10.r),
              borderSide: const BorderSide(color: AppColors.error, width: 1.5),
            ),
            errorStyle: TextStyle(color: AppColors.error, fontSize: 11.sp),
          ),
        ),
      ],
    );
  }
}

// ── Gradient login button ─────────────────────────────────────────────────────
class _GradientButton extends StatelessWidget {
  final String label;
  final bool isLoading;
  final VoidCallback? onPressed;
  final IconData icon;

  const _GradientButton({
    required this.label,
    required this.isLoading,
    required this.onPressed,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onPressed,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: double.infinity,
        height: 54.h,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isLoading
                ? [Colors.grey.shade700, Colors.grey.shade600]
                : const [Color(0xFF1E90FF), Color(0xFF7C3AED)],
            begin: Alignment.centerLeft,
            end: Alignment.centerRight,
          ),
          borderRadius: BorderRadius.circular(14.r),
          boxShadow: isLoading
              ? []
              : [
                  BoxShadow(
                    color: AppColors.primary.withAlpha(80),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
        ),
        child: Center(
          child: isLoading
              ? SizedBox(
                  width: 22.r,
                  height: 22.r,
                  child: const CircularProgressIndicator(
                    color: Colors.white,
                    strokeWidth: 2.5,
                  ),
                )
              : Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(icon, color: Colors.white, size: 20.r),
                    SizedBox(width: 10.w),
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 16.sp,
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
