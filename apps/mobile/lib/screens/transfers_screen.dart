import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_provider.dart';

class TransfersScreen extends ConsumerWidget {
  const TransfersScreen({super.key});

  String _formatBytes(num bytes) {
    if (bytes >= 1e9) return '${(bytes / 1e9).toStringAsFixed(1)} GB';
    if (bytes >= 1e6) return '${(bytes / 1e6).toStringAsFixed(0)} MB';
    if (bytes >= 1e3) return '${(bytes / 1e3).toStringAsFixed(0)} KB';
    return '$bytes B';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final transfers = ref.watch(transfersProvider);
    final active = transfers.where((t) =>
      ['in_progress', 'uploading', 'paused'].contains(t['status'])).toList();
    final history = transfers.where((t) =>
      ['completed', 'failed', 'cancelled'].contains(t['status'])).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Transfers'),
        actions: [
          IconButton(icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(transfersProvider.notifier).refresh()),
        ],
      ),
      body: transfers.isEmpty
        ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.upload_file_rounded, size: 64, color: Colors.white24),
            SizedBox(height: 16),
            Text('No transfers yet', style: TextStyle(color: Colors.white38)),
          ]))
        : ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (active.isNotEmpty) ...[
                Text('Active', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                ...active.map((t) => _ActiveTransferCard(transfer: t, formatBytes: _formatBytes)),
                const SizedBox(height: 20),
              ],
              if (history.isNotEmpty) ...[
                Text('History', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 13, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                ...history.map((t) => _HistoryCard(transfer: t, formatBytes: _formatBytes)),
              ],
            ],
          ),
    );
  }
}

class _ActiveTransferCard extends StatelessWidget {
  final Map<String, dynamic> transfer;
  final String Function(num) formatBytes;
  const _ActiveTransferCard({required this.transfer, required this.formatBytes});

  @override
  Widget build(BuildContext context) {
    final progress = (transfer['progress'] ?? 0).toDouble();
    return Card(
      margin: const EdgeInsets.only(bottom: 10),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Icon(transfer['direction'] == 'upload' ? Icons.upload_rounded : Icons.download_rounded,
              color: const Color(0xFF4CC9F0), size: 18),
            const SizedBox(width: 8),
            Expanded(child: Text(transfer['fileName'] ?? '', overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w600))),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: const Color(0xFF4CC9F0).withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(transfer['transferMethod'] ?? '', style: const TextStyle(fontSize: 11, color: Color(0xFF4CC9F0))),
            ),
          ]),
          const SizedBox(height: 12),
          LinearProgressIndicator(value: progress / 100,
            backgroundColor: Colors.white.withOpacity(0.05), color: const Color(0xFF4CC9F0)),
          const SizedBox(height: 8),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Text('${transfer['speed'] ?? '—'} → ${transfer['peer'] ?? ''}',
              style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.4))),
            Text('${progress.round()}% • ${formatBytes(transfer['fileSize'] ?? 0)}',
              style: TextStyle(fontSize: 12, color: Colors.white.withOpacity(0.4))),
          ]),
        ]),
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final Map<String, dynamic> transfer;
  final String Function(num) formatBytes;
  const _HistoryCard({required this.transfer, required this.formatBytes});

  @override
  Widget build(BuildContext context) {
    final status = transfer['status'] ?? '';
    final isComplete = status == 'completed';
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Icon(isComplete ? Icons.check_circle : Icons.error,
          color: isComplete ? const Color(0xFF06D6A0) : const Color(0xFFEF476F)),
        title: Text(transfer['fileName'] ?? '', overflow: TextOverflow.ellipsis),
        subtitle: Text('${formatBytes(transfer['fileSize'] ?? 0)} • ${transfer['transferMethod'] ?? ''}'),
        trailing: Text(status, style: TextStyle(
          fontSize: 12, color: isComplete ? const Color(0xFF06D6A0) : const Color(0xFFEF476F))),
      ),
    );
  }
}
