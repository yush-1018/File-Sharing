import { Shield, RefreshCw, HardDrive, Palette, Info, User } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function SettingsPage() {
  const {
    userName, autoResume, chunkSize, theme,
    toggleAutoResume, setChunkSize, setTheme, setUserName,
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
            <div className="setting-desc">Version 1.0.0 • Production Ready</div>
          </div>
        </div>
      </section>
    </>
  );
}
