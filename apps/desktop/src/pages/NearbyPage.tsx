import { useRef } from 'react';
import { Laptop, Smartphone, Tablet, Send, Signal } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function NearbyPage() {
  const { devices, refreshDevices, addToast, uploadFile } = useAppStore();
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const handleSendTo = (deviceName: string) => {
    addToast(`Ready to send to ${deviceName} — pick a file`, 'info');
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h2>Nearby Devices</h2>
          <p>Devices discovered on your local network and nearby</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => { refreshDevices(); addToast('Rescanning...', 'info'); }}>
          <Signal size={14} /> Rescan
        </button>
      </div>

      {/* Radar */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div className="radar-container">
          <div className="radar-ring" />
          <div className="radar-ring" />
          <div className="radar-ring" />
          <div className="radar-center" />
        </div>
      </div>

      {/* Device list */}
      <div className="list-stack">
        {devices.length === 0 && (
          <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
            <p>No devices discovered yet. Make sure the server is running.</p>
          </div>
        )}
        {devices.map((d) => {
          const Icon = d.deviceType === 'desktop' ? Laptop : d.deviceType === 'mobile' ? Smartphone : Tablet;
          const qualityLabel = d.quality >= 0.9 ? 'excellent' : d.quality >= 0.7 ? 'good' : 'fair';

          return (
            <div className="list-row" key={d.id} style={{ opacity: d.online ? 1 : 0.5 }}>
              <div className="list-row-left">
                <div className={`device-icon ${d.deviceType}`}>
                  <Icon size={20} />
                </div>
                <div>
                  <strong style={{ fontSize: 14 }}>{d.name}</strong>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    {d.platform} • {d.distance}
                    {!d.online && ' • Offline'}
                  </p>
                </div>
              </div>
              <div className="list-row-right">
                <span className={`quality-badge ${qualityLabel}`}>
                  {Math.round(d.quality * 100)}% signal
                </span>
                <span className="speed-text">{d.speedMbps} Mbps</span>
                <button
                  className="btn btn-primary btn-sm"
                  disabled={!d.online}
                  onClick={() => handleSendTo(d.name)}
                >
                  <Send size={13} /> Send
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
