import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/constants/app_colors.dart';
import '../../core/utils/toast_helper.dart';
import '../../models/user_model.dart';
import '../../providers/user_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_input_field.dart';
import '../../widgets/cached_image_widget.dart';

class EditUserScreen extends ConsumerStatefulWidget {
  const EditUserScreen({super.key});

  @override
  ConsumerState<EditUserScreen> createState() => _EditUserScreenState();
}

class _EditUserScreenState extends ConsumerState<EditUserScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();

  late User _user;
  bool _initialized = false;
  String _selectedRole = 'user';
  String? _imagePath;
  bool _isLoading = false;

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (!_initialized) {
      _user = ModalRoute.of(context)!.settings.arguments as User;
      _nameCtrl.text = _user.name;
      _emailCtrl.text = _user.email;
      _selectedRole = _user.role ?? 'user';
      _initialized = true;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
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
      final fields = {
        'name': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'role': _selectedRole,
        if (_passwordCtrl.text.isNotEmpty) 'password': _passwordCtrl.text,
        if (_passwordCtrl.text.isNotEmpty) 'password_confirmation': _passwordCtrl.text,
      };
      await service.updateUser(_user.id, fields, imagePath: _imagePath);
      if (mounted) {
        ToastHelper.showSuccess(context, 'User updated successfully');
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
      appBar: AppBar(title: const Text('Edit User')),
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
                    _imagePath != null
                        ? CircleAvatar(radius: 48.r, backgroundImage: FileImage(File(_imagePath!)))
                        : UserAvatarWidget(
                            imageUrl: _user.avatarUrl.isEmpty ? null : _user.avatarUrl,
                            initials: _user.initials,
                            radius: 48.r,
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
                label: 'New Password (optional)',
                hint: 'Leave blank to keep current',
                controller: _passwordCtrl,
                obscureText: true,
                prefixIcon: const Icon(Icons.lock_outlined),
                validator: (v) {
                  if (v != null && v.isNotEmpty && v.length < 6) return 'Min 6 characters';
                  return null;
                },
              ),

              SizedBox(height: 32.h),
              AppButton(
                label: 'Save Changes',
                isLoading: _isLoading,
                onPressed: _submit,
                icon: const Icon(Icons.save_outlined, color: Colors.white, size: 20),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
