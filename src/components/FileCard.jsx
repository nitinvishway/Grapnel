import React, { useState } from 'react';
import {
  Folder, File, Image, Film, Music, FileCode, FileText,
  FileSpreadsheet, Archive, HardDrive,
  MoreVertical, Download, Eye, Trash2, Edit2, Star, Copy, CheckCircle2, Link2, Lock,
} from 'lucide-react';
import { useFile } from '../context/FileContext';
import { ShareLinkModal } from './ShareLinkModal';

const categoryIconMap = {
  directory: Folder, drive: HardDrive, image: Image, video: Film,
  audio: Music, code: FileCode, pdf: FileText, document: FileText,
  spreadsheet: FileSpreadsheet, archive: Archive, file: File,
};

const categoryColorMap = {
  directory: 'text-amber-400', drive: 'text-purple-400', image: 'text-emerald-400',
  video: 'text-rose-400', audio: 'text-cyan-400', code: 'text-blue-400',
  pdf: 'text-red-400', document: 'text-indigo-400', spreadsheet: 'text-green-400',
  archive: 'text-amber-500', file: 'text-slate-400',
};

const ContextMenu = ({ item, onClose, onOpen, onShare }) => {
  const { setActiveItemForAction, setShowRenameModal, setShowDeleteModal, showToast } = useFile();

  const copyLink = (e) => {
    e.stopPropagation();
    const url = `${window.location.origin}/api/files/download?path=${encodeURIComponent(item.path)}`;
    navigator.clipboard.writeText(url);
    showToast('Download link copied!', 'success');
    onClose();
  };
  const rename = (e) => { e.stopPropagation(); setActiveItemForAction(item); setShowRenameModal(true); onClose(); };
  const del    = (e) => { e.stopPropagation(); setActiveItemForAction(item); setShowDeleteModal(true); onClose(); };

  const menuBtnClass = "w-full text-left flex items-center text-slate-200 hover:text-white hover:bg-white/8 transition-colors rounded-lg";
  const menuBtnStyle = { gap: '9px', padding: '8px 12px', fontSize: '0.75rem' };

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      style={{
        position: 'absolute', right: 0, top: 'calc(100% + 4px)', zIndex: 50,
        width: '176px', background: '#1a1e2b',
        borderRadius: '14px', padding: '6px',
        boxShadow: '0 20px 50px rgba(0,0,0,0.7)',
      }}
    >
      {/* Share link — available for all non-directory files */}
      {!item.isDirectory && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onShare(); onClose(); }} className={menuBtnClass} style={menuBtnStyle}>
            <Link2 className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" /> Share Link
          </button>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
        </>
      )}
      {!item.isDirectory && (
        <>
          <button onClick={(e) => { e.stopPropagation(); onOpen(e); onClose(); }} className={menuBtnClass} style={menuBtnStyle}>
            <Eye className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" /> Preview
          </button>
          <a
            href={`/api/files/download?path=${encodeURIComponent(item.path)}`}
            download
            className={menuBtnClass}
            style={menuBtnStyle}
          >
            <Download className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> Download
          </a>
          <button onClick={copyLink} className={menuBtnClass} style={menuBtnStyle}>
            <Copy className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" /> Copy Link
          </button>
        </>
      )}
      {item.isDirectory && (
        <a
          href={`/api/files/zip?path=${encodeURIComponent(item.path)}`}
          className={menuBtnClass}
          style={menuBtnStyle}
        >
          <Download className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" /> Download ZIP
        </a>
      )}
      {!item.isProtected && item.category !== 'drive' && (
        <>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)', margin: '4px 0' }} />
          <button onClick={rename} className={menuBtnClass} style={menuBtnStyle}>
            <Edit2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" /> Rename
          </button>
          <button
            onClick={del}
            className="w-full text-left flex items-center text-rose-400 hover:bg-rose-500/15 transition-colors rounded-lg"
            style={menuBtnStyle}
          >
            <Trash2 className="w-3.5 h-3.5 flex-shrink-0" /> Delete
          </button>
        </>
      )}
    </div>
  );
};

