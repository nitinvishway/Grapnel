import React, { useState } from 'react';
import { FolderPlus, Edit2, Trash2, X, AlertTriangle, Loader2, ShieldAlert, Eye, EyeOff, Lock } from 'lucide-react';
import { useFile } from '../context/FileContext';

/* ─── Shared modal shell ─────────────────────────────── */
function Modal({ onClose, children }) {
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
          maxWidth: '420px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.75)',
          animation: 'fadeUp 0.2s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function ModalHeader({ icon: Icon, iconColor, title, onClose }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: 'rgba(255,255,255,0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: iconColor,
          }}
        >
          <Icon className="w-5 h-5" />
        </div>
        <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>{title}</h3>
      </div>
      <button
        onClick={onClose}
        style={{
          padding: '6px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.06)', color: '#64748b',
          border: 'none', cursor: 'pointer', lineHeight: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
        onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

function StyledInput({ value, onChange, placeholder, autoFocus, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      style={{
        width: '100%', padding: '11px 14px', borderRadius: '12px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        color: '#fff', fontSize: '0.85rem', outline: 'none',
        transition: 'border-color 0.15s',
      }}
      onFocus={e => e.target.style.borderColor = 'rgba(255,69,69,0.5)'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
    />
  );
}

function ModalActions({ children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '4px' }}>
      {children}
    </div>
  );
}

function BtnCancel({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '9px 18px', borderRadius: '11px', border: 'none',
        background: 'rgba(255,255,255,0.07)', color: '#94a3b8',
        fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer',
        transition: 'background 0.15s, color 0.15s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#94a3b8'; }}
    >
      Cancel
    </button>
  );
}

function BtnPrimary({ type = 'submit', onClick, disabled, children, color = '#ff4545', glow = 'rgba(255,69,69,0.3)' }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '9px 22px', borderRadius: '11px', border: 'none',
        background: disabled ? 'rgba(255,255,255,0.08)' : color,
        color: disabled ? '#64748b' : '#fff',
        fontSize: '0.82rem', fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', gap: '7px',
        boxShadow: disabled ? 'none' : `0 4px 16px ${glow}`,
        transition: 'all 0.15s',
      }}
    >
      {children}
    </button>
  );
}

