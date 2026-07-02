import { useRef } from 'react';
import { Upload, Users, Laptop, Smartphone, Activity, ArrowUpRight, Wifi } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function DashboardPage() {
  const { devices, transfers, setPage, uploadFile, addToast } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const activeTransfers = transfers.filter(
    (t) => t.status === 'active' || t.status === 'in_progress' || t.status === 'uploading'
  );
  const onlineDevices = devices.filter((d) => d.online);

  const handleSendFiles = () => fileRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => uploadFile(f));
    e.target.value = '';
  };

  return (
    <>
      <input ref={fileRef} type="file" multiple hidden onChange={handleFileChange} />

      {/* Hero */}
      <section className="hero">
        <div className="hero-text">
          <p className="eyebrow">Universal transfer engine</p>
          <h2>One app for LAN, WebRTC, cloud relay, chat & share links.</h2>
          <p>Automatically route each file over the fastest secure path based on distance, bandwidth, and reachability.</p>
        </div>
        <div className="hero-actions">
          <button className="btn btn-primary" onClick={handleSendFiles}>
            <Upload size={16} /> Send files
          </button>
          <button className="btn btn-secondary" onClick={() => setPage('links')}>
            Create share link
          </button>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue"><Upload size={20} /></div>
          <span className="stat-value">{activeTransfers.length}</span>
          <span className="stat-label">Active transfers</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Users size={20} /></div>
          <span className="stat-value">{onlineDevices.length}</span>
          <span className="stat-label">Devices online</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><Laptop size={20} /></div>
          <span className="stat-value">{transfers.filter((t) => t.status === 'completed').length}</span>
          <span className="stat-label">Completed</span>
        </div>
        <div className="stat-card">
          <div className="stat-icon amber"><Smartphone size={20} /></div>
          <span className="stat-value">{transfers.length}</span>
          <span className="stat-label">Total transfers</span>
        </div>
      </section>

      {/* Two-column grid */}
      <section className="grid-2">
        {/* Nearby */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Nearby devices</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('nearby')}>
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="list-stack">
            {onlineDevices.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No devices discovered yet
              </div>
            )}
            {onlineDevices.slice(0, 4).map((d) => (
              <div className="list-row" key={d.id}>
                <div className="list-row-left">
                  <div className={`device-icon ${d.deviceType}`}>
                    {d.deviceType === 'desktop' ? <Laptop size={20} /> : <Smartphone size={20} />}
                  </div>
                  <div>
                    <strong style={{ fontSize: 13.5 }}>{d.name}</strong>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{d.platform} • {d.distance}</p>
                  </div>
                </div>
                <div className="list-row-right">
                  <span className={`quality-badge ${d.quality >= 0.9 ? 'excellent' : d.quality >= 0.7 ? 'good' : 'fair'}`}>
                    {Math.round(d.quality * 100)}%
                  </span>
                  <span className="speed-text">{d.speedMbps} Mbps</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transfer queue */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0 }}>Recent transfers</h3>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage('transfers')}>
              View all <ArrowUpRight size={14} />
            </button>
          </div>
          <div className="list-stack">
            {transfers.length === 0 && (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                No transfers yet — click "Send files" to start
              </div>
            )}
            {transfers.slice(0, 3).map((t) => (
              <div className="transfer-item" key={t.id}>
                <div className="transfer-header">
                  <strong>{t.fileName}</strong>
                  <span className={`method-badge ${t.transferMethod === 'local' ? 'lan' : t.transferMethod === 'webrtc' ? 'webrtc' : 'cloud'}`}>
                    {t.transferMethod}
                  </span>
                </div>
                <div className="progress-bar">
                  <span className="progress-fill" style={{ width: `${t.progress}%` }} />
                </div>
                <div className="transfer-meta">
                  <span>{formatBytes(t.fileSize)}</span>
                  <span>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Routing policy */}
      <section className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>Smart routing policy</h3>
          <Activity size={18} style={{ color: 'var(--accent)' }} />
        </div>
        <ul className="policy-list">
          <li><Wifi size={16} style={{ color: 'var(--success)' }} /> Prefer direct LAN / hotspot when both peers are reachable on the same network.</li>
          <li><Activity size={16} style={{ color: 'var(--accent)' }} /> Use WebRTC data channels for medium remote transfers with NAT traversal.</li>
          <li><Upload size={16} style={{ color: '#b97aff' }} /> Fall back to encrypted cloud relay for huge or offline deliveries via S3.</li>
          <li><ArrowUpRight size={16} style={{ color: 'var(--warning)' }} /> Persist resumable chunks and recover queues after process restart.</li>
        </ul>
      </section>
    </>
  );
}
