import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { GlobalLoadingOverlay } from './GlobalLoadingOverlay';
import {
  Boxes,
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
  Table as TableIcon,
  Truck,
  FileText,
  User,
  ArrowRightLeft,
  ChevronDown
} from 'lucide-react';
import { getAccessToken, googleSignIn } from '../lib/auth';
import { updateFullSheetValues } from '../lib/sheetsApi';

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1mcnmLr92VJMsgIZbz1LeiVHMnI43pmB1Q6QOVVlYliA/edit?gid=743919527#gid=743919527';
const CSV_EXPORT_URL = 'https://docs.google.com/spreadsheets/d/1mcnmLr92VJMsgIZbz1LeiVHMnI43pmB1Q6QOVVlYliA/export?format=csv&gid=743919527';
const SPREADSHEET_ID = '1mcnmLr92VJMsgIZbz1LeiVHMnI43pmB1Q6QOVVlYliA';

interface MaterialDataViewProps {
  onBackToDashboard?: () => void;
  showToast?: (msg: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export const MaterialDataView: React.FC<MaterialDataViewProps> = ({
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

  // Edit & Save states
  const [isSavingToSheets, setIsSavingToSheets] = useState<boolean>(false);
  const [isCopiedTable, setIsCopiedTable] = useState<boolean>(false);

  // Search & Filter
  const [internalSearchTerm, setInternalSearchTerm] = useState<string>('');
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = externalSetSearchTerm || setInternalSearchTerm;
  const [selectedAktivitas, setSelectedAktivitas] = useState<string>('ALL');

  // Modal Detail
  const [selectedRowDetail, setSelectedRowDetail] = useState<{ row: string[]; index: number } | null>(null);

  // Hidden Columns
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set());
  const [showColumnPicker, setShowColumnPicker] = useState<boolean>(false);

  // Auto hide all columns except AKTIVITAS, ASAL MULA, and TUJUAN
  useEffect(() => {
    if (headers.length > 0) {
      const hidden = new Set<number>();
      headers.forEach((h, idx) => {
        const normalized = h.trim().toUpperCase();
        const isAktivitas = normalized.includes('AKTIVITAS');
        const isAsalMula = normalized.includes('ASAL MULA') || normalized.includes('ASAL');
        const isTujuan = normalized.includes('TUJUAN');

        if (!isAktivitas && !isAsalMula && !isTujuan) {
          hidden.add(idx);
        }
      });
      setHiddenColumns(hidden);
    }
  }, [headers]);

  // Scroll top
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
              const rowData = cleanData.slice(1);
              setRows(rowData);
              setOriginalRows(JSON.parse(JSON.stringify(rowData)));
              setLastFetched(new Date());
              setIsModified(false);
            } else {
              setError('Tabel Material tidak berisi data.');
            }
          } else {
            setError('Format data Material tidak valid.');
          }
          setLoading(false);
        },
        error: (err: Error) => {
          setError(`Gagal memproses CSV: ${err.message}`);
          setLoading(false);
        }
      });
    } catch (err: unknown) {
      console.error('Fetch Google Sheet Material failed:', err);
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(CSV_EXPORT_URL)}`;
        const responseProxy = await fetch(proxyUrl);
        const csvText = await responseProxy.text();

        Papa.parse<string[]>(csvText, {
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const cleanData = results.data.filter((r) => r.some((cell) => cell && cell.trim() !== ''));
              setHeaders(cleanData[0]);
              const rowData = cleanData.slice(1);
              setRows(rowData);
              setOriginalRows(JSON.parse(JSON.stringify(rowData)));
              setLastFetched(new Date());
              setIsModified(false);
            } else {
              setError('Tabel data Material kosong.');
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
        setError(`Gagal mengambil data Material: ${errMessage}. Pastikan Google Sheet dibagikan secara publik.`);
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

  // Aktivitas index column
  const aktivitasColIdx = useMemo(() => {
    return headers.findIndex((h) => h.toUpperCase().includes('AKTIVITAS'));
  }, [headers]);

  // Unique Aktivitas options for filter
  const uniqueAktivitasOptions = useMemo(() => {
    if (aktivitasColIdx === -1) return [];
    const setOptions = new Set<string>();
    rows.forEach((r) => {
      const val = (r[aktivitasColIdx] || '').trim().toUpperCase();
      if (val) setOptions.add(val);
    });
    return Array.from(setOptions).sort();
  }, [rows, aktivitasColIdx]);

  // Filtered rows
  const filteredRows = useMemo(() => {
    let result = rows;

    if (selectedAktivitas !== 'ALL' && aktivitasColIdx !== -1) {
      result = result.filter(
        (r) => (r[aktivitasColIdx] || '').trim().toUpperCase() === selectedAktivitas
      );
    }

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter((row) =>
        row.some((cell) => cell && String(cell).toLowerCase().includes(term))
      );
    }

    return result;
  }, [rows, selectedAktivitas, aktivitasColIdx, searchTerm]);

  // Statistics
  const totalGDLCount = useMemo(() => {
    const gdlColIdx = headers.findIndex((h) => h.toUpperCase().includes('GDL'));
    if (gdlColIdx === -1) return 0;
    const gdlSet = new Set<string>();
    rows.forEach((r) => {
      const val = (r[gdlColIdx] || '').trim();
      if (val) gdlSet.add(val);
    });
    return gdlSet.size;
  }, [rows, headers]);

  // Cell change
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

  // Add Row
  const handleAddRow = () => {
    const newEmptyRow = new Array(headers.length).fill('');
    if (headers.length > 0 && headers[0].toUpperCase().includes('NO')) {
      newEmptyRow[0] = String(rows.length + 1);
    }
    // Set today date as default for TANGGAL
    const tanggalIdx = headers.findIndex((h) => h.toUpperCase().includes('TANGGAL'));
    if (tanggalIdx !== -1) {
      const today = new Date().toISOString().split('T')[0];
      newEmptyRow[tanggalIdx] = today;
    }
    setRows((prev) => [newEmptyRow, ...prev]);
    setIsModified(true);
    if (showToast) showToast('Baris transaksi material baru ditambahkan di paling atas.');
  };

  // Reset Edits
  const handleReset = () => {
    setRows(JSON.parse(JSON.stringify(originalRows)));
    setIsModified(false);
    if (showToast) showToast('Perubahan dibatalkan, kembali ke data asli.');
  };

  // Save to Google Sheets
  const handleSaveToSheets = async () => {
    if (headers.length === 0) return;
    setIsSavingToSheets(true);

    try {
      let token = await getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        token = authRes?.accessToken || null;
      }

      if (!token) {
        throw new Error('Izin login Google diperlukan untuk menyimpan perubahan.');
      }

      const allValues = [headers, ...rows];
      await updateFullSheetValues(SPREADSHEET_ID, '743919527', allValues, token);

      setOriginalRows(JSON.parse(JSON.stringify(rows)));
      setIsModified(false);
      if (showToast) showToast('✅ Data Material berhasil disimpan ke Google Sheets!');
    } catch (err: unknown) {
      console.error('Error saving to sheets:', err);
      const msg = err instanceof Error ? err.message : String(err);
      if (showToast) showToast(`❌ Gagal menyimpan ke Sheets: ${msg}`);
      else alert(`Gagal menyimpan: ${msg}`);
    } finally {
      setIsSavingToSheets(false);
    }
  };

  // Copy Table
  const handleCopyTable = () => {
    if (headers.length === 0) return;
    const csvContent = Papa.unparse([headers, ...filteredRows]);
    navigator.clipboard.writeText(csvContent);
    setIsCopiedTable(true);
    if (showToast) showToast('Seluruh tabel material disalin ke clipboard!');
    setTimeout(() => setIsCopiedTable(false), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (headers.length === 0) return;
    const csvContent = Papa.unparse([headers, ...filteredRows]);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Laporan_Material_Pion_X_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast('File CSV Material berhasil diunduh.');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto w-full">
      {loading && (
        <GlobalLoadingOverlay
          title="Memuat Data Material"
          subtitle="Menghubungkan ke Google Sheets database material PION X..."
        />
      )}

      {/* Main Table Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-lg space-y-4">
        {/* Toolbar & Filters */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari GDL, PIC, Asal, Tujuan, No Polisi, Material..."
                className="w-full pl-10 pr-8 py-2.5 bg-slate-100 border border-slate-300 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Aktivitas Filter Dropdown */}
            {uniqueAktivitasOptions.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-cyan-600" />
                <select
                  value={selectedAktivitas}
                  onChange={(e) => setSelectedAktivitas(e.target.value)}
                  className="bg-slate-100 border border-slate-300 rounded-2xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="ALL" className="bg-white text-slate-800">Semua Aktivitas</option>
                  {uniqueAktivitasOptions.map((opt) => (
                    <option key={opt} value={opt} className="bg-white text-slate-800">
                      Aktivitas: {opt}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleCopyTable}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              {isCopiedTable ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-cyan-600" />}
              <span>{isCopiedTable ? 'Tersalin' : 'Salin Table'}</span>
            </button>

            {/* Reset Edits */}
            {isModified && (
              <button
                onClick={handleReset}
                className="px-3.5 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 cursor-pointer"
                title="Reset Perubahan"
              >
                <Undo2 className="w-3.5 h-3.5 text-amber-600" />
                <span>Reset</span>
              </button>
            )}

            {/* Save to Sheets */}
            {isModified && (
              <button
                onClick={handleSaveToSheets}
                disabled={isSavingToSheets}
                className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:opacity-90 text-white font-black text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <Save className={`w-3.5 h-3.5 text-white ${isSavingToSheets ? 'animate-spin' : ''}`} />
                <span>{isSavingToSheets ? 'Menyimpan...' : 'Simpan ke Google Sheets'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Column Picker Panel */}
        {showColumnPicker && headers.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
                Atur Tampilan Kolom Table ({headers.length - hiddenColumns.size} dari {headers.length} ditampilkan)
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setHiddenColumns(new Set())}
                  className="text-xs text-cyan-700 hover:underline cursor-pointer font-bold"
                >
                  Tampilkan Semua
                </button>
                <button
                  onClick={() => {
                    const hidden = new Set<number>();
                    headers.forEach((h, idx) => {
                      const normalized = h.trim().toUpperCase();
                      const isAktivitas = normalized.includes('AKTIVITAS');
                      const isAsalMula = normalized.includes('ASAL MULA') || normalized.includes('ASAL');
                      const isTujuan = normalized.includes('TUJUAN');

                      if (!isAktivitas && !isAsalMula && !isTujuan) {
                        hidden.add(idx);
                      }
                    });
                    setHiddenColumns(hidden);
                  }}
                  className="text-xs text-slate-500 hover:underline cursor-pointer"
                >
                  Hanya Aktivitas, Asal Mula & Tujuan
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-56 overflow-y-auto p-1 custom-scrollbar">
              {headers.map((h, colIdx) => {
                const isVisible = !hiddenColumns.has(colIdx);
                return (
                  <button
                    key={colIdx}
                    onClick={() => toggleColumnVisibility(colIdx)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all text-left truncate flex items-center justify-between border cursor-pointer ${
                      isVisible
                        ? 'bg-cyan-50 border-cyan-300 text-cyan-800'
                        : 'bg-slate-100 border-slate-200 text-slate-400 line-through'
                    }`}
                  >
                    <span className="truncate">{h || `Kolom ${colIdx + 1}`}</span>
                    {isVisible && <CheckCircle2 className="w-3 h-3 text-cyan-600 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Error Notification */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchSheetData}
              className="px-3 py-1 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-bold border border-rose-300 cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* Table Container */}
        <div className="w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-md">
          <table className="w-full text-left border-collapse text-xs table-auto">
            <thead className="bg-slate-100 text-slate-700 font-extrabold uppercase tracking-wider sticky top-0 z-10 border-b border-slate-200">
              <tr>
                <th className="p-1.5 sm:p-2 w-10 text-center border-r border-slate-200">Aksi</th>
                {headers.map((h, colIdx) => {
                  if (hiddenColumns.has(colIdx)) return null;
                  return (
                    <th
                      key={colIdx}
                      className="p-1.5 sm:p-2 border-r border-slate-200 whitespace-normal break-words text-[11px] leading-tight"
                    >
                      {h || `Kolom ${colIdx + 1}`}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 font-medium bg-white">
              {filteredRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={headers.length + 1}
                    className="px-6 py-12 text-center text-slate-500 italic"
                  >
                    {loading ? 'Sedang mengambil data material...' : 'Tidak ada data material yang cocok dengan pencarian.'}
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, rowIdx) => {
                  const actualRowIndex = rows.indexOf(row);
                  return (
                    <tr
                      key={rowIdx}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Action Cell */}
                      <td className="p-1 sm:p-1.5 text-center border-r border-slate-200 bg-slate-50/50">
                        <button
                          onClick={() => setSelectedRowDetail({ row, index: actualRowIndex })}
                          className="px-2 py-1 rounded-lg bg-cyan-50 hover:bg-cyan-100 text-cyan-700 border border-cyan-300 text-[10px] font-bold cursor-pointer transition-all shadow-sm"
                          title="Lihat Detail Lengkap Baris Ini"
                        >
                          Detail
                        </button>
                      </td>

                      {/* Data Cells */}
                      {row.map((cellValue, colIdx) => {
                        if (hiddenColumns.has(colIdx)) return null;

                        return (
                          <td
                            key={colIdx}
                            className="p-1 sm:p-1.5 border-r border-slate-200 whitespace-normal break-words min-w-0 select-text"
                          >
                            <span className="px-1 py-0.5 text-[11px] text-slate-800 font-medium block select-text cursor-text">
                              {cellValue || '-'}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info */}
        <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 pt-2 gap-2">
          <span>
            Menampilkan <strong className="text-slate-800">{filteredRows.length}</strong> dari <strong className="text-slate-800">{rows.length}</strong> baris transaksi material
          </span>
          {lastFetched && (
            <span>Terakhir diperbarui: {lastFetched.toLocaleTimeString()} WIB</span>
          )}
        </div>
      </div>

      {/* Row Detail Modal */}
      {selectedRowDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-4xl w-full max-h-[85vh] overflow-y-auto custom-scrollbar shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 border border-cyan-300 flex items-center justify-center text-cyan-700">
                  <Boxes className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    Detail Baris Material #{selectedRowDetail.index + 1}
                  </h3>
                  <p className="text-xs text-slate-600">
                    GDL: <span className="text-cyan-700 font-bold">{selectedRowDetail.row[4] || 'N/A'}</span> • Tanggal: {selectedRowDetail.row[1] || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Structured Detail Grid */}
            <div className="space-y-6">
              {/* Group 1: Informasi Logistik */}
              <div>
                <h4 className="text-xs font-black uppercase text-cyan-700 tracking-wider mb-3 flex items-center gap-2">
                  <Truck className="w-3.5 h-3.5 text-cyan-700" />
                  <span>Informasi Logistik & Pengiriman</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  {headers.slice(0, 11).map((h, idx) => (
                    <div key={idx} className="space-y-1">
                      <span className="text-[10px] text-slate-500 uppercase font-bold block truncate">{h || `Kolom ${idx + 1}`}</span>
                      <span className="text-xs font-bold text-slate-800 block break-words bg-white px-2.5 py-1.5 rounded-xl border border-slate-200">
                        {selectedRowDetail.row[idx] || '-'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Group 2: Volume Item Material */}
              {headers.length > 11 && (
                <div>
                  <h4 className="text-xs font-black uppercase text-emerald-700 tracking-wider mb-3 flex items-center gap-2">
                    <Boxes className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Rincian Item Material ({headers.length - 11} Item)</span>
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    {headers.slice(11).map((h, idxOffset) => {
                      const actualColIdx = idxOffset + 11;
                      const val = selectedRowDetail.row[actualColIdx];
                      const hasVal = val && val.trim() !== '' && val.trim() !== '0';

                      return (
                        <div
                          key={actualColIdx}
                          className={`space-y-1 p-2.5 rounded-xl border transition-all ${
                            hasVal
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                              : 'bg-white border-slate-200 text-slate-400 opacity-60'
                          }`}
                        >
                          <span className="text-[10px] uppercase font-bold block truncate">{h}</span>
                          <span className={`text-xs font-black block ${hasVal ? 'text-emerald-800' : 'text-slate-400'}`}>
                            {val || '0'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="px-6 py-2.5 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition-all cursor-pointer border border-slate-300"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Scroll-to-Top Button */}
      {showScrollTop && (
        <button
          onClick={handleScrollToTop}
          className="fixed bottom-6 right-6 z-40 p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-[0_0_25px_rgba(6,182,212,0.5)] hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="Kembali ke Atas"
        >
          <ArrowUp className="w-5 h-5 stroke-[3]" />
        </button>
      )}
    </div>
  );
};
