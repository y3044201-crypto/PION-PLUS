import React, { useState, useEffect } from 'react';
import { 
  X, 
  Folder, 
  Search, 
  Link as LinkIcon, 
  PlusSquare, 
  FileSpreadsheet, 
  ExternalLink, 
  Loader2, 
  Sparkles,
  TrendingUp,
  CheckSquare,
  Package,
  FileText,
  AlertCircle
} from 'lucide-react';
import { DriveFile, SampleTemplate } from '../types';
import { SAMPLE_TEMPLATES } from '../data/templates';
import { listDriveSpreadsheets } from '../lib/sheetsApi';

interface SheetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSpreadsheet: (id: string, title?: string) => void;
  onCreateNew: (title: string, template: SampleTemplate) => void;
  onLoadSandboxTemplate: (template: SampleTemplate) => void;
  token: string | null;
  needsAuth: boolean;
  onLogin: () => void;
}

export const SheetSelectorModal: React.FC<SheetSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectSpreadsheet,
  onCreateNew,
  onLoadSandboxTemplate,
  token,
  needsAuth,
  onLogin,
}) => {
  const [activeTab, setActiveTab] = useState<'drive' | 'url' | 'templates'>('drive');
  const [driveFiles, setDriveFiles] = useState<DriveFile[]>([]);
  const [isLoadingDrive, setIsLoadingDrive] = useState(false);
  const [driveError, setDriveError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [newSheetTitle, setNewSheetTitle] = useState('File Data Baru Saya');
  const [selectedTemplate, setSelectedTemplate] = useState<SampleTemplate>(SAMPLE_TEMPLATES[0]);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (isOpen && activeTab === 'drive' && token && !needsAuth) {
      loadDriveFiles();
    }
  }, [isOpen, activeTab, token, needsAuth]);

  const loadDriveFiles = async () => {
    if (!token) return;
    setIsLoadingDrive(true);
    setDriveError(null);
    try {
      const files = await listDriveSpreadsheets(token);
      setDriveFiles(files);
    } catch (err: any) {
      console.error(err);
      setDriveError(err.message || 'Gagal memuat berkas dari Google Drive.');
    } finally {
      setIsLoadingDrive(false);
    }
  };

  if (!isOpen) return null;

  const filteredFiles = driveFiles.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputUrl.trim()) return;
    onSelectSpreadsheet(inputUrl);
    onClose();
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSheetTitle.trim()) return;

    if (needsAuth || !token) {
      // Sandbox mode load
      onLoadSandboxTemplate({
        ...selectedTemplate,
        title: newSheetTitle,
      });
      onClose();
    } else {
      setIsCreating(true);
      try {
        await onCreateNew(newSheetTitle, selectedTemplate);
        onClose();
      } catch (err) {
        console.error(err);
      } finally {
        setIsCreating(false);
      }
    }
  };

  const getTemplateIcon = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'CheckSquare':
        return <CheckSquare className="w-5 h-5 text-blue-500" />;
      case 'Package':
        return <Package className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-amber-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Kelola Data Cloud</h2>
              <p className="text-xs text-slate-400">Pilih berkas dari Drive, masukkan link, atau buat template baru</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-5 pt-2 gap-2">
          <button
            onClick={() => setActiveTab('drive')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'drive'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Folder className="w-4 h-4" />
            Google Drive Saya
          </button>

          <button
            onClick={() => setActiveTab('url')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'url'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LinkIcon className="w-4 h-4" />
            URL / ID Sheet
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2.5 text-xs font-semibold rounded-t-lg transition-all flex items-center gap-2 border-b-2 ${
              activeTab === 'templates'
                ? 'border-emerald-500 text-emerald-400 bg-slate-800/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PlusSquare className="w-4 h-4" />
            Buat Sheet Baru
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="p-5 overflow-y-auto flex-1">
          
          {/* TAB 1: GOOGLE DRIVE */}
          {activeTab === 'drive' && (
            <div className="space-y-4">
              {needsAuth || !token ? (
                <div className="p-6 rounded-xl bg-slate-800/50 border border-slate-700/60 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                    <Folder className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-white">Sambungkan Akun Google Anda</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    Masuk dengan Google untuk menampilkan semua daftar file milik Anda secara langsung dari Google Drive.
                  </p>
                  <button
                    onClick={onLogin}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all inline-flex items-center gap-2"
                  >
                    Masuk Akun Google
                  </button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama file di Drive..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {isLoadingDrive ? (
                    <div className="py-12 text-center space-y-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
                      <p className="text-xs">Memuat file dari Google Drive...</p>
                    </div>
                  ) : driveError ? (
                    <div className="p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{driveError}</span>
                    </div>
                  ) : filteredFiles.length === 0 ? (
                    <div className="py-10 text-center text-slate-400 text-xs">
                      {searchQuery ? 'Tidak ada file yang cocok dengan pencarian.' : 'Belum ada file di Google Drive Anda.'}
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {filteredFiles.map((file) => (
                        <div
                          key={file.id}
                          className="p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all flex items-center justify-between group cursor-pointer"
                          onClick={() => {
                            onSelectSpreadsheet(file.id, file.name);
                            onClose();
                          }}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                              <FileSpreadsheet className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">
                                {file.name}
                              </h4>
                              {file.modifiedTime && (
                                <p className="text-[10px] text-slate-500">
                                  Diubah: {new Date(file.modifiedTime).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {file.webViewLink && (
                              <a
                                href={file.webViewLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
                                title="Buka File di Tab Baru"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button className="px-3 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 text-xs font-medium transition-colors">
                              Buka
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* TAB 2: INPUT URL OR ID */}
          {activeTab === 'url' && (
            <form onSubmit={handleUrlSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  URL atau Cloud Data ID
                </label>
                <p className="text-[11px] text-slate-400">
                  Tempelkan link berbagi Google Sheets atau karakter ID dari alamat data Anda.
                </p>
                <div className="relative mt-1">
                  <LinkIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                    value={inputUrl}
                    onChange={(e) => setInputUrl(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">💡 Petunjuk Akses:</p>
                <p>
                  Pastikan file memiliki izin akses edit bagi akun Anda atau setel visibilitas dengan benar.
                </p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!inputUrl.trim()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
                >
                  Muat Data Cloud
                </button>
              </div>
            </form>
          )}

          {/* TAB 3: CREATE NEW WITH TEMPLATES */}
          {activeTab === 'templates' && (
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Judul File Data Baru
                </label>
                <input
                  type="text"
                  value={newSheetTitle}
                  onChange={(e) => setNewSheetTitle(e.target.value)}
                  placeholder="Contoh: Laporan Penjualan Juli 2026"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">Pilih Starter Template Data</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SAMPLE_TEMPLATES.map((tmpl) => (
                    <div
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        selectedTemplate.id === tmpl.id
                          ? 'bg-emerald-500/10 border-emerald-500 text-white'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0">
                          {getTemplateIcon(tmpl.icon)}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-200">{tmpl.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{tmpl.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {needsAuth || !token ? (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Mode Sandbox (Belum Login) — Data dapat diedit langsung secara lokal.</span>
                  </div>
                </div>
              ) : null}

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isCreating}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Membuat di Google Drive...
                    </>
                  ) : needsAuth || !token ? (
                    'Mulai di Sandbox'
                  ) : (
                    'Buat & Sinkron ke Drive'
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
};
