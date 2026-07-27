import 'dart:convert';
import 'dart:io';
import 'dart:math' as math;

import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/constants/app_colors.dart';
import '../../core/router/app_router.dart';
import '../../core/utils/toast_helper.dart';
import '../../providers/auth_provider.dart';

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen>
    with TickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();

  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _plateCtrl = TextEditingController();

  int _selectedGenderId = 1; // Default 1 (Male)
  String? _imagePath;
  bool _isLoading = false;

  late AnimationController _bgController;
  late AnimationController _contentController;
  late Animation<double> _fadeIn;
  late Animation<Offset> _slideUp;

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 800,
      imageQuality: 80,
    );
    if (picked != null) setState(() => _imagePath = picked.path);
  }

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
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _emailCtrl.dispose();
    _usernameCtrl.dispose();
    _passwordCtrl.dispose();
    _contactCtrl.dispose();
    _plateCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _isLoading = true);

    try {
      final authService = ref.read(authServiceProvider);
      final password = _passwordCtrl.text;
      final payload = {
        'first_name': _firstNameCtrl.text.trim(),
        'last_name': _lastNameCtrl.text.trim(),
        'gender': _selectedGenderId,
        'birth_date': '2000-01-01',
        'email': _emailCtrl.text.trim(),
        'username': _usernameCtrl.text.trim(),
        'password': password,
        'password_confirmation': password,
        'contact_number': _contactCtrl.text.trim(),
        'plate_number': _plateCtrl.text.trim(),
      };

      final response = await authService.registerResident(
        payload,
        imagePath: _imagePath,
      );

      if (mounted) {
        ToastHelper.showSuccess(
          context,
          response['message'] as String? ?? 'Registration successful!',
        );
        Navigator.of(context).pushReplacementNamed(AppRouter.login);
      }
    } on DioException catch (e) {
      final errorMsg = _parseDioError(e);
      if (mounted) ToastHelper.showError(context, errorMsg);
    } catch (e) {
      if (mounted) ToastHelper.showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  String _parseDioError(DioException e) {
    dynamic data = e.response?.data;
    if (data is String && data.isNotEmpty) {
      try {
        data = jsonDecode(data);
      } catch (_) {}
    }
    if (data is Map) {
      if (data['errors'] != null && data['errors'] is Map) {
        final errors = data['errors'] as Map;
        final messages = <String>[];
        errors.forEach((key, val) {
          if (val is List && val.isNotEmpty) {
            messages.add(val.first.toString());
          } else if (val != null) {
            messages.add(val.toString());
          }
        });
        if (messages.isNotEmpty) {
          return messages.join('\n');
        }
      }
      if (data['message'] != null && data['message'].toString().isNotEmpty) {
        return data['message'].toString();
      }
    }
    return e.message ?? 'Registration failed. Please check your details.';
  }

  @override
  Widget build(BuildContext context) {
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
            top: -60.r,
            left: -40.r,
            child: AnimatedBuilder(
              animation: _bgController,
              builder: (_, _) => Opacity(
                opacity: 0.15 + 0.08 * math.sin(_bgController.value * math.pi),
                child: Container(
                  width: 200.r,
                  height: 200.r,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.primary,
                  ),
                ),
              ),
            ),
          ),

          // ── Content ────────────────────────────────────────────────────
          SafeArea(
            child: Center(
              child: ConstrainedBox(
                constraints: const BoxConstraints(maxWidth: 540),
                child: SingleChildScrollView(
                  padding:
                      EdgeInsets.symmetric(horizontal: 24.w, vertical: 20.h),
                  child: FadeTransition(
                    opacity: _fadeIn,
                    child: SlideTransition(
                      position: _slideUp,
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Back Button
                            IconButton(
                              onPressed: () => Navigator.of(context).pop(),
                              icon: const Icon(
                                Icons.arrow_back_ios_new_rounded,
                                color: Colors.white,
                                size: 20,
                              ),
                            ),

                            SizedBox(height: 8.h),

                            // Header Text
                            Text(
                              'Resident Registration',
                              style: TextStyle(
                                fontSize: 28.sp,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                                letterSpacing: -0.5,
                              ),
                            ),
                            SizedBox(height: 4.h),
                            Text(
                              'Fill out your details to register as a resident',
                              style: TextStyle(
                                fontSize: 13.sp,
                                color: Colors.white60,
                              ),
                            ),

                            SizedBox(height: 20.h),

                            // ── Form Container ──────────────────────────────
                            Container(
                              padding: EdgeInsets.all(20.r),
                              decoration: BoxDecoration(
                                color: Colors.white.withAlpha(13),
                                borderRadius: BorderRadius.circular(24.r),
                                border: Border.all(
                                  color: Colors.white.withAlpha(30),
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Profile Picture Picker
                                  Center(
                                    child: GestureDetector(
                                      onTap: _pickImage,
                                      child: Stack(
                                        alignment: Alignment.bottomRight,
                                        children: [
                                          CircleAvatar(
                                            radius: 44.r,
                                            backgroundColor:
                                                Colors.white.withAlpha(25),
                                            backgroundImage: _imagePath != null
                                                ? FileImage(File(_imagePath!))
                                                : null,
                                            child: _imagePath == null
                                                ? Icon(
                                                    Icons.person_rounded,
                                                    size: 44.r,
                                                    color: Colors.white70,
                                                  )
                                                : null,
                                          ),
                                          Container(
                                            padding: EdgeInsets.all(6.r),
                                            decoration: BoxDecoration(
                                              color: AppColors.primary,
                                              shape: BoxShape.circle,
                                              border: Border.all(
                                                  color: Colors.white,
                                                  width: 2),
                                            ),
                                            child: Icon(
                                              Icons.camera_alt_rounded,
                                              size: 14.r,
                                              color: Colors.white,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),

                                  SizedBox(height: 18.h),

                                  // First Name & Last Name Row
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _DarkRegisterInput(
                                          label: 'First Name',
                                          hint: 'First Name',
                                          controller: _firstNameCtrl,
                                          prefixIcon: Icons.person_outline,
                                          validator: (v) =>
                                              (v == null || v.trim().isEmpty)
                                                  ? 'Required'
                                                  : null,
                                        ),
                                      ),
                                      SizedBox(width: 12.w),
                                      Expanded(
                                        child: _DarkRegisterInput(
                                          label: 'Last Name',
                                          hint: 'Last Name',
                                          controller: _lastNameCtrl,
                                          prefixIcon: Icons.person_outline,
                                          validator: (v) =>
                                              (v == null || v.trim().isEmpty)
                                                  ? 'Required'
                                                  : null,
                                        ),
                                      ),
                                    ],
                                  ),

                                  SizedBox(height: 14.h),

                                  // Email Address & Gender Row
                                  Row(
                                    children: [
                                      Expanded(
                                        flex: 3,
                                        child: _DarkRegisterInput(
                                          label: 'Email Address',
                                          hint: 'you@example.com',
                                          controller: _emailCtrl,
                                          keyboardType:
                                              TextInputType.emailAddress,
                                          prefixIcon: Icons.email_outlined,
                                          validator: (v) {
                                            if (v == null || v.trim().isEmpty) {
                                              return 'Email is required';
                                            }
                                            if (!v.contains('@')) {
                                              return 'Enter a valid email';
                                            }
                                            return null;
                                          },
                                        ),
                                      ),
                                      SizedBox(width: 12.w),
                                      Expanded(
                                        flex: 2,
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'Gender',
                                              style: TextStyle(
                                                fontSize: 11.sp,
                                                fontWeight: FontWeight.w600,
                                                color: Colors.white70,
                                                letterSpacing: 0.3,
                                              ),
                                            ),
                                            SizedBox(height: 4.h),
                                            Container(
                                              padding: EdgeInsets.symmetric(
                                                  horizontal: 10.w),
                                              decoration: BoxDecoration(
                                                color: Colors.white.withAlpha(18),
                                                borderRadius:
                                                    BorderRadius.circular(10.r),
                                                border: Border.all(
                                                  color: Colors.white
                                                      .withAlpha(30),
                                                ),
                                              ),
                                              child: DropdownButtonHideUnderline(
                                                child: DropdownButton<int>(
                                                  value: _selectedGenderId,
                                                  isExpanded: true,
                                                  dropdownColor:
                                                      const Color(0xFF0D1B4B),
                                                  style: TextStyle(
                                                      fontSize: 13.sp,
                                                      color: Colors.white),
                                                  items: const [
                                                    DropdownMenuItem(
                                                      value: 1,
                                                      child: Text('Male'),
                                                    ),
                                                    DropdownMenuItem(
                                                      value: 2,
                                                      child: Text('Female'),
                                                    ),
                                                    DropdownMenuItem(
                                                      value: 3,
                                                      child: Text('Other'),
                                                    ),
                                                  ],
                                                  onChanged: (val) {
                                                    if (val != null) {
                                                      setState(() =>
                                                          _selectedGenderId =
                                                              val);
                                                    }
                                                  },
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  ),

                                  SizedBox(height: 14.h),

                                  // Username & Password Row
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _DarkRegisterInput(
                                          label: 'Username',
                                          hint: '6-12 chars',
                                          controller: _usernameCtrl,
                                          prefixIcon: Icons.badge_outlined,
                                          validator: (v) {
                                            if (v == null || v.trim().isEmpty) {
                                              return 'Required';
                                            }
                                            if (v.trim().length < 6 ||
                                                v.trim().length > 12) {
                                              return '6-12 chars';
                                            }
                                            return null;
                                          },
                                        ),
                                      ),
                                      SizedBox(width: 12.w),
                                      Expanded(
                                        child: _DarkRegisterInput(
                                          label: 'Password',
                                          hint: '6-12 chars',
                                          controller: _passwordCtrl,
                                          obscureText: true,
                                          prefixIcon: Icons.lock_outlined,
                                          validator: (v) {
                                            if (v == null || v.isEmpty) {
                                              return 'Required';
                                            }
                                            if (v.length < 6 || v.length > 12) {
                                              return '6-12 chars';
                                            }
                                            return null;
                                          },
                                        ),
                                      ),
                                    ],
                                  ),

                                  SizedBox(height: 14.h),

                                  // Contact Number & Plate Number
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _DarkRegisterInput(
                                          label: 'Contact Number',
                                          hint: '09123456789',
                                          controller: _contactCtrl,
                                          keyboardType: TextInputType.phone,
                                          prefixIcon: Icons.phone_outlined,
                                          validator: (v) =>
                                              (v == null || v.trim().isEmpty)
                                                  ? 'Required'
                                                  : null,
                                        ),
                                      ),
                                      SizedBox(width: 12.w),
                                      Expanded(
                                        child: _DarkRegisterInput(
                                          label: 'Plate Number',
                                          hint: 'ABC 1234',
                                          controller: _plateCtrl,
                                          prefixIcon:
                                              Icons.directions_car_outlined,
                                          validator: (v) =>
                                              (v == null || v.trim().isEmpty)
                                                  ? 'Required'
                                                  : null,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),

                            SizedBox(height: 24.h),

                            // Submit Button
                            _RegisterButton(
                              label: 'Register Resident',
                              isLoading: _isLoading,
                              onPressed: _submit,
                            ),

                            SizedBox(height: 20.h),

                            // Sign In Link
                            Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Text(
                                  'Already have an account? ',
                                  style: TextStyle(
                                    fontSize: 13.sp,
                                    color: Colors.white60,
                                  ),
                                ),
                                GestureDetector(
                                  onTap: () => Navigator.of(context)
                                      .pushReplacementNamed(AppRouter.login),
                                  child: Text(
                                    'Sign In',
                                    style: TextStyle(
                                      fontSize: 13.sp,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.primary,
                                    ),
                                  ),
                                ),
                              ],
                            ),

                            SizedBox(height: 16.h),
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

class _DarkRegisterInput extends StatefulWidget {
  final String label;
  final String? hint;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType keyboardType;
  final String? Function(String?)? validator;
  final IconData prefixIcon;

  const _DarkRegisterInput({
    required this.label,
    this.hint,
    this.controller,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.validator,
    required this.prefixIcon,
  });

  @override
  State<_DarkRegisterInput> createState() => _DarkRegisterInputState();
}

class _DarkRegisterInputState extends State<_DarkRegisterInput> {
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
            fontSize: 11.sp,
            fontWeight: FontWeight.w600,
            color: Colors.white70,
            letterSpacing: 0.3,
          ),
        ),
        SizedBox(height: 4.h),
        TextFormField(
          controller: widget.controller,
          obscureText: _obscure,
          keyboardType: widget.keyboardType,
          validator: widget.validator,
          style: TextStyle(fontSize: 13.sp, color: Colors.white),
          decoration: InputDecoration(
            hintText: widget.hint,
            hintStyle: TextStyle(color: Colors.white30, fontSize: 12.sp),
            prefixIcon:
                Icon(widget.prefixIcon, color: Colors.white38, size: 16),
            suffixIcon: widget.obscureText
                ? IconButton(
                    icon: Icon(
                      _obscure ? Icons.visibility_off : Icons.visibility,
                      color: Colors.white38,
                      size: 16,
                    ),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  )
                : null,
            filled: true,
            fillColor: Colors.white.withAlpha(18),
            contentPadding:
                EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10.r),
              borderSide: BorderSide(color: Colors.white.withAlpha(30)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10.r),
              borderSide: BorderSide(color: Colors.white.withAlpha(30)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10.r),
              borderSide:
                  const BorderSide(color: AppColors.primary, width: 1.5),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10.r),
              borderSide: const BorderSide(color: AppColors.error),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(10.r),
              borderSide: const BorderSide(color: AppColors.error, width: 1.5),
            ),
            errorStyle: TextStyle(color: AppColors.error, fontSize: 10.sp),
          ),
        ),
      ],
    );
  }
}

class _RegisterButton extends StatelessWidget {
  final String label;
  final bool isLoading;
  final VoidCallback? onPressed;

  const _RegisterButton({
    required this.label,
    required this.isLoading,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onPressed,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        width: double.infinity,
        height: 50.h,
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
                    Icon(Icons.person_add_rounded,
                        color: Colors.white, size: 18.r),
                    SizedBox(width: 8.w),
                    Text(
                      label,
                      style: TextStyle(
                        fontSize: 15.sp,
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
