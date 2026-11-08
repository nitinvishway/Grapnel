import React, { useState, useRef } from 'react';
import { UploadCloud, X, File, Loader2 } from 'lucide-react';
import { useFile } from '../context/FileContext';

export function UploadModal() {
  const { showUploadModal, setShowUploadModal, currentPath, refreshCurrentDir, showToast } = useFile();

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!showUploadModal) return null;

  const handleFileChange = (e) => {
    if (e.target.files?.length) setSelectedFiles(Array.from(e.target.files));
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) setSelectedFiles(Array.from(e.dataTransfer.files));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFiles.length) return;
    setUploading(true);
    setProgress(20);
    const formData = new FormData();
    formData.append('targetPath', currentPath);
    selectedFiles.forEach((f) => formData.append('files', f));
    try {
      setProgress(50);
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      setProgress(90);
      if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
      const result = await res.json();
      setProgress(100);
      showToast(result.message || 'Files uploaded!', 'success');
      refreshCurrentDir();
      setShowUploadModal(false);
      setSelectedFiles([]);
    } catch (err) {
      showToast(err.message, 'danger');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const close = () => { setShowUploadModal(false); setSelectedFiles([]); };

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
          maxWidth: '480px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.75)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(34,211,238,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>
              <UploadCloud className="w-5 h-5" />
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>Upload Files</h3>
          </div>
          <button
            onClick={close}
            style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', color: '#64748b', border: 'none', cursor: 'pointer', lineHeight: 0 }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Destination path */}
        <div style={{ fontSize: '0.72rem', color: '#64748b', background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '9px 14px', fontFamily: 'monospace' }}>
          → <span style={{ color: '#22d3ee' }}>{currentPath}</span>
        </div>

        <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Drop zone */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#22d3ee' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: '16px',
              padding: '36px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(34,211,238,0.06)' : 'rgba(255,255,255,0.03)',
              transition: 'all 0.2s',
            }}
          >
            <input type="file" multiple ref={fileInputRef} onChange={handleFileChange} className="hidden" />
            <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '12px', background: 'rgba(34,211,238,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee' }}>
              <UploadCloud className="w-6 h-6" />
            </div>
            <p style={{ color: '#e2e8f0', fontSize: '0.875rem', fontWeight: 500 }}>
              Drop files here or <span style={{ color: '#22d3ee', textDecoration: 'underline' }}>browse</span>
            </p>
            <p style={{ color: '#475569', fontSize: '0.72rem', marginTop: '4px' }}>
              Photos, videos, music, documents & archives
            </p>
          </div>

          {/* Selected files list */}
          {selectedFiles.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto' }}>
              <span style={{ fontSize: '0.65rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.06em' }}>
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </span>
              {selectedFiles.map((file, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: '10px',
                    background: 'rgba(255,255,255,0.04)', gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <File className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span style={{ fontSize: '0.78rem', color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#64748b', fontFamily: 'monospace', flexShrink: 0 }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          {uploading && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b' }}>
                <span>Uploading to server…</span>
                <span>{progress}%</span>
              </div>
              <div style={{ height: '4px', background: 'rgba(255,255,255,0.08)', borderRadius: '99px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(to right, #22d3ee, #a855f7)', borderRadius: '99px', transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
            <button
              type="button" onClick={close}
              style={{ padding: '9px 20px', borderRadius: '11px', border: 'none', background: 'rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: '0.82rem', fontWeight: 500, cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedFiles.length || uploading}
              style={{
                padding: '9px 22px', borderRadius: '11px', border: 'none',
                background: (!selectedFiles.length || uploading) ? 'rgba(255,255,255,0.08)' : '#22d3ee',
                color: (!selectedFiles.length || uploading) ? '#64748b' : '#0a0c10',
                fontSize: '0.82rem', fontWeight: 700, cursor: (!selectedFiles.length || uploading) ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: '7px',
                boxShadow: (!selectedFiles.length || uploading) ? 'none' : '0 4px 16px rgba(34,211,238,0.35)',
              }}
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
              {uploading ? 'Uploading…' : 'Upload Now'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
