import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, Code2, Sparkles, CheckCircle2 } from 'lucide-react';
import { APPS_SCRIPT_CODE } from '../data/appsScriptCode';
import { getAppsScriptUrl, setAppsScriptUrl } from '../lib/sheetsApi';

interface AppsScriptConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
}

export const AppsScriptConfigModal: React.FC<AppsScriptConfigModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [url, setUrlInput] = useState(getAppsScriptUrl());
  const [isCopied, setIsCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setAppsScriptUrl(url);
    setSaveSuccess(true);
    onSaved();
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#0b1020] border border-cyan-500/30 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-slate-100 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Konfigurasi Apps Script</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Tanpa Login Google / OAuth
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Gunakan Google Apps Script Web App agar aplikasi dapat membaca dan menambah data tanpa token OAuth.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto my-5 space-y-6 pr-1 custom-scrollbar">
          
          {/* Step 1: Input URL */}
          <form onSubmit={handleSave} className="bg-white/5 border border-white/10 p-5 rounded-2xl space-y-3">
            <label className="block text-xs font-bold text-slate-200">
              1. URL Aplikasi Web Google Apps Script (Web App URL)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                className="flex-1 px-3.5 py-2.5 bg-[#050816] border border-white/15 rounded-xl text-xs text-cyan-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 font-mono"
              />
              <button
                type="submit"
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-black text-xs rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                {saveSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-slate-950" />
                    <span>Tersimpan!</span>
                  </>
                ) : (
                  <span>Simpan URL</span>
                )}
              </button>
            </div>
            {url && (
              <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono">
                <Check className="w-3.5 h-3.5" /> Web App URL telah terpasang. Akses langsung aktif tanpa login Google!
              </p>
            )}
          </form>

          {/* Step 2: Code instructions */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-200">
                2. Kode Google Apps Script (<code className="text-cyan-400">Code.gs</code>)
              </label>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Kode Berhasil Disalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Kode Apps Script</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Box */}
            <div className="relative">
              <pre className="p-4 bg-[#050816] border border-white/10 rounded-2xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-60 leading-relaxed custom-scrollbar">
                {APPS_SCRIPT_CODE}
              </pre>
            </div>
          </div>

          {/* Step 3: Step-by-step deployment guide */}
          <div className="bg-gradient-to-br from-indigo-950/40 to-slate-900 border border-indigo-500/20 p-5 rounded-2xl space-y-3">
            <h3 className="text-xs font-bold text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Langkah-langkah Memasang Apps Script di Google Sheets:</span>
            </h3>

            <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 leading-relaxed pl-1">
              <li>
                Buka Google Sheets Anda &rarr; Klik menu <strong className="text-white">Ekstensi</strong> &rarr; <strong className="text-white">Apps Script</strong>.
              </li>
              <li>
                Hapus seluruh isi file <code className="text-cyan-300 bg-white/5 px-1 py-0.5 rounded">Code.gs</code> default, lalu <strong className="text-emerald-300">Tempel (Paste)</strong> kode di atas.
              </li>
              <li>
                Klik tombol <strong className="text-white">Terapkan (Deploy)</strong> di kanan atas &rarr; Pilih <strong className="text-white">Terapkan baru (New deployment)</strong>.
              </li>
              <li>
                Pilih jenis: <strong className="text-cyan-300">Aplikasi Web (Web App)</strong>.
              </li>
              <li>
                Konfigurasi:
                <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-400">
                  <li>Jalankan sebagai: <strong className="text-amber-300">Saya (Me)</strong></li>
                  <li>Siapa yang memiliki akses: <strong className="text-emerald-300">Siapa saja (Anyone)</strong></li>
                </ul>
              </li>
              <li>
                Klik <strong className="text-white">Terapkan (Deploy)</strong>, berikan izin akses saat diminta, lalu <strong className="text-cyan-300">Salin URL Aplikasi Web</strong>.
              </li>
              <li>
                Tempel URL Aplikasi Web ke kolom input di atas &rarr; Klik <strong className="text-white">Simpan URL</strong>.
              </li>
            </ol>
          </div>

        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-white/10 flex items-center justify-between shrink-0">
          <a
            href="https://script.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
          >
            <span>Buka Google Apps Script Dashboard</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
