import React from 'react';
import {
  Home, Download, FileText, Image, Film, Music, Monitor,
  HardDrive, Star, Server, Folder, X, Radio, Lock,
} from 'lucide-react';
import { useFile } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';

const iconMap = { Home, Download, FileText, Image, Film, Music, Monitor };

export function Sidebar({ isOpen, onClose }) {
  const { navigateTo, currentPath, breadcrumbs, quickAccess, systemStats, favorites, showToast } = useFile();
  const { role } = useAuth();
  const isMaster = role === 'master';

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-md z-40"
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col bg-transparent transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
        style={{ width: '272px', padding: '0 4px' }}
      >
        {/* ── Scrollable content area ──────────────── */}
        <div className="flex-1 overflow-y-auto no-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Mobile close row */}
          <div className="flex items-center justify-between lg:hidden" style={{ paddingBottom: '12px' }}>
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">Menu</span>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── Section header ─────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <span className="font-mono font-bold text-rose-500" style={{ fontSize: '1.5rem' }}>01</span>
            <h2 className="font-bold text-white" style={{ fontSize: '1.3rem', lineHeight: '1.3' }}>
              Storage & Drives Hub
            </h2>
            <p className="text-slate-400" style={{ fontSize: '0.72rem', lineHeight: '1.5' }}>
              {isMaster
                ? 'Access host drives, user home folders & quick bookmarks.'
                : 'Standard access enabled: E: drive accessible.'}
            </p>
          </div>

          {/* ── Quick Access (Reordered Above Drives) ─ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span className="text-slate-400 font-mono font-bold uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>
              Quick Access
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {quickAccess.map((item) => {
                const Icon = iconMap[item.icon] || Folder;
                const active = currentPath === item.path;
                const isLocked = !isMaster && item.isLocked;

                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      if (isLocked) {
                        showToast('Master password required to access this folder', 'danger');
                        return;
                      }
                      navigateTo(item.path);
                      onClose?.();
                    }}
                    className="flex flex-col items-center justify-center transition-all relative"
                    style={{
                      padding: '14px 10px',
                      borderRadius: '14px',
                      gap: '8px',
                      background: active ? 'rgba(255,69,69,0.18)' : 'rgba(255,255,255,0.05)',
                      color: isLocked ? '#64748b' : active ? '#fca5a5' : '#94a3b8',
                      opacity: isLocked ? 0.65 : 1,
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => {
                      if (!active && !isLocked) e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                    }}
                    onMouseLeave={e => {
                      if (!active && !isLocked) e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    }}
                  >
                    {isLocked ? (
                      <Lock className="w-5 h-5 text-slate-500" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                    <span className="font-medium text-center truncate w-full flex items-center justify-center gap-1" style={{ fontSize: '0.73rem' }}>
                      {item.name}
                      {isLocked && <span style={{ fontSize: '0.6rem' }}>🔒</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Storage Drives ─────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-mono font-bold uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>
                Storage Drives
              </span>
              <button
                onClick={() => { navigateTo('drives'); onClose?.(); }}
                className="text-rose-400 hover:underline font-mono"
                style={{ fontSize: '0.7rem' }}
              >
                View All
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {systemStats?.drives?.map((drive) => {
                const active = currentPath === drive.path;
                const isLocked = !isMaster && (drive.isLocked || drive.name.toUpperCase().startsWith('C') || drive.name.toUpperCase().startsWith('D'));

                return (
                  <button
                    key={drive.path}
                    onClick={() => {
                      if (isLocked) {
                        showToast(`Master password required to unlock drive ${drive.name}`, 'danger');
                        return;
                      }
                      navigateTo(drive.path);
                      onClose?.();
                    }}
                    className="w-full text-left flex items-center justify-between transition-all"
                    style={{
                      padding: '10px 14px',
                      borderRadius: '14px',
                      background: active
                        ? 'linear-gradient(to right, rgba(255,69,69,0.22), rgba(220,38,38,0.08))'
                        : isLocked
                        ? 'rgba(255,255,255,0.02)'
                        : 'transparent',
                      color: isLocked ? '#64748b' : active ? '#fca5a5' : '#94a3b8',
                      opacity: isLocked ? 0.7 : 1,
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                    }}
                    onMouseEnter={e => {
                      if (!active && !isLocked) e.currentTarget.style.background = 'linear-gradient(to right, rgba(255,69,69,0.15), rgba(220,38,38,0.04))';
                    }}
                    onMouseLeave={e => {
                      if (!active && !isLocked) e.currentTarget.style.background = 'transparent';
                    }}
                  >
                    <div className="flex items-center" style={{ gap: '12px' }}>
                      <div
                        className="flex items-center justify-center flex-shrink-0"
                        style={{
                          width: '36px', height: '36px', borderRadius: '10px',
                          background: isLocked ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.35)',
                          color: isLocked ? '#64748b' : '#c084fc',
                        }}
                      >
                        {isLocked ? <Lock className="w-4 h-4" /> : <HardDrive className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-semibold flex items-center gap-1.5" style={{ fontSize: '0.82rem', color: isLocked ? '#94a3b8' : '#fff' }}>
                          <span>{drive.name}</span>
                          {isLocked && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Locked
                            </span>
                          )}
                        </div>
                        {drive.formattedFree && (
                          <div className="text-slate-400 font-mono" style={{ fontSize: '0.65rem', marginTop: '2px' }}>
                            {drive.formattedFree} free
                          </div>
                        )}
                      </div>
                    </div>
                    {active && <span style={{ width: '8px', height: '8px', borderRadius: '99px', background: '#ff4545', flexShrink: 0 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Favorites ──────────────────────────── */}
          {favorites.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <span className="text-slate-400 font-mono font-bold uppercase tracking-wider" style={{ fontSize: '0.65rem' }}>
                Favorites
              </span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {favorites.map((fav) => (
                  <button
                    key={fav.path}
                    onClick={() => { navigateTo(fav.path); onClose?.(); }}
                    className="flex items-center text-slate-300 hover:text-white transition-colors"
                    style={{ gap: '10px', padding: '9px 12px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', fontSize: '0.78rem' }}
                  >
                    <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="truncate">{fav.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* ── Host Info Footer ────────────────────── */}
        <div style={{ marginTop: '28px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div
            style={{
              background: 'rgba(255,255,255,0.04)',
              borderRadius: '14px',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center text-white font-semibold" style={{ gap: '8px', fontSize: '0.78rem' }}>
                <Server className="w-4 h-4 text-rose-400" />
                <span className="truncate" style={{ maxWidth: '130px' }}>{systemStats?.hostname || 'Host PC'}</span>
              </div>
              <span
                className="flex items-center text-emerald-400 font-mono"
                style={{ gap: '5px', fontSize: '0.62rem', background: 'rgba(16,185,129,0.08)', padding: '3px 9px', borderRadius: '99px' }}
              >
                <Radio className="w-3 h-3 animate-pulse" />
                ONLINE
              </span>
            </div>
            <div className="flex items-center justify-between font-mono text-slate-400" style={{ fontSize: '0.7rem' }}>
              <span>LAN IP:</span>
              <span className="text-rose-400 font-semibold">
                {systemStats?.primaryUrl?.replace('http://', '').replace(':3000', '') || '127.0.0.1'}
              </span>
            </div>
          </div>

          {/* Breadcrumb depth tracker */}
          <div className="flex items-center font-mono text-slate-600" style={{ gap: '16px', fontSize: '0.7rem' }}>
            {breadcrumbs.slice(0, 4).map((crumb, idx) => (
              <div
                key={idx}
                onClick={() => navigateTo(crumb.path)}
                className="cursor-pointer hover:text-white transition-colors relative pb-1"
                style={{ color: idx === breadcrumbs.length - 1 ? '#ff4545' : undefined, fontWeight: idx === breadcrumbs.length - 1 ? 700 : 400 }}
              >
                0{idx + 1}
                {idx === breadcrumbs.length - 1 && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: '#ff4545', borderRadius: '99px' }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
