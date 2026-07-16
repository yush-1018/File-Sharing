import 'package:go_router/go_router.dart';
import 'screens/shell_screen.dart';
import 'screens/dashboard_screen.dart';
import 'screens/nearby_screen.dart';
import 'screens/transfers_screen.dart';
import 'screens/chat_screen.dart';
import 'screens/links_screen.dart';
import 'screens/settings_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/dashboard',
  routes: [
    ShellRoute(
      builder: (context, state, child) => ShellScreen(child: child),
      routes: [
        GoRoute(path: '/dashboard', builder: (_, __) => const DashboardScreen()),
        GoRoute(path: '/nearby', builder: (_, __) => const NearbyScreen()),
        GoRoute(path: '/transfers', builder: (_, __) => const TransfersScreen()),
        GoRoute(path: '/chat', builder: (_, __) => const ChatScreen()),
        GoRoute(path: '/links', builder: (_, __) => const LinksScreen()),
        GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
      ],
    ),
  ],
);
