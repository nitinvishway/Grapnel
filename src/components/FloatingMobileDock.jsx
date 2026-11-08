import React from 'react';
import {
  Home,
  UploadCloud,
  FolderPlus,
  QrCode,
  Grid,
  List,
  Menu,
  HardDrive,
  Search,
} from 'lucide-react';
import { useFile } from '../context/FileContext';

export function FloatingMobileDock({ onToggleSidebar }) {
  const {
    navigateTo,
    viewMode,
    setViewMode,
    setShowUploadModal,
    setShowMkdirModal,
    setShowConnectionModal,
  } = useFile();

  return (
    <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50 floating-dock px-4 py-2 flex items-center gap-2">
      {/* Home */}
      <button
        onClick={() => navigateTo('home')}
        className="dock-item"
        title="Home Directory"
      >
        <Home className="w-5 h-5" />
      </button>

      {/* Drives */}
      <button
        onClick={() => navigateTo('drives')}
        className="dock-item"
        title="Storage Drives"
      >
        <HardDrive className="w-5 h-5" />
      </button>

      {/* Upload */}
      <button
        onClick={() => setShowUploadModal(true)}
        className="dock-item dock-item-active"
        title="Upload File"
      >
        <UploadCloud className="w-5 h-5" />
      </button>

      {/* New Folder */}
      <button
        onClick={() => setShowMkdirModal(true)}
        className="dock-item"
        title="New Folder"
      >
        <FolderPlus className="w-5 h-5" />
      </button>

      {/* QR Connect */}
      <button
        onClick={() => setShowConnectionModal(true)}
        className="dock-item"
        title="Connect Phone QR"
      >
        <QrCode className="w-5 h-5 text-purple-400" />
      </button>

      {/* Menu / Sidebar */}
      <button
        onClick={onToggleSidebar}
        className="dock-item"
        title="Toggle Menu"
      >
        <Menu className="w-5 h-5" />
      </button>
    </div>
  );
}
