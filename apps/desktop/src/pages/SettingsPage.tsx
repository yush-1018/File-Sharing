import { Shield, RefreshCw, HardDrive, Palette, Info, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function SettingsPage() {
  const {
    userName, e2eEnabled, autoResume, chunkSize, theme,
    toggleE2E, toggleAutoResume, setChunkSize, setTheme, setUserName,
  } = useAppStore();

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p>Configure your LinkDrop experience</p>
        </div>
      </div>

      {/* Profile */}
      <section className="settings-section">
        <h3><User size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Profile</h3>
        <div className="setting-row">
          <div>
            <div className="setting-label">Display name</div>
            <div className="setting-desc">How you appear to other devices</div>
          </div>
          <input
            className="input"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            style={{ width: 200 }}
          />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Device name</div>
            <div className="setting-desc">This device's identity on the network</div>
          </div>
          <input className="input" defaultValue="My Workstation" style={{ width: 200 }} />
        </div>
      </section>

      {/* Security */}
      <section className="settings-section">
        <h3><Shield size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Security</h3>
        <div className="setting-row">
          <div>
            <div className="setting-label">End-to-end encryption</div>
            <div className="setting-desc">Encrypt all file transfers with AES-256</div>
          </div>
          <button className={`toggle ${e2eEnabled ? 'on' : ''}`} onClick={toggleE2E} />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Require PIN for incoming transfers</div>
            <div className="setting-desc">Ask for a 4-digit PIN before accepting files</div>
          </div>
          <button className="toggle" />
        </div>
      </section>

      {/* Transfer */}
      <section className="settings-section">
        <h3><RefreshCw size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Transfer Preferences</h3>
        <div className="setting-row">
          <div>
            <div className="setting-label">Auto-resume on reconnect</div>
            <div className="setting-desc">Automatically resume paused transfers when connection is restored</div>
          </div>
          <button className={`toggle ${autoResume ? 'on' : ''}`} onClick={toggleAutoResume} />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Default chunk size</div>
            <div className="setting-desc">Larger chunks are faster but use more memory</div>
          </div>
          <select className="select" value={chunkSize} onChange={(e) => setChunkSize(e.target.value)}>
            <option>8 MB</option>
            <option>16 MB</option>
            <option>32 MB</option>
            <option>64 MB</option>
          </select>
        </div>
      </section>

      {/* Storage */}
      <section className="settings-section">
        <h3><HardDrive size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Cloud Storage</h3>
        <div className="setting-row">
          <div>
            <div className="setting-label">S3 endpoint</div>
            <div className="setting-desc">MinIO / Cloudflare R2 / AWS S3 endpoint URL</div>
          </div>
          <input className="input" defaultValue="http://localhost:9000" style={{ width: 220 }} />
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Bucket name</div>
            <div className="setting-desc">Object storage bucket for cloud relay</div>
          </div>
          <input className="input" defaultValue="linkdrop" style={{ width: 220 }} />
        </div>
      </section>

      {/* Appearance */}
      <section className="settings-section">
        <h3><Palette size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Appearance</h3>
        <div className="setting-row">
          <div>
            <div className="setting-label">Theme</div>
            <div className="setting-desc">Color scheme for the interface</div>
          </div>
          <select className="select" value={theme} onChange={(e) => setTheme(e.target.value)}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </select>
        </div>
      </section>

      {/* About */}
      <section className="settings-section">
        <h3><Info size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />About</h3>
        <div className="setting-row">
          <div>
            <div className="setting-label">LinkDrop</div>
            <div className="setting-desc">Version 0.1.0 • Tauri + React + Vite</div>
          </div>
        </div>
        <div className="setting-row">
          <div>
            <div className="setting-label">Server</div>
            <div className="setting-desc">Node.js + Express + Socket.IO + MongoDB</div>
          </div>
        </div>
      </section>
    </>
  );
}