/* ─── Main ActionModals component ───────────────────── */
export function ActionModals() {
  const {
    showMkdirModal, setShowMkdirModal,
    showRenameModal, setShowRenameModal,
    showDeleteModal, setShowDeleteModal,
    activeItemForAction, currentPath,
    refreshCurrentDir, showToast,
  } = useFile();

  const [folderName, setFolderName] = useState('');
  const [newName, setNewName] = useState('');
  const [doomPassword, setDoomPassword] = useState('');
  const [showDoomPassword, setShowDoomPassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [loading, setLoading] = useState(false);

  const isProtectedItem = activeItemForAction?.isProtected || activeItemForAction?.category === 'drive';

  const handleCreateFolder = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/files/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parentPath: currentPath, folderName }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create folder');
      showToast(`Folder "${folderName}" created!`, 'success');
      refreshCurrentDir();
      setShowMkdirModal(false);
      setFolderName('');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleRenameItem = async (e) => {
    e.preventDefault();
    if (!newName.trim() || !activeItemForAction) return;
    setLoading(true);
    try {
      const res = await fetch('/api/files/rename', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath: activeItemForAction.path, newName }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to rename item');
      showToast('Item renamed!', 'success');
      refreshCurrentDir();
      setShowRenameModal(false);
      setNewName('');
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (e) => {
    e?.preventDefault?.();
    if (!activeItemForAction || isProtectedItem) return;
    if (!doomPassword.trim()) {
      setDeleteError('Doom password is required to confirm deletion.');
      return;
    }

    setLoading(true);
    setDeleteError('');
    try {
      const res = await fetch('/api/files/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetPath: activeItemForAction.path,
          doomPassword: doomPassword.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete item');
      showToast(`Deleted "${activeItemForAction.name}"`, 'info');
      refreshCurrentDir();
      setShowDeleteModal(false);
      setDoomPassword('');
      setDeleteError('');
    } catch (err) {
      setDeleteError(err.message);
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── New Folder ──────────────────────────────── */}
      {showMkdirModal && (
        <Modal onClose={() => setShowMkdirModal(false)}>
          <ModalHeader icon={FolderPlus} iconColor="#22d3ee" title="New Folder" onClose={() => setShowMkdirModal(false)} />
          <form onSubmit={handleCreateFolder} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Folder Name</label>
              <StyledInput value={folderName} onChange={(e) => setFolderName(e.target.value)} placeholder="e.g. My Documents" autoFocus />
            </div>
            <ModalActions>
              <BtnCancel onClick={() => setShowMkdirModal(false)} />
              <BtnPrimary type="submit" disabled={loading || !folderName.trim()} color="#22d3ee" glow="rgba(34,211,238,0.3)">
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Create Folder
              </BtnPrimary>
            </ModalActions>
          </form>
        </Modal>
      )}

      {/* ── Rename ──────────────────────────────────── */}
      {showRenameModal && (
        <Modal onClose={() => setShowRenameModal(false)}>
          <ModalHeader icon={Edit2} iconColor="#fbbf24" title="Rename Item" onClose={() => setShowRenameModal(false)} />
          <div style={{ fontSize: '0.78rem', color: '#94a3b8', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '10px 14px' }}>
            Current name: <span style={{ color: '#fff', fontWeight: 600 }}>{activeItemForAction?.name}</span>
          </div>
          <form onSubmit={handleRenameItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>New Name</label>
              <StyledInput value={newName} onChange={(e) => setNewName(e.target.value)} placeholder={activeItemForAction?.name || 'New name…'} autoFocus />
            </div>
            <ModalActions>
              <BtnCancel onClick={() => setShowRenameModal(false)} />
              <BtnPrimary type="submit" disabled={loading || !newName.trim()} color="#fbbf24" glow="rgba(251,191,36,0.3)">
                {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Rename
              </BtnPrimary>
            </ModalActions>
          </form>
        </Modal>
      )}

      {/* ── Doom Delete Confirmation ────────────────── */}
      {showDeleteModal && (
        <Modal onClose={() => { setShowDeleteModal(false); setDoomPassword(''); setDeleteError(''); }}>
          <ModalHeader
            icon={isProtectedItem ? Lock : ShieldAlert}
            iconColor="#f87171"
            title={isProtectedItem ? "Protected Directory" : "Doom Deletion Authorization"}
            onClose={() => { setShowDeleteModal(false); setDoomPassword(''); setDeleteError(''); }}
          />

          {isProtectedItem ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ padding: '14px', borderRadius: '12px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', color: '#fbbf24', fontSize: '0.8rem', lineHeight: '1.5' }}>
                <strong>Protected Directory:</strong> "{activeItemForAction?.name}" is a protected system or root directory and cannot be deleted.
              </div>
              <ModalActions>
                <BtnCancel onClick={() => setShowDeleteModal(false)} />
              </ModalActions>
            </div>
          ) : (
            <form onSubmit={handleDeleteItem} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.82rem', color: '#94a3b8', lineHeight: '1.6', margin: 0 }}>
                You are about to permanently delete{' '}
                <strong style={{ color: '#fff' }}>"{activeItemForAction?.name}"</strong>.
                {' '}Enter your <strong style={{ color: '#f87171' }}>Doom / Master Password</strong> to confirm destruction.
              </p>

              {deleteError && (
                <div style={{ padding: '10px 12px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: '0.78rem' }}>
                  {deleteError}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.72rem', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Doom Password (Master Authorization)
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    type={showDoomPassword ? 'text' : 'password'}
                    placeholder="Enter Master password to delete"
                    value={doomPassword}
                    onChange={(e) => setDoomPassword(e.target.value)}
                    autoFocus
                    style={{
                      width: '100%', padding: '11px 40px 11px 14px', borderRadius: '12px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      color: '#fff', fontSize: '0.85rem', outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDoomPassword(!showDoomPassword)}
                    style={{
                      position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px',
                    }}
                  >
                    {showDoomPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <ModalActions>
                <BtnCancel onClick={() => { setShowDeleteModal(false); setDoomPassword(''); setDeleteError(''); }} />
                <BtnPrimary type="submit" disabled={loading || !doomPassword.trim()} color="#ef4444" glow="rgba(239,68,68,0.4)">
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  Confirm Destruction
                </BtnPrimary>
              </ModalActions>
            </form>
          )}
        </Modal>
      )}
    </>
  );
}
