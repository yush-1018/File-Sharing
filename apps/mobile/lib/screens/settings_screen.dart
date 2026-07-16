import 'package:flutter/material.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _Section(title: 'Profile', icon: Icons.person, children: [
            _TextSetting(label: 'Display name', value: 'Mobile User'),
            _TextSetting(label: 'Device name', value: 'My Phone'),
          ]),
          const SizedBox(height: 16),
          _Section(title: 'Security', icon: Icons.shield, children: [
            _ToggleSetting(label: 'End-to-end encryption', subtitle: 'AES-256-GCM', value: true),
            _ToggleSetting(label: 'Require PIN for incoming', subtitle: '4-digit PIN', value: false),
          ]),
          const SizedBox(height: 16),
          _Section(title: 'Transfer', icon: Icons.swap_vert, children: [
            _ToggleSetting(label: 'Auto-resume on reconnect', subtitle: 'Resume paused transfers', value: true),
            _DropdownSetting(label: 'Default chunk size', value: '16 MB',
              options: const ['8 MB', '16 MB', '32 MB', '64 MB']),
          ]),
          const SizedBox(height: 16),
          _Section(title: 'About', icon: Icons.info_outline, children: [
            _InfoRow(label: 'Version', value: '0.1.0'),
            _InfoRow(label: 'Platform', value: 'Flutter + Riverpod'),
          ]),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title;
  final IconData icon;
  final List<Widget> children;
  const _Section({required this.title, required this.icon, required this.children});

  @override
  Widget build(BuildContext context) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        Icon(icon, size: 16, color: const Color(0xFF4CC9F0)),
        const SizedBox(width: 8),
        Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
      ]),
      const SizedBox(height: 8),
      Card(child: Column(children: children)),
    ]);
  }
}

class _TextSetting extends StatelessWidget {
  final String label;
  final String value;
  const _TextSetting({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(label),
      trailing: SizedBox(width: 150,
        child: Text(value, textAlign: TextAlign.right,
          style: TextStyle(color: Colors.white.withOpacity(0.5)))),
    );
  }
}

class _ToggleSetting extends StatefulWidget {
  final String label;
  final String subtitle;
  final bool value;
  const _ToggleSetting({required this.label, required this.subtitle, required this.value});
  @override
  State<_ToggleSetting> createState() => _ToggleSettingState();
}

class _ToggleSettingState extends State<_ToggleSetting> {
  late bool _value;
  @override
  void initState() { super.initState(); _value = widget.value; }

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      title: Text(widget.label),
      subtitle: Text(widget.subtitle, style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.4))),
      value: _value,
      onChanged: (v) => setState(() => _value = v),
    );
  }
}

class _DropdownSetting extends StatelessWidget {
  final String label;
  final String value;
  final List<String> options;
  const _DropdownSetting({required this.label, required this.value, required this.options});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(label),
      trailing: Text(value, style: TextStyle(color: Colors.white.withOpacity(0.5))),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  const _InfoRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return ListTile(
      title: Text(label),
      trailing: Text(value, style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13)),
    );
  }
}
