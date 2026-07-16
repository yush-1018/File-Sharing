import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/app_provider.dart';

class NearbyScreen extends ConsumerWidget {
  const NearbyScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final devices = ref.watch(devicesProvider);
    final online = devices.where((d) => d['online'] == true).toList();

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nearby Devices'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.read(devicesProvider.notifier).refresh(),
          ),
        ],
      ),
      body: online.isEmpty
        ? const Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.radar_rounded, size: 64, color: Colors.white24),
            SizedBox(height: 16),
            Text('No devices found', style: TextStyle(color: Colors.white38)),
            SizedBox(height: 8),
            Text('Make sure the server is running', style: TextStyle(color: Colors.white24, fontSize: 13)),
          ]))
        : ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: online.length,
            itemBuilder: (_, i) {
              final d = online[i];
              final type = d['deviceType'] ?? 'desktop';
              final icon = type == 'mobile' ? Icons.smartphone : type == 'tablet' ? Icons.tablet : Icons.laptop;
              final quality = ((d['quality'] ?? 0.8) * 100).round();

              return Card(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF4CC9F0).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(icon, color: const Color(0xFF4CC9F0)),
                  ),
                  title: Text(d['name'] ?? 'Unknown', style: const TextStyle(fontWeight: FontWeight.w600)),
                  subtitle: Text('${d['platform'] ?? ''} • ${d['distance'] ?? ''} • $quality% signal'),
                  trailing: FilledButton.icon(
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('Ready to send to ${d['name']}')),
                      );
                    },
                    icon: const Icon(Icons.send, size: 16),
                    label: const Text('Send'),
                    style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 12)),
                  ),
                ),
              );
            },
          ),
    );
  }
}
