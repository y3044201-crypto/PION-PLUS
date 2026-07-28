import React, { useState } from 'react';
import { 
  Table, 
  FileText, 
  BarChart3, 
  Search, 
  Plus, 
  Trash2, 
  Download, 
  RefreshCw, 
  ExternalLink, 
  Sparkles,
  Layers
} from 'lucide-react';
import { ActiveView, SheetTab, SyncStatus } from '../types';
import { TableView } from './TableView';
import { FormView } from './FormView';
import { AnalyticsView } from './AnalyticsView';

interface SpreadsheetEditorProps {
  sheetTabs: SheetTab[];
  activeTabTitle: string;
  onSelectTab: (sheetTitle: string) => void;
  onAddTab: (newTabTitle: string) => void;
  onDeleteTab: (sheetId: number, tabTitle: string) => void;

  headers: string[];
  rows: string[][];

  syncStatus: SyncStatus;
  autoSync: boolean;
  onToggleAutoSync: (enabled: boolean) => void;
  onManualSync: () => void;
  onRefresh: () => void;

  onCellEdit: (rowIndex: number, colIndex: number, newValue: string) => void;
  onHeaderEdit: (colIndex: number, newHeaderName: string) => void;
  onAddRow: (rowValues: string[]) => void;
  onDeleteRowRequest: (rowIndex: number) => void;
  onDuplicateRow: (rowIndex: number) => void;
  onAddColumn: (columnName: string) => void;

  spreadsheetUrl?: string;
  isSandboxMode: boolean;
}

export const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({
  sheetTabs,
  activeTabTitle,
  onSelectTab,
  onAddTab,
  onDeleteTab,
  headers,
  rows,
  syncStatus,
  autoSync,
  onToggleAutoSync,
  onManualSync,
  onRefresh,
  onCellEdit,
  onHeaderEdit,
  onAddRow,
  onDeleteRowRequest,
  onDuplicateRow,
  onAddColumn,
  spreadsheetUrl,
  isSandboxMode,
}) => {
  const [activeView, setActiveView] = useState<ActiveView>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTabInput, setNewTabInput] = useState('');
  const [isAddingTab, setIsAddingTab] = useState(false);

  const handleCreateTabSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabInput.trim()) return;
    onAddTab(newTabInput.trim());
    setNewTabInput('');
    setIsAddingTab(false);
  };

  const handleExportCSV = () => {
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTabTitle || 'data'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const jsonObjects = rows.map((row) => {
      const obj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        obj[h || `Kolom_${idx + 1}`] = row[idx] || '';
      });
      return obj;
    });

    const blob = new Blob([JSON.stringify(jsonObjects, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${activeTabTitle || 'data'}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
      
      {/* Worksheet Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-0 overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {sheetTabs.map((tab) => {
            const isActive = tab.title === activeTabTitle;
            return (
              <div
                key={tab.sheetId}
                className={`group px-3.5 py-2 rounded-t-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap border-t border-x ${
                  isActive
                    ? 'bg-slate-900 border-slate-800 text-emerald-400 shadow-lg'
                    : 'bg-slate-950/40 border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
                onClick={() => onSelectTab(tab.title)}
              >
                <Layers className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{tab.title}</span>

                {sheetTabs.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTab(tab.sheetId, tab.title);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-500 hover:text-rose-400 transition-opacity"
                    title="Hapus Tab Lembar Kerja"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Add New Tab Input */}
          {isAddingTab ? (
            <form onSubmit={handleCreateTabSubmit} className="flex items-center gap-1 bg-slate-900 border border-emerald-500 rounded-t-xl px-2 py-1.5">
              <input
                type="text"
                placeholder="Nama Tab Baru"
                value={newTabInput}
                onChange={(e) => setNewTabInput(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none w-24"
                autoFocus
              />
              <button type="submit" className="text-emerald-400 text-xs font-bold px-1">
                +
              </button>
            </form>
          ) : (
            <button
              onClick={() => setIsAddingTab(true)}
              className="px-3 py-2 rounded-t-xl bg-slate-900/40 hover:bg-slate-900 border border-slate-800/80 text-slate-400 hover:text-emerald-400 text-xs font-semibold flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Tab Baru
            </button>
          )}
        </div>

        {/* Sync Controls & External Link */}
        <div className="flex items-center gap-3 shrink-0 pb-2">
          {!isSandboxMode && (
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400 text-[11px] font-medium hidden sm:inline">Otomatis Sync 2-Arah:</span>
              <button
                onClick={() => onToggleAutoSync(!autoSync)}
                className={`w-8 h-4 rounded-full transition-colors relative ${autoSync ? 'bg-emerald-600' : 'bg-slate-700'}`}
              >
                <div
                  className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-transform ${
                    autoSync ? 'left-4.5 bg-white' : 'left-0.5'
                  }`}
                />
              </button>
            </div>
          )}

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Muat Ulang Data dari Database Cloud"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 flex flex-col md:flex-row items-center justify-between gap-3 shadow-lg">
        
        {/* View Switcher */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 w-full md:w-auto">
          <button
            onClick={() => setActiveView('table')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeView === 'table'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            Tabel Grid
          </button>

          <button
            onClick={() => setActiveView('form')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeView === 'form'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Form Record
          </button>

          <button
            onClick={() => setActiveView('analytics')}
            className={`flex-1 md:flex-none px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeView === 'analytics'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Analisis
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kata di semua sel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Export & External Link Actions */}
        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
          <button
            onClick={handleExportCSV}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Ekspor sebagai CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            CSV
          </button>

          <button
            onClick={handleExportJSON}
            className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Ekspor sebagai JSON"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            JSON
          </button>
        </div>

      </div>

      {/* Active View Content */}
      {activeView === 'table' && (
        <TableView
          headers={headers}
          rows={rows}
          searchQuery={searchQuery}
          onCellEdit={onCellEdit}
          onHeaderEdit={onHeaderEdit}
          onAddRow={onAddRow}
          onDeleteRow={onDeleteRowRequest}
          onDuplicateRow={onDuplicateRow}
          onAddColumn={onAddColumn}
        />
      )}

      {activeView === 'form' && (
        <FormView
          headers={headers}
          rows={rows}
          onCellEdit={onCellEdit}
          onAddRow={onAddRow}
          onDeleteRow={onDeleteRowRequest}
        />
      )}

      {activeView === 'analytics' && (
        <AnalyticsView headers={headers} rows={rows} />
      )}

    </div>
  );
};
