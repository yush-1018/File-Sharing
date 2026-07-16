import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_provider.dart';

class ChatScreen extends ConsumerStatefulWidget {
  const ChatScreen({super.key});
  @override
  ConsumerState<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends ConsumerState<ChatScreen> {
  final _controller = TextEditingController();

  @override
  void dispose() { _controller.dispose(); super.dispose(); }

  void _send() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    final roomId = ref.read(activeChatRoomProvider);
    final user = ref.read(userProvider);
    if (roomId == null || user == null) return;

    ref.read(socketServiceProvider).sendChat({
      'roomId': roomId,
      'text': text,
      'senderUserId': user['id'],
      'senderName': user['name'] ?? 'User',
    });
    _controller.clear();
  }

  @override
  Widget build(BuildContext context) {
    final rooms = ref.watch(chatRoomsProvider);
    final activeRoom = ref.watch(activeChatRoomProvider);
    final messages = ref.watch(chatMessagesProvider);
    final user = ref.watch(userProvider);
    final roomMessages = messages.where((m) => m['roomId'] == activeRoom).toList();

    return Scaffold(
      appBar: AppBar(title: Text(activeRoom != null
        ? rooms.firstWhere((r) => r['id'] == activeRoom, orElse: () => {'name': 'Chat'})['name'] ?? 'Chat'
        : 'Chat')),
      body: Column(children: [
        // Room tabs
        SizedBox(height: 44, child: ListView(scrollDirection: Axis.horizontal,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          children: rooms.map((r) {
            final isActive = r['id'] == activeRoom;
            return Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: ChoiceChip(
                label: Text(r['name'] ?? ''),
                selected: isActive,
                onSelected: (_) {
                  ref.read(activeChatRoomProvider.notifier).state = r['id'];
                  ref.read(socketServiceProvider).joinRoom(r['id']);
                },
              ),
            );
          }).toList(),
        )),

        // Messages
        Expanded(child: roomMessages.isEmpty
          ? const Center(child: Text('No messages yet 👋', style: TextStyle(color: Colors.white38)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: roomMessages.length,
              itemBuilder: (_, i) {
                final msg = roomMessages[i];
                final isMine = msg['senderUserId'] == user?['id'];
                return Align(
                  alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
                    decoration: BoxDecoration(
                      color: isMine ? const Color(0xFF4CC9F0).withOpacity(0.2) : const Color(0xFF0D1B2A),
                      borderRadius: BorderRadius.circular(16),
                      border: isMine ? null : Border.all(color: Colors.white.withOpacity(0.06)),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      if (!isMine) Text(msg['senderName'] ?? '', style: TextStyle(
                        fontSize: 11, color: const Color(0xFF4CC9F0).withOpacity(0.8), fontWeight: FontWeight.w600)),
                      if (!isMine) const SizedBox(height: 4),
                      Text(msg['text'] ?? ''),
                    ]),
                  ),
                );
              },
            ),
        ),

        // Input bar
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF0D1B2A),
            border: Border(top: BorderSide(color: Colors.white.withOpacity(0.06))),
          ),
          child: Row(children: [
            Expanded(child: TextField(
              controller: _controller,
              decoration: InputDecoration(
                hintText: 'Type a message...',
                filled: true,
                fillColor: const Color(0xFF060E1A),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              ),
              onSubmitted: (_) => _send(),
            )),
            const SizedBox(width: 8),
            IconButton.filled(onPressed: _send, icon: const Icon(Icons.send, size: 18)),
          ]),
        ),
      ]),
    );
  }
}
