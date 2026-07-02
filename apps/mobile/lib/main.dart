import 'package:flutter/material.dart';

void main() => runApp(const LinkDropApp());

class LinkDropApp extends StatelessWidget {
  const LinkDropApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'LinkDrop',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(useMaterial3: true, brightness: Brightness.dark, colorSchemeSeed: const Color(0xFF4CC9F0)),
      home: const DashboardPage(),
    );
  }
}

class DashboardPage extends StatelessWidget {
  const DashboardPage({super.key});

  @override
  Widget build(BuildContext context) {
    final cards = const [
      ('Nearby devices', '6 available now'),
      ('Active uploads', '3 transfers running'),
      ('Share links', '14 active links'),
      ('Chats', '8 unread messages')
    ];

    return Scaffold(
      appBar: AppBar(title: const Text('LinkDrop')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(28),
              gradient: const LinearGradient(colors: [Color(0x334CC9F0), Color(0x337209B7)]),
            ),
            child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Smart transfer engine', style: TextStyle(fontSize: 12, letterSpacing: 1.2, color: Color(0xFF4CC9F0))),
              SizedBox(height: 8),
              Text('Send anything over LAN, WebRTC, or encrypted cloud relay.', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
            ]),
          ),
          const SizedBox(height: 16),
          ...cards.map((card) => Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
            child: ListTile(title: Text(card.$1), subtitle: Text(card.$2), trailing: const Icon(Icons.chevron_right)),
          )),
          const SizedBox(height: 16),
          FilledButton.icon(onPressed: () {}, icon: const Icon(Icons.send), label: const Text('Send files')),
        ],
      ),
    );
  }
}
