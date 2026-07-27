import 'package:flutter/material.dart';

import '../../screens/auth/login_screen.dart';
import '../../screens/auth/register_screen.dart';
import '../../screens/main/main_screen.dart';
import '../../screens/splash/splash_screen.dart';
import '../../screens/users/create_user_screen.dart';
import '../../screens/users/edit_user_screen.dart';
import '../../screens/users/view_user_screen.dart';

class AppRouter {
  AppRouter._();

  // Route names
  static const String splash = '/';
  static const String login = '/login';
  static const String register = '/register';
  static const String main = '/main';
  static const String createUser = '/users/create';
  static const String viewUser = '/users/view';
  static const String editUser = '/users/edit';

  // Route Generator
  static Route<dynamic> onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case splash:
        return _buildRoute(const SplashScreen(), settings);

      case login:
      case '/auth/login':
        return _buildRoute(const LoginScreen(), settings);

      case register:
      case '/auth/register':
        return _buildRoute(const RegisterScreen(), settings);

      case main:
      case '/home':
      case '/dashboard':
        return _buildRoute(const MainScreen(), settings);

      case createUser:
        return _slideRoute(const CreateUserScreen(), settings);

      case viewUser:
        return _slideRoute(const ViewUserScreen(), settings);

      case editUser:
        return _slideRoute(const EditUserScreen(), settings);

      default:
        return _buildRoute(const MainScreen(), settings);
    }
  }

  static Route<dynamic> _buildRoute(Widget page, RouteSettings settings) {
    return PageRouteBuilder(
      settings: settings,
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        return FadeTransition(opacity: animation, child: child);
      },
      transitionDuration: const Duration(milliseconds: 300),
    );
  }

  static Route<dynamic> _slideRoute(Widget page, RouteSettings settings) {
    return PageRouteBuilder(
      settings: settings,
      pageBuilder: (context, animation, secondaryAnimation) => page,
      transitionsBuilder: (context, animation, secondaryAnimation, child) {
        const begin = Offset(0.0, 1.0);
        const end = Offset.zero;
        final tween = Tween(
          begin: begin,
          end: end,
        ).chain(CurveTween(curve: Curves.easeOutCubic));
        return SlideTransition(position: animation.drive(tween), child: child);
      },
      transitionDuration: const Duration(milliseconds: 350),
    );
  }
}
