import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const FileContext = createContext(null);

export function FileProvider({ children }) {
  const { role } = useAuth();
  const defaultInitialPath = role === 'standard' ? 'E:\\' : 'home';

  const [currentPath, setCurrentPath] = useState(defaultInitialPath);
  const [rawItems, setRawItems] = useState([]);
  const [showHiddenFiles, setShowHiddenFiles] = useState(false);
  const [breadcrumbs, setBreadcrumbs] = useState([]);
  const [isDrivesView, setIsDrivesView] = useState(false);
  const [parentPath, setParentPath] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const [previewFile, setPreviewFile] = useState(null); // File object for FileViewerModal
  const [activeItemForAction, setActiveItemForAction] = useState(null);

  // Modals state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMkdirModal, setShowMkdirModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showConnectionModal, setShowConnectionModal] = useState(false);

  // System stats & Quick access
  const [systemStats, setSystemStats] = useState(null);
  const [quickAccess, setQuickAccess] = useState([]);

  // Favorites list saved in localStorage
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('grapnel_favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('grapnel_favorites', JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites', e);
    }
  }, [favorites]);

  const toggleFavorite = useCallback((item) => {
    setFavorites((prev) => {
      const exists = prev.some((fav) => fav.path === item.path);
      if (exists) {
        showToast(`Removed "${item.name}" from Favorites`, 'info');
        return prev.filter((fav) => fav.path !== item.path);
      } else {
        showToast(`Added "${item.name}" to Favorites`, 'success');
        return [...prev, { name: item.name, path: item.path, isDirectory: item.isDirectory }];
      }
    });
  }, [showToast]);

  // Fetch Directory Files
  const fetchDirectory = useCallback(async (targetPath) => {
    setLoading(true);
    setError(null);
    try {
      const pathParam = encodeURIComponent(targetPath || 'home');
      const res = await fetch(`/api/files?path=${pathParam}`);
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to read directory');
      }
      const data = await res.json();
      setRawItems(data.items || []);
      setBreadcrumbs(data.breadcrumbs || []);
      setIsDrivesView(!!data.isDrivesView);
      setParentPath(data.parentPath);
      if (data.quickAccess) setQuickAccess(data.quickAccess);
      if (data.currentPath) setCurrentPath(data.currentPath);
    } catch (err) {
      console.error('Directory fetch error:', err);
      setError(err.message);
      showToast(err.message, 'danger');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch System Stats (IP address, QR code, disk space)
  const fetchSystemStats = useCallback(async () => {
    try {
      const res = await fetch('/api/system/stats');
      if (res.ok) {
        const data = await res.json();
        setSystemStats(data);
      }
    } catch (e) {
      console.error('System stats fetch error:', e);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchDirectory(currentPath);
    fetchSystemStats();
  }, []);

  // Perform search
  const performSearch = useCallback(async (query) => {
    if (!query || query.trim() === '') {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch('/api/files/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ basePath: currentPath, query }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data.results || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      showToast('Search request failed', 'danger');
    }
  }, [currentPath, showToast]);

  // Navigation handlers
  const navigateTo = useCallback((targetPath) => {
    setSearchQuery('');
    setIsSearching(false);
    fetchDirectory(targetPath);
  }, [fetchDirectory]);

  const refreshCurrentDir = useCallback(() => {
    fetchDirectory(currentPath);
    fetchSystemStats();
  }, [currentPath, fetchDirectory, fetchSystemStats]);

  const value = {
    currentPath,
    items: showHiddenFiles ? rawItems : rawItems.filter(i => !i.name.startsWith('.')),
    breadcrumbs,
    isDrivesView,
    parentPath,
    loading,
    error,
    viewMode,
    setViewMode,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    performSearch,
    navigateTo,
    refreshCurrentDir,
    previewFile,
    setPreviewFile,
    activeItemForAction,
    setActiveItemForAction,
    showUploadModal,
    setShowUploadModal,
    showMkdirModal,
    setShowMkdirModal,
    showRenameModal,
    setShowRenameModal,
    showDeleteModal,
    setShowDeleteModal,
    showConnectionModal,
    setShowConnectionModal,
    systemStats,
    quickAccess,
    favorites,
    toggleFavorite,
    toast,
    showToast,
    showHiddenFiles,
    setShowHiddenFiles,
  };

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
}

export function useFile() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFile must be used within a FileProvider');
  }
  return context;
}
