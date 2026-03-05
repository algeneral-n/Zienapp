// ============================================================================
// ZIEN Mobile — Profile Model
// Mirrors: web/src/types.ts Profile
// ============================================================================

import 'enums.dart';

class Profile {
  final String id;
  final String email;
  final String? fullName;
  final String? displayName;
  final String? avatarUrl;
  final String? phone;
  final PlatformRole platformRole;
  final bool isActive;
  final String createdAt;
  final String updatedAt;

  const Profile({
    required this.id,
    required this.email,
    this.fullName,
    this.displayName,
    this.avatarUrl,
    this.phone,
    this.platformRole = PlatformRole.tenantUser,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Profile.fromJson(Map<String, dynamic> json) {
    return Profile(
      id: json['id'] as String,
      email: json['email'] as String? ?? '',
      fullName: json['full_name'] as String?,
      displayName: json['display_name'] as String?,
      avatarUrl: json['avatar_url'] as String?,
      phone: json['phone'] as String?,
      platformRole: PlatformRole.fromString(
        json['platform_role'] as String? ?? 'tenant_user',
      ),
      isActive: json['is_active'] as bool? ?? true,
      createdAt: json['created_at'] as String? ?? '',
      updatedAt: json['updated_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'full_name': fullName,
      'display_name': displayName,
      'avatar_url': avatarUrl,
      'phone': phone,
      'platform_role': platformRole.value,
      'is_active': isActive,
    };
  }
}
