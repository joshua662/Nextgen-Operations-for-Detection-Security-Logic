import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/router/app_router.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/app_logo.dart';

class SplashScreen extends ConsumerStatefulWidget {
  const SplashScreen({super.key});

  @override
  ConsumerState<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends ConsumerState<SplashScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;

  bool _hasNavigated = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _fadeAnim = CurvedAnimation(parent: _controller, curve: Curves.easeOut);
    _scaleAnim = Tween<double>(begin: 0.75, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.elasticOut),
    );
    _controller.forward();

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
    _controller.dispose();
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
      body: Container(
        width: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F172A), Color(0xFF1D4ED8)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ScaleTransition(
              scale: _scaleAnim,
              child: FadeTransition(opacity: _fadeAnim, child: const AppLogo()),
            ),
            SizedBox(height: 60.h),
            const CircularProgressIndicator(color: Colors.white54, strokeWidth: 2),
          ],
        ),
      ),
    );
  }
}
