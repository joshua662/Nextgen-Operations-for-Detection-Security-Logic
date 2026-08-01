import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../../core/constants/app_strings.dart';
import '../../core/router/app_router.dart';
import '../../core/utils/toast_helper.dart';
import '../../models/user_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/resident_provider.dart';
import '../../widgets/modals/action_confirm_dialog.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  bool _showEditModal = false;

  // Edit form controllers
  final _editFormKey = GlobalKey<FormState>();
  final _firstNameCtrl = TextEditingController();
  final _lastNameCtrl = TextEditingController();
  final _contactCtrl = TextEditingController();
  final _plateCtrl = TextEditingController();
  final _modelCtrl = TextEditingController();
  final _colorCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  bool _isSubmittingEdit = false;

  @override
  void dispose() {
    _firstNameCtrl.dispose();
    _lastNameCtrl.dispose();
    _contactCtrl.dispose();
    _plateCtrl.dispose();
    _modelCtrl.dispose();
    _colorCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  void _openEditModal(User user) {
    _firstNameCtrl.text = user.firstName ?? '';
    _lastNameCtrl.text = user.lastName ?? '';
    _contactCtrl.text = user.contactNumber ?? '';
    _plateCtrl.text = user.plateNumber ?? '';
    _modelCtrl.text = user.carModel ?? '';
    _colorCtrl.text = user.carColor ?? '';
    _addressCtrl.text = user.address ?? '';
    setState(() => _showEditModal = true);
  }

  void _closeEditModal() => setState(() => _showEditModal = false);

  Future<void> _submitProfileChanges() async {
    if (!(_editFormKey.currentState?.validate() ?? false)) return;
    setState(() => _isSubmittingEdit = true);
    try {
      final service = ref.read(residentServiceProvider);
      await service.submitUpdateRequest({
        'request_type': 'profile_update',
        'first_name': _firstNameCtrl.text.trim(),
        'last_name': _lastNameCtrl.text.trim(),
        'contact_number': _contactCtrl.text.trim(),
        'plate_number': _plateCtrl.text.trim().toUpperCase(),
        if (_modelCtrl.text.trim().isNotEmpty)
          'car_model': _modelCtrl.text.trim(),
        if (_colorCtrl.text.trim().isNotEmpty)
          'car_color': _colorCtrl.text.trim(),
        if (_addressCtrl.text.trim().isNotEmpty)
          'address': _addressCtrl.text.trim(),
      });
      _closeEditModal();
      if (mounted) {
        ToastHelper.showSuccess(
            context, 'Profile changes submitted for admin review.');
      }
    } catch (e) {
      if (mounted) {
        ToastHelper.showError(context, 'Failed to submit profile changes.');
      }
    } finally {
      if (mounted) setState(() => _isSubmittingEdit = false);
    }
  }

  Future<void> _confirmLogout() async {
    final confirm = await ActionConfirmDialog.show(
      context,
      title: 'Sign Out',
      message:
          'Are you sure you want to sign out? You will need to sign in again.',
      confirmLabel: 'Sign Out',
      cancelLabel: 'Cancel',
      confirmColor: const Color(0xFFEF4444),
      icon: Icons.logout_rounded,
    );
    if (confirm == true && mounted) {
      await ref.read(authProvider.notifier).logout();
      if (mounted) {
        ToastHelper.showInfo(context, AppStrings.logoutSuccess);
        Navigator.of(context).pushNamedAndRemoveUntil(
          AppRouter.login,
          (_) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authAsync = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: const Color(0xFF0D1117),
      body: authAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Text('Error: $e', style: const TextStyle(color: Colors.white)),
        ),
        data: (user) {
          if (user == null) return const SizedBox.shrink();
          return Stack(
            children: [
              _buildMainContent(user),
              if (_showEditModal) _buildEditModal(),
            ],
          );
        },
      ),
    );
  }

  // ── Main scrollable content ──────────────────────────────────────────────
  Widget _buildMainContent(User user) {
    final firstName = user.firstName ?? user.name.split(' ').first;
    final lastName = user.lastName ??
        (user.name.split(' ').length > 1
            ? user.name.split(' ').sublist(1).join(' ')
            : '');

    return SafeArea(
      child: SingleChildScrollView(
        padding: EdgeInsets.fromLTRB(16.w, 16.h, 16.w, 32.h),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Title Row: "My Profile" + X button ─────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'My Profile',
                      style: TextStyle(
                        fontSize: 22.sp,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    SizedBox(height: 2.h),
                    Text(
                      'View and manage your personal and account information',
                      style: TextStyle(
                        fontSize: 11.sp,
                        color: const Color(0xFF9CA3AF),
                      ),
                    ),
                  ],
                ),
              ],
            ),

            SizedBox(height: 16.h),

            // ── Profile Banner Card ────────────────────────────────────
            _buildProfileBanner(user),

            SizedBox(height: 16.h),

            // ── Personal Information Card ──────────────────────────────
            _buildPersonalInfoCard(firstName, lastName, user),

            SizedBox(height: 16.h),

            // ── Account Information Card ───────────────────────────────
            _buildAccountInfoCard(user),

            SizedBox(height: 16.h),

            // ── Vehicle Information Card ───────────────────────────────
            _buildVehicleInfoCard(user),
          ],
        ),
      ),
    );
  }

  // ── Profile Banner ───────────────────────────────────────────────────────
  Widget _buildProfileBanner(User user) {
    return Container(
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: const Color(0xFF30363D)),
      ),
      child: Row(
        children: [
          // Avatar circle with initials
          Container(
            width: 52.r,
            height: 52.r,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF3B82F6), Color(0xFF06B6D4)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(
                color: const Color(0xFF3B82F6).withAlpha(100),
                width: 2.5,
              ),
            ),
            child: Center(
              child: Text(
                user.initials,
                style: TextStyle(
                  fontSize: 18.sp,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),

          SizedBox(width: 12.w),

          // Name, role, active status
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user.name,
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
                Text(
                  'Resident Member',
                  style: TextStyle(
                    fontSize: 11.5.sp,
                    color: const Color(0xFF9CA3AF),
                  ),
                ),
                SizedBox(height: 3.h),
                Row(
                  children: [
                    Container(
                      width: 7.r,
                      height: 7.r,
                      decoration: const BoxDecoration(
                        color: Color(0xFF22C55E),
                        shape: BoxShape.circle,
                      ),
                    ),
                    SizedBox(width: 5.w),
                    Text(
                      'ACTIVE ACCOUNT',
                      style: TextStyle(
                        fontSize: 10.sp,
                        fontWeight: FontWeight.w700,
                        color: const Color(0xFF22C55E),
                        letterSpacing: 0.3,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Edit + Sign Out buttons
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Edit button
              GestureDetector(
                onTap: () => _openEditModal(user),
                child: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: 14.w,
                    vertical: 8.h,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2563EB),
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                  child: Text(
                    'Edit',
                    style: TextStyle(
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
              SizedBox(width: 8.w),
              // Sign Out button
              GestureDetector(
                onTap: _confirmLogout,
                child: Container(
                  padding: EdgeInsets.symmetric(
                    horizontal: 14.w,
                    vertical: 8.h,
                  ),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8.r),
                    border: Border.all(color: const Color(0xFFEF4444)),
                  ),
                  child: Text(
                    'Sign Out',
                    style: TextStyle(
                      fontSize: 12.sp,
                      fontWeight: FontWeight.w600,
                      color: const Color(0xFFEF4444),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Personal Information Card ────────────────────────────────────────────
  Widget _buildPersonalInfoCard(
      String firstName, String lastName, User user) {
    return _SectionCard(
      icon: Icons.person_rounded,
      iconColor: const Color(0xFF3B82F6),
      iconBgColor: const Color(0xFF3B82F6).withAlpha(30),
      title: 'Personal Information',
      child: Column(
        children: [
          // Row 1: First Name + Last Name
          Row(
            children: [
              Expanded(
                child: _InfoTile(
                  label: 'FIRST NAME',
                  value: firstName,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: _InfoTile(
                  label: 'LAST NAME',
                  value: lastName,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),

          // Row 2: Age + Contact Number
          Row(
            children: [
              Expanded(
                child: _InfoTile(
                  label: 'AGE',
                  value: user.age,
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: _InfoTile(
                  label: 'CONTACT NUMBER',
                  value: user.contactNumber,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),

          // Row 3: Address (full width)
          _InfoTile(
            label: 'ADDRESS',
            value: user.address,
          ),
        ],
      ),
    );
  }

  // ── Account Information Card ─────────────────────────────────────────────
  Widget _buildAccountInfoCard(User user) {
    return _SectionCard(
      icon: Icons.shield_rounded,
      iconColor: const Color(0xFF22C55E),
      iconBgColor: const Color(0xFF22C55E).withAlpha(30),
      title: 'Account Information',
      child: Column(
        children: [
          _InfoTile(label: 'EMAIL', value: user.email),
          SizedBox(height: 12.h),
          _InfoTile(label: 'USERNAME', value: user.username ?? user.slug),
          SizedBox(height: 12.h),
          Row(
            children: [
              Expanded(
                child: _InfoTile(
                  label: 'ACCOUNT ID',
                  value: '#${user.id}',
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: _InfoTile(
                  label: 'RFID UID',
                  value: user.rfidUid,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),

          // Access Status badge
          Container(
            width: double.infinity,
            padding: EdgeInsets.symmetric(horizontal: 14.w, vertical: 12.h),
            decoration: BoxDecoration(
              color: const Color(0xFF22C55E).withAlpha(20),
              borderRadius: BorderRadius.circular(10.r),
              border: Border.all(
                color: const Color(0xFF22C55E).withAlpha(50),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'ACCESS STATUS',
                  style: TextStyle(
                    fontSize: 10.sp,
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF22C55E),
                    letterSpacing: 0.5,
                  ),
                ),
                SizedBox(height: 4.h),
                Row(
                  children: [
                    Container(
                      width: 8.r,
                      height: 8.r,
                      decoration: const BoxDecoration(
                        color: Color(0xFF22C55E),
                        shape: BoxShape.circle,
                      ),
                    ),
                    SizedBox(width: 6.w),
                    Text(
                      'Active',
                      style: TextStyle(
                        fontSize: 13.sp,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF22C55E),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ── Vehicle Information Card ─────────────────────────────────────────────
  Widget _buildVehicleInfoCard(User user) {
    return _SectionCard(
      icon: Icons.directions_car_rounded,
      iconColor: const Color(0xFF8B5CF6),
      iconBgColor: const Color(0xFF8B5CF6).withAlpha(30),
      title: 'Vehicle Information',
      child: Column(
        children: [
          // Row 1: Plate Number (highlighted) + Car Model
          Row(
            children: [
              Expanded(
                child: _InfoTile(
                  label: 'PLATE NUMBER',
                  value: user.plateNumber,
                  isHighlighted: true,
                  highlightColor: const Color(0xFF8B5CF6),
                ),
              ),
              SizedBox(width: 12.w),
              Expanded(
                child: _InfoTile(
                  label: 'CAR MODEL',
                  value: user.carModel,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),

          // Row 2: Car Color
          _InfoTile(
            label: 'CAR COLOR',
            value: user.carColor,
          ),
        ],
      ),
    );
  }

  // ── Edit Profile Modal ───────────────────────────────────────────────────
  Widget _buildEditModal() {
    return Positioned.fill(
      child: Stack(
        children: [
          // Backdrop
          Positioned.fill(
            child: GestureDetector(
              onTap: _closeEditModal,
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                child: Container(color: Colors.black.withAlpha(180)),
              ),
            ),
          ),

          // Modal content
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: EdgeInsets.all(18.r),
                child: Container(
                  padding: EdgeInsets.all(20.r),
                  decoration: BoxDecoration(
                    color: const Color(0xFF161B22),
                    borderRadius: BorderRadius.circular(16.r),
                    border: Border.all(color: const Color(0xFF30363D)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(200),
                        blurRadius: 32,
                        offset: const Offset(0, 16),
                      ),
                    ],
                  ),
                  child: Form(
                    key: _editFormKey,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Edit Profile Information',
                                    style: TextStyle(
                                      fontSize: 17.sp,
                                      fontWeight: FontWeight.bold,
                                      color: Colors.white,
                                    ),
                                  ),
                                  SizedBox(height: 2.h),
                                  Text(
                                    'Changes are submitted for admin approval.',
                                    style: TextStyle(
                                      fontSize: 11.sp,
                                      color: const Color(0xFF9CA3AF),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            GestureDetector(
                              onTap: _closeEditModal,
                              child: Container(
                                padding: EdgeInsets.all(6.r),
                                decoration: BoxDecoration(
                                  color: Colors.white.withAlpha(15),
                                  shape: BoxShape.circle,
                                ),
                                child: Icon(
                                  Icons.close_rounded,
                                  color: const Color(0xFF9CA3AF),
                                  size: 18.r,
                                ),
                              ),
                            ),
                          ],
                        ),

                        Divider(
                          color: const Color(0xFF30363D),
                          height: 24.h,
                        ),

                        // Name row
                        Row(
                          children: [
                            Expanded(
                              child: _ModalField(
                                label: 'First Name',
                                controller: _firstNameCtrl,
                                isRequired: true,
                              ),
                            ),
                            SizedBox(width: 10.w),
                            Expanded(
                              child: _ModalField(
                                label: 'Last Name',
                                controller: _lastNameCtrl,
                                isRequired: true,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 12.h),

                        _ModalField(
                          label: 'Contact Number',
                          controller: _contactCtrl,
                          isRequired: true,
                        ),
                        SizedBox(height: 12.h),

                        Row(
                          children: [
                            Expanded(
                              child: _ModalField(
                                label: 'Plate Number',
                                controller: _plateCtrl,
                                isRequired: true,
                              ),
                            ),
                            SizedBox(width: 10.w),
                            Expanded(
                              child: _ModalField(
                                label: 'Car Model',
                                controller: _modelCtrl,
                              ),
                            ),
                          ],
                        ),
                        SizedBox(height: 12.h),

                        _ModalField(
                          label: 'Car Color',
                          controller: _colorCtrl,
                        ),
                        SizedBox(height: 12.h),

                        _ModalField(
                          label: 'Address',
                          controller: _addressCtrl,
                        ),
                        SizedBox(height: 16.h),

                        // Notice box
                        Container(
                          padding: EdgeInsets.all(10.r),
                          decoration: BoxDecoration(
                            color: const Color(0xFF3B82F6).withAlpha(20),
                            borderRadius: BorderRadius.circular(8.r),
                            border: Border.all(
                              color: const Color(0xFF3B82F6).withAlpha(50),
                            ),
                          ),
                          child: Text(
                            'Your changes will be submitted for admin review and approval. '
                            'You will receive a notification once processed.',
                            style: TextStyle(
                              fontSize: 11.sp,
                              color: const Color(0xFF93C5FD),
                              height: 1.4,
                            ),
                          ),
                        ),
                        SizedBox(height: 20.h),

                        // Action buttons
                        Row(
                          mainAxisAlignment: MainAxisAlignment.end,
                          children: [
                            TextButton(
                              onPressed: _closeEditModal,
                              child: Text(
                                'Cancel',
                                style: TextStyle(
                                  color: const Color(0xFF9CA3AF),
                                  fontSize: 12.5.sp,
                                ),
                              ),
                            ),
                            SizedBox(width: 8.w),
                            ElevatedButton(
                              onPressed: _isSubmittingEdit
                                  ? null
                                  : _submitProfileChanges,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF2563EB),
                                foregroundColor: Colors.white,
                                disabledBackgroundColor:
                                    const Color(0xFF2563EB).withAlpha(120),
                                padding: EdgeInsets.symmetric(
                                  horizontal: 16.w,
                                  vertical: 10.h,
                                ),
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10.r),
                                ),
                              ),
                              child: _isSubmittingEdit
                                  ? SizedBox(
                                      height: 16.r,
                                      width: 16.r,
                                      child: const CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : Text(
                                      'Submit Changes for Review',
                                      style: TextStyle(
                                        fontSize: 12.sp,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                            ),
                          ],
                        ),
                      ],
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

// ─────────────────────────────────────────────────────────────────────────────
// Helper Widgets
// ─────────────────────────────────────────────────────────────────────────────

/// Section card with icon, title and content
class _SectionCard extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final Color iconBgColor;
  final String title;
  final Widget child;

  const _SectionCard({
    required this.icon,
    required this.iconColor,
    required this.iconBgColor,
    required this.title,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.r),
      decoration: BoxDecoration(
        color: const Color(0xFF161B22),
        borderRadius: BorderRadius.circular(16.r),
        border: Border.all(color: const Color(0xFF30363D)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Section header with icon
          Row(
            children: [
              Container(
                width: 32.r,
                height: 32.r,
                decoration: BoxDecoration(
                  color: iconBgColor,
                  borderRadius: BorderRadius.circular(8.r),
                ),
                child: Center(
                  child: Icon(icon, color: iconColor, size: 18.r),
                ),
              ),
              SizedBox(width: 10.w),
              Text(
                title,
                style: TextStyle(
                  fontSize: 15.sp,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ],
          ),
          SizedBox(height: 16.h),
          child,
        ],
      ),
    );
  }
}

/// Individual info tile matching the screenshot: label on top, value below,
/// with a dark background and subtle border
class _InfoTile extends StatelessWidget {
  final String label;
  final String? value;
  final bool isHighlighted;
  final Color? highlightColor;

  const _InfoTile({
    required this.label,
    this.value,
    this.isHighlighted = false,
    this.highlightColor,
  });

  @override
  Widget build(BuildContext context) {
    final hColor = highlightColor ?? const Color(0xFF8B5CF6);
    final displayValue = (value != null && value!.isNotEmpty) ? value! : '—';

    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
      decoration: BoxDecoration(
        color: isHighlighted
            ? hColor.withAlpha(15)
            : const Color(0xFF0D1117),
        borderRadius: BorderRadius.circular(10.r),
        border: Border.all(
          color: isHighlighted
              ? hColor.withAlpha(80)
              : const Color(0xFF30363D),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 9.5.sp,
              fontWeight: FontWeight.w700,
              color: isHighlighted
                  ? hColor.withAlpha(200)
                  : const Color(0xFF9CA3AF),
              letterSpacing: 0.5,
            ),
          ),
          SizedBox(height: 4.h),
          Text(
            displayValue,
            style: TextStyle(
              fontSize: isHighlighted ? 15.sp : 13.5.sp,
              fontWeight: FontWeight.w600,
              fontFamily: isHighlighted ? 'monospace' : null,
              color: isHighlighted ? hColor : Colors.white,
            ),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

/// Dark modal text input field
class _ModalField extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final bool isRequired;

  const _ModalField({
    required this.label,
    required this.controller,
    this.isRequired = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          isRequired ? '$label *' : label,
          style: TextStyle(
            fontSize: 11.5.sp,
            fontWeight: FontWeight.w500,
            color: const Color(0xFF9CA3AF),
          ),
        ),
        SizedBox(height: 4.h),
        TextFormField(
          controller: controller,
          validator: isRequired
              ? (v) => (v == null || v.trim().isEmpty)
                  ? 'This field is required'
                  : null
              : null,
          style: TextStyle(fontSize: 13.sp, color: Colors.white),
          decoration: InputDecoration(
            filled: true,
            fillColor: const Color(0xFF0D1117),
            contentPadding: EdgeInsets.symmetric(
              horizontal: 12.w,
              vertical: 10.h,
            ),
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8.r),
              borderSide: const BorderSide(color: Color(0xFF30363D)),
            ),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8.r),
              borderSide: const BorderSide(color: Color(0xFF30363D)),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8.r),
              borderSide: const BorderSide(color: Color(0xFF2563EB)),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8.r),
              borderSide: const BorderSide(color: Color(0xFFEF4444)),
            ),
          ),
        ),
      ],
    );
  }
}
