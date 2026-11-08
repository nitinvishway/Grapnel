import React from 'react';
import {
  Anchor,
  Search,
  UploadCloud,
  FolderPlus,
  QrCode,
  Grid,
  List,
  RefreshCw,
  ChevronRight,
  HardDrive,
  Home,
  X,
  Menu,
} from 'lucide-react';
import { useFile } from '../context/FileContext';

export function Navbar({ onToggleSidebar }) {
  const {
    breadcrumbs,
    navigateTo,
    refreshCurrentDir,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    performSearch,
    setShowUploadModal,
    setShowMkdirModal,
    setShowConnectionModal,
    loading,
  } = useFile();

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(searchQuery);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#12151c]/90 backdrop-blur-xl border-b border-white/10 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-3">
          {/* Brand Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleSidebar}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-white/5"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div
              onClick={() => navigateTo('home')}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <Anchor className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-heading font-bold text-lg leading-none tracking-tight text-white">
                    GRAPNEL
                  </h1>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    LAN Engine
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">
                  Client-Server Host
                </span>
              </div>
            </div>
          </div>

          {/* Search Input (Desktop) */}
          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex items-center flex-1 max-w-md mx-6 relative"
          >
            <Search className="w-4 h-4 absolute left-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search files in directory..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                performSearch(e.target.value);
              }}
              className="ui-input w-full pl-10 pr-8"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  performSearch('');
                }}
                className="absolute right-3 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Desktop Toolbar Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUploadModal(true)}
              className="btn-coral text-xs sm:text-sm py-2 px-3.5"
            >
              <UploadCloud className="w-4 h-4" />
              <span className="hidden sm:inline">Upload</span>
            </button>

            <button
              onClick={() => setShowMkdirModal(true)}
              className="btn-slate text-xs sm:text-sm py-2 px-3.5"
            >
              <FolderPlus className="w-4 h-4 text-cyan-400" />
              <span className="hidden sm:inline">New Folder</span>
            </button>

            <button
              onClick={() => setShowConnectionModal(true)}
              className="btn-slate text-xs sm:text-sm py-2 px-3.5 border-purple-500/30 text-purple-300 hover:bg-purple-500/20"
            >
              <QrCode className="w-4 h-4 text-purple-400" />
              <span className="hidden sm:inline">Connect Phone</span>
            </button>

            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center bg-slate-900/90 p-1 rounded-xl border border-white/10">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'grid'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-all ${
                  viewMode === 'list'
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            {/* Refresh */}
            <button
              onClick={refreshCurrentDir}
              className={`p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-900/90 border border-white/10 ${
                loading ? 'animate-spin text-rose-400' : ''
              }`}
              title="Refresh Directory"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={handleSearchSubmit} className="md:hidden relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              performSearch(e.target.value);
            }}
            className="ui-input w-full pl-10 pr-8 py-2 text-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                performSearch('');
              }}
              className="absolute right-3 top-3 text-slate-400"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        {/* Breadcrumbs Path Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs font-mono text-slate-400 no-scrollbar">
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            return (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />}
                <button
                  onClick={() => navigateTo(crumb.path)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-all flex-shrink-0 border ${
                    isLast
                      ? 'bg-rose-500/15 text-rose-400 font-semibold border-rose-500/30'
                      : 'bg-slate-900/60 text-slate-300 border-white/5 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {index === 0 ? (
                    crumb.path === 'drives' ? (
                      <HardDrive className="w-3.5 h-3.5" />
                    ) : (
                      <Home className="w-3.5 h-3.5 text-rose-400" />
                    )
                  ) : null}
                  <span className="truncate max-w-[140px] sm:max-w-[200px]">{crumb.name}</span>
                </button>
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </header>
  );
}
