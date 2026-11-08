import React, { useState } from 'react';
import {
  Anchor, Home, HardDrive, UploadCloud, FolderPlus,
  QrCode, Grid, List, RefreshCw, Search, X, Menu,
  Shield, LogOut, Lock,
} from 'lucide-react';
import { useFile } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';

export function TopCapsuleDock({ onToggleSidebar }) {
  const {
    navigateTo, viewMode, setViewMode,
    searchQuery, setSearchQuery, performSearch,
    setShowUploadModal, setShowMkdirModal, setShowConnectionModal,
    refreshCurrentDir, loading,
  } = useFile();

  const { role, logout } = useAuth();
  const [showSearch, setShowSearch] = useState(false);

  const isMaster = role === 'master';

  return (
    <header style={{ marginBottom: '4px' }}>
      <div className="capsule-bar flex items-center justify-between gap-3" style={{ padding: '4px 0' }}>

        {/* ── Brand + Mobile Menu ────── */}
        <div className="flex items-center gap-2">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigateTo(isMaster ? 'home' : 'E:\\')}
            className="capsule-btn capsule-btn-active font-mono font-bold tracking-widest uppercase"
            style={{ padding: '9px 20px', fontSize: '0.75rem' }}
          >
            <Anchor className="w-4 h-4" />
            GRAPNEL
          </button>
        </div>

        {/* ── Centre Nav Pills ──────── */}
        <div className="hidden lg:flex items-center gap-2">
          {isMaster ? (
            <button onClick={() => navigateTo('home')} className="capsule-btn">
              <Home className="w-3.5 h-3.5 text-rose-400" />
              Home
            </button>
          ) : (
            <button onClick={() => navigateTo('E:\\')} className="capsule-btn">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              E: Drive
            </button>
          )}

          <button onClick={() => navigateTo('drives')} className="capsule-btn">
            <HardDrive className="w-3.5 h-3.5 text-purple-400" />
            Drives
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="capsule-btn"
            style={{ background: 'rgba(255,69,69,0.15)', color: '#fca5a5' }}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            Upload
          </button>

          <button onClick={() => setShowMkdirModal(true)} className="capsule-btn">
            <FolderPlus className="w-3.5 h-3.5 text-cyan-400" />
            New Folder
          </button>

          <button
            onClick={() => setShowConnectionModal(true)}
            className="capsule-btn"
            style={{ color: '#c4b5fd' }}
          >
            <QrCode className="w-3.5 h-3.5 text-purple-400" />
            Connect Phone
          </button>
        </div>

        {/* ── Right Controls: Search, View, Role & Logout ────────── */}
        <div className="flex items-center gap-2">
          {/* Search */}
          {showSearch ? (
            <form
              onSubmit={(e) => { e.preventDefault(); performSearch(searchQuery); }}
              className="relative flex items-center"
            >
              <input
                type="text"
                placeholder="Search files…"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); performSearch(e.target.value); }}
                autoFocus
                className="rounded-full text-white text-xs outline-none font-mono"
                style={{
                  background: '#0f1117',
                  border: '1px solid rgba(255,69,69,0.35)',
                  padding: '8px 36px 8px 16px',
                  width: '220px',
                }}
              />
              <button
                type="button"
                onClick={() => { setShowSearch(false); setSearchQuery(''); performSearch(''); }}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <button onClick={() => setShowSearch(true)} className="capsule-btn" style={{ padding: '9px 12px' }}>
              <Search className="w-4 h-4 text-slate-300" />
            </button>
          )}

          {/* View Toggle */}
          <div
            className="flex items-center"
            style={{ background: '#0f1117', borderRadius: '9999px', padding: '4px', gap: '2px' }}
          >
            {[
              { mode: 'grid', Icon: Grid },
              { mode: 'list', Icon: List },
            ].map(({ mode, Icon }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className="transition-all"
                style={{
                  padding: '6px 8px',
                  borderRadius: '9999px',
                  background: viewMode === mode ? '#ff4545' : 'transparent',
                  color: viewMode === mode ? '#fff' : '#94a3b8',
                }}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button
            onClick={refreshCurrentDir}
            className={`p-2 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all ${loading ? 'animate-spin text-rose-400' : ''}`}
            title="Refresh Directory"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Role Status Badge */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold"
            style={{
              background: isMaster ? 'rgba(255,69,69,0.12)' : 'rgba(34,211,238,0.12)',
              border: `1px solid ${isMaster ? 'rgba(255,69,69,0.3)' : 'rgba(34,211,238,0.3)'}`,
              color: isMaster ? '#fca5a5' : '#67e8f9',
            }}
            title={isMaster ? 'Full access to C:, D:, E: drives' : 'Standard access: E: drive only'}
          >
            {isMaster ? <Shield className="w-3.5 h-3.5 text-rose-400" /> : <HardDrive className="w-3.5 h-3.5 text-cyan-400" />}
            <span>{isMaster ? 'Master' : 'Guest (Home & E:)'}</span>
          </div>

          {/* Lock / Logout Button */}
          <button
            onClick={logout}
            className="p-2 rounded-full text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
            title="Lock & Logout Server"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
