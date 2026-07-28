import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

/// Full-screen authentication page backdrop with glassmorphic card.
///
/// Now a StatefulWidget with a dramatic entrance animation matching Client's
/// `auth-login-card-in`: opacity 0→1, scale 0.92→1, translateY 22px→0,
/// 720ms with cubic-bezier(0.16, 1, 0.3, 1).
class AuthPageLayout extends StatefulWidget {
  final Widget child;

  const AuthPageLayout({
    super.key,
    required this.child,
  });

  @override
  State<AuthPageLayout> createState() => _AuthPageLayoutState();
}

class _AuthPageLayoutState extends State<AuthPageLayout>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;
  late Animation<double> _scaleAnim;
  late Animation<Offset> _slideAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 720),
    );

    // Client uses cubic-bezier(0.16, 1, 0.3, 1) for auth-login-card-in
    const curve = Cubic(0.16, 1.0, 0.3, 1.0);

    _fadeAnim = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: curve),
    );
    _scaleAnim = Tween<double>(begin: 0.92, end: 1.0).animate(
      CurvedAnimation(parent: _animController, curve: curve),
    );
    // translateY: 22px → 0  (positive dy = downward offset at start)
    _slideAnim = Tween<Offset>(
      begin: Offset(0, 22.h / MediaQueryData.fromView(WidgetsBinding.instance.platformDispatcher.views.first).size.height),
      end: Offset.zero,
    ).animate(
      CurvedAnimation(parent: _animController, curve: curve),
    );

    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0C29),
      body: Stack(
        children: [
          // 1. Fullscreen Backdrop Image
          Positioned.fill(
            child: Image.asset(
              'assets/images/subdivision-gate-background.png',
              fit: BoxFit.cover,
              errorBuilder: (_, _, _) => Container(
                color: const Color(0xFF1E1B4B),
              ),
            ),
          ),

          // 2. Twilight Indigo / Purple Gradient Overlay
          Positioned.fill(
            child: Container(
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Color(0x991E1B4B), // indigo-950/60
                    Color(0x662E1065), // violet-950/40
                    Color(0x7A3B0764), // purple-950/48
                  ],
                ),
              ),
            ),
          ),

          // 3. Subtle Star Specks Decoration
          Positioned.fill(
            child: CustomPaint(
              painter: _StarSpeckPainter(),
            ),
          ),

          // 4. Centered Glassmorphic Content Card — with entrance animation
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: EdgeInsets.symmetric(horizontal: 20.w, vertical: 24.h),
                child: ConstrainedBox(
                  constraints: BoxConstraints(maxWidth: 440.w),
                  child: FadeTransition(
                    opacity: _fadeAnim,
                    child: SlideTransition(
                      position: _slideAnim,
                      child: ScaleTransition(
                        scale: _scaleAnim,
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(28.r),
                          child: BackdropFilter(
                            filter: ImageFilter.blur(sigmaX: 18, sigmaY: 18),
                            child: Container(
                              padding: EdgeInsets.symmetric(
                                horizontal: 24.w,
                                vertical: 32.h,
                              ),
                              decoration: BoxDecoration(
                                color: const Color(0x6B1E1B4B), // rgba(30, 27, 75, 0.42)
                                borderRadius: BorderRadius.circular(28.r),
                                border: Border.all(
                                  color: const Color(0x40FFFFFF), // Colors.white.withAlpha(64)
                                  width: 1,
                                ),
                                boxShadow: const [
                                  BoxShadow(
                                    color: Color(0x73000000), // Colors.black.withAlpha(115)
                                    blurRadius: 32,
                                    offset: Offset(0, 16),
                                  ),
                                ],
                              ),
                              child: widget.child,
                            ),
                          ),
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

class _StarSpeckPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint();
    final specks = [
      Offset(size.width * 0.20, size.height * 0.15),
      Offset(size.width * 0.70, size.height * 0.10),
      Offset(size.width * 0.40, size.height * 0.80),
      Offset(size.width * 0.88, size.height * 0.52),
      Offset(size.width * 0.12, size.height * 0.55),
      Offset(size.width * 0.82, size.height * 0.25),
      Offset(size.width * 0.30, size.height * 0.35),
    ];
    final alphas = [191, 140, 128, 166, 115, 153, 102];

    for (int i = 0; i < specks.length; i++) {
      paint.color = Colors.white.withAlpha(alphas[i]);
      canvas.drawCircle(specks[i], 1.2, paint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
