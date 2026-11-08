import React, { useState } from 'react';
import { Link2, X, Clock, Copy, Check, Loader2, Trash2, ExternalLink } from 'lucide-react';

const TTL_OPTIONS = [
  { label: '1 Hour',   seconds: 3600,           desc: 'Expires in 1 hour' },
  { label: '6 Hours',  seconds: 21600,           desc: 'Expires in 6 hours' },
  { label: '24 Hours', seconds: 86400,           desc: 'Expires in 24 hours' },
  { label: '7 Days',   seconds: 7 * 86400,       desc: 'Expires in 7 days' },
];

export function ShareLinkModal({ item, onClose }) {
  const [selectedTTL, setSelectedTTL] = useState(TTL_OPTIONS[0]);
  const [generating, setGenerating] = useState(false);
  const [shareData, setShareData]   = useState(null);
  const [copied, setCopied]         = useState(false);
  const [revoking, setRevoking]     = useState(false);
  const [revoked, setRevoked]       = useState(false);
  const [genError, setGenError]     = useState(null);

  const generate = async () => {
    setGenerating(true);
    setShareData(null);
    setRevoked(false);
    setGenError(null);
    try {
      const res = await fetch('/api/share/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: item.path, expiresIn: selectedTTL.seconds }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate link');
      setShareData(data);
    } catch (err) {
      console.error('Share link error:', err);
      setGenError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const copy = () => {
    navigator.clipboard.writeText(shareData.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const revoke = async () => {
    setRevoking(true);
    try {
      await fetch(`/api/share/${shareData.token}`, { method: 'DELETE' });
      setRevoked(true);
      setShareData(null);
    } finally {
      setRevoking(false);
    }
  };

  const expiryLabel = shareData
    ? new Date(shareData.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
      ' · ' + new Date(shareData.expiresAt).toLocaleDateString()
    : null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#131720',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '28px',
          width: '100%',
          maxWidth: '460px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.75)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(99,102,241,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
              <Link2 className="w-5 h-5" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Share File Link</h3>
              <p style={{ fontSize: '0.68rem', color: '#64748b', marginTop: '2px' }}>Time-limited, file-only access</p>
            </div>
          </div>
          <button onClick={onClose} style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: '#64748b', border: 'none', cursor: 'pointer', lineHeight: 0 }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* File info */}
        <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '12px', padding: '12px 16px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {item.name}
          </div>
          <div style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'monospace' }}>
            {item.formattedSize || '—'}
          </div>
        </div>

        {/* TTL selector */}
        {!shareData && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Clock className="w-3 h-3" /> Link Expiry
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {TTL_OPTIONS.map((opt) => (
                <button
                  key={opt.seconds}
                  onClick={() => setSelectedTTL(opt)}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: `1px solid ${selectedTTL.seconds === opt.seconds ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                    background: selectedTTL.seconds === opt.seconds ? 'rgba(99,102,241,0.18)' : 'rgba(255,255,255,0.04)',
                    color: selectedTTL.seconds === opt.seconds ? '#a5b4fc' : '#94a3b8',
                    fontWeight: selectedTTL.seconds === opt.seconds ? 700 : 500,
                    fontSize: '0.82rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2px',
                  }}
                >
                  <span>{opt.label}</span>
                  <span style={{ fontSize: '0.65rem', opacity: 0.6 }}>{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Generated link */}
        {shareData && !revoked && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.7rem', color: '#34d399' }}>
              <div style={{ width: '7px', height: '7px', borderRadius: '99px', background: '#34d399', animation: 'pulse 2s infinite' }} />
              Active · Expires {expiryLabel}
            </div>

            {/* URL box */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
              <div style={{
                flex: 1, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.3)',
                borderRadius: '12px', padding: '10px 14px', fontFamily: 'monospace',
                fontSize: '0.72rem', color: '#a5b4fc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {shareData.shareUrl}
              </div>
              <button
                onClick={copy}
                style={{
                  padding: '10px 14px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                  background: copied ? 'rgba(52,211,153,0.2)' : 'rgba(99,102,241,0.5)',
                  color: copied ? '#34d399' : '#fff',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '0.78rem', fontWeight: 600, flexShrink: 0,
                }}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            {/* Security note */}
            <div style={{ padding: '10px 14px', borderRadius: '10px', background: 'rgba(99,102,241,0.07)', fontSize: '0.72rem', color: '#94a3b8', lineHeight: '1.55' }}>
              🔒 This link grants <strong style={{ color: '#a5b4fc' }}>download-only access to this single file</strong>. No other files or folders are accessible.
            </div>

            {/* Open + Revoke */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <a
                href={shareData.shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  flex: 1, padding: '9px 16px', borderRadius: '11px', border: 'none',
                  background: 'rgba(255,255,255,0.07)', color: '#e2e8f0',
                  fontSize: '0.78rem', fontWeight: 500, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  textDecoration: 'none',
                }}
              >
                <ExternalLink className="w-3.5 h-3.5" /> Preview Page
              </a>
              <button
                onClick={revoke}
                disabled={revoking}
                style={{
                  padding: '9px 16px', borderRadius: '11px', border: 'none', cursor: revoking ? 'not-allowed' : 'pointer',
                  background: 'rgba(239,68,68,0.12)', color: '#f87171',
                  fontSize: '0.78rem', fontWeight: 500,
                  display: 'flex', alignItems: 'center', gap: '6px',
                }}
              >
                {revoking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Revoke
              </button>
            </div>
          </div>
        )}

        {/* Revoked state */}
        {revoked && (
          <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '0.82rem', textAlign: 'center' }}>
            Link revoked. No one can access this file via the old link.
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
          <button
            onClick={onClose}
            style={{ padding: '9px 20px', borderRadius: '11px', border: 'none', background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: '0.82rem', cursor: 'pointer' }}
          >
            Close
          </button>
          {(!shareData || revoked) && (
            <button
              onClick={generate}
              disabled={generating}
              style={{
                padding: '9px 22px', borderRadius: '11px', border: 'none', cursor: generating ? 'not-allowed' : 'pointer',
                background: generating ? 'rgba(255,255,255,0.08)' : '#6366f1',
                color: generating ? '#64748b' : '#fff',
                fontSize: '0.82rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '7px',
                boxShadow: generating ? 'none' : '0 4px 16px rgba(99,102,241,0.4)',
              }}
            >
              {generating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {generating ? 'Generating…' : revoked ? 'New Link' : 'Generate Link'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
