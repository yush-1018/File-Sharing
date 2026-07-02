import { useRef } from 'react';
import { Copy, Trash2, Link2, Lock, ExternalLink, Plus, Eye, Download } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

function formatBytes(bytes: number): string {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(1)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(0)} KB`;
  return `${bytes} B`;
}

function timeUntil(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.ceil(diff / 86400000);
  return `${days} day${days > 1 ? 's' : ''}`;
}

export default function CloudLinksPage() {
  const { cloudLinks, copyLink, revokeLink, createLink, addToast } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const activeLinks  = cloudLinks.filter((l) => l.active);
  const expiredLinks = cloudLinks.filter((l) => !l.active);

  const handleNewLink = () => fileRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    createLink(files[0]);
    e.target.value = '';
  };

  return (
    <>
      <input ref={fileRef} type="file" hidden onChange={handleFileChange} />

      <div className="page-header">
        <div>
          <h2>Cloud Links</h2>
          <p>{activeLinks.length} active links · {expiredLinks.length} expired</p>
        </div>
        <button className="btn btn-primary btn-sm" onClick={handleNewLink}>
          <Plus size={14} /> New Link
        </button>
      </div>

      {/* Active */}
      {activeLinks.length > 0 && (
        <section className="glass-card">
          <h3>Active Links</h3>
          <div className="list-stack">
            {activeLinks.map((link) => (
              <div className="link-card" key={link.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  <div className="device-icon desktop" style={{ flexShrink: 0 }}>
                    <Link2 size={20} />
                  </div>
                  <div className="link-info">
                    <div className="link-name">
                      {link.fileName}
                      {link.password && <Lock size={12} style={{ marginLeft: 6, color: 'var(--warning)', verticalAlign: 'middle' }} />}
                    </div>
                    <div className="link-url">{link.url}</div>
                    <div className="link-stats">
                      <span><Eye size={11} style={{ verticalAlign: 'middle' }} /> {link.views} views</span>
                      <span><Download size={11} style={{ verticalAlign: 'middle' }} /> {link.downloads} downloads</span>
                      <span>{formatBytes(link.fileSize)}</span>
                      <span>Expires in {timeUntil(link.expiresAt)}</span>
                    </div>
                  </div>
                </div>
                <div className="link-actions">
                  <button className="btn-icon" title="Copy link" onClick={() => copyLink(link.id)}>
                    <Copy size={14} />
                  </button>
                  <button className="btn-icon" title="Open in browser" onClick={() => window.open(link.url, '_blank')}>
                    <ExternalLink size={14} />
                  </button>
                  <button className="btn-icon" title="Revoke" onClick={() => revokeLink(link.id)}
                          style={{ borderColor: 'rgba(239,71,111,0.2)', color: 'var(--danger)' }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {activeLinks.length === 0 && expiredLinks.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center', padding: 48 }}>
          <Link2 size={48} style={{ color: 'var(--text-muted)', marginBottom: 16, opacity: 0.4 }} />
          <h3 style={{ textTransform: 'none', letterSpacing: 'normal', color: 'var(--text-primary)', fontSize: 16 }}>No cloud links yet</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 8 }}>
            Click "New Link" to upload a file and create a shareable download link
          </p>
        </div>
      )}

      {/* Expired */}
      {expiredLinks.length > 0 && (
        <section className="glass-card" style={{ opacity: 0.6 }}>
          <h3>Revoked</h3>
          <div className="list-stack">
            {expiredLinks.map((link) => (
              <div className="link-card" key={link.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  <div className="device-icon desktop" style={{ opacity: 0.5, flexShrink: 0 }}>
                    <Link2 size={20} />
                  </div>
                  <div className="link-info">
                    <div className="link-name">{link.fileName}</div>
                    <div className="link-stats">
                      <span>{link.downloads} downloads</span>
                      <span>{formatBytes(link.fileSize)}</span>
                      <span style={{ color: 'var(--danger)' }}>Revoked</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
