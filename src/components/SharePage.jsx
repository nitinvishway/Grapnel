import React, { useEffect, useState } from 'react';
import { Download, Anchor, AlertTriangle, Clock, FileText, Loader2, CheckCircle2 } from 'lucide-react';

function timeRemaining(expiresAt) {
  const ms = expiresAt - Date.now();
  if (ms <= 0) return 'Expired';
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}h ${m}m`;
}

export function SharePage({ token }) {
  const [info, setInfo]       = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState('');
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    fetch(`/api/share/${token}/info`)
      .then((r) => {
        if (!r.ok) return r.json().then((e) => { throw new Error(e.error || 'Link not found'); });
        return r.json();
      })
      .then(setInfo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  // Live countdown
  useEffect(() => {
    if (!info?.expiresAt) return;
    const id = setInterval(() => {
      const remaining = timeRemaining(info.expiresAt);
      setCountdown(remaining);
      if (remaining === 'Expired') clearInterval(id);
    }, 1000);
    setCountdown(timeRemaining(info.expiresAt));
    return () => clearInterval(id);
  }, [info]);

  const handleDownload = () => {
    window.location.href = `/api/share/${token}/download`;
    setDownloaded(true);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0c10',
      backgroundImage: 'radial-gradient(ellipse at 20% 20%, rgba(99,102,241,0.06) 0%, transparent 55%), radial-gradient(ellipse at 80% 80%, rgba(255,69,69,0.04) 0%, transparent 55%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Brand bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px', color: '#ff4545' }}>
        <Anchor className="w-5 h-5" />
        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '0.85rem', letterSpacing: '0.18em', textTransform: 'uppercase' }}>GRAPNEL</span>
        <span style={{ color: '#334155', fontSize: '0.7rem', fontWeight: 400, marginLeft: '4px' }}>/ Secure File Share</span>
      </div>

      {/* Card */}
      <div style={{
        background: '#131720',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '20px',
        padding: '36px 32px',
        width: '100%',
        maxWidth: '440px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '20px 0' }}>
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Validating link…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', padding: '10px 0', textAlign: 'center' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f87171' }}>
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>Link Not Found</h2>
            <p style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: '1.6' }}>{error}</p>
            <p style={{ color: '#475569', fontSize: '0.72rem' }}>This link may have expired or been revoked by the owner.</p>
          </div>
        )}

        {/* Success */}
        {info && (
          <>
            {/* File icon + info */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', paddingBottom: '4px' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '18px', background: 'rgba(99,102,241,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                <FileText className="w-8 h-8" />
              </div>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', textAlign: 'center', wordBreak: 'break-all' }}>
                {info.filename}
              </h2>
              <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#64748b', background: 'rgba(255,255,255,0.05)', padding: '3px 10px', borderRadius: '99px' }}>
                {info.fileSize}
              </span>
            </div>

            {/* Expiry badge */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              padding: '10px 16px', borderRadius: '12px',
              background: countdown === 'Expired' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.08)',
              color: countdown === 'Expired' ? '#f87171' : '#34d399',
              fontSize: '0.78rem', fontWeight: 600,
            }}>
              <Clock className="w-4 h-4" />
              {countdown === 'Expired' ? 'This link has expired' : `Expires in ${countdown}`}
            </div>

            {/* Download button */}
            {countdown !== 'Expired' && (
              <button
                onClick={handleDownload}
                style={{
                  padding: '14px 24px', borderRadius: '14px', border: 'none', cursor: 'pointer',
                  background: downloaded ? 'rgba(52,211,153,0.2)' : '#6366f1',
                  color: downloaded ? '#34d399' : '#fff',
                  fontSize: '0.9rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: downloaded ? 'none' : '0 6px 24px rgba(99,102,241,0.45)',
                  transition: 'all 0.2s',
                }}
              >
                {downloaded
                  ? <><CheckCircle2 className="w-5 h-5" /> Download Started</>
                  : <><Download className="w-5 h-5" /> Download File</>
                }
              </button>
            )}

            {/* Security note */}
            <p style={{ color: '#334155', fontSize: '0.68rem', textAlign: 'center', lineHeight: '1.6' }}>
              🔒 This is a secure, single-file link shared via Grapnel. You can only access this specific file — no folders or other content.
            </p>
          </>
        )}
      </div>

      <p style={{ color: '#1e293b', fontSize: '0.65rem', marginTop: '28px' }}>
        Powered by Grapnel · LAN File Server
      </p>
    </div>
  );
}
