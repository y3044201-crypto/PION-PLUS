import React, { useState } from 'react';
import { 
  ArrowUpDown, 
  Trash2, 
  Plus, 
  Copy, 
  Edit3, 
  Check, 
  X, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { columnIndexToLetter } from '../lib/sheetsApi';

interface TableViewProps {
  headers: string[];
  rows: string[][];
  searchQuery: string;
  onCellEdit: (rowIndex: number, colIndex: number, newValue: string) => void;
  onHeaderEdit: (colIndex: number, newHeaderName: string) => void;
  onAddRow: (rowValues: string[]) => void;
  onDeleteRow: (rowIndex: number) => void;
  onDuplicateRow: (rowIndex: number) => void;
  onAddColumn: (columnName: string) => void;
}

export const TableView: React.FC<TableViewProps> = ({
  headers,
  rows,
  searchQuery,
  onCellEdit,
  onHeaderEdit,
  onAddRow,
  onDeleteRow,
  onDuplicateRow,
  onAddColumn,
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [cellValue, setCellValue] = useState('');
  const [editingHeader, setEditingHeader] = useState<number | null>(null);
  const [headerValue, setHeaderValue] = useState('');

  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [newRowData, setNewRowData] = useState<string[]>(Array(headers.length).fill(''));
  const [newColName, setNewColName] = useState('');
  const [showAddColInput, setShowAddColInput] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // Filter rows by search query
  const filteredRowsWithOriginalIndex = rows
    .map((row, idx) => ({ row, originalIndex: idx }))
    .filter(({ row }) => {
      if (!searchQuery.trim()) return true;
      return row.some((cell) => cell.toLowerCase().includes(searchQuery.toLowerCase()));
    });

  // Sort rows if sortCol is active
  const sortedRows = [...filteredRowsWithOriginalIndex].sort((a, b) => {
    if (sortCol === null) return 0;
    const valA = a.row[sortCol] || '';
    const valB = b.row[sortCol] || '';

    const numA = parseFloat(valA);
    const numB = parseFloat(valB);

    if (!isNaN(numA) && !isNaN(numB)) {
      return sortDir === 'asc' ? numA - numB : numB - numA;
    }

    return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
  });

  // Pagination
  const totalPages = Math.ceil(sortedRows.length / pageSize) || 1;
  const paginatedRows = sortedRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const handleStartCellEdit = (rowIndex: number, colIndex: number, currentVal: string) => {
    setEditingCell({ row: rowIndex, col: colIndex });
    setCellValue(currentVal);
  };

  const handleSaveCell = () => {
    if (editingCell) {
      onCellEdit(editingCell.row, editingCell.col, cellValue);
      setEditingCell(null);
    }
  };

  const handleStartHeaderEdit = (colIndex: number, currentName: string) => {
    setEditingHeader(colIndex);
    setHeaderValue(currentName);
  };

  const handleSaveHeader = (colIndex: number) => {
    if (headerValue.trim()) {
      onHeaderEdit(colIndex, headerValue.trim());
    }
    setEditingHeader(null);
  };

  const handleSort = (colIndex: number) => {
    if (sortCol === colIndex) {
      if (sortDir === 'asc') setSortDir('desc');
      else {
        setSortCol(null);
        setSortDir('asc');
      }
    } else {
      setSortCol(colIndex);
      setSortDir('asc');
    }
  };

  const handleAddRowSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAddRow(newRowData);
    setNewRowData(Array(headers.length).fill(''));
  };

  const handleAddColumnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim()) return;
    onAddColumn(newColName.trim());
    setNewColName('');
    setShowAddColInput(false);
  };

  return (
    <div className="space-y-4">
      
      {/* Grid Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            
            {/* Table Header */}
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-semibold select-none">
                <th className="w-12 py-3 px-3 text-center border-r border-slate-800 bg-slate-950/80 sticky left-0 z-10">
                  #
                </th>

                {headers.map((header, colIdx) => {
                  const colLetter = columnIndexToLetter(colIdx);
                  return (
                    <th
                      key={colIdx}
                      className="py-3 px-4 border-r border-slate-800 min-w-[140px] max-w-[240px] group relative"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            {colLetter}
                          </span>

                          {editingHeader === colIdx ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                value={headerValue}
                                onChange={(e) => setHeaderValue(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveHeader(colIdx);
                                  if (e.key === 'Escape') setEditingHeader(null);
                                }}
                                autoFocus
                                className="bg-slate-900 border border-emerald-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-28"
                              />
                              <button onClick={() => handleSaveHeader(colIdx)} className="text-emerald-400 p-0.5">
                                <Check className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="truncate text-slate-200 font-bold" title={header}>
                              {header}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleSort(colIdx)}
                            className={`p-1 rounded hover:bg-slate-800 transition-colors ${
                              sortCol === colIdx ? 'text-emerald-400' : 'text-slate-500 opacity-0 group-hover:opacity-100'
                            }`}
                            title="Urutkan Kolom"
                          >
                            <ArrowUpDown className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleStartHeaderEdit(colIdx, header)}
                            className="p-1 rounded text-slate-500 opacity-0 group-hover:opacity-100 hover:bg-slate-800 hover:text-slate-300 transition-colors"
                            title="Ubah Nama Kolom"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </th>
                  );
                })}

                <th className="py-3 px-4 w-28 text-center bg-slate-950">
                  {showAddColInput ? (
                    <form onSubmit={handleAddColumnSubmit} className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Nama Kolom"
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        className="bg-slate-900 border border-emerald-500 rounded px-2 py-0.5 text-xs text-white w-20 focus:outline-none"
                        autoFocus
                      />
                      <button type="submit" className="text-emerald-400">
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button type="button" onClick={() => setShowAddColInput(false)} className="text-slate-400">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <button
                      onClick={() => setShowAddColInput(true)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium inline-flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Kolom
                    </button>
                  )}
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-800/60">
              {paginatedRows.length === 0 ? (
                <tr>
                  <td colSpan={headers.length + 2} className="py-12 text-center text-slate-400 text-xs">
                    {searchQuery ? 'Tidak ada data yang sesuai dengan pencarian.' : 'Lembar kerja ini masih kosong.'}
                  </td>
                </tr>
              ) : (
                paginatedRows.map(({ row, originalIndex }) => {
                  const sheetRowIndex = originalIndex + 1; // 1-based data index (excluding header)
                  return (
                    <tr key={originalIndex} className="hover:bg-slate-800/40 transition-colors group">
                      
                      {/* Row Index */}
                      <td className="py-2.5 px-3 text-center text-[11px] font-mono text-slate-500 border-r border-slate-800/60 bg-slate-950/40 sticky left-0 z-10">
                        {sheetRowIndex}
                      </td>

                      {/* Cells */}
                      {headers.map((_, colIdx) => {
                        const cellVal = row[colIdx] || '';
                        const isEditing = editingCell?.row === originalIndex && editingCell?.col === colIdx;

                        return (
                          <td
                            key={colIdx}
                            onClick={() => !isEditing && handleStartCellEdit(originalIndex, colIdx, cellVal)}
                            className={`py-2.5 px-4 border-r border-slate-800/60 transition-all cursor-pointer relative ${
                              isEditing ? 'bg-emerald-950/40 outline outline-2 outline-emerald-500' : 'hover:bg-slate-800/60'
                            }`}
                          >
                            {isEditing ? (
                              <div className="flex items-center gap-1">
                                <input
                                  type="text"
                                  value={cellValue}
                                  onChange={(e) => setCellValue(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveCell();
                                    if (e.key === 'Escape') setEditingCell(null);
                                  }}
                                  autoFocus
                                  className="w-full bg-slate-950 text-white text-xs px-2 py-1 rounded border border-emerald-500 focus:outline-none"
                                />
                                <button
                                  onClick={handleSaveCell}
                                  className="p-1 text-emerald-400 hover:bg-emerald-500/20 rounded"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-200 block truncate max-w-[240px]">
                                {cellVal !== '' ? cellVal : <span className="text-slate-600 italic">-</span>}
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Row Actions */}
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onDuplicateRow(originalIndex)}
                            className="p-1 rounded text-slate-400 hover:text-emerald-400 hover:bg-slate-800 transition-colors"
                            title="Duplikasi Baris"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => onDeleteRow(originalIndex)}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                            title="Hapus Baris"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Add Row Input Bar Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form onSubmit={handleAddRowSubmit} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-400" />
                Tambah Baris Data Baru
              </span>
              <span className="text-[11px] text-slate-500">
                Isi kolom di bawah lalu tekan Tambah Baris
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {headers.map((header, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[10px] text-slate-400 truncate block font-mono">
                    {columnIndexToLetter(idx)}: {header}
                  </label>
                  <input
                    type="text"
                    placeholder={`Isi ${header}`}
                    value={newRowData[idx] || ''}
                    onChange={(e) => {
                      const updated = [...newRowData];
                      updated[idx] = e.target.value;
                      setNewRowData(updated);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                Tambah Baris Baru
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Pagination & Count Summary Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400 px-1">
        <div>
          Menampilkan <span className="text-slate-200 font-semibold">{paginatedRows.length}</span> dari{' '}
          <span className="text-slate-200 font-semibold">{rows.length}</span> total baris
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 transition-colors text-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-slate-300 font-medium">
              Halaman {currentPage} dari {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 disabled:opacity-40 hover:bg-slate-800 transition-colors text-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
