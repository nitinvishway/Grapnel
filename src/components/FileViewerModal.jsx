import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  FileText,
  Film,
  Music,
  Image as ImageIcon,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { useFile } from '../context/FileContext';

export function FileViewerModal() {
  const { previewFile, setPreviewFile, showToast } = useFile();
  const [textContent, setTextContent] = useState('');
  const [loadingText, setLoadingText] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!previewFile) return;

    // If code or document or text, fetch content from preview API
    if (previewFile.category === 'code' || previewFile.category === 'document') {
      setLoadingText(true);
      fetch(`/api/files/preview?path=${encodeURIComponent(previewFile.path)}`)
        .then((res) => res.json())
        .then((data) => {
          setTextContent(data.content || 'Unable to load text preview');
        })
        .catch((err) => {
          setTextContent(`Error loading content: ${err.message}`);
        })
        .finally(() => setLoadingText(false));
    }
  }, [previewFile]);

  if (!previewFile) return null;

  const downloadUrl = `/api/files/download?path=${encodeURIComponent(previewFile.path)}`;
  const streamUrl = `/api/files/stream?path=${encodeURIComponent(previewFile.path)}`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    showToast('Code content copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel w-full max-w-4xl max-h-[90vh] rounded-2xl border border-white/10 flex flex-col overflow-hidden shadow-2xl animate-fadeIn">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3 min-w-0">
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {previewFile.category === 'image' && <ImageIcon className="w-5 h-5" />}
              {previewFile.category === 'video' && <Film className="w-5 h-5 text-rose-400" />}
              {previewFile.category === 'audio' && <Music className="w-5 h-5 text-cyan-400" />}
              {(previewFile.category === 'code' || previewFile.category === 'document') && (
                <FileText className="w-5 h-5 text-blue-400" />
              )}
            </span>
            <div className="min-w-0">
              <h3 className="font-heading font-semibold text-base text-slate-100 truncate">
                {previewFile.name}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                {previewFile.formattedSize} • {previewFile.mimeType || previewFile.category}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={downloadUrl}
              download
              className="btn-primary py-1.5 px-3 text-xs"
              title="Download file"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </a>
            <button
              onClick={() => setPreviewFile(null)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Viewer Content */}
        <div className="flex-1 overflow-auto p-6 bg-slate-950/40 flex items-center justify-center min-h-[300px]">
          {/* IMAGE VIEWER */}
          {previewFile.category === 'image' && (
            <div className="relative flex flex-col items-center max-w-full">
              <img
                src={downloadUrl}
                alt={previewFile.name}
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/10"
              />
            </div>
          )}

          {/* VIDEO PLAYER */}
          {previewFile.category === 'video' && (
            <div className="w-full flex items-center justify-center">
              <video
                controls
                autoPlay
                className="w-full max-h-[70vh] rounded-xl shadow-2xl border border-white/10"
                src={streamUrl}
              >
                Your browser does not support HTML5 video playback.
              </video>
            </div>
          )}

          {/* AUDIO PLAYER */}
          {previewFile.category === 'audio' && (
            <div className="glass-card p-8 rounded-2xl w-full max-w-md text-center space-y-6">
              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-cyan-500/30 animate-pulse">
                <Music className="w-12 h-12" />
              </div>
              <div>
                <h4 className="font-heading font-semibold text-lg text-white mb-1">
                  {previewFile.name}
                </h4>
                <span className="text-xs text-cyan-400 font-mono">{previewFile.formattedSize}</span>
              </div>
              <audio controls autoPlay className="w-full">
                <source src={streamUrl} type={previewFile.mimeType || 'audio/mpeg'} />
                Your browser does not support audio playback.
              </audio>
            </div>
          )}

          {/* PDF VIEWER */}
          {previewFile.category === 'pdf' && (
            <iframe
              src={downloadUrl}
              title={previewFile.name}
              className="w-full h-[70vh] rounded-xl border border-white/10"
            />
          )}

          {/* CODE / TEXT VIEWER */}
          {(previewFile.category === 'code' || previewFile.category === 'document') && (
            <div className="w-full h-[65vh] flex flex-col glass-panel rounded-xl overflow-hidden border border-white/10">
              <div className="bg-slate-900/90 px-4 py-2 flex items-center justify-between border-b border-white/10 text-xs font-mono text-slate-400">
                <span>Code Viewer</span>
                <button
                  onClick={handleCopyText}
                  className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Code'}</span>
                </button>
              </div>
              {loadingText ? (
                <div className="flex-1 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
              ) : (
                <pre className="flex-1 p-4 overflow-auto text-xs font-mono text-slate-200 bg-slate-950/80 leading-relaxed selection:bg-cyan-500/30">
                  <code>{textContent}</code>
                </pre>
              )}
            </div>
          )}

          {/* OTHER / GENERIC FILE */}
          {!['image', 'video', 'audio', 'pdf', 'code', 'document'].includes(previewFile.category) && (
            <div className="text-center p-8 space-y-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400">
                <FileText className="w-10 h-10" />
              </div>
              <div>
                <h4 className="font-heading font-semibold text-base text-white">
                  No Direct Preview Available
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                  This file type cannot be rendered inline in the browser. Download the file to view on your device.
                </p>
              </div>
              <a href={downloadUrl} download className="btn-primary inline-flex">
                <Download className="w-4 h-4" />
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
