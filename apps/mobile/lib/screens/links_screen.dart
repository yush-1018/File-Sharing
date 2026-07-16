import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_provider.dart';

class LinksScreen extends ConsumerWidget {
  const LinksScreen({super.key});

  String _formatBytes(num bytes) {
    if (bytes >= 1e9) return '${(bytes / 1e9).toStringAsFixed(1)} GB';
    if (bytes >= 1e6) return '${(bytes / 1e6).toStringAsFixed(0)} MB';
    if (bytes >= 1e3) return '${(bytes / 1e3).toStringAsFixed(0)} KB';
    return '$bytes B';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final links = ref.watch(linksProvider);
    final active = links.where((l) => l['active'] == true).toList();
    final revoked = links.where((l) => l['active'] != true).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cloud Links'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(linksProvider.notifier).refresh()),
        ],
      ),
      body: links.isEmpty
        ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.link_rounded, size: 64, color: Colors.white24),
            SizedBox(height: 16),
            Text('No cloud links yet', style: TextStyle(color: Colors.white38)),
          ]))
        : ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (active.isNotEmpty) ...[
                ...active.map((l) => _LinkCard(link: l, formatBytes: _formatBytes)),
                const SizedBox(height: 16),
              ],
              if (revoked.isNotEmpty) ...[
                Text('Revoked', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 13)),
                const SizedBox(height: 8),
                ...revoked.map((l) => Opacity(opacity: 0.5,
                  child: _LinkCard(link: l, formatBytes: _formatBytes))),
              ],
            ],
          ),
    );
  }
}

class _LinkCard extends StatelessWidget {
  final Map<String, dynamic> link;
  final String Function(num) formatBytes;
  const _LinkCard({required this.link, required this.formatBytes});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const Icon(Icons.link, color: Color(0xFF4CC9F0), size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text(link['fileName'] ?? '', overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w600))),
            if (link['password'] != null)
              Icon(Icons.lock, size: 14, color: Colors.amber.withOpacity(0.7)),
          ]),
          const SizedBox(height: 8),
          Text(link['url'] ?? '', style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.3)),
            overflow: TextOverflow.ellipsis),
          const SizedBox(height: 10),
          Row(children: [
            _Stat(Icons.visibility, '${link['views'] ?? 0}'),
            const SizedBox(width: 16),
            _Stat(Icons.download, '${link['downloads'] ?? 0}'),
            const SizedBox(width: 16),
            Text(formatBytes(link['fileSize'] ?? 0),
              style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.4))),
            const Spacer(),
            if (link['active'] == true)
              IconButton(
                icon: const Icon(Icons.copy, size: 16),
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: link['url'] ?? ''));
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Link copied!')));
                },
              ),
          ]),
        ]),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final IconData icon;
  final String value;
  const _Stat(this.icon, this.value);

  @override
  Widget build(BuildContext context) {
    return Row(children: [
      Icon(icon, size: 13, color: Colors.white38),
      const SizedBox(width: 4),
      Text(value, style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.5))),
    ]);
  }
}