export function FileCard({ item, viewMode }) {
  const { navigateTo, setPreviewFile, favorites, toggleFavorite, showToast } = useFile();
  const [showMenu, setShowMenu] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const Icon  = item.isLocked ? Lock : (categoryIconMap[item.category] || File);
  const color = item.isLocked ? 'text-amber-400' : (categoryColorMap[item.category] || 'text-slate-400');
  const isFav = favorites.some((f) => f.path === item.path);

  const handleOpen = (e) => {
    e.stopPropagation();
    if (item.isLocked) {
      showToast('Master password required to unlock this drive', 'danger');
      return;
    }
    item.isDirectory ? navigateTo(item.path) : setPreviewFile(item);
  };

  // ── GRID TILE ───────────────────────────────
  if (viewMode === 'grid') {
    return (
      <>
      {showShare && <ShareLinkModal item={item} onClose={() => setShowShare(false)} />}
      <div
        onClick={handleOpen}
        className={`tile-card cursor-pointer select-none group flex flex-col justify-between ${isFav ? 'tile-card-selected' : ''}`}
        style={{ padding: '14px', height: '140px', position: 'relative', zIndex: showMenu ? 30 : 10 }}
      >
        {/* Top: icon + menu */}
        <div className="flex items-start justify-between">
          <div
            className="flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform"
            style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(0,0,0,0.4)' }}
          >
            <Icon className={`w-5 h-5 ${color}`} />
          </div>

          <div className="flex items-center" style={{ gap: '2px' }}>
            {isFav && <CheckCircle2 className="w-4 h-4 text-rose-400" style={{ opacity: 0.8 }} />}
            <button
              onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
              className={`transition-all rounded-lg ${isFav ? 'text-amber-400' : 'text-slate-500 opacity-0 group-hover:opacity-100 hover:text-slate-300'}`}
              style={{ padding: '4px' }}
            >
              <Star className="w-3.5 h-3.5" />
            </button>

            {/* Context menu trigger */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="text-slate-400 hover:text-white rounded-lg transition-colors"
                style={{ padding: '4px' }}
              >
                <MoreVertical className="w-4 h-4" />
              </button>
              {showMenu && (
                <ContextMenu item={item} onClose={() => setShowMenu(false)} onOpen={handleOpen} onShare={() => { if (!item.isDirectory) setShowShare(true); }} />
              )}
            </div>
          </div>
        </div>

        {/* Bottom: name + meta */}
        <div>
          <h4
            className="font-semibold text-white group-hover:text-rose-400 transition-colors truncate"
            style={{ fontSize: '0.8rem', marginBottom: '3px' }}
          >
            {item.name}
          </h4>
          <div className="flex items-center justify-between text-slate-400 font-mono" style={{ fontSize: '0.65rem' }}>
            <span>{item.formattedSize || (item.isDirectory ? 'Folder' : '—')}</span>
            {item.mtime && <span>{new Date(item.mtime).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>
      </>
    );
  }

  // ── LIST ROW ────────────────────────────────
  return (
    <>
    {showShare && <ShareLinkModal item={item} onClose={() => setShowShare(false)} />}
    <div
      onClick={handleOpen}
      className={`tile-card cursor-pointer select-none flex items-center justify-between ${isFav ? 'tile-card-selected' : ''}`}
      style={{ padding: '10px 16px', gap: '14px', position: 'relative', zIndex: showMenu ? 30 : 10 }}
    >
      <div className="flex items-center flex-1 min-w-0" style={{ gap: '12px' }}>
        <div
          className="flex items-center justify-center flex-shrink-0"
          style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'rgba(0,0,0,0.4)' }}
        >
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-white truncate" style={{ fontSize: '0.82rem' }}>{item.name}</h4>
          <span className="text-slate-400 font-mono sm:hidden" style={{ fontSize: '0.65rem' }}>{item.formattedSize}</span>
        </div>
      </div>

      <span className="hidden sm:block text-slate-400 font-mono text-right" style={{ width: '80px', fontSize: '0.7rem' }}>
        {item.formattedSize}
      </span>
      <span className="hidden md:block text-slate-400 font-mono text-right" style={{ width: '100px', fontSize: '0.7rem' }}>
        {item.mtime ? new Date(item.mtime).toLocaleDateString() : '—'}
      </span>

      <div className="flex items-center" style={{ gap: '4px' }}>
        <button
          onClick={(e) => { e.stopPropagation(); toggleFavorite(item); }}
          className={`rounded-lg transition-colors ${isFav ? 'text-amber-400' : 'text-slate-500 hover:text-slate-300'}`}
          style={{ padding: '5px' }}
        >
          <Star className="w-4 h-4" />
        </button>
        <div style={{ position: 'relative' }}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="text-slate-400 hover:text-white rounded-lg transition-colors"
            style={{ padding: '5px' }}
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showMenu && (
            <ContextMenu item={item} onClose={() => setShowMenu(false)} onOpen={handleOpen} onShare={() => { if (!item.isDirectory) setShowShare(true); }} />
          )}
        </div>
      </div>
    </div>
    </>
  );
}
