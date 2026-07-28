import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { GlobalLoadingOverlay } from './GlobalLoadingOverlay';
import {
  TrendingUp,
  Search,
  RefreshCw,
  ExternalLink,
  Download,
  Filter,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit3,
  Save,
  Copy,
  Check,
  SlidersHorizontal,
  MapPin,
  ArrowUp,
  FileSpreadsheet,
  Info,
  X,
  Undo2,
  Table as TableIcon
} from 'lucide-react';
import { getAccessToken, googleSignIn } from '../lib/auth';
import { updateFullSheetValues } from '../lib/sheetsApi';

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1mcnmLr92VJMsgIZbz1LeiVHMnI43pmB1Q6QOVVlYliA/edit?gid=852537996#gid=852537996';
const CSV_EXPORT_URL = 'https://docs.google.com/spreadsheets/d/1mcnmLr92VJMsgIZbz1LeiVHMnI43pmB1Q6QOVVlYliA/export?format=csv&gid=852537996';
const SPREADSHEET_ID = '1mcnmLr92VJMsgIZbz1LeiVHMnI43pmB1Q6QOVVlYliA';

const computeTargetHiddenColumns = (headerRow: string[]): Set<number> => {
  const hidden = new Set<number>();
  headerRow.forEach((h, colIdx) => {
    const norm = (h || '').trim().toUpperCase();
    const normCompact = norm.replace(/[\s_]+/g, '');
    const isTarget =
      norm.includes('PROJECT') ||
      normCompact.includes('SONUM') ||
      norm.includes('SO NUM') ||
      norm.includes('SITE NAME') ||
      normCompact.includes('SITENAME');
    if (!isTarget) {
      hidden.add(colIdx);
    }
  });
  return hidden;
};

interface ProgresDataViewProps {
  onBackToDashboard?: () => void;
  showToast?: (msg: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export const ProgresDataView: React.FC<ProgresDataViewProps> = ({
  showToast,
  searchTerm: externalSearchTerm,
  setSearchTerm: externalSetSearchTerm
}) => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [originalRows, setOriginalRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);
  const [isModified, setIsModified] = useState<boolean>(false);

  // Edit states
  const [editMode, setEditMode] = useState<boolean>(true); // Inline editable by default
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);
  const [editRowData, setEditRowData] = useState<string[]>([]);
  const [isSavingToSheets, setIsSavingToSheets] = useState<boolean>(false);
  const [isCopiedTable, setIsCopiedTable] = useState<boolean>(false);

  // Search & Filters
  const [internalSearchTerm, setInternalSearchTerm] = useState<string>('');
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = externalSetSearchTerm || setInternalSearchTerm;

  // Selected Row Detail Modal
  const [selectedRowDetail, setSelectedRowDetail] = useState<string[] | null>(null);

  // Hidden Columns
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const [showColumnPicker, setShowColumnPicker] = useState<boolean>(false);

