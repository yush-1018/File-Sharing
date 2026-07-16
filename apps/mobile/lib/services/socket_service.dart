import 'package:socket_io_client/socket_io_client.dart' as io;

class SocketService {
  static const String socketUrl = 'http://10.0.2.2:8080';
  io.Socket? _socket;

  io.Socket? get socket => _socket;
  bool get isConnected => _socket?.connected ?? false;

  void connect() {
    _socket = io.io(socketUrl, io.OptionBuilder()
      .setTransports(['websocket', 'polling'])
      .enableAutoConnect()
      .enableReconnection()
      .setReconnectionDelay(2000)
      .setReconnectionAttempts(10)
      .build(),
    );

    _socket!.onConnect((_) => print('[Socket] Connected: ${_socket!.id}'));
    _socket!.onDisconnect((_) => print('[Socket] Disconnected'));
    _socket!.onConnectError((err) => print('[Socket] Error: $err'));
  }

  void announcePresence(Map<String, dynamic> info) {
    _socket?.emit('presence:announce', info);
  }

  void joinRoom(String roomId) {
    _socket?.emit('room:join', roomId);
  }

  void leaveRoom(String roomId) {
    _socket?.emit('room:leave', roomId);
  }

  void sendChat(Map<String, dynamic> payload) {
    _socket?.emit('chat:send', payload);
  }

  void onPresenceList(void Function(List<dynamic>) callback) {
    _socket?.on('presence:list', (data) => callback(data as List<dynamic>));
  }

  void onPresenceUpdate(void Function(Map<String, dynamic>) callback) {
    _socket?.on('presence:update', (data) => callback(Map<String, dynamic>.from(data)));
  }

  void onChatMessage(void Function(Map<String, dynamic>) callback) {
    _socket?.on('chat:message', (data) => callback(Map<String, dynamic>.from(data)));
  }

  void onChatHistory(void Function(Map<String, dynamic>) callback) {
    _socket?.on('chat:history', (data) => callback(Map<String, dynamic>.from(data)));
  }

  void onTransferProgress(void Function(Map<String, dynamic>) callback) {
    _socket?.on('transfer:progress', (data) => callback(Map<String, dynamic>.from(data)));
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }
}
