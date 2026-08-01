import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_colors.dart';
import '../../core/constants/app_strings.dart';
import '../../core/router/app_router.dart';
import '../../core/utils/toast_helper.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_input_field.dart';
import '../../widgets/app_logo.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  void _submit() {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    // TODO: Wire up registration API when backend endpoint is available
    ToastHelper.showError(context, 'Registration is not yet available.');
  }

  @override
  Widget build(BuildContext context) {
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
                Text('Create Account', style: Theme.of(context).textTheme.headlineMedium),
                SizedBox(height: 4.h),
                Text('Sign up to get started', style: Theme.of(context).textTheme.bodyMedium),
                SizedBox(height: 36.h),
                AppInputField(
                  label: 'Full Name',
                  hint: 'John Doe',
                  controller: _nameCtrl,
                  keyboardType: TextInputType.name,
                  prefixIcon: const Icon(Icons.person_outlined),
                  validator: (v) {
                    if (v == null || v.trim().isEmpty) return 'Name is required';
                    return null;
                  },
                ),
                SizedBox(height: 20.h),
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
                SizedBox(height: 20.h),
                AppInputField(
                  label: 'Confirm Password',
                  hint: 'Confirm Password',
                  controller: _confirmPasswordCtrl,
                  obscureText: true,
                  prefixIcon: const Icon(Icons.lock_outlined),
                  validator: (v) {
                    if (v == null || v.isEmpty) return 'Please confirm your password';
                    if (v != _passwordCtrl.text) return 'Passwords do not match';
                    return null;
                  },
                ),
                SizedBox(height: 36.h),
                AppButton(
                  label: 'Register',
                  isLoading: _isLoading,
                  onPressed: _submit,
                  icon: const Icon(Icons.person_add, color: Colors.white, size: 20),
                ),
                SizedBox(height: 16.h),
                Center(
                  child: TextButton(
                    onPressed: () {
                      Navigator.of(context).pushReplacementNamed(AppRouter.login);
                    },
                    child: Text(
                      'Already have an account? Login',
                      style: TextStyle(fontSize: 13.sp, color: AppColors.primary),
                    ),
                  ),
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
