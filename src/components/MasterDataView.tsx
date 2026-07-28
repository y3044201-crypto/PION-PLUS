import React, { useState, useEffect, useMemo } from 'react';
import Papa from 'papaparse';
import { GlobalLoadingOverlay } from './GlobalLoadingOverlay';
import { 
  Database, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  Download, 
  Filter, 
  Layers, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  ArrowUpDown,
  Table as TableIcon,
  Info,
  SlidersHorizontal,
  MapPin,
  ArrowUp
} from 'lucide-react';

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1mcnmLr92VJMsgIZbz1LeiVHMnI43pmB1Q6QOVVlYliA/edit?gid=1393425582#gid=1393425582';
const CSV_EXPORT_URL = 'https://docs.google.com/spreadsheets/d/1mcnmLr92VJMsgIZbz1LeiVHMnI43pmB1Q6QOVVlYliA/export?format=csv&gid=1393425582';

interface MasterDataViewProps {
  onBackToDashboard?: () => void;
  showToast?: (msg: string) => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
}

export const MasterDataView: React.FC<MasterDataViewProps> = ({
  onBackToDashboard,
  showToast,
  searchTerm: externalSearchTerm,
  setSearchTerm: externalSetSearchTerm
}) => {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  // Search & Filters
  const [internalSearchTerm, setInternalSearchTerm] = useState<string>('');
  const searchTerm = externalSearchTerm !== undefined ? externalSearchTerm : internalSearchTerm;
  const setSearchTerm = externalSetSearchTerm || setInternalSearchTerm;
  const [selectedOperator, setSelectedOperator] = useState<string>('ALL');
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [selectedRegional, setSelectedRegional] = useState<string>('ALL');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(999999);

  // Selected Row Modal
  const [selectedRowDetail, setSelectedRowDetail] = useState<string[] | null>(null);

  // Hidden Columns state (defaulting to hiding all except selected columns: col 2, 5, 7)
  const [hiddenColumns, setHiddenColumns] = useState<Set<number>>(new Set([0, 1, 3, 4, 6, 8, 9, 10, 11, 12, 13, 14, 15]));
  const [showColumnPicker, setShowColumnPicker] = useState<boolean>(false);

  // Back to Top button state & logic
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

    // Initial check
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

  // Set default hidden columns when headers arrive
  useEffect(() => {
    if (headers.length > 0) {
      const keepIndices = new Set([2, 5, 7]);
      const hidden = new Set<number>();
      headers.forEach((_, idx) => {
        if (!keepIndices.has(idx)) {
          hidden.add(idx);
        }
      });
      setHiddenColumns(hidden);
    }
  }, [headers]);

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

  // Fetch function
  const fetchSheetData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try direct CSV fetch
      const response = await fetch(CSV_EXPORT_URL);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}`);
      }
      const csvText = await response.text();

      Papa.parse<string[]>(csvText, {
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            // Filter out empty trailing rows
            const cleanData = results.data.filter((r) => r.some((cell) => cell && cell.trim() !== ''));
            if (cleanData.length > 0) {
              setHeaders(cleanData[0]);
              setRows(cleanData.slice(1));
              setLastFetched(new Date());
            } else {
              setError('Tabel Data tidak berisi data.');
            }
          } else {
            setError('Format data tidak valid.');
          }
          setLoading(false);
        },
        error: (err: Error) => {
          setError(`Gagal memproses CSV: ${err.message}`);
          setLoading(false);
        }
      });
    } catch (err: unknown) {
      console.error('Fetch Google Sheet failed:', err);
      // Try secondary proxy endpoint if direct fetch fails
      try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(CSV_EXPORT_URL)}`;
        const responseProxy = await fetch(proxyUrl);
        const csvText = await responseProxy.text();

        Papa.parse<string[]>(csvText, {
          complete: (results) => {
            if (results.data && results.data.length > 0) {
              const cleanData = results.data.filter((r) => r.some((cell) => cell && cell.trim() !== ''));
              setHeaders(cleanData[0]);
              setRows(cleanData.slice(1));
              setLastFetched(new Date());
            } else {
              setError('Tabel Data kosong.');
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

  // Indices for Key Columns (Operator: col 3, Project: col 2, Regional, Site Name: col 7)
  const operatorIndex = useMemo(() => {
    return headers.findIndex((h) => h.toUpperCase().includes('OPERATOR'));
  }, [headers]);

  const projectIndex = useMemo(() => {
    return headers.findIndex((h) => h.toUpperCase().includes('PROJECT'));
  }, [headers]);

  const regionalIndex = useMemo(() => {
    return headers.findIndex((h) => {
      const norm = (h || '').trim().toUpperCase();
      return norm === 'KODE REGIONAL' || norm.includes('KODE REGIONAL') || norm === 'REGIONAL' || norm.includes('REGIONAL');
    });
  }, [headers]);

  // Unique Operators List
  const uniqueOperators = useMemo(() => {
    if (operatorIndex === -1) return [];
    const ops = new Set<string>();
    rows.forEach((r) => {
      const val = r[operatorIndex];
      if (val && val.trim()) ops.add(val.trim());
    });
    return Array.from(ops).sort();
  }, [rows, operatorIndex]);

  // Unique Projects List
  const uniqueProjects = useMemo(() => {
    if (projectIndex === -1) return [];
    const projs = new Set<string>();
    rows.forEach((r) => {
      const val = r[projectIndex];
      if (val && val.trim()) projs.add(val.trim());
    });
    return Array.from(projs).sort();
  }, [rows, projectIndex]);

  // Unique Regionals List
  const uniqueRegionals = useMemo(() => {
    if (regionalIndex === -1) return [];
    const regs = new Set<string>();
    rows.forEach((r) => {
      const val = r[regionalIndex];
      if (val && val.trim()) regs.add(val.trim());
    });
    return Array.from(regs).sort();
  }, [rows, regionalIndex]);

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      // Filter by Operator
      if (selectedOperator !== 'ALL' && operatorIndex !== -1) {
        if (row[operatorIndex] !== selectedOperator) return false;
      }
      // Filter by Project
      if (selectedProject !== 'ALL' && projectIndex !== -1) {
        if (row[projectIndex] !== selectedProject) return false;
      }
      // Filter by Regional
      if (selectedRegional !== 'ALL' && regionalIndex !== -1) {
        if (row[regionalIndex] !== selectedRegional) return false;
      }
      // Search term
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        const matches = row.some((cell) => cell && cell.toLowerCase().includes(term));
        if (!matches) return false;
      }
      return true;
    });
  }, [rows, selectedOperator, selectedProject, selectedRegional, searchTerm, operatorIndex, projectIndex, regionalIndex]);

  // Pagination Logic
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // Reset to page 1 when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedOperator, selectedProject, selectedRegional, pageSize]);

  // Download CSV Export
  const handleExportCSV = () => {
    if (headers.length === 0) return;
    const exportData = [headers, ...filteredRows];
    const csvContent = Papa.unparse(exportData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Master_Data_Google_Sheet_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (showToast) showToast('File CSV berhasil diunduh!');
  };

  // Calculate modal title (Site Name or fallback)
  const detailModalTitle = useMemo(() => {
    if (!selectedRowDetail || headers.length === 0) return 'Detail Baris Data Master';
    const siteNameIdx = headers.findIndex(h => {
      const norm = (h || '').trim().toLowerCase();
      return norm === 'site name' || norm === 'sitename' || norm === 'site_name' || norm === 'nama site' || norm.includes('site name');
    });
    const fallbackSiteIdx = siteNameIdx !== -1 ? siteNameIdx : headers.findIndex(h => (h || '').toLowerCase().includes('site'));
    const actualIdx = siteNameIdx !== -1 ? siteNameIdx : fallbackSiteIdx;
    if (actualIdx !== -1 && selectedRowDetail[actualIdx]) {
      const val = String(selectedRowDetail[actualIdx]).trim();
      if (val) return val;
    }
    return 'Detail Baris Data Master';
  }, [selectedRowDetail, headers]);

  // Calculate modal subtitle ([Operator] - [Project] or fallback)
  const detailModalSubtitle = useMemo(() => {
    if (!selectedRowDetail || headers.length === 0) return 'Pratinjau lengkap kolom dan atribut baris terpilih';
    
    const operatorIdx = headers.findIndex(h => {
      const norm = (h || '').trim().toLowerCase();
      return norm === 'operator' || norm === 'op' || norm.includes('operator');
    });

    const projectIdx = headers.findIndex(h => {
      const norm = (h || '').trim().toLowerCase();
      return norm === 'project' || norm === 'nama project' || norm === 'project name' || norm.includes('project');
    });

    const operatorVal = operatorIdx !== -1 && selectedRowDetail[operatorIdx] ? String(selectedRowDetail[operatorIdx]).trim() : '';
    const projectVal = projectIdx !== -1 && selectedRowDetail[projectIdx] ? String(selectedRowDetail[projectIdx]).trim() : '';

    if (operatorVal && projectVal) {
      return `${operatorVal} - ${projectVal}`;
    } else if (operatorVal) {
      return operatorVal;
    } else if (projectVal) {
      return projectVal;
    }

    return 'Pratinjau lengkap kolom dan atribut baris terpilih';
  }, [selectedRowDetail, headers]);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Global Ultra-Premium Loading Overlay */}
      <GlobalLoadingOverlay
        isVisible={loading}
        title="Memuat Data Master"
        description="Menghubungkan ke Database Cloud dan memverifikasi struktur dataset master..."
        smartStatus="Loading Master Resources..."
      />

      {/* Detail Modal */}
      {selectedRowDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-hidden shadow-2xl border border-slate-200 flex flex-col">
            <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-100 border border-cyan-300 text-cyan-700 flex items-center justify-center font-bold shadow-sm">
                  <TableIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{detailModalTitle}</h3>
                  <p className="text-xs text-slate-600 font-medium">{detailModalSubtitle}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRowDetail(null)}
                className="w-8 h-8 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-600 hover:text-slate-900 font-bold flex items-center justify-center text-sm transition-colors border border-slate-300 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
              {(() => {
                const visibleItems = headers.map((h, i) => ({
                  header: h || `Kolom ${i + 1}`,
                  value: selectedRowDetail[i],
                  index: i
                })).filter(item => {
                  const headerClean = item.header.trim().toLowerCase();
                  if (headerClean === 'no' || headerClean === 'no.' || headerClean === 'nomor' || headerClean === 'no_') return false;

                  const val = item.value;
                  if (val === undefined || val === null) return false;
                  const str = String(val).trim();
                  if (str === '' || str === '-' || str.toLowerCase() === 'null' || str.toLowerCase() === 'undefined') return false;
                  if (str === '0' || str === '0.0' || str === '0,0' || (!isNaN(Number(str)) && Number(str) === 0)) return false;
                  return true;
                });

                if (visibleItems.length === 0) {
                  return (
                    <div className="text-center py-8 text-slate-500 text-xs font-medium">
                      Tidak ada detail data untuk ditampilkan (semua item kosong atau bernilai 0).
                    </div>
                  );
                }

                return (
                  <div className="flex flex-col divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/50 shadow-inner">
                    {visibleItems.map((item) => (
                      <div key={item.index} className="px-4 py-3 hover:bg-slate-100/60 transition-colors flex flex-col sm:flex-row sm:items-center justify-start gap-1 sm:gap-4">
                        <span className="text-[11px] font-extrabold text-cyan-700 uppercase tracking-wider shrink-0 sm:w-1/3 text-left">
                          {item.header}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-700 break-words text-left sm:w-2/3">
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
                onClick={() => setSelectedRowDetail(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all border border-slate-300 cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Table Card & Filters */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-lg space-y-6">
        
        {/* Filters & Actions Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
          
          {/* Dropdown Filters & Kolom Button */}
          <div className="flex items-center gap-3 flex-wrap">
            
            {/* 1. Regional Filter (FAR LEFT) */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedRegional}
                  onChange={(e) => setSelectedRegional(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="ALL" className="bg-white text-slate-800">Regional</option>
                  {uniqueRegionals.map((reg) => (
                    <option key={reg} value={reg} className="bg-white text-slate-800">{reg}</option>
                  ))}
                </select>
                <MapPin className="w-3.5 h-3.5 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 2. Project Filter (NEXT TO REGIONAL) */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="ALL" className="bg-white text-slate-800">Project</option>
                  {uniqueProjects.map((p) => (
                    <option key={p} value={p} className="bg-white text-slate-800">{p}</option>
                  ))}
                </select>
                <Layers className="w-3.5 h-3.5 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 3. Operator Filter */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <select
                  value={selectedOperator}
                  onChange={(e) => setSelectedOperator(e.target.value)}
                  className="pl-9 pr-8 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-cyan-500 transition-all appearance-none cursor-pointer"
                >
                  <option value="ALL" className="bg-white text-slate-800">Operator</option>
                  {uniqueOperators.map((op) => (
                    <option key={op} value={op} className="bg-white text-slate-800">{op}</option>
                  ))}
                </select>
                <Filter className="w-3.5 h-3.5 text-cyan-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* 4. Tombol Atur Kolom */}
            <button
              onClick={() => setShowColumnPicker(!showColumnPicker)}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                showColumnPicker 
                  ? 'bg-cyan-100 border-cyan-300 text-cyan-800' 
                  : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
              }`}
              title="Atur Kolom Tampil"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-cyan-600" />
              <span>Kolom</span>
            </button>

            {(selectedOperator !== 'ALL' || selectedProject !== 'ALL' || selectedRegional !== 'ALL' || searchTerm) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedOperator('ALL');
                  setSelectedProject('ALL');
                  setSelectedRegional('ALL');
                }}
                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors border border-rose-200 cursor-pointer"
              >
                Reset Filter
              </button>
            )}

          </div>

        </div>

        {/* Column Picker Panel */}
        {showColumnPicker && headers.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-cyan-700 uppercase tracking-wider">
                Pilih Kolom Tampil
              </span>
              <button
                onClick={() => setHiddenColumns(new Set())}
                className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
              >
                Tampilkan Semua
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
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

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-4">
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
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-center space-y-1">
              <span className="text-sm font-bold text-slate-700 block tracking-wide">Tunggu Sebentar. . .</span>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Info className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="text-base font-bold text-slate-800">Tidak ada data ditemukan</h4>
            <p className="text-xs text-slate-600 max-w-sm mx-auto">
              Tidak ada baris yang sesuai dengan kata kunci pencarian atau filter terpilih.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedOperator('ALL');
                setSelectedProject('ALL');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-300"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-md bg-white custom-scrollbar">
            <table className="w-max min-w-full text-left text-xs table-auto">
              <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-widest font-extrabold sticky top-0 z-10 border-b border-slate-200">
                <tr>
                  <th className="py-3 px-3.5 font-extrabold border-b border-slate-200 text-center w-auto whitespace-nowrap">
                    Aksi
                  </th>
                  {headers.map((h, colIdx) => {
                    if (hiddenColumns.has(colIdx)) return null;
                    return (
                      <th key={colIdx} className="py-3 px-3.5 font-extrabold border-b border-slate-200 whitespace-nowrap w-auto">
                        {h || `Kolom ${colIdx + 1}`}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedRows.map((row, rowIdx) => (
                  <tr 
                    key={rowIdx} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    <td className="py-2.5 px-3.5 text-center whitespace-nowrap w-auto">
                      <button
                        onClick={() => setSelectedRowDetail(row)}
                        className="px-3 py-1 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-700 font-extrabold text-[11px] border border-cyan-300 transition-all shadow-sm cursor-pointer"
                        title="Lihat detail baris"
                      >
                        Detail
                      </button>
                    </td>
                    {headers.map((_, colIdx) => {
                      if (hiddenColumns.has(colIdx)) return null;
                      const cellValue = row[colIdx];
                      const isHighlighted = colIdx === 0 || colIdx === 1 || colIdx === 2 || colIdx === 7;
                      return (
                        <td 
                          key={colIdx} 
                          className={`py-2.5 px-3.5 font-medium whitespace-nowrap w-auto select-text cursor-text ${
                            isHighlighted ? 'text-slate-900 font-bold' : 'text-slate-600'
                          }`}
                        >
                          {cellValue !== undefined && cellValue !== '' ? cellValue : '-'}
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
