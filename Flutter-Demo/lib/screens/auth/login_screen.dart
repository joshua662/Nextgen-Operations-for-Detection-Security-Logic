import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/router/app_router.dart';
import '../../core/utils/toast_helper.dart';
import '../../models/auth/login_state.dart';
import '../../providers/login_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_input_field.dart';
import '../../widgets/app_logo.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    ref.read(loginProvider.notifier).login(_emailCtrl.text, _passwordCtrl.text);
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
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 32.h),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: 32.h),
                Center(child: AppLogo(iconSize: 64.r)),
                SizedBox(height: 48.h),
                Text(AppStrings.welcomeBack, style: Theme.of(context).textTheme.headlineMedium),
                SizedBox(height: 4.h),
                Text(AppStrings.loginSubtitle, style: Theme.of(context).textTheme.bodyMedium),
                SizedBox(height: 36.h),
                AppInputField(
                  label: AppStrings.email,
                  hint: 'you@example.com',
                  controller: _emailCtrl,
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: const Icon(Icons.email_outlined),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Email is required';
                    if (!v.contains('@')) return 'Enter a valid email';
                    return null;
                  },
                ),
                SizedBox(height: 20.h),
                AppInputField(
                  label: AppStrings.password,
                  hint: 'Password',
                  controller: _passwordCtrl,
                  obscureText: true,
                  prefixIcon: const Icon(Icons.lock_outlined),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Password is required';
                    if (v.length < 6) return 'Min 6 characters';
                    return null;
                  },
                ),
                SizedBox(height: 36.h),
                AppButton(
                  label: AppStrings.login,
                  isLoading: isLoading,
                  onPressed: _submit,
                  icon: const Icon(Icons.login, color: Colors.white, size: 20),
                ),
                SizedBox(height: 24.h),
                Center(
                  child: Text(
                    'NODSL — Nextgen Operations for\nDetection Security Logic',
                    textAlign: TextAlign.center,
                    style: TextStyle(fontSize: 11.sp, color: AppColors.textSecondary),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
