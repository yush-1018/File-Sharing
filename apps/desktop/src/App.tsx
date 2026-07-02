import { useEffect, useRef } from 'react';
import {
  LayoutDashboard, Radar, ArrowUpDown, MessageSquare, Link2, Settings, Zap,
  CheckCircle, AlertCircle, Info, Wifi, WifiOff
} from 'lucide-react';
import { useAppStore, type Page } from './store/useAppStore';
import DashboardPage from './pages/DashboardPage';
import NearbyPage from './pages/NearbyPage';
import TransfersPage from './pages/TransfersPage';
import ChatPage from './pages/ChatPage';
import CloudLinksPage from './pages/CloudLinksPage';
import SettingsPage from './pages/SettingsPage';

/* ── Navigation config ──────────────────────────────────────── */
const navItems: { page: Page; label: string; icon: typeof LayoutDashboard }[] = [
  { page: 'dashboard', label: 'Dashboard',   icon: LayoutDashboard },
  { page: 'nearby',    label: 'Nearby',       icon: Radar },
  { page: 'transfers', label: 'Transfers',    icon: ArrowUpDown },
  { page: 'chat',      label: 'Chats',        icon: MessageSquare },
  { page: 'links',     label: 'Cloud Links',  icon: Link2 },
  { page: 'settings',  label: 'Settings',     icon: Settings },
];

/* ── Page renderer ──────────────────────────────────────────── */
function PageContent({ page }: { page: Page }) {
  switch (page) {
    case 'dashboard': return <DashboardPage />;
    case 'nearby':    return <NearbyPage />;
    case 'transfers': return <TransfersPage />;
    case 'chat':      return <ChatPage />;
    case 'links':     return <CloudLinksPage />;
    case 'settings':  return <SettingsPage />;
  }
}

/* ── Toast container ────────────────────────────────────────── */
function Toasts() {
  const toasts = useAppStore((s) => s.toasts);
  if (toasts.length === 0) return null;

  const iconMap = {
    success: <CheckCircle size={16} />,
    error:   <AlertCircle size={16} />,
    info:    <Info size={16} />,
  };

  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`}>
          {iconMap[t.type]}
          {t.message}
        </div>
      ))}
    </div>
  );
}

/* ── Upload progress overlay ────────────────────────────────── */
function UploadOverlay() {
  const progress = useAppStore((s) => s.uploadProgress);
  if (progress === null) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9998,
      padding: '16px 24px', borderRadius: 16,
      background: 'rgba(6,14,26,0.95)', border: '1px solid var(--border)',
      backdropFilter: 'blur(12px)', minWidth: 280,
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
        <span>Uploading...</span>
        <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{progress}%</span>
      </div>
      <div className="progress-bar">
        <span className="progress-fill" style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
}

/* ── App ────────────────────────────────────────────────────── */
export default function App() {
  const { page, setPage, initialize, serverOnline, transfers } = useAppStore();
  const initRef = useRef(false);

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true;
      initialize();
    }
  }, [initialize]);

  const activeTransferCount = transfers.filter(
    (t) => t.status === 'active' || t.status === 'uploading' || t.status === 'in_progress'
  ).length;

  return (
    <>
      <Toasts />
      <UploadOverlay />
      <div className="shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-icon">
              <Zap size={18} color="#fff" />
            </div>
            <h1>LinkDrop</h1>
          </div>

          <nav>
            {navItems.map(({ page: p, label, icon: Icon }) => {
              let badge: number | null = null;
              if (p === 'transfers' && activeTransferCount > 0) badge = activeTransferCount;

              return (
                <button
                  key={p}
                  className={`nav-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                >
                  <Icon size={18} />
                  {label}
                  {badge ? <span className="nav-badge">{badge}</span> : null}
                </button>
              );
            })}
          </nav>

          <div className="sidebar-footer">
            <div className="user-card" onClick={() => setPage('settings')}>
              <div className="user-avatar">U</div>
              <div className="user-info">
                <strong>User</strong>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {serverOnline
                    ? <><Wifi size={10} style={{ color: 'var(--success)' }} /> Connected</>
                    : <><WifiOff size={10} style={{ color: 'var(--danger)' }} /> Offline</>}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className="content">
          <PageContent page={page} />
        </main>
      </div>
    </>
  );
}