  // Scroll to top
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);

  useEffect(() => {
    const mainEl = document.querySelector('main');
    const handleScroll = () => {
      const scrollTop = mainEl ? mainEl.scrollTop : window.scrollY;
      setShowScrollTop(scrollTop > 200);
    };

    if (mainEl) {
      mainEl.addEventListener('scroll', handleScroll);
    }
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    return () => {
      if (mainEl) {
        mainEl.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleScrollToTop = () => {
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Fetch function
  const fetchSheetData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(CSV_EXPORT_URL);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      const csvText = await response.text();

      Papa.parse<string[]>(csvText, {
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            const cleanData = results.data.filter((r) => r.some((cell) => cell && cell.trim() !== ''));
            if (cleanData.length > 0) {
              setHeaders(cleanData[0]);
              setHiddenColumns(computeTargetHiddenColumns(cleanData[0]));
              const rowData = cleanData.slice(1);
              setRows(rowData);
              setOriginalRows(JSON.parse(JSON.stringify(rowData)));
              setLastFetched(new Date());
              setIsModified(false);
            } else {
              setError('Tabel Progres tidak berisi data.');
            }
          } else {
            setError('Format data Progres tidak valid.');
          }
          setLoading(false);
        },
        error: (err: Error) => {
          setError(`Gagal memproses CSV: ${err.message}`);
          setLoading(false);
        }
      });
    } catch (err: unknown) {
      console.error('Fetch Google Sheet Progres failed:', err);
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(CSV_EXPORT_URL)}`;
        const responseProxy = await fetch(proxyUrl);
        const csvText = await responseProxy.text();

        Papa.parse<string[]>(csvText, {
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const cleanData = results.data.filter((r) => r.some((cell) => cell && cell.trim() !== ''));
              setHeaders(cleanData[0]);
              setHiddenColumns(computeTargetHiddenColumns(cleanData[0]));
              const rowData = cleanData.slice(1);
              setRows(rowData);
              setOriginalRows(JSON.parse(JSON.stringify(rowData)));
              setLastFetched(new Date());
              setIsModified(false);
            } else {
              setError('Tabel data kosong.');
            }
            setLoading(false);
          },
          error: (parseErr: Error) => {
            setError(`Gagal parsing CSV: ${parseErr.message}`);
            setLoading(false);
          }
        });
      } catch (proxyErr: unknown) {
        const errMessage = proxyErr instanceof Error ? proxyErr.message : String(proxyErr);
        setError(`Gagal mengambil data dari Database: ${errMessage}. Pastikan Sheet dibagikan secara publik.`);
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchSheetData();
  }, []);

  const toggleColumnVisibility = (colIdx: number) => {
    setHiddenColumns((prev) => {
      const next = new Set(prev);
      if (next.has(colIdx)) {
        next.delete(colIdx);
      } else {
        next.add(colIdx);
      }
      return next;
    });
  };

  // Filtered rows by search term
  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return rows;
    const term = searchTerm.toLowerCase();
    return rows.filter((row) =>
      row.some((cell) => cell && String(cell).toLowerCase().includes(term))
    );
  }, [rows, searchTerm]);

  // Handle cell edit
  const handleCellChange = (rowIndexInFiltered: number, colIdx: number, newValue: string) => {
    const actualRowIndex = rows.indexOf(filteredRows[rowIndexInFiltered]);
    if (actualRowIndex === -1) return;

    setRows((prev) => {
      const updated = [...prev];
      const newRow = [...updated[actualRowIndex]];
      newRow[colIdx] = newValue;
      updated[actualRowIndex] = newRow;
      return updated;
    });
    setIsModified(true);
  };

  // Add new row
  const handleAddRow = () => {
    const newEmptyRow = new Array(headers.length).fill('');
    // Put default index/number if first col is NO
    if (headers.length > 0 && headers[0].toUpperCase().includes('NO')) {
      newEmptyRow[0] = String(rows.length + 1);
    }
    setRows((prev) => [newEmptyRow, ...prev]);
    setIsModified(true);
    if (showToast) showToast('Baris baru berhasil ditambahkan di paling atas.');
  };

  // Delete row
  const handleDeleteRow = (rowIndexInFiltered: number) => {
    const actualRowIndex = rows.indexOf(filteredRows[rowIndexInFiltered]);
    if (actualRowIndex === -1) return;

    if (window.confirm('Apakah Anda yakin ingin menghapus baris data ini?')) {
      setRows((prev) => prev.filter((_, idx) => idx !== actualRowIndex));
      setIsModified(true);
      if (showToast) showToast('Baris berhasil dihapus.');
    }
  };

  // Reset edits to original
  const handleResetEdits = () => {
    if (window.confirm('Kembalikan semua data ke kondisi awal? Semua perubahan lokal akan dibatalkan.')) {
      setRows(JSON.parse(JSON.stringify(originalRows)));
      setIsModified(false);
      if (showToast) showToast('Data dikembalikan ke posisi awal.');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (headers.length === 0) return;
    const exportData = [headers, ...rows];
    const csvContent = Papa.unparse(exportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Data_Progres_Lap_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast('File CSV berhasil diunduh!');
  };

  // Copy table to Excel
  const handleCopyTableToExcel = async () => {
    if (rows.length === 0) {
      if (showToast) showToast('Tabel masih kosong.');
      return;
    }

    const tsvContent = [
      headers.join('\t'),
      ...rows.map((row) => row.join('\t'))
    ].join('\n');

    const htmlHeaders = headers.map((h) => `<th style="background-color: #f1f5f9; padding: 6px; border: 1px solid #ccc;">${h}</th>`).join('');
    const htmlRows = rows.map((row) => `
      <tr>
        ${row.map((cell) => `<td style="padding: 6px; border: 1px solid #ccc;">${(cell || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`).join('')}
      </tr>
    `).join('');

    const htmlContent = `
      <table border="1" style="border-collapse: collapse; font-family: sans-serif; font-size: 12px;">
        <thead><tr>${htmlHeaders}</tr></thead>
        <tbody>${htmlRows}</tbody>
      </table>
    `;

    try {
      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([tsvContent], { type: 'text/plain' });
        const htmlBlob = new Blob([htmlContent], { type: 'text/html' });
        await navigator.clipboard.write([
          new ClipboardItem({
            'text/plain': textBlob,
            'text/html': htmlBlob,
          })
        ]);
      } else {
        await navigator.clipboard.writeText(tsvContent);
      }

      setIsCopiedTable(true);
      setTimeout(() => setIsCopiedTable(false), 3000);
      if (showToast) showToast(`Berhasil menyalin ${rows.length} baris ke clipboard! Siap di-paste ke Excel.`);
    } catch (err) {
      console.error('Copy table error:', err);
      try {
        await navigator.clipboard.writeText(tsvContent);
        setIsCopiedTable(true);
        setTimeout(() => setIsCopiedTable(false), 3000);
        if (showToast) showToast(`Berhasil menyalin ${rows.length} baris ke clipboard! Siap di-paste ke Excel.`);
      } catch (fallbackErr) {
        if (showToast) showToast('Gagal menyalin isi tabel ke clipboard.');
      }
    }
  };

  // Save changes to Google Sheets API
  const handleSaveToGoogleSheets = async () => {
    setIsSavingToSheets(true);
    try {
      let token = await getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
      }

      if (!token) {
        throw new Error('Izin Google Account diperlukan untuk menyimpan langsung ke Google Sheets.');
      }

      // First line in sheet is headers, followed by rows
      const fullValues = [headers, ...rows];
      await updateFullSheetValues(SPREADSHEET_ID, 'PROGRES', fullValues, token);
      
      setOriginalRows(JSON.parse(JSON.stringify(rows)));
      setIsModified(false);
      if (showToast) showToast('Berhasil menyimpan semua perubahan data ke Google Sheets!');
    } catch (err: any) {
      console.error('Save to Google Sheets failed:', err);
      const msg = err?.message || String(err);
      if (showToast) {
        showToast(`Perubahan tersimpan secara lokal. (Sync Google Sheets: ${msg})`);
      } else {
        alert(`Gagal menyimpan ke Google Sheets: ${msg}`);
      }
    } finally {
      setIsSavingToSheets(false);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Loading Overlay */}
      <GlobalLoadingOverlay
        isVisible={loading}
        title="Memuat Data Progres"
        description="Menghubungkan ke Data Progres dan menyiapkan editor tabel..."
        smartStatus="Loading Progres Resources..."
      />

      {/* Row Detail Modal Popup */}
      {selectedRowDetail && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSelectedRowDetail(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col text-slate-900 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 border border-cyan-300 text-cyan-700 flex items-center justify-center font-bold shadow-sm">
                  <TableIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Detail Baris Data Progres</h3>
                  <p className="text-xs text-slate-500 font-medium">Informasi lengkap seluruh kolom data progres</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRowDetail(null)}
                className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 hover:text-slate-900 font-bold flex items-center justify-center text-sm transition-colors border border-slate-300 cursor-pointer"
                title="Tutup Modal"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {(() => {
                const isValueEmptyOrZeroOrDash = (val: any) => {
                  if (val === undefined || val === null) return true;
                  const str = String(val).trim();
                  if (str === '' || str === '-') return true;
                  const cleanStr = str.replace(/[%]/g, '').replace(/,/g, '.').trim();
                  if (cleanStr === '0' || /^0+(?:\.0+)?$/.test(cleanStr)) return true;
                  return false;
                };

                const validItems = headers
                  .map((h, i) => ({
                    header: h || `Kolom ${i + 1}`,
                    value: selectedRowDetail[i],
                  }))
                  .filter(item => !isValueEmptyOrZeroOrDash(item.value));

                if (validItems.length === 0) {
                  return (
                    <div className="py-8 text-center text-slate-500">
                      <p className="text-sm font-semibold">Tidak ada data terisi untuk ditampilkan.</p>
                      <p className="text-xs text-slate-400 mt-1">Seluruh kolom pada baris ini bernilai 0, kosong, atau &quot;-&quot;.</p>
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 shadow-inner">
                    {validItems.map((item, idx) => (
                      <div key={idx} className="px-4 py-3 hover:bg-slate-100/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-start gap-1 sm:gap-4">
                        <span className="text-[11px] font-extrabold text-cyan-800 uppercase tracking-wider shrink-0 sm:w-1/3 text-left">
                          {item.header}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 break-words text-left sm:w-2/3">
                          {String(item.value)}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedRowDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card & Toolbar */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl space-y-6 text-slate-900">
        
        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          
          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari data progres..."
                className="pl-9 pr-8 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-cyan-600 transition-all w-56 placeholder-slate-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Reset Edits */}
            {isModified && (
              <button
                onClick={handleResetEdits}
                className="px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-colors border border-amber-300 flex items-center gap-1.5 cursor-pointer"
                title="Batalkan perubahan lokal"
              >
                <Undo2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Reset Perubahan</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Copy Table to Excel */}
            <button
              type="button"
              onClick={handleCopyTableToExcel}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer border ${
                isCopiedTable
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300 hover:border-emerald-500'
              }`}
              title="Salin isi tabel ke clipboard untuk ditempelkan langsung ke Excel"
            >
              {isCopiedTable ? (
                <>
                  <Check className="w-4 h-4 text-white" />
                  <span>Tersalin ke Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-emerald-600" />
                  <span>Salin Ke Excel</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchSheetData}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-500 transition-colors shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Table Renderer */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center space-y-1">
              <span className="text-sm font-bold text-slate-800 block tracking-wide">Memuat Data Progres...</span>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Info className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">Tidak ada data progres ditemukan</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Coba ubah kata kunci pencarian Anda untuk menemukan data progres.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-300 shadow-sm custom-scrollbar bg-white">
            <table className="w-max min-w-full text-left text-xs table-auto bg-white text-slate-900">
              <thead className="bg-slate-100 text-slate-900 uppercase text-[10px] tracking-widest font-extrabold sticky top-0 z-10 border-b border-slate-300">
                <tr>
                  <th className="py-3 px-3.5 font-extrabold border-b border-slate-300 text-center w-auto whitespace-nowrap text-slate-900">
                    Aksi
                  </th>
                  {headers.map((h, colIdx) => {
                    if (hiddenColumns.has(colIdx)) return null;
                    const isSiteCol = (h || '').toLowerCase().includes('site');
                    return (
                      <th key={colIdx} className={`py-3 px-3.5 font-extrabold border-b border-slate-300 text-slate-900 ${isSiteCol ? 'w-full min-w-[150px]' : 'whitespace-nowrap w-auto'}`}>
                        {h || `Kolom ${colIdx + 1}`}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white text-slate-900">
                {filteredRows.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-slate-50 transition-colors group">
                    {/* Action buttons */}
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap w-auto">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedRowDetail(row)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-extrabold text-[11px] border border-cyan-300 transition-all cursor-pointer"
                          title="Lihat detail baris"
                        >
                          Detail
                        </button>
                      </div>
                    </td>

                    {/* Read-Only Cells */}
                    {headers.map((_, colIdx) => {
                      if (hiddenColumns.has(colIdx)) return null;
                      const cellValue = row[colIdx] !== undefined ? row[colIdx] : '';
                      const headerName = headers[colIdx] || '';
                      const headerLower = headerName.toLowerCase();
                      const isSiteCol = headerLower.includes('site');
                      const isDescCol = !isSiteCol && (headerLower.includes('uraian') || headerLower.includes('pekerjaan') || headerLower.includes('deskripsi'));
                      const baseMin = isDescCol ? 55 : 6;
                      const minChars = Math.max((cellValue ? String(cellValue).length : 0) + 2, (headerName ? headerName.length : 0) + 2, baseMin);

                      return (
                        <td key={colIdx} className={`py-1 px-2 font-medium text-slate-900 ${isSiteCol ? 'w-full' : 'whitespace-nowrap w-auto'}`}>
                          <input
                            type="text"
                            readOnly
                            value={cellValue}
                            style={isSiteCol ? { width: '100%' } : { width: `${minChars}ch` }}
                            className={`bg-transparent hover:bg-slate-100 text-slate-900 px-2 py-1.5 rounded-lg border border-transparent focus:outline-none transition-all font-sans text-xs cursor-default select-text ${isDescCol ? 'min-w-[350px] max-w-[650px]' : isSiteCol ? 'w-full min-w-[120px]' : 'min-w-[60px]'}`}
                            placeholder="-"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Floating Back to Top Button */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-[0_0_25px_rgba(6,182,212,0.4)] border border-cyan-300/40 transition-all duration-300 transform hover:scale-110 active:scale-95 flex items-center justify-center cursor-pointer animate-in fade-in slide-in-from-bottom-4 group"
          title="Kembali ke atas"
          aria-label="Kembali ke atas"
        >
          <ArrowUp className="w-5 h-5 stroke-[2.5] group-hover:-translate-y-0.5 transition-transform" />
        </button>
      )}

    </div>
  );
};
