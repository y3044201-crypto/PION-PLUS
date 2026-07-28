import React from 'react';
import { User } from 'firebase/auth';
import { 
  Code2,
  FileSpreadsheet, 
  FolderOpen, 
  PlusCircle, 
  CloudCheck, 
  RefreshCw, 
  CloudOff, 
  ExternalLink, 
  LogOut, 
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { SyncStatus } from '../types';

interface HeaderProps {
  user: User | null;
  needsAuth: boolean;
  spreadsheetTitle?: string;
  spreadsheetUrl?: string;
  syncStatus: SyncStatus;
  isSandboxMode: boolean;
  viewMode?: 'dashboard' | 'spreadsheet';
  onToggleViewMode?: (mode: 'dashboard' | 'spreadsheet') => void;
  onOpenSelector: () => void;
  onOpenNewModal: () => void;
  onLogin: () => void;
  onLogout: () => void;
  onManualSave: () => void;
  hasUnsavedChanges: boolean;
  onOpenAppsScriptConfig?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  needsAuth,
  spreadsheetTitle,
  spreadsheetUrl,
  syncStatus,
  isSandboxMode,
  viewMode = 'dashboard',
  onToggleViewMode,
  onOpenSelector,
  onOpenNewModal,
  onLogin,
  onLogout,
  onManualSave,
  hasUnsavedChanges,
  onOpenAppsScriptConfig,
}) => {
  return (
    <header className="bg-[#050816]/90 backdrop-blur-2xl border-b border-white/10 text-slate-100 sticky top-0 z-30 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Branding & Current Sheet */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500/20 via-purple-500/20 to-cyan-500/20 border border-indigo-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
            <FileSpreadsheet className="w-5 h-5" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white truncate tracking-tight">
                {spreadsheetTitle || 'Editor Data 2-Arah'}
              </h1>

              {spreadsheetUrl && (
                <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 hover:text-cyan-400 p-1 transition-colors"
                  title="Buka Data Cloud"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              {isSandboxMode ? (
                <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 text-[11px] font-semibold">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  Mode Pratinjau (Sandbox)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30 text-[11px] font-semibold">
                  <CloudCheck className="w-3 h-3 text-emerald-400" />
                  Terhubung ke Database Cloud
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Center: View Switcher Tabs (Dashboard vs Spreadsheet) */}
        {onToggleViewMode && (
          <div className="bg-[#0b1020]/90 p-1 rounded-2xl border border-white/10 flex items-center gap-1 shadow-inner backdrop-blur-md">
            <button
              onClick={() => onToggleViewMode('dashboard')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                viewMode === 'dashboard'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)] font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-300" />
              <span>Dashboard UI</span>
            </button>
            <button
              onClick={() => onToggleViewMode('spreadsheet')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                viewMode === 'spreadsheet'
                  ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-cyan-300" />
              <span>Editor Data</span>
            </button>
          </div>
        )}

        {/* Center: Sync Status & Manual Save */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0b1020]/80 border border-white/10 text-xs font-medium backdrop-blur-md">
            {syncStatus === 'saving' && (
              <span className="text-cyan-400 flex items-center gap-1.5 font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                Menyimpan...
              </span>
            )}
            {syncStatus === 'synced' && (
              <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                Tersinkronisasi 2-Arah
              </span>
            )}
            {syncStatus === 'unsaved_changes' && (
              <span className="text-amber-400 flex items-center gap-1.5 font-semibold">
                <CloudOff className="w-3.5 h-3.5 text-amber-400" />
                Ada Perubahan Belum Disimpan
              </span>
            )}
            {syncStatus === 'error' && (
              <span className="text-rose-400 flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                Gagal Sinkronisasi
              </span>
            )}
          </div>

          {hasUnsavedChanges && !isSandboxMode && (
            <button
              onClick={onManualSave}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-slate-950" />
              Simpan Sekarang
            </button>
          )}
        </div>

        {/* Right: Actions & Google Sign In */}
        <div className="flex items-center gap-2">
          {onOpenAppsScriptConfig && (
            <button
              onClick={onOpenAppsScriptConfig}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
              title="Konfigurasi Apps Script (Tanpa Login OAuth)"
            >
              <Code2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Apps Script</span>
            </button>
          )}

          <button
            onClick={onOpenSelector}
            className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            title="Pilih atau Buka File Data"
          >
            <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Buka Sheet</span>
          </button>

          <button
            onClick={onOpenNewModal}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shadow-[0_0_10px_rgba(99,102,241,0.2)]"
            title="Buat File Data Baru"
          >
            <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Buat Baru</span>
          </button>

          <div className="h-5 w-px bg-white/10 my-auto mx-1" />

          {needsAuth || !user ? (
            <button
              onClick={onLogin}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 via-indigo-500 to-purple-500 hover:opacity-90 text-slate-950 text-xs font-black shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center gap-2 transition-all active:scale-95"
            >
              <svg className="w-4 h-4 fill-slate-950" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span>Masuk Google</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Pengguna'}
                  className="w-8 h-8 rounded-full border-2 border-cyan-400/60 object-cover shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center text-xs shadow-[0_0_10px_rgba(99,102,241,0.4)]">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
                </div>
              )}
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                title="Keluar"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
