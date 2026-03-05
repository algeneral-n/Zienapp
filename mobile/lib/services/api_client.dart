// ============================================================================
// ZIEN Mobile — API Client
// Calls Worker endpoints with Supabase JWT auth header.
// Mirrors the pattern used by web: src/services/accountingService.ts
// ============================================================================

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:supabase_flutter/supabase_flutter.dart';
import '../config/app_config.dart';

class ApiClient {
  ApiClient._();
  static final ApiClient instance = ApiClient._();

  String get _baseUrl => AppConfig.apiUrl;

  /// Get the current user's JWT from Supabase session.
  Future<String?> _getToken() async {
    final session = Supabase.instance.client.auth.currentSession;
    return session?.accessToken;
  }

  /// Build common headers with JWT auth.
  Future<Map<String, String>> _headers() async {
    final token = await _getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// GET request to a Worker endpoint.
  Future<ApiResponse> get(
    String path, {
    Map<String, String>? queryParams,
    Map<String, String>? extraHeaders,
  }) async {
    final uri = Uri.parse(
      '$_baseUrl$path',
    ).replace(queryParameters: queryParams);
    final headers = await _headers();
    if (extraHeaders != null) headers.addAll(extraHeaders);
    final response = await http.get(uri, headers: headers);
    return ApiResponse.fromHttpResponse(response);
  }

  /// POST request to a Worker endpoint.
  Future<ApiResponse> post(
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? extraHeaders,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final headers = await _headers();
    if (extraHeaders != null) headers.addAll(extraHeaders);
    final response = await http.post(
      uri,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return ApiResponse.fromHttpResponse(response);
  }

  /// PUT request to a Worker endpoint.
  Future<ApiResponse> put(
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? extraHeaders,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final headers = await _headers();
    if (extraHeaders != null) headers.addAll(extraHeaders);
    final response = await http.put(
      uri,
      headers: headers,
      body: body != null ? jsonEncode(body) : null,
    );
    return ApiResponse.fromHttpResponse(response);
  }

  /// DELETE request to a Worker endpoint.
  Future<ApiResponse> delete(
    String path, {
    Map<String, String>? extraHeaders,
  }) async {
    final uri = Uri.parse('$_baseUrl$path');
    final headers = await _headers();
    if (extraHeaders != null) headers.addAll(extraHeaders);
    final response = await http.delete(uri, headers: headers);
    return ApiResponse.fromHttpResponse(response);
  }
}

/// Wrapper around HTTP responses.
class ApiResponse {
  final int statusCode;
  final Map<String, dynamic>? data;
  final String? rawBody;

  const ApiResponse({required this.statusCode, this.data, this.rawBody});

  bool get isSuccess => statusCode >= 200 && statusCode < 300;

  String? get errorMessage {
    if (isSuccess) return null;
    return data?['error'] as String? ?? data?['message'] as String? ?? rawBody;
  }

  factory ApiResponse.fromHttpResponse(http.Response response) {
    Map<String, dynamic>? parsed;
    try {
      final decoded = jsonDecode(response.body);
      if (decoded is Map<String, dynamic>) {
        parsed = decoded;
      }
    } catch (_) {
      // Body isn't JSON
    }
    return ApiResponse(
      statusCode: response.statusCode,
      data: parsed,
      rawBody: response.body,
    );
  }
}
