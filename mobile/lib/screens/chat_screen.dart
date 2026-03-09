// ============================================================================
// ZIEN Mobile — Chat Screen
// Real-time team chat using Worker API (/api/chat/*) + Supabase Realtime.
// ============================================================================

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../services/api_client.dart';
import '../services/company_providers.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});

  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  List<Map<String, dynamic>> _channels = [];
  Map<String, dynamic>? _activeChannel;
  List<Map<String, dynamic>> _messages = [];
  final TextEditingController _msgController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _loadingChannels = true;
  bool _loadingMessages = false;
  bool _sending = false;
  StreamSubscription? _realtimeSub;

  @override
  void initState() {
    super.initState();
    _loadChannels();
  }

  @override
  void dispose() {
    _realtimeSub?.cancel();
    _msgController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _loadChannels() async {
    setState(() => _loadingChannels = true);
    final companyState = ref.read(companyNotifierProvider);
    final companyId = companyState.active?.id;
    if (companyId == null) {
      setState(() => _loadingChannels = false);
      return;
    }

    final res = await ApiClient.instance.get(
      '/api/chat/channels',
      queryParams: {'companyId': companyId},
    );

    if (res.isSuccess && res.data != null) {
      final list = res.data!['channels'] ?? res.data!['data'] ?? [];
      setState(() {
        _channels = List<Map<String, dynamic>>.from(list is List ? list : []);
        _loadingChannels = false;
      });
    } else {
      setState(() => _loadingChannels = false);
    }
  }

  Future<void> _selectChannel(Map<String, dynamic> channel) async {
    _realtimeSub?.cancel();
    setState(() {
      _activeChannel = channel;
      _messages = [];
      _loadingMessages = true;
    });

    final channelId = channel['id']?.toString() ?? '';
    final res = await ApiClient.instance.get(
      '/api/chat/channels/$channelId/messages',
    );

    if (res.isSuccess && res.data != null) {
      final list = res.data!['messages'] ?? res.data!['data'] ?? [];
      setState(() {
        _messages = List<Map<String, dynamic>>.from(list is List ? list : []);
        _loadingMessages = false;
      });
      _scrollToBottom();
    } else {
      setState(() => _loadingMessages = false);
    }

    // Subscribe to realtime
    _realtimeSub = Supabase.instance.client
        .from('chat_messages')
        .stream(primaryKey: ['id'])
        .eq('channel_id', channelId)
        .listen((data) {
      setState(() {
        _messages = List<Map<String, dynamic>>.from(data);
      });
      _scrollToBottom();
    });
  }

  Future<void> _sendMessage() async {
    final text = _msgController.text.trim();
    if (text.isEmpty || _activeChannel == null) return;

    setState(() => _sending = true);
    _msgController.clear();

    final channelId = _activeChannel!['id']?.toString() ?? '';
    await ApiClient.instance.post(
      '/api/chat/channels/$channelId/messages',
      body: {'content': text},
    );

    setState(() => _sending = false);
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final currentUserId =
        Supabase.instance.client.auth.currentUser?.id ?? '';

    if (_activeChannel != null) {
      return _buildChatView(theme, currentUserId);
    }
    return _buildChannelList(theme);
  }

  Widget _buildChannelList(ThemeData theme) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Chat'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: _loadingChannels
          ? const Center(child: CircularProgressIndicator())
          : _channels.isEmpty
              ? Center(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.chat_bubble_outline,
                          size: 64, color: Colors.grey.shade400),
                      const SizedBox(height: 16),
                      Text('No channels yet',
                          style: theme.textTheme.titleMedium
                              ?.copyWith(color: Colors.grey)),
                      const SizedBox(height: 8),
                      Text('Channels will appear when your company has team chat enabled',
                          textAlign: TextAlign.center,
                          style: theme.textTheme.bodySmall
                              ?.copyWith(color: Colors.grey)),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _loadChannels,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _channels.length,
                    itemBuilder: (context, index) {
                      final ch = _channels[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          leading: CircleAvatar(
                            backgroundColor:
                                theme.colorScheme.primaryContainer,
                            child: Icon(
                              ch['type'] == 'dm'
                                  ? Icons.person
                                  : Icons.group,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                          title: Text(
                            ch['name']?.toString() ?? 'Channel',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          subtitle: Text(
                            ch['last_message']?.toString() ?? '',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          trailing: Icon(Icons.chevron_right,
                              color: Colors.grey.shade400),
                          onTap: () => _selectChannel(ch),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  Widget _buildChatView(ThemeData theme, String currentUserId) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_activeChannel?['name']?.toString() ?? 'Chat'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => setState(() => _activeChannel = null),
        ),
      ),
      body: Column(
        children: [
          // Messages
          Expanded(
            child: _loadingMessages
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty
                    ? Center(
                        child: Text('No messages yet',
                            style: theme.textTheme.bodyMedium
                                ?.copyWith(color: Colors.grey)),
                      )
                    : ListView.builder(
                        controller: _scrollController,
                        padding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 8),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final msg = _messages[index];
                          final isMe =
                              msg['user_id']?.toString() == currentUserId;
                          return _MessageBubble(
                            message: msg,
                            isMe: isMe,
                            theme: theme,
                          );
                        },
                      ),
          ),
          // Input
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              border: Border(
                top: BorderSide(color: theme.dividerColor),
              ),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _msgController,
                      decoration: InputDecoration(
                        hintText: 'Type a message...',
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(24),
                          borderSide: BorderSide.none,
                        ),
                        filled: true,
                        fillColor:
                            theme.colorScheme.surfaceContainerHighest,
                        contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16, vertical: 10),
                      ),
                      textInputAction: TextInputAction.send,
                      onSubmitted: (_) => _sendMessage(),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    onPressed: _sending ? null : _sendMessage,
                    icon: _sending
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : Icon(Icons.send,
                            color: theme.colorScheme.primary),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final Map<String, dynamic> message;
  final bool isMe;
  final ThemeData theme;

  const _MessageBubble({
    required this.message,
    required this.isMe,
    required this.theme,
  });

  @override
  Widget build(BuildContext context) {
    final content = message['content']?.toString() ?? '';
    final senderName = message['sender_name']?.toString() ?? '';
    final createdAt = message['created_at']?.toString() ?? '';
    String timeStr = '';
    if (createdAt.isNotEmpty) {
      try {
        final dt = DateTime.parse(createdAt).toLocal();
        timeStr = '${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}';
      } catch (_) {}
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment:
            isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            CircleAvatar(
              radius: 14,
              backgroundColor: theme.colorScheme.primaryContainer,
              child: Text(
                senderName.isNotEmpty ? senderName[0].toUpperCase() : '?',
                style: TextStyle(
                    fontSize: 12, color: theme.colorScheme.primary),
              ),
            ),
            const SizedBox(width: 6),
          ],
          Flexible(
            child: Container(
              padding: const EdgeInsets.symmetric(
                  horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: isMe
                    ? theme.colorScheme.primary
                    : theme.colorScheme.surfaceContainerHighest,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(16),
                  topRight: const Radius.circular(16),
                  bottomLeft: Radius.circular(isMe ? 16 : 4),
                  bottomRight: Radius.circular(isMe ? 4 : 16),
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (!isMe && senderName.isNotEmpty)
                    Text(
                      senderName,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: isMe
                            ? Colors.white.withValues(alpha: 0.8)
                            : theme.colorScheme.primary,
                      ),
                    ),
                  Text(
                    content,
                    style: TextStyle(
                      color: isMe ? Colors.white : theme.colorScheme.onSurface,
                    ),
                  ),
                  if (timeStr.isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        timeStr,
                        style: TextStyle(
                          fontSize: 10,
                          color: isMe
                              ? Colors.white.withValues(alpha: 0.6)
                              : Colors.grey,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
