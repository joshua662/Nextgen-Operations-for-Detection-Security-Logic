import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_colors.dart';
import '../../core/router/app_router.dart';
import '../../providers/auth_provider.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with TickerProviderStateMixin {
  late AnimationController _logoController;
  late AnimationController _pulseController;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;
  late Animation<double> _pulseAnim;

  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();

    _logoController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    );
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _fadeAnim =
        CurvedAnimation(parent: _logoController, curve: Curves.easeOut);
    _scaleAnim = Tween<double>(begin: 0.6, end: 1.0).animate(
      CurvedAnimation(
        parent: _logoController,
        curve: Curves.elasticOut,
      ),
    );
    _pulseAnim = Tween<double>(begin: 0.85, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _logoController.forward();

    // Check auth status after minimum splash display
    Future.delayed(const Duration(milliseconds: 1200), () {
      if (!mounted || _hasNavigated) return;
      final authState = ref.read(authProvider);
      if (!authState.isLoading) {
        _navigate(authState.value != null);
      }
    });

    // Safety fallback timeout after 3 seconds
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted && !_hasNavigated) {
        final authState = ref.read(authProvider);
        _navigate(authState.value != null);
      }
    });
  }

  @override
  void dispose() {
    _logoController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _navigate(bool isAuthenticated) {
    if (!mounted || _hasNavigated) return;
    _hasNavigated = true;
    Navigator.of(context).pushReplacementNamed(
      isAuthenticated ? AppRouter.main : AppRouter.login,
    );
  }

  @override
  Widget build(BuildContext context) {
    ref.listen(authProvider, (_, next) {
      if (!next.isLoading) {
        _navigate(next.value != null);
      }
    });

    return Scaffold(
      body: Stack(
        children: [
          // Gradient background
          Container(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF050A1E), Color(0xFF0D1B4B), Color(0xFF1A2980)],
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
              ),
            ),
          ),

          // Decorative animated rings
          Center(
            child: AnimatedBuilder(
              animation: _pulseController,
              builder: (_, _) {
                return Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer ring
                    Opacity(
                      opacity:
                          0.07 + 0.05 * math.sin(_pulseController.value * math.pi),
                      child: Container(
                        width: 260.r,
                        height: 260.r,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.primary,
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                    // Middle ring
                    Opacity(
                      opacity:
                          0.12 + 0.06 * math.cos(_pulseController.value * math.pi),
                      child: Container(
                        width: 180.r,
                        height: 180.r,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.primary,
                            width: 1.5,
                          ),
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
          ),

          // Main logo content
          Center(
            child: FadeTransition(
              opacity: _fadeAnim,
              child: ScaleTransition(
                scale: _scaleAnim,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    // Icon container
                    AnimatedBuilder(
                      animation: _pulseAnim,
                      builder: (_, child) => Transform.scale(
                        scale: _pulseAnim.value,
                        child: child,
                      ),
                      child: Container(
                        width: 88.r,
                        height: 88.r,
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF1E90FF), Color(0xFF7C3AED)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24.r),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withAlpha(100),
                              blurRadius: 30,
                              spreadRadius: 4,
                            ),
                          ],
                        ),
                        child: Icon(
                          Icons.security_rounded,
                          color: Colors.white,
                          size: 44.r,
                        ),
                      ),
                    ),

                    SizedBox(height: 24.h),

                    Text(
                      'NODSL',
                      style: TextStyle(
                        fontSize: 28.sp,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                        letterSpacing: 4,
                      ),
                    ),
                    SizedBox(height: 6.h),
                    Text(
                      'Nextgen Operations for\nDetection Security Logic',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: Colors.white54,
                        height: 1.6,
                        letterSpacing: 0.3,
                      ),
                    ),

                    SizedBox(height: 60.h),

                    // Loading dots
                    _PulsingDots(),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _PulsingDots extends StatefulWidget {
  @override
  State<_PulsingDots> createState() => _PulsingDotsState();
}

class _PulsingDotsState extends State<_PulsingDots>
    with TickerProviderStateMixin {
  late List<AnimationController> _controllers;
  late List<Animation<double>> _anims;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(
      3,
      (i) => AnimationController(
        vsync: this,
        duration: const Duration(milliseconds: 600),
      )..repeat(
          reverse: true,
          period: Duration(milliseconds: 600 + i * 150),
        ),
    );
    _anims = _controllers
        .map(
          (c) => Tween<double>(begin: 0.3, end: 1.0).animate(
            CurvedAnimation(parent: c, curve: Curves.easeInOut),
          ),
        )
        .toList();

    // Stagger starts
    Future.delayed(const Duration(milliseconds: 0), () => _controllers[0].forward());
    Future.delayed(
        const Duration(milliseconds: 200), () => _controllers[1].forward());
    Future.delayed(
        const Duration(milliseconds: 400), () => _controllers[2].forward());
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        return AnimatedBuilder(
          animation: _anims[i],
          builder: (_, _) => Container(
            margin: EdgeInsets.symmetric(horizontal: 4.w),
            width: 8.r,
            height: 8.r,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white.withAlpha((255 * _anims[i].value).toInt()),
            ),
          ),
        );
      }),
    );
  }
}
