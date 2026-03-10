// ============================================================================
// ZIEN Mobile -- RARE AI Agent Screen
// AI chat + agent control -- mirrors web RARE architecture
// ============================================================================

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../services/api_client.dart';
import '../services/auth_providers.dart';
import '../services/company_providers.dart';
import '../models/enums.dart';
import '../theme/app_theme.dart';

class RareScreen extends ConsumerStatefulWidget {
  const RareScreen({super.key});

  @override
  ConsumerState<RareScreen> createState() => _RareScreenState();
}

class _RareScreenState extends ConsumerState<RareScreen> {
  final _api = ApiClient.instance;
  final _msgCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  final List<Map<String, dynamic>> _messages = [];
  bool _loading = false;
  String _mode = 'assistant'; // assistant | architect | analyst | operator

  String? get _companyId => ref.read(companyNotifierProvider).active?.id;

  bool get _isFounder {
    final profile = ref.read(profileProvider).valueOrNull;
    return profile?.platformRole == PlatformRole.founder;
  }

  static const Map<String, Map<String, dynamic>> _modes = {
    'assistant': {'label': 'Assistant', 'icon': Icons.smart_toy, 'color': Colors.blue},
    'architect': {'label': 'Architect', 'icon': Icons.architecture, 'color': Colors.purple},
    'analyst': {'label': 'Analyst', 'icon': Icons.analytics, 'color': Colors.teal},
    'operator': {'label': 'Operator', 'icon': Icons.engineering, 'color': Colors.orange},
  };

  @override
  void dispose() {
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _msgCtrl.text.trim();
    if (text.isEmpty || _companyId == null) return;

    setState(() {
      _messages.add({'role': 'user', 'content': text});
      _loading = true;
    });
    _msgCtrl.clear();
    _scrollToBottom();

    try {
      final res = await _api.post('/api/rare/chat', body: {
        'message': text,
        'mode': _mode,
      }, extraHeaders: {'X-Company-Id': _companyId!});

      if (res.isSuccess) {
        setState(() {
          _messages.add({
            'role': 'assistant',
            'content': res.data?['reply'] ?? res.data?['message'] ?? 'No response',
            'mode': _mode,
          });
        });
      } else {
        setState(() {
          _messages.add({'role': 'system', 'content': 'Error: ${res.errorMessage ?? 'Unknown error'}'});
        });
      }
    } catch (e) {
      setState(() {
        _messages.add({'role': 'system', 'content': 'Connection error'});
      });
    }

    setState(() => _loading = false);
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) {
        _scrollCtrl.animateTo(
          _scrollCtrl.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('RARE AI', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        actions: [
          // Supreme Access button — only for founder
          if (_isFounder)
            IconButton(
              icon: const Icon(Icons.shield_moon, color: Colors.amber),
              tooltip: 'Supreme Access',
              onPressed: () => context.push('/supreme'),
            ),
          IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () => setState(() => _messages.clear()),
          ),
        ],
      ),
      body: Column(
        children: [
          _buildModeSelector(),
          Expanded(child: _buildChat()),
          _buildInput(),
        ],
      ),
    );
  }

  Widget _buildModeSelector() {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: ListView(
        scrollDirection: Axis.horizontal,
        children: _modes.entries.map((e) {
          final active = _mode == e.key;
          final color = e.value['color'] as Color;
          return Padding(
            padding: const EdgeInsets.only(right: 8, top: 8, bottom: 8),
            child: ChoiceChip(
              selected: active,
              label: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(e.value['icon'] as IconData, size: 16, color: active ? Colors.white : color),
                  const SizedBox(width: 6),
                  Text(e.value['label'] as String),
                ],
              ),
              selectedColor: color,
              labelStyle: TextStyle(color: active ? Colors.white : color, fontWeight: FontWeight.bold, fontSize: 12),
              onSelected: (_) => setState(() => _mode = e.key),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildChat() {
    if (_messages.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.psychology, size: 64, color: AppTheme.primaryBlue.withValues(alpha: 0.3)),
            const SizedBox(height: 16),
            const Text('RARE AI Agent', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
            const SizedBox(height: 8),
            Text('Select a mode and start chatting',
                style: TextStyle(color: Colors.grey[500])),
            const SizedBox(height: 24),
            Wrap(
              spacing: 8, runSpacing: 8,
              children: [
                _suggestionChip('Summarize today\'s metrics'),
                _suggestionChip('Draft a client proposal'),
                _suggestionChip('Analyze revenue trends'),
                _suggestionChip('Create a task workflow'),
              ],
            ),
          ],
        ),
      );
    }

    return ListView.builder(
      controller: _scrollCtrl,
      padding: const EdgeInsets.all(16),
      itemCount: _messages.length + (_loading ? 1 : 0),
      itemBuilder: (context, i) {
        if (i == _messages.length) {
          return const Padding(
            padding: EdgeInsets.all(16),
            child: Row(
              children: [
                SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)),
                SizedBox(width: 12),
                Text('Thinking...', style: TextStyle(color: Colors.grey)),
              ],
            ),
          );
        }
        final msg = _messages[i];
        final isUser = msg['role'] == 'user';
        final isSystem = msg['role'] == 'system';

        return Align(
          alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            margin: const EdgeInsets.only(bottom: 12),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
            decoration: BoxDecoration(
              color: isUser
                  ? AppTheme.primaryBlue
                  : isSystem
                      ? Colors.red.withValues(alpha: 0.1)
                      : Colors.grey.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(18).copyWith(
                bottomRight: isUser ? const Radius.circular(4) : null,
                bottomLeft: !isUser ? const Radius.circular(4) : null,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isUser && msg['mode'] != null)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4),
                    child: Text(
                      (msg['mode'] as String).toUpperCase(),
                      style: TextStyle(
                        fontSize: 9, fontWeight: FontWeight.bold,
                        color: (_modes[msg['mode']]?['color'] as Color?) ?? Colors.grey,
                      ),
                    ),
                  ),
                Text(
                  msg['content'] ?? '',
                  style: TextStyle(
                    color: isUser ? Colors.white : isSystem ? Colors.red : null,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _suggestionChip(String text) {
    return ActionChip(
      label: Text(text, style: const TextStyle(fontSize: 12)),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      onPressed: () {
        _msgCtrl.text = text;
        _sendMessage();
      },
    );
  }

  Widget _buildInput() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.05), blurRadius: 8, offset: const Offset(0, -2))],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: TextField(
                controller: _msgCtrl,
                textInputAction: TextInputAction.send,
                onSubmitted: (_) => _sendMessage(),
                decoration: InputDecoration(
                  hintText: 'Ask RARE AI...',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                  filled: true,
                  fillColor: Colors.grey.withValues(alpha: 0.1),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                ),
              ),
            ),
            const SizedBox(width: 8),
            CircleAvatar(
              backgroundColor: AppTheme.primaryBlue,
              child: IconButton(
                icon: const Icon(Icons.send, color: Colors.white, size: 20),
                onPressed: _loading ? null : _sendMessage,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
