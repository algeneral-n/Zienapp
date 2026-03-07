import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// NotificationService handles local push notifications and
/// Supabase Realtime-triggered alerts.
class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FlutterLocalNotificationsPlugin _localPlugin =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  // ─── Channels ──────────────────────────────────────────────
  static const _channelGeneral = AndroidNotificationChannel(
    'zien_general',
    'General',
    description: 'General platform notifications',
    importance: Importance.defaultImportance,
  );

  static const _channelHR = AndroidNotificationChannel(
    'zien_hr',
    'HR & Attendance',
    description: 'Leave approvals, attendance, payroll',
    importance: Importance.high,
  );

  static const _channelChat = AndroidNotificationChannel(
    'zien_chat',
    'Chat Messages',
    description: 'New chat messages',
    importance: Importance.high,
  );

  // ─── Init ──────────────────────────────────────────────────
  Future<void> init() async {
    if (_initialized) return;

    const androidSettings = AndroidInitializationSettings(
      '@mipmap/ic_launcher',
    );
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localPlugin.initialize(
      settings,
      onDidReceiveNotificationResponse: _onTap,
    );

    // Create Android channels
    if (Platform.isAndroid) {
      final androidImpl =
          _localPlugin
              .resolvePlatformSpecificImplementation<
                AndroidFlutterLocalNotificationsPlugin
              >();
      await androidImpl?.createNotificationChannel(_channelGeneral);
      await androidImpl?.createNotificationChannel(_channelHR);
      await androidImpl?.createNotificationChannel(_channelChat);
    }

    _initialized = true;
    debugPrint('[NotificationService] initialized');
  }

  // ─── Show local notification ──────────────────────────────
  Future<void> show({
    required String title,
    required String body,
    String channel = 'zien_general',
    String? payload,
  }) async {
    if (!_initialized) await init();

    final details = NotificationDetails(
      android: AndroidNotificationDetails(
        channel,
        channel == 'zien_chat'
            ? 'Chat Messages'
            : channel == 'zien_hr'
            ? 'HR & Attendance'
            : 'General',
        importance: Importance.high,
        priority: Priority.high,
      ),
      iOS: const DarwinNotificationDetails(),
    );

    await _localPlugin.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: payload,
    );
  }

  // ─── Supabase Realtime listener ───────────────────────────
  RealtimeChannel? _channel;

  /// Subscribe to the `notifications` table for the current user.
  void subscribeToUserNotifications(String userId) {
    _channel?.unsubscribe();

    _channel =
        Supabase.instance.client
            .channel('user_notifications')
            .onPostgresChanges(
              event: PostgresChangeEvent.insert,
              schema: 'public',
              table: 'notifications',
              filter: PostgresChangeFilter(
                type: PostgresChangeFilterType.eq,
                column: 'user_id',
                value: userId,
              ),
              callback: (payload) {
                final record = payload.newRecord;
                show(
                  title: record['title']?.toString() ?? 'ZIEN',
                  body: record['body']?.toString() ?? '',
                  channel: _channelForType(record['type']?.toString()),
                  payload: jsonEncode(record),
                );
              },
            )
            .subscribe();

    debugPrint('[NotificationService] subscribed for user: $userId');
  }

  void unsubscribe() {
    _channel?.unsubscribe();
    _channel = null;
  }

  // ─── Helpers ──────────────────────────────────────────────
  String _channelForType(String? type) {
    switch (type) {
      case 'hr':
      case 'leave':
      case 'payroll':
      case 'attendance':
        return 'zien_hr';
      case 'chat':
      case 'message':
        return 'zien_chat';
      default:
        return 'zien_general';
    }
  }

  void _onTap(NotificationResponse response) {
    // Handle notification tap — navigate based on payload
    debugPrint('[NotificationService] tapped: ${response.payload}');
    // TODO: Route to specific page based on payload type
  }
}
