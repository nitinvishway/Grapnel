import React, { useState } from 'react';
import { QrCode, X, Copy, Wifi, Smartphone, Check } from 'lucide-react';
import { useFile } from '../context/FileContext';

export function ConnectionModal() {
  const { showConnectionModal, setShowConnectionModal, systemStats, showToast } = useFile();
  const [copiedUrl, setCopiedUrl] = useState(null);

  if (!showConnectionModal) return null;

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    showToast('Connection URL copied!', 'success');
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const close = () => setShowConnectionModal(false);

  return (
    <div className="modal-overlay" onClick={close}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#131720',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '28px',
          width: '100%',
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '22px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.75)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(168,85,247,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a855f7' }}>
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Connect a Device</h3>
          </div>
          <button
            onClick={close}
            style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: '#64748b', border: 'none', cursor: 'pointer', lineHeight: 0 }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* QR Code */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <p style={{ fontSize: '0.78rem', color: '#94a3b8', textAlign: 'center', lineHeight: '1.6' }}>
            Scan with your phone camera to open Grapnel over Wi-Fi
          </p>
          {systemStats?.qrDataUrl ? (
            <div style={{ padding: '16px', background: '#fff', borderRadius: '18px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
              <img src={systemStats.qrDataUrl} alt="LAN QR Code" style={{ width: '180px', height: '180px', display: 'block' }} />
            </div>
          ) : (
            <div style={{ width: '180px', height: '180px', background: 'rgba(255,255,255,0.04)', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <QrCode className="w-10 h-10 text-slate-600" />
            </div>
          )}
        </div>

        {/* IP Address List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            Active Connections ({systemStats?.ipAddresses?.length || 0})
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
            {systemStats?.ipAddresses?.map((item, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', borderRadius: '12px',
                  background: 'rgba(255,255,255,0.04)', gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <Wifi className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                  <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.url}
                  </span>
                </div>
                <button
                  onClick={() => copyUrl(item.url)}
                  style={{
                    padding: '5px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: copiedUrl === item.url ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.07)',
                    color: copiedUrl === item.url ? '#10b981' : '#94a3b8',
                    lineHeight: 0, flexShrink: 0,
                  }}
                >
                  {copiedUrl === item.url ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div style={{ padding: '12px 16px', borderRadius: '12px', background: 'rgba(168,85,247,0.08)', fontSize: '0.75rem', color: '#c4b5fd', lineHeight: '1.6' }}>
          <strong>Tip:</strong> Make sure your phone is on the same Wi-Fi network as this PC.
        </div>
      </div>
    </div>
  );
}
