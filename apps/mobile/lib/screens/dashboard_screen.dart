import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/app_provider.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final init = ref.watch(initProvider);
    final devices = ref.watch(devicesProvider);
    final transfers = ref.watch(transfersProvider);
    final connected = ref.watch(isConnectedProvider);

    final onlineDevices = devices.where((d) => d['online'] == true).toList();
    final activeTransfers = transfers.where((t) =>
      t['status'] == 'in_progress' || t['status'] == 'uploading').toList();
    final completedTransfers = transfers.where((t) => t['status'] == 'completed').toList();

    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF4CC9F0), Color(0xFF7209B7)]),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.bolt, size: 16, color: Colors.white),
          ),
          const SizedBox(width: 10),
          const Text('LinkDrop', style: TextStyle(fontWeight: FontWeight.bold)),
        ]),
        actions: [
          Icon(connected ? Icons.wifi : Icons.wifi_off,
            color: connected ? const Color(0xFF06D6A0) : const Color(0xFFEF476F), size: 18),
          const SizedBox(width: 16),
        ],
      ),
      body: init.when(
        data: (_) => _buildContent(context, onlineDevices, activeTransfers, completedTransfers, transfers),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(child: Text('Failed to initialize: $e')),
      ),
    );
  }

  Widget _buildContent(BuildContext context, List devices, List active, List completed, List all) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Hero card
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(24),
            gradient: const LinearGradient(
              colors: [Color(0x334CC9F0), Color(0x337209B7)],
              begin: Alignment.topLeft, end: Alignment.bottomRight,
            ),
            border: Border.all(color: const Color(0xFF4CC9F0).withOpacity(0.15)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('UNIVERSAL TRANSFER ENGINE',
              style: TextStyle(fontSize: 11, letterSpacing: 1.5, color: const Color(0xFF4CC9F0).withOpacity(0.8))),
            const SizedBox(height: 10),
            const Text('Send anything over LAN, WebRTC, or encrypted cloud relay.',
              style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, height: 1.3)),
            const SizedBox(height: 16),
            FilledButton.icon(
              onPressed: () => context.go('/transfers'),
              icon: const Icon(Icons.upload_rounded),
              label: const Text('Send files'),
            ),
          ]),
        ),
        const SizedBox(height: 20),

        // Stats row
        Row(children: [
          _StatCard(icon: Icons.upload_rounded, color: const Color(0xFF4CC9F0),
            value: '${active.length}', label: 'Active'),
          const SizedBox(width: 12),
          _StatCard(icon: Icons.people_rounded, color: const Color(0xFFB97AFF),
            value: '${devices.length}', label: 'Online'),
          const SizedBox(width: 12),
          _StatCard(icon: Icons.check_circle_rounded, color: const Color(0xFF06D6A0),
            value: '${completed.length}', label: 'Done'),
          const SizedBox(width: 12),
          _StatCard(icon: Icons.list_alt_rounded, color: const Color(0xFFFFD166),
            value: '${all.length}', label: 'Total'),
        ]),
        const SizedBox(height: 20),

        // Nearby devices
        _SectionHeader(title: 'Nearby devices', onTap: () => context.go('/nearby')),
        const SizedBox(height: 8),
        if (devices.isEmpty)
          const Padding(padding: EdgeInsets.all(24),
            child: Center(child: Text('No devices found', style: TextStyle(color: Colors.white38))))
        else
          ...devices.take(3).map((d) => _DeviceRow(device: d)),

        const SizedBox(height: 20),

        // Recent transfers
        _SectionHeader(title: 'Recent transfers', onTap: () => context.go('/transfers')),
        const SizedBox(height: 8),
        if (all.isEmpty)
          const Padding(padding: EdgeInsets.all(24),
            child: Center(child: Text('No transfers yet', style: TextStyle(color: Colors.white38))))
        else
          ...all.take(3).map((t) => _TransferRow(transfer: t)),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final Color color;
  final String value;
  final String label;
  const _StatCard({required this.icon, required this.color, required this.value, required this.label});

  @override
  Widget build(BuildContext context) {
    return Expanded(child: Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF0D1B2A),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.06)),
      ),
      child: Column(children: [
        Icon(icon, color: color, size: 20),
        const SizedBox(height: 8),
        Text(value, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
        const SizedBox(height: 2),
        Text(label, style: TextStyle(fontSize: 11, color: Colors.white.withOpacity(0.5))),
      ]),
    ));
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  final VoidCallback onTap;
  const _SectionHeader({required this.title, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
      Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
      TextButton(onPressed: onTap, child: const Text('View all →')),
    ]);
  }
}

class _DeviceRow extends StatelessWidget {
  final Map<String, dynamic> device;
  const _DeviceRow({required this.device});

  @override
  Widget build(BuildContext context) {
    final type = device['deviceType'] ?? 'desktop';
    final icon = type == 'mobile' ? Icons.smartphone : type == 'tablet' ? Icons.tablet : Icons.laptop;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: const Color(0xFF4CC9F0).withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: const Color(0xFF4CC9F0)),
        ),
        title: Text(device['name'] ?? 'Unknown'),
        subtitle: Text('${device['platform'] ?? ''} • ${device['distance'] ?? ''}'),
        trailing: Text('${device['speedMbps'] ?? 0} Mbps',
          style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 12)),
      ),
    );
  }
}

class _TransferRow extends StatelessWidget {
  final Map<String, dynamic> transfer;
  const _TransferRow({required this.transfer});

  @override
  Widget build(BuildContext context) {
    final status = transfer['status'] ?? '';
    final progress = (transfer['progress'] ?? 0).toDouble();
    final isComplete = status == 'completed';
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            Expanded(child: Text(transfer['fileName'] ?? '', overflow: TextOverflow.ellipsis,
              style: const TextStyle(fontWeight: FontWeight.w500))),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                color: isComplete ? const Color(0xFF06D6A0).withOpacity(0.15) : const Color(0xFF4CC9F0).withOpacity(0.15),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(status, style: TextStyle(
                fontSize: 11, color: isComplete ? const Color(0xFF06D6A0) : const Color(0xFF4CC9F0))),
            ),
          ]),
          const SizedBox(height: 8),
          LinearProgressIndicator(value: progress / 100,
            backgroundColor: Colors.white.withOpacity(0.05),
            color: isComplete ? const Color(0xFF06D6A0) : const Color(0xFF4CC9F0)),
        ]),
      ),
    );
  }
}
