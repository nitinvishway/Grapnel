import React from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useFile } from '../context/FileContext';

export function Toast() {
  const { toast } = useFile();

  if (!toast) return null;

  const bgColors = {
    success: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    danger: 'bg-red-500/20 border-red-500/30 text-red-300',
    info: 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300',
  };

  const IconComponent = {
    success: CheckCircle,
    danger: AlertCircle,
    info: Info,
  }[toast.type] || Info;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-fadeIn">
      <div
        className={`glass-panel flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl ${
          bgColors[toast.type] || bgColors.info
        }`}
      >
        <IconComponent className="w-5 h-5 flex-shrink-0" />
        <span className="text-xs font-medium font-sans">{toast.message}</span>
      </div>
    </div>
  );
}
