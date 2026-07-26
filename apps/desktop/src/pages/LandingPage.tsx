import { useRef } from 'react';
import { Folder, Upload, Link2, Shield, Lock, ArrowRight, Zap, Eye, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function LandingPage() {
  const { setPage, uploadFile } = useAppStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((f) => uploadFile(f));
    setPage('dashboard');
  };

  return (
    <div className="vault-landing">
      <input ref={fileRef} type="file" multiple hidden onChange={handleFileChange} />

      {/* Top Navbar */}
      <header className="vault-navbar">
        <div className="vault-logo" onClick={() => setPage('landing')}>
          <div className="logo-icon-badge">
            <Folder size={18} className="logo-icon" />
          </div>
          <span className="logo-text">Vault</span>
        </div>
        <div className="vault-nav-actions">
          <button className="btn-vault-ghost" onClick={() => setPage('dashboard')}>
            Sign in
          </button>
          <button className="btn-vault-primary" onClick={() => setPage('dashboard')}>
            Get started
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="vault-hero-section">
        <div className="vault-hero-content">
          {/* Eyebrow Pill Badge */}
          <div className="eyebrow-pill">
            <span className="pill-dot"></span>
            <span>Private by default</span>
          </div>

          {/* Headline */}
          <h1 className="hero-headline">
            Your files. <span className="text-emerald">Your terms.</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Vault is a calm, precise place to store and share files. Drop them in, organize with
            folders and tags, then share with expiring links, passwords, and download limits —
            or keep everything to yourself.
          </p>

          {/* CTA Action Buttons */}
          <div className="hero-ctas">
            <button className="btn-vault-primary btn-lg" onClick={handleUploadClick}>
              <span>Create your vault</span>
              <ArrowRight size={18} />
            </button>
            <button className="btn-vault-outline btn-lg" onClick={() => setPage('dashboard')}>
              Sign in
            </button>
          </div>

          {/* Feature Grid Cards */}
          <div className="vault-feature-grid">
            <div className="feature-card" onClick={handleUploadClick}>
              <div className="card-icon-badge">
                <Upload size={20} />
              </div>
              <h3>Drag, drop, done</h3>
              <p>Instant file drops with zero-knowledge WebCrypto E2EE and automatic high-speed transport selection (LAN, WebRTC, Cloud).</p>
            </div>

            <div className="feature-card" onClick={() => setPage('dashboard')}>
              <div className="card-icon-badge">
                <Folder size={20} />
              </div>
              <h3>Real organization...</h3>
              <p>Nested folders, tags, and intelligent search to keep your personal vault organized and clutter-free.</p>
            </div>

            <div className="feature-card" onClick={() => setPage('links')}>
              <div className="card-icon-badge">
                <Link2 size={20} />
              </div>
              <h3>Precise sharing</h3>
              <p>Share with expiring links, PBKDF2 password protection, download caps, and instant DMCA abuse quarantine.</p>
            </div>
          </div>

          {/* Security & Capability Badges */}
          <div className="security-trust-bar">
            <div className="trust-item">
              <Shield size={16} className="trust-icon" />
              <span>Zero-Knowledge E2EE</span>
            </div>
            <div className="trust-item">
              <Zap size={16} className="trust-icon" />
              <span>Launch-Blocking Virus Scan</span>
            </div>
            <div className="trust-item">
              <CheckCircle2 size={16} className="trust-icon" />
              <span>Expiring Links & Passwords</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
