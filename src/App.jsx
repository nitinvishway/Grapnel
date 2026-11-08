import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FileProvider } from './context/FileContext';
import { LoginWall } from './components/LoginWall';
import { TopCapsuleDock } from './components/TopCapsuleDock';
import { Sidebar } from './components/Sidebar';
import { FileGrid } from './components/FileGrid';
import { FileViewerModal } from './components/FileViewerModal';
import { UploadModal } from './components/UploadModal';
import { ConnectionModal } from './components/ConnectionModal';
import { ActionModals } from './components/ActionModals';
import { Toast } from './components/Toast';
import { SharePage } from './components/SharePage';
import { Loader2 } from 'lucide-react';

// ── Detect /share/:token route ─────────────────────────────────────
const shareMatch = window.location.pathname.match(/^\/share\/([a-f0-9]{40})$/i);

function MainApp() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen bg-[#0a0c10] text-slate-100 flex justify-center"
      style={{ padding: '20px 20px 32px 20px' }}
    >
      <div className="w-full max-w-[1440px] flex flex-col">
        <TopCapsuleDock onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <div className="flex flex-col lg:flex-row items-start w-full" style={{ gap: '24px', marginTop: '8px' }}>
          <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex-1 min-w-0 w-full">
            <FileGrid />
          </main>
        </div>
      </div>

      <FileViewerModal />
      <UploadModal />
      <ConnectionModal />
      <ActionModals />
      <Toast />
    </div>
  );
}

function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
        <span className="font-mono text-xs tracking-wider uppercase">Loading security status...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginWall />;
  }

  return (
    <FileProvider>
      <MainApp />
    </FileProvider>
  );
}

export default function App() {
  // Public shared file links bypass authentication wall entirely
  if (shareMatch) {
    return <SharePage token={shareMatch[1]} />;
  }

  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
