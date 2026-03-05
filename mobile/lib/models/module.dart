// ============================================================================
// ZIEN Mobile — Module Models
// Mirrors: web/src/types.ts ModuleCatalog, CompanyModule
// ============================================================================

import 'enums.dart';

/// Global module catalog entry
class ModuleCatalog {
  final String id;
  final String code;
  final String nameAr;
  final String nameEn;
  final String? descriptionAr;
  final String? descriptionEn;
  final String? icon;
  final ModuleTier tier;
  final List<String> dependencies;
  final bool isActive;
  final int sortOrder;

  const ModuleCatalog({
    required this.id,
    required this.code,
    required this.nameAr,
    required this.nameEn,
    this.descriptionAr,
    this.descriptionEn,
    this.icon,
    this.tier = ModuleTier.core,
    this.dependencies = const [],
    this.isActive = true,
    this.sortOrder = 0,
  });

  factory ModuleCatalog.fromJson(Map<String, dynamic> json) {
    return ModuleCatalog(
      id: json['id'] as String,
      code: json['code'] as String? ?? '',
      nameAr: json['name_ar'] as String? ?? '',
      nameEn: json['name_en'] as String? ?? '',
      descriptionAr: json['description_ar'] as String?,
      descriptionEn: json['description_en'] as String?,
      icon: json['icon'] as String?,
      tier: ModuleTier.fromString(json['tier'] as String? ?? 'core'),
      dependencies: (json['dependencies'] as List<dynamic>?)
              ?.map((e) => e as String)
              .toList() ??
          const [],
      isActive: json['is_active'] as bool? ?? true,
      sortOrder: json['sort_order'] as int? ?? 0,
    );
  }
}

/// An active module for a company
class CompanyModule {
  final String id;
  final String companyId;
  final String moduleId;
  final bool isActive;
  final Map<String, dynamic> config;
  final String activatedAt;
  final String? moduleCode;

  const CompanyModule({
    required this.id,
    required this.companyId,
    required this.moduleId,
    this.isActive = true,
    this.config = const {},
    required this.activatedAt,
    this.moduleCode,
  });

  factory CompanyModule.fromJson(Map<String, dynamic> json) {
    final catalog = json['modules_catalog'] as Map<String, dynamic>?;
    return CompanyModule(
      id: json['id'] as String,
      companyId: json['company_id'] as String,
      moduleId: json['module_id'] as String,
      isActive: json['is_active'] as bool? ?? true,
      config: (json['config'] as Map<String, dynamic>?) ?? const {},
      activatedAt: json['activated_at'] as String? ?? '',
      moduleCode: catalog?['code'] as String?,
    );
  }
}
