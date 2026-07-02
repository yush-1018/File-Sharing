import { useRef } from 'react';
import { Pause, Play, X, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

export default function TransfersPage() {
  const { transfers, toggleTransfer, cancelTransfer, uploadFile, addToast } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const active  = transfers.filter((t) => t.status === 'active' || t.status === 'in_progress' || t.status === 'uploading' || t.status === 'paused');
  const history = transfers.filter((t) => t.status === 'completed' || t.status === 'failed' || t.status === 'cancelled');

  const handleNewTransfer = () => fileRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => uploadFile(f));
    e.target.value = '';
  };

  return (
    <>
      <input ref={fileRef} type="file" multiple hidden onChange={handleFileChange} />

      <div className="page-header">
        <div>
          <h2>Transfers</h2>
          <p>{active.length} active · {history.length} completed</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleNewTransfer}>
          <Upload size={14} /> New Transfer
        </button>
      </div>

      {/* Active */}
      {active.length > 0 && (
        <section className="glass-card">
          <h3>Active Transfers</h3>
          <div className="list-stack">
            {active.map((t) => (
              <div className="transfer-item" key={t.id}>
                <div className="transfer-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {t.direction === 'upload'
                      ? <Upload size={16} style={{ color: 'var(--accent)' }} />
                      : <Download size={16} style={{ color: 'var(--success)' }} />}
                    <strong>{t.fileName}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className={`method-badge ${t.transferMethod === 'local' ? 'lan' : t.transferMethod === 'webrtc' ? 'webrtc' : t.transferMethod === 'bluetooth' ? 'bt' : 'cloud'}`}>
                      {t.transferMethod}
                    </span>
                    <div className="transfer-controls">
                      <button className="btn-icon" title={t.status === 'paused' ? 'Resume' : 'Pause'} onClick={() => toggleTransfer(t.id)}>
                        {t.status === 'paused' ? <Play size={14} /> : <Pause size={14} />}
                      </button>
                      <button className="btn-icon" title="Cancel" onClick={() => cancelTransfer(t.id)}>
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </div>
                <div className="progress-bar">
                  <span className="progress-fill" style={{ width: `${t.progress}%` }} />
                </div>
                <div className="transfer-meta">
                  <span>{t.speed} → {t.peer}</span>
                  <span>{t.progress}% • {formatBytes(t.fileSize)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {active.length === 0 && history.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: 48 }}>
          <Upload size={48} style={{ color: 'var(--text-muted)', marginBottom: 16, opacity: 0.4 }} />
          <h3 style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-primary)', fontSize: 16 }}>No transfers yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
            Click "New Transfer" to upload a file to the server
          </p>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <section className="glass-card">
          <h3>History</h3>
          <div className="list-stack">
            {history.map((t) => (
              <div className="list-row" key={t.id}>
                <div className="list-row-left">
                  {t.status === 'completed'
                    ? <CheckCircle size={20} style={{ color: 'var(--success)', flexShrink: 0 }} />
                    : <AlertCircle size={20} style={{ color: 'var(--danger)', flexShrink: 0 }} />}
                  <div>
                    <strong style={{ fontSize: 13.5 }}>{t.fileName}</strong>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {formatBytes(t.fileSize)} • {t.transferMethod} • {t.peer}
                    </p>
                  </div>
                </div>
                <span className={`quality-badge ${t.status === 'completed' ? 'excellent' : ''}`}
                      style={t.status !== 'completed' ? { background: 'rgba(239,71,111,0.12)', color: 'var(--danger)' } : {}}>
                  {t.status === 'completed' ? 'Completed' : t.status === 'cancelled' ? 'Cancelled' : 'Failed'}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
