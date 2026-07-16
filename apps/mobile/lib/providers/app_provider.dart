import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';
import '../services/socket_service.dart';

// Service singletons
final apiServiceProvider = Provider<ApiService>((ref) => ApiService());
final socketServiceProvider = Provider<SocketService>((ref) => SocketService());

// Auth state
final userProvider = StateProvider<Map<String, dynamic>?>((ref) => null);
final isConnectedProvider = StateProvider<bool>((ref) => false);

// Device list
final devicesProvider = StateNotifierProvider<DevicesNotifier, List<Map<String, dynamic>>>(
  (ref) => DevicesNotifier(ref),
);

class DevicesNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  final Ref _ref;
  DevicesNotifier(this._ref) : super([]);

  Future<void> refresh() async {
    try {
      final api = _ref.read(apiServiceProvider);
      final data = await api.fetchNearbyDevices();
      state = data.cast<Map<String, dynamic>>();
    } catch (_) {}
  }

  void updateFromSocket(List<dynamic> devices) {
    state = devices.map((d) => Map<String, dynamic>.from(d)).toList();
  }
}

// Transfers
final transfersProvider = StateNotifierProvider<TransfersNotifier, List<Map<String, dynamic>>>(
  (ref) => TransfersNotifier(ref),
);

class TransfersNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  final Ref _ref;
  TransfersNotifier(this._ref) : super([]);

  Future<void> refresh() async {
    try {
      final api = _ref.read(apiServiceProvider);
      final data = await api.fetchTransfers();
      state = data.cast<Map<String, dynamic>>();
    } catch (_) {}
  }
}

// Chat rooms
final chatRoomsProvider = StateNotifierProvider<ChatRoomsNotifier, List<Map<String, dynamic>>>(
  (ref) => ChatRoomsNotifier(ref),
);

class ChatRoomsNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  final Ref _ref;
  ChatRoomsNotifier(this._ref) : super([]);

  Future<void> refresh() async {
    try {
      final api = _ref.read(apiServiceProvider);
      final data = await api.fetchChatRooms();
      state = data.cast<Map<String, dynamic>>();
    } catch (_) {}
  }
}

// Chat messages
final chatMessagesProvider = StateProvider<List<Map<String, dynamic>>>((ref) => []);
final activeChatRoomProvider = StateProvider<String?>((ref) => null);

// Cloud links
final linksProvider = StateNotifierProvider<LinksNotifier, List<Map<String, dynamic>>>(
  (ref) => LinksNotifier(ref),
);

class LinksNotifier extends StateNotifier<List<Map<String, dynamic>>> {
  final Ref _ref;
  LinksNotifier(this._ref) : super([]);

  Future<void> refresh() async {
    try {
      final api = _ref.read(apiServiceProvider);
      final data = await api.fetchLinks();
      state = data.cast<Map<String, dynamic>>();
    } catch (_) {}
  }
}

// App initialization
final initProvider = FutureProvider<void>((ref) async {
  final api = ref.read(apiServiceProvider);
  final socket = ref.read(socketServiceProvider);

  try {
    // Guest login
    final result = await api.guestLogin('Mobile User');
    ref.read(userProvider.notifier).state = result['user'];
    ref.read(isConnectedProvider.notifier).state = true;

    // Connect socket
    socket.connect();
    socket.announcePresence({
      'name': 'Mobile Device',
      'platform': 'Android/iOS',
      'deviceType': 'mobile',
      'userId': result['user']['id'],
    });

    // Socket listeners
    socket.onPresenceList((devices) {
      ref.read(devicesProvider.notifier).updateFromSocket(devices);
    });

    socket.onChatMessage((msg) {
      final messages = ref.read(chatMessagesProvider);
      if (!messages.any((m) => m['id'] == msg['id'])) {
        ref.read(chatMessagesProvider.notifier).state = [...messages, msg];
      }
    });

    // Load initial data
    await Future.wait([
      ref.read(devicesProvider.notifier).refresh(),
      ref.read(transfersProvider.notifier).refresh(),
      ref.read(chatRoomsProvider.notifier).refresh(),
      ref.read(linksProvider.notifier).refresh(),
    ]);
  } catch (e) {
    print('[Init] Failed: $e');
    ref.read(isConnectedProvider.notifier).state = false;
  }
});
