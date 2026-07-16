import 'package:dio/dio.dart';

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:8080'; // Android emulator → host
  late final Dio _dio;
  String? _token;

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 30),
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) {
        if (_token != null) {
          options.headers['Authorization'] = 'Bearer $_token';
        }
        handler.next(options);
      },
    ));
  }

  void setToken(String token) {
    _token = token;
  }

  // ── Auth ─────────────────────────────────────────────────────
  Future<Map<String, dynamic>> guestLogin([String name = 'Mobile User']) async {
    final res = await _dio.post('/api/auth/guest', data: {'name': name});
    final data = res.data as Map<String, dynamic>;
    setToken(data['token']);
    return data;
  }

  Future<Map<String, dynamic>> register(String email, String password, String name) async {
    final res = await _dio.post('/api/auth/register', data: {
      'email': email, 'password': password, 'name': name,
    });
    final data = res.data as Map<String, dynamic>;
    setToken(data['token']);
    return data;
  }

  Future<Map<String, dynamic>> login(String email, String password) async {
    final res = await _dio.post('/api/auth/login', data: {
      'email': email, 'password': password,
    });
    final data = res.data as Map<String, dynamic>;
    setToken(data['token']);
    return data;
  }

  // ── Discovery ────────────────────────────────────────────────
  Future<List<dynamic>> fetchNearbyDevices() async {
    final res = await _dio.get('/api/discovery/nearby');
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> announceDevice(Map<String, dynamic> info) async {
    final res = await _dio.post('/api/discovery/announce', data: info);
    return res.data as Map<String, dynamic>;
  }

  // ── Transfers ────────────────────────────────────────────────
  Future<List<dynamic>> fetchTransfers() async {
    final res = await _dio.get('/api/transfers');
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> uploadFile(
    String filePath,
    String fileName, {
    void Function(int, int)? onProgress,
  }) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
      'peer': 'Cloud',
    });

    final res = await _dio.post('/api/transfers', data: formData,
      options: Options(sendTimeout: Duration.zero),
      onSendProgress: onProgress,
    );
    return res.data as Map<String, dynamic>;
  }

  Future<void> pauseTransfer(String id) => _dio.post('/api/transfers/$id/pause');
  Future<void> resumeTransfer(String id) => _dio.post('/api/transfers/$id/resume');
  Future<void> cancelTransfer(String id) => _dio.post('/api/transfers/$id/cancel');

  // ── Chat ─────────────────────────────────────────────────────
  Future<List<dynamic>> fetchChatRooms() async {
    final res = await _dio.get('/api/chat/rooms');
    return res.data as List<dynamic>;
  }

  Future<List<dynamic>> fetchMessages(String roomId) async {
    final res = await _dio.get('/api/chat/rooms/$roomId/messages');
    return res.data as List<dynamic>;
  }

  // ── Links ────────────────────────────────────────────────────
  Future<List<dynamic>> fetchLinks() async {
    final res = await _dio.get('/api/links');
    return res.data as List<dynamic>;
  }

  Future<Map<String, dynamic>> createLink(
    String filePath,
    String fileName, {
    String? password,
    void Function(int, int)? onProgress,
  }) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: fileName),
      if (password != null) 'password': password,
    });

    final res = await _dio.post('/api/links', data: formData,
      options: Options(sendTimeout: Duration.zero),
      onSendProgress: onProgress,
    );
    return res.data as Map<String, dynamic>;
  }

  Future<void> revokeLink(String id) => _dio.delete('/api/links/$id');

  // ── Health ───────────────────────────────────────────────────
  Future<bool> healthCheck() async {
    try {
      final res = await _dio.get('/health');
      return (res.data as Map<String, dynamic>)['ok'] == true;
    } catch (_) {
      return false;
    }
  }
}
