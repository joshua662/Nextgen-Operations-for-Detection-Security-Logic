import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/constants/app_colors.dart';
import '../../core/utils/toast_helper.dart';
import '../../providers/user_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_input_field.dart';

class CreateUserScreen extends ConsumerStatefulWidget {
  const CreateUserScreen({super.key});

  @override
  ConsumerState<CreateUserScreen> createState() => _CreateUserScreenState();
}

class _CreateUserScreenState extends ConsumerState<CreateUserScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _confirmCtrl = TextEditingController();
  String _selectedRole = 'user';
  String? _imagePath;
  bool _isLoading = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _confirmCtrl.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, maxWidth: 800, imageQuality: 80);
    if (picked != null) setState(() => _imagePath = picked.path);
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _isLoading = true);
    try {
      final service = ref.read(userServiceProvider);
      await service.createUser({
        'name': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'password': _passwordCtrl.text,
        'password_confirmation': _confirmCtrl.text,
        'role': _selectedRole,
      }, imagePath: _imagePath);
      if (mounted) {
        ToastHelper.showSuccess(context, 'User created successfully');
        Navigator.of(context).pop();
      }
    } catch (e) {
      if (mounted) ToastHelper.showError(context, e.toString());
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Create User')),
      body: SingleChildScrollView(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 24.h),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              GestureDetector(
                onTap: _pickImage,
                child: Stack(
                  alignment: Alignment.bottomRight,
                  children: [
                    CircleAvatar(
                      radius: 48.r,
                      backgroundColor: AppColors.primary.withAlpha(26),
                      backgroundImage: _imagePath != null ? FileImage(File(_imagePath!)) : null,
                      child: _imagePath == null
                          ? Icon(Icons.person_add, size: 40, color: AppColors.primary)
                          : null,
                    ),
                    Container(
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: const Icon(Icons.camera_alt, size: 14, color: Colors.white),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 28.h),
              AppInputField(
                label: 'Full Name',
                hint: 'John Doe',
                controller: _nameCtrl,
                prefixIcon: const Icon(Icons.person_outline),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Name is required' : null,
              ),
              SizedBox(height: 16.h),
              AppInputField(
                label: 'Email',
                hint: 'john@example.com',
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                prefixIcon: const Icon(Icons.email_outlined),
                validator: (v) {
                  if (v == null || v.trim().isEmpty) return 'Email is required';
                  if (!v.contains('@')) return 'Enter a valid email';
                  return null;
                },
              ),
              SizedBox(height: 16.h),
              AppInputField(
                label: 'Password',
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
              SizedBox(height: 16.h),
              AppInputField(
                label: 'Confirm Password',
                hint: 'Confirm Password',
                controller: _confirmCtrl,
                obscureText: true,
                prefixIcon: const Icon(Icons.lock_outline),
                validator: (v) => v != _passwordCtrl.text ? 'Passwords do not match' : null,
              ),

              SizedBox(height: 32.h),
              AppButton(
                label: 'Create User',
                isLoading: _isLoading,
                onPressed: _submit,
                icon: const Icon(Icons.person_add, color: Colors.white, size: 20),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
