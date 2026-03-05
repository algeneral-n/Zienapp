// ============================================================================
// ZIEN Mobile — Company Models
// Mirrors: web/src/types.ts Company, CompanyMember, Department
// ============================================================================

import 'enums.dart';

/// Company (tenant) entity
class Company {
  final String id;
  final String name;
  final String? nameAr;
  final String slug;
  final String? companyTypeId;
  final String? industry;
  final CompanyStatus status;
  final String countryCode;
  final String? city;
  final String? address;
  final String? phone;
  final String? email;
  final String timezone;
  final String currencyCode;
  final String taxMode;
  final String? logoUrl;
  final String? businessLicenseUrl;
  final String? responsiblePersonIdUrl;
  final String brandingTheme;
  final String brandingMode;
  final Map<String, dynamic> branding;
  final String ownerUserId;
  final Map<String, dynamic> settings;
  final String createdAt;
  final String updatedAt;

  const Company({
    required this.id,
    required this.name,
    this.nameAr,
    required this.slug,
    this.companyTypeId,
    this.industry,
    required this.status,
    this.countryCode = 'AE',
    this.city,
    this.address,
    this.phone,
    this.email,
    this.timezone = 'Asia/Dubai',
    this.currencyCode = 'AED',
    this.taxMode = 'country_default',
    this.logoUrl,
    this.businessLicenseUrl,
    this.responsiblePersonIdUrl,
    this.brandingTheme = 'prism',
    this.brandingMode = 'system',
    this.branding = const {},
    required this.ownerUserId,
    this.settings = const {},
    required this.createdAt,
    required this.updatedAt,
  });

  factory Company.fromJson(Map<String, dynamic> json) => Company(
    id: json['id'] as String,
    name: json['name'] as String? ?? '',
    nameAr: json['name_ar'] as String?,
    slug: json['slug'] as String? ?? '',
    companyTypeId: json['company_type_id'] as String?,
    industry: json['industry'] as String?,
    status: CompanyStatus.fromString(
      json['status'] as String? ?? 'pending_review',
    ),
    countryCode: json['country_code'] as String? ?? 'AE',
    city: json['city'] as String?,
    address: json['address'] as String?,
    phone: json['phone'] as String?,
    email: json['email'] as String?,
    timezone: json['timezone'] as String? ?? 'Asia/Dubai',
    currencyCode: json['currency_code'] as String? ?? 'AED',
    taxMode: json['tax_mode'] as String? ?? 'country_default',
    logoUrl: json['logo_url'] as String?,
    businessLicenseUrl: json['business_license_url'] as String?,
    responsiblePersonIdUrl: json['responsible_person_id_url'] as String?,
    brandingTheme: json['branding_theme'] as String? ?? 'prism',
    brandingMode: json['branding_mode'] as String? ?? 'system',
    branding: (json['branding'] as Map<String, dynamic>?) ?? const {},
    ownerUserId: json['owner_user_id'] as String? ?? '',
    settings: (json['settings'] as Map<String, dynamic>?) ?? const {},
    createdAt: json['created_at'] as String? ?? '',
    updatedAt: json['updated_at'] as String? ?? '',
  );

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'name_ar': nameAr,
    'slug': slug,
    'company_type_id': companyTypeId,
    'industry': industry,
    'status': status.value,
    'country_code': countryCode,
    'city': city,
    'address': address,
    'phone': phone,
    'email': email,
    'timezone': timezone,
    'currency_code': currencyCode,
    'tax_mode': taxMode,
    'logo_url': logoUrl,
    'business_license_url': businessLicenseUrl,
    'responsible_person_id_url': responsiblePersonIdUrl,
    'branding_theme': brandingTheme,
    'branding_mode': brandingMode,
    'branding': branding,
    'owner_user_id': ownerUserId,
    'settings': settings,
  };
}

/// A user's membership within a company
class CompanyMember {
  final String id;
  final String companyId;
  final String userId;
  final CompanyRole role;
  final String? departmentId;
  final String? branchId;
  final MemberStatus status;
  final bool isPrimary;
  final String joinedAt;
  final String? createdBy;

  const CompanyMember({
    required this.id,
    required this.companyId,
    required this.userId,
    required this.role,
    this.departmentId,
    this.branchId,
    required this.status,
    this.isPrimary = false,
    required this.joinedAt,
    this.createdBy,
  });

  factory CompanyMember.fromJson(Map<String, dynamic> json) => CompanyMember(
    id: json['id'] as String,
    companyId: json['company_id'] as String,
    userId: json['user_id'] as String,
    role: CompanyRole.fromString(json['role'] as String? ?? 'employee'),
    departmentId: json['department_id'] as String?,
    branchId: json['branch_id'] as String?,
    status: MemberStatus.fromString(json['status'] as String? ?? 'active'),
    isPrimary: json['is_primary'] as bool? ?? false,
    joinedAt: json['joined_at'] as String? ?? '',
    createdBy: json['created_by'] as String?,
  );
}

/// Department within a company
class Department {
  final String id;
  final String companyId;
  final String? code;
  final String name;
  final String? managerId;
  final bool isActive;

  const Department({
    required this.id,
    required this.companyId,
    this.code,
    required this.name,
    this.managerId,
    this.isActive = true,
  });

  factory Department.fromJson(Map<String, dynamic> json) => Department(
    id: json['id'] as String,
    companyId: json['company_id'] as String,
    code: json['code'] as String?,
    name: json['name'] as String? ?? '',
    managerId: json['manager_id'] as String?,
    isActive: json['is_active'] as bool? ?? true,
  );
}
