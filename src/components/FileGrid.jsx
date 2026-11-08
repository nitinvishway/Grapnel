import React from 'react';
import { FileCard } from './FileCard';
import { useFile } from '../context/FileContext';
import { useAuth } from '../context/AuthContext';
import { FolderOpen, ArrowLeft, Search, UploadCloud, Loader2, HardDrive, FolderPlus } from 'lucide-react';

export function FileGrid() {
  const {
    items, loading, error, viewMode, isSearching,
    searchResults, searchQuery, parentPath,
    navigateTo, setShowUploadModal, setShowMkdirModal, isDrivesView,
  } = useFile();
  const { role } = useAuth();
  const isMaster = role === 'master';

  const displayItems = isSearching ? searchResults : items;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center" style={{ minHeight: '40vh', gap: '12px' }}>
        <div
          className="animate-pulse text-rose-500"
          style={{ width: '52px', height: '52px', background: 'rgba(255,69,69,0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Loader2 className="w-6 h-6 animate-spin" />
        </div>
        <p className="text-slate-400 text-sm">Reading file system…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center text-center" style={{ minHeight: '40vh', gap: '12px', padding: '32px' }}>
        <div style={{ padding: '16px', background: 'rgba(255,69,69,0.1)', borderRadius: '16px', color: '#f87171' }}>
          <FolderOpen className="w-10 h-10" />
        </div>
        <h3 className="text-white font-bold text-lg">Unable to Access Path</h3>
        <p className="text-slate-400 text-xs" style={{ maxWidth: '360px' }}>{error}</p>
        <button
          onClick={() => navigateTo(isMaster ? 'home' : 'E:\\')}
          className="btn-coral"
          style={{ marginTop: '8px' }}
        >
          {isMaster ? 'Return to Home Folder' : 'Return to E: Drive'}
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>

      {/* ── Header Row ──────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between" style={{ gap: '12px' }}>
        <div>
          <h1 className="font-bold text-white" style={{ fontSize: '1.25rem', letterSpacing: '-0.02em' }}>
            {isSearching
              ? `Results for "${searchQuery}"`
              : isDrivesView
              ? 'Storage Drives'
              : 'Current Directory'}
          </h1>
          <p className="text-slate-400" style={{ fontSize: '0.72rem', marginTop: '3px' }}>
            {isSearching
              ? `${displayItems.length} match${displayItems.length !== 1 ? 'es' : ''}`
              : 'Select a file to preview, download, or stream over LAN.'}
          </p>
        </div>

        <span
          className="font-mono font-semibold text-rose-400"
          style={{ fontSize: '0.72rem', background: 'rgba(255,69,69,0.08)', padding: '5px 14px', borderRadius: '99px', flexShrink: 0 }}
        >
          {displayItems.length} {displayItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* ── Empty State ─────────────────────── */}
      {displayItems.length === 0 && (
        <div
          className="tile-card flex flex-col items-center justify-center text-center"
          style={{ minHeight: '38vh', padding: '48px 24px', gap: '12px' }}
        >
          <div style={{ width: '52px', height: '52px', background: 'rgba(15,17,23,0.9)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff4545' }}>
            {isSearching ? <Search className="w-6 h-6" /> : <FolderOpen className="w-6 h-6" />}
          </div>
          <h3 className="text-white font-semibold">{isSearching ? 'No Results' : 'Folder is Empty'}</h3>
          <p className="text-slate-400" style={{ fontSize: '0.75rem', maxWidth: '320px' }}>
            {isSearching
              ? `Nothing matched "${searchQuery}".`
              : 'Upload files or create a folder to get started.'}
          </p>
          {!isSearching && (
            <div className="flex items-center" style={{ gap: '10px', marginTop: '8px' }}>
              <button onClick={() => setShowUploadModal(true)} className="btn-coral">
                <UploadCloud className="w-4 h-4" /> Upload Files
              </button>
              <button onClick={() => setShowMkdirModal(true)} className="btn-slate">
                <FolderPlus className="w-4 h-4 text-cyan-400" /> New Folder
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── File Grid ───────────────────────── */}
      {displayItems.length > 0 && (
        <div
          style={viewMode === 'grid' ? {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
            gap: '12px',
          } : {
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {displayItems.map((item) => (
            <FileCard key={item.path} item={item} viewMode={viewMode} />
          ))}
        </div>
      )}

      {/* ── Bottom Action Bar ───────────────── */}
      <div className="flex items-center justify-between" style={{ paddingTop: '16px' }}>
        {parentPath && !isSearching ? (
          <button onClick={() => navigateTo(parentPath)} className="btn-slate">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        ) : (
          <button onClick={() => navigateTo('drives')} className="btn-slate">
            <HardDrive className="w-4 h-4 text-purple-400" /> Drives
          </button>
        )}
        <button onClick={() => setShowUploadModal(true)} className="btn-coral">
          <UploadCloud className="w-4 h-4" /> Upload Files
        </button>
      </div>

    </div>
  );
}
