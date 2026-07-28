import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { Header } from './components/Header';
import { SpreadsheetEditor } from './components/SpreadsheetEditor';
import { DashboardView } from './components/DashboardView';
import { SheetSelectorModal } from './components/SheetSelectorModal';
import { AppsScriptConfigModal } from './components/AppsScriptConfigModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { GlobalLoadingOverlay } from './components/GlobalLoadingOverlay';
import { ConfirmationConfig, SampleTemplate, SheetTab, SyncStatus } from './types';
import { SAMPLE_TEMPLATES } from './data/templates';
import { initAuth, googleSignIn, logoutUser, getAccessToken } from './lib/auth';
import { 
  getSpreadsheetMetadata, 
  getSheetGridData, 
  updateSingleCell, 
  updateFullSheetValues, 
  appendRowToSheet, 
  deleteRowInSheet, 
  addNewSheetTab, 
  deleteSheetTab, 
  createNewSpreadsheet, 
  extractSpreadsheetId,
  getAppsScriptUrl
} from './lib/sheetsApi';
import { Loader2, Sparkles, FileSpreadsheet } from 'lucide-react';

export default function App() {
  // View Mode State
  const [viewMode, setViewMode] = useState<'dashboard' | 'spreadsheet'>('dashboard');

  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [needsAuth, setNeedsAuth] = useState(true);

  // Active Spreadsheet State
  const [spreadsheetId, setSpreadsheetId] = useState<string>('sandbox-sales');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('Laporan Penjualan (Pratinjau Sandbox)');
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string | undefined>(undefined);
  const [sheetTabs, setSheetTabs] = useState<SheetTab[]>([
    { sheetId: 0, title: 'Penjualan Juli 2026', index: 0 },
  ]);
  const [activeTabTitle, setActiveTabTitle] = useState<string>('Penjualan Juli 2026');
  const [headers, setHeaders] = useState<string[]>(SAMPLE_TEMPLATES[0].headers);
  const [rows, setRows] = useState<string[][]>(SAMPLE_TEMPLATES[0].rows);
  const [isSandboxMode, setIsSandboxMode] = useState<boolean>(true);

  // Sync state
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [isLoadingSheet, setIsLoadingSheet] = useState<boolean>(false);

  // Modals & Glassmorphism Feedback
  const [isSelectorOpen, setIsSelectorOpen] = useState<boolean>(false);
  const [isAppsScriptModalOpen, setIsAppsScriptModalOpen] = useState<boolean>(false);
  const [confirmationConfig, setConfirmationConfig] = useState<ConfirmationConfig>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Konfirmasi',
    onConfirm: () => {},
  });

  // Ultra-Premium Glassmorphism 2.0 Feedback Overlay
  const [glassFeedback, setGlassFeedback] = useState<{
    isVisible: boolean;
    title: string;
    description?: string;
    smartStatus?: string;
    progress?: number;
  }>({
    isVisible: false,
    title: '',
  });

  const triggerGlassFeedback = (title: string, description?: string, smartStatus?: string) => {
    setGlassFeedback({
      isVisible: true,
      title,
      description,
      smartStatus: smartStatus || 'Berhasil',
      progress: 100,
    });
  };

  const closeGlassFeedback = () => {
    setGlassFeedback((prev) => ({ ...prev, isVisible: false }));
  };

  // Initialize Firebase Auth
  useEffect(() => {
    const unsubscribe = initAuth(
      async (u, cachedToken) => {
        setUser(u);
        setNeedsAuth(false);
        const tok = cachedToken || (await getAccessToken());
        setToken(tok);
      },
      () => {
        setUser(null);
        setToken(null);
        setNeedsAuth(true);
      }
    );
    return () => unsubscribe();
  }, []);

  // Google Login Handler
  const handleLogin = async () => {
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setToken(result.accessToken);
        setNeedsAuth(false);
        triggerGlassFeedback('Berhasil Masuk Google', `Selamat datang, ${result.user.displayName || result.user.email}`);
      }
    } catch (err: any) {
      if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        triggerGlassFeedback('Login Dibatalkan', 'Proses login ditutup oleh pengguna.');
      } else {
        console.error(err);
        triggerGlassFeedback('Gagal Masuk Google', err.message || 'Terjadi kesalahan saat otentikasi.');
      }
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setToken(null);
    setNeedsAuth(true);
    triggerGlassFeedback('Berhasil Keluar', 'Anda telah keluar dari akun Google.');
  };

  // Load real spreadsheet from Google Sheets
  const loadGoogleSpreadsheet = async (input: string) => {
    const targetId = extractSpreadsheetId(input);
    if (!targetId) {
      triggerGlassFeedback('ID Spreadsheet Tidak Valid', 'Silakan periksa kembali URL atau ID spreadsheet.');
      return;
    }

    if (!token && !getAppsScriptUrl()) {
      setIsAppsScriptModalOpen(true);
      triggerGlassFeedback('Konfigurasi Apps Script Diperlukan', 'Silakan atur URL Web App Google Apps Script atau Masuk Google.');
      return;
    }

    setIsLoadingSheet(true);
    try {
      const meta = await getSpreadsheetMetadata(targetId, token);
      setSpreadsheetId(meta.id);
      setSpreadsheetTitle(meta.title);
      setSpreadsheetUrl(meta.spreadsheetUrl);
      setSheetTabs(meta.sheets);
      setIsSandboxMode(false);

      const firstTabTitle = meta.sheets[0]?.title || 'Sheet1';
      setActiveTabTitle(firstTabTitle);

      const gridData = await getSheetGridData(meta.id, firstTabTitle, token);
      setHeaders(gridData.headers);
      setRows(gridData.rows);
      setSyncStatus('synced');
      setHasUnsavedChanges(false);

      triggerGlassFeedback('Spreadsheet Terhubung 2-Arah', 'Berhasil memuat data dari Cloud');
    } catch (err: any) {
      console.error(err);
      triggerGlassFeedback('Gagal Memuat Spreadsheet', err.message || 'Periksa URL/ID Spreadsheet dan Web App URL.');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Switch Tab within current spreadsheet
  const handleSelectTab = async (sheetTitle: string) => {
    setActiveTabTitle(sheetTitle);
    if (isSandboxMode) return;

    setIsLoadingSheet(true);
    try {
      const gridData = await getSheetGridData(spreadsheetId, sheetTitle, token);
      setHeaders(gridData.headers);
      setRows(gridData.rows);
      setSyncStatus('synced');
    } catch (err: any) {
      console.error(err);
      triggerGlassFeedback('Gagal Memuat Tab', err.message);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Load Sandbox Template
  const handleLoadSandboxTemplate = (template: SampleTemplate) => {
    setSpreadsheetId(`sandbox-${template.id}`);
    setSpreadsheetTitle(`${template.title} (Sandbox)`);
    setSpreadsheetUrl(undefined);
    setSheetTabs([{ sheetId: 0, title: 'Sheet1', index: 0 }]);
    setActiveTabTitle('Sheet1');
    setHeaders(template.headers);
    setRows(template.rows);
    setIsSandboxMode(true);
    setSyncStatus('synced');
    setHasUnsavedChanges(false);
    triggerGlassFeedback('Mode Sandbox Aktif', `Memuat template '${template.title}'. Data disimpan secara lokal.`);
  };

  // Create new real spreadsheet in Drive
  const handleCreateNewSpreadsheet = async (title: string, template: SampleTemplate) => {
    if (!token && !getAppsScriptUrl()) {
      handleLoadSandboxTemplate({ ...template, title });
      return;
    }

    setIsLoadingSheet(true);
    try {
      const meta = await createNewSpreadsheet(title, template.headers, template.rows, token);
      setSpreadsheetId(meta.id);
      setSpreadsheetTitle(meta.title);
      setSpreadsheetUrl(meta.spreadsheetUrl);
      setSheetTabs(meta.sheets);
      setActiveTabTitle('Sheet1');
      setHeaders(template.headers);
      setRows(template.rows);
      setIsSandboxMode(false);
      setSyncStatus('synced');
      setHasUnsavedChanges(false);
      triggerGlassFeedback('Spreadsheet Baru Dibuat', `'${title}' berhasil dibuat di Cloud.`);
    } catch (err: any) {
      console.error(err);
      triggerGlassFeedback('Gagal Membuat Spreadsheet', err.message);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Cell editing logic (2-Way sync)
  const handleCellEdit = async (rowIndex: number, colIndex: number, newValue: string) => {
    const updatedRows = [...rows];
    if (!updatedRows[rowIndex]) return;

    const oldValue = updatedRows[rowIndex][colIndex] || '';
    if (oldValue === newValue) return;

    updatedRows[rowIndex][colIndex] = newValue;
    setRows(updatedRows);

    if (isSandboxMode) {
      setSyncStatus('synced');
      return;
    }

    if (!token && !getAppsScriptUrl()) return;

    if (autoSync) {
      setSyncStatus('saving');
      try {
        // row index in sheets is 1-based header + 1 = 2
        const sheetRow1Based = rowIndex + 2;
        await updateSingleCell(spreadsheetId, activeTabTitle, sheetRow1Based, colIndex, newValue, token);
        setSyncStatus('synced');
        triggerGlassFeedback('Sel Disinkronkan ke Cloud', `Perubahan sel ${headers[colIndex] || 'Kolom'} disimpan.`);
      } catch (err: any) {
        console.error(err);
        setSyncStatus('error');
        setHasUnsavedChanges(true);
        triggerGlassFeedback('Gagal Sync Sel', err.message);
      }
    } else {
      setHasUnsavedChanges(true);
      setSyncStatus('unsaved_changes');
    }
  };

  // Header editing logic
  const handleHeaderEdit = async (colIndex: number, newHeaderName: string) => {
    const updatedHeaders = [...headers];
    updatedHeaders[colIndex] = newHeaderName;
    setHeaders(updatedHeaders);

    if (isSandboxMode || (!token && !getAppsScriptUrl())) return;

    if (autoSync) {
      setSyncStatus('saving');
      try {
        const fullValues = [updatedHeaders, ...rows];
        await updateFullSheetValues(spreadsheetId, activeTabTitle, fullValues, token);
        setSyncStatus('synced');
        triggerGlassFeedback('Nama Kolom Diperbarui', `Header '${newHeaderName}' disinkronkan ke Cloud.`);
      } catch (err: any) {
        console.error(err);
        setSyncStatus('error');
        triggerGlassFeedback('Gagal Sync Header', err.message);
      }
    } else {
      setHasUnsavedChanges(true);
      setSyncStatus('unsaved_changes');
    }
  };

  // Add row logic
  const handleAddRow = async (rowValues: string[]) => {
    const updatedRows = [...rows, rowValues];
    setRows(updatedRows);

    if (isSandboxMode || (!token && !getAppsScriptUrl())) {
      triggerGlassFeedback('Baris Ditambahkan', 'Baris baru ditambahkan secara lokal.');
      return;
    }

    setSyncStatus('saving');
    try {
      await appendRowToSheet(spreadsheetId, activeTabTitle, rowValues, token);
      setSyncStatus('synced');
      triggerGlassFeedback('Baris Disinkronkan', 'Baris baru ditambahkan ke Cloud.');
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      setHasUnsavedChanges(true);
      triggerGlassFeedback('Gagal Menambah Baris', err.message);
    }
  };

  // Duplicate row logic
  const handleDuplicateRow = (rowIndex: number) => {
    const rowToCopy = [...rows[rowIndex]];
    handleAddRow(rowToCopy);
  };

  // Delete row logic WITH MANDATORY CONFIRMATION DIALOG
  const handleDeleteRowRequest = (rowIndex: number) => {
    setConfirmationConfig({
      isOpen: true,
      title: 'Hapus Baris Data?',
      description: `Apakah Anda yakin ingin menghapus baris #${rowIndex + 1} dari lembar kerja '${activeTabTitle}'? Perubahan ini akan disinkronkan ke Database Cloud.`,
      confirmText: 'Ya, Hapus Baris',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmationConfig((prev) => ({ ...prev, isOpen: false }));

        const updatedRows = rows.filter((_, idx) => idx !== rowIndex);
        setRows(updatedRows);

        if (isSandboxMode || (!token && !getAppsScriptUrl())) {
          triggerGlassFeedback('Baris Dihapus', 'Baris berhasil dihapus.');
          return;
        }

        setSyncStatus('saving');
        try {
          const currentTabObj = sheetTabs.find((t) => t.title === activeTabTitle);
          if (currentTabObj && currentTabObj.sheetId !== undefined) {
            // Row index 0 is header, row index 1 is first data row
            const sheetsRowIdx0Based = rowIndex + 1;
            await deleteRowInSheet(spreadsheetId, currentTabObj.sheetId, sheetsRowIdx0Based, token, activeTabTitle);
          } else {
            const fullValues = [headers, ...updatedRows];
            await updateFullSheetValues(spreadsheetId, activeTabTitle, fullValues, token);
          }
          setSyncStatus('synced');
          triggerGlassFeedback('Baris Dihapus', `Baris #${rowIndex + 1} berhasil dihapus dari Cloud.`);
        } catch (err: any) {
          console.error(err);
          setSyncStatus('error');
          triggerGlassFeedback('Gagal Menghapus Baris', err.message);
        }
      },
    });
  };

  // Add Column logic
  const handleAddColumn = async (columnName: string) => {
    const updatedHeaders = [...headers, columnName];
    const updatedRows = rows.map((r) => [...r, '']);

    setHeaders(updatedHeaders);
    setRows(updatedRows);

    if (isSandboxMode || (!token && !getAppsScriptUrl())) {
      triggerGlassFeedback('Kolom Ditambahkan', `Kolom '${columnName}' ditambahkan.`);
      return;
    }

    setSyncStatus('saving');
    try {
      const fullValues = [updatedHeaders, ...updatedRows];
      await updateFullSheetValues(spreadsheetId, activeTabTitle, fullValues, token);
      setSyncStatus('synced');
      triggerGlassFeedback('Kolom Baru Disinkronkan', `Kolom '${columnName}' ditambahkan ke Cloud.`);
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      triggerGlassFeedback('Gagal Menambah Kolom', err.message);
    }
  };

  // Add Sheet Tab logic
  const handleAddTab = async (newTabTitle: string) => {
    if (sheetTabs.some((t) => t.title.toLowerCase() === newTabTitle.toLowerCase())) {
      triggerGlassFeedback('Nama Tab Sudah Ada', 'Gunakan nama tab yang berbeda.');
      return;
    }

    if (isSandboxMode || (!token && !getAppsScriptUrl())) {
      const newTabObj: SheetTab = {
        sheetId: Date.now(),
        title: newTabTitle,
        index: sheetTabs.length,
      };
      setSheetTabs([...sheetTabs, newTabObj]);
      setActiveTabTitle(newTabTitle);
      setHeaders(['Kolom 1', 'Kolom 2', 'Kolom 3']);
      setRows([['', '', '']]);
      triggerGlassFeedback('Tab Baru Dibuat', `Tab '${newTabTitle}' dibuat di Sandbox.`);
      return;
    }

    setIsLoadingSheet(true);
    try {
      await addNewSheetTab(spreadsheetId, newTabTitle, token);
      const meta = await getSpreadsheetMetadata(spreadsheetId, token);
      setSheetTabs(meta.sheets);
      setActiveTabTitle(newTabTitle);
      setHeaders(['Kolom 1', 'Kolom 2', 'Kolom 3']);
      setRows([['', '', '']]);
      triggerGlassFeedback('Tab Lembar Baru Disinkronkan', `Tab '${newTabTitle}' telah dibuat di Cloud.`);
    } catch (err: any) {
      console.error(err);
      triggerGlassFeedback('Gagal Membuat Tab', err.message);
    } finally {
      setIsLoadingSheet(false);
    }
  };

  // Delete Sheet Tab logic WITH MANDATORY CONFIRMATION DIALOG
  const handleDeleteTabRequest = (sheetId: number, tabTitle: string) => {
    setConfirmationConfig({
      isOpen: true,
      title: 'Hapus Tab Lembar Kerja?',
      description: `Apakah Anda yakin ingin menghapus tab '${tabTitle}'? Seluruh data dalam tab ini akan dihapus secara permanen dari Database Cloud.`,
      confirmText: 'Hapus Tab',
      confirmVariant: 'danger',
      onConfirm: async () => {
        setConfirmationConfig((prev) => ({ ...prev, isOpen: false }));

        if (isSandboxMode || (!token && !getAppsScriptUrl())) {
          const updatedTabs = sheetTabs.filter((t) => t.title !== tabTitle);
          setSheetTabs(updatedTabs);
          if (updatedTabs.length > 0) {
            handleSelectTab(updatedTabs[0].title);
          }
          triggerGlassFeedback('Tab Dihapus', `Tab '${tabTitle}' telah dihapus.`);
          return;
        }

        setIsLoadingSheet(true);
        try {
          await deleteSheetTab(spreadsheetId, sheetId, token);
          const meta = await getSpreadsheetMetadata(spreadsheetId, token);
          setSheetTabs(meta.sheets);
          const remainingTabTitle = meta.sheets[0]?.title || 'Sheet1';
          setActiveTabTitle(remainingTabTitle);
          const gridData = await getSheetGridData(spreadsheetId, remainingTabTitle, token);
          setHeaders(gridData.headers);
          setRows(gridData.rows);
          triggerGlassFeedback('Tab Dihapus', `Tab '${tabTitle}' berhasil dihapus dari Cloud.`);
        } catch (err: any) {
          console.error(err);
          triggerGlassFeedback('Gagal Menghapus Tab', err.message);
        } finally {
          setIsLoadingSheet(false);
        }
      },
    });
  };

  // Manual Full Save / Sync to Google Sheets
  const handleManualSave = async () => {
    if (isSandboxMode || (!token && !getAppsScriptUrl())) return;

    setSyncStatus('saving');
    try {
      const fullValues = [headers, ...rows];
      await updateFullSheetValues(spreadsheetId, activeTabTitle, fullValues, token);
      setSyncStatus('synced');
      setHasUnsavedChanges(false);
      triggerGlassFeedback('Penyimpanan Berhasil', 'Data sinkron');
    } catch (err: any) {
      console.error(err);
      setSyncStatus('error');
      triggerGlassFeedback('Gagal Menyimpan Data', err.message);
    }
  };

  if (viewMode === 'dashboard') {
    return (
      <DashboardView 
        onSwitchToSpreadsheet={() => setViewMode('spreadsheet')}
        userEmail={user?.email || 'y3044201@gmail.com'}
        userName={user?.displayName || 'Administrator'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* App Header */}
      <Header
        user={user}
        needsAuth={needsAuth}
        spreadsheetTitle={spreadsheetTitle}
        spreadsheetUrl={spreadsheetUrl}
        syncStatus={syncStatus}
        isSandboxMode={isSandboxMode}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        onOpenSelector={() => setIsSelectorOpen(true)}
        onOpenNewModal={() => setIsSelectorOpen(true)}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onManualSave={handleManualSave}
        hasUnsavedChanges={hasUnsavedChanges}
        onOpenAppsScriptConfig={() => setIsAppsScriptModalOpen(true)}
      />

      {/* Global Luxury Loading Overlay for Spreadsheet operations */}
      <GlobalLoadingOverlay
        isVisible={isLoadingSheet}
        title="Synchronizing Cloud Database"
        description="Establishing real-time 2-way data stream with Cloud server and fetching sheet grid records..."
        smartStatus="Syncing Database..."
      />

      {/* Ultra-Premium Glassmorphism 2.0 Feedback Overlay */}
      <GlobalLoadingOverlay
        isVisible={glassFeedback.isVisible}
        title={glassFeedback.title}
        description={glassFeedback.description}
        smartStatus={glassFeedback.smartStatus}
        progress={100}
        autoCloseMs={800}
        onClose={closeGlassFeedback}
      />

      <main className="flex-1">
          <SpreadsheetEditor
            sheetTabs={sheetTabs}
            activeTabTitle={activeTabTitle}
            onSelectTab={handleSelectTab}
            onAddTab={handleAddTab}
            onDeleteTab={handleDeleteTabRequest}
            headers={headers}
            rows={rows}
            syncStatus={syncStatus}
            autoSync={autoSync}
            onToggleAutoSync={setAutoSync}
            onManualSync={handleManualSave}
            onRefresh={() => {
              if (!isSandboxMode) loadGoogleSpreadsheet(spreadsheetId);
              else triggerGlassFeedback('Sandbox Dibereskan', 'Data pratinjau diperbarui.');
            }}
            onCellEdit={handleCellEdit}
            onHeaderEdit={handleHeaderEdit}
            onAddRow={handleAddRow}
            onDeleteRowRequest={handleDeleteRowRequest}
            onDuplicateRow={handleDuplicateRow}
            onAddColumn={handleAddColumn}
            spreadsheetUrl={spreadsheetUrl}
            isSandboxMode={isSandboxMode}
          />
        </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        <p>Aplikasi Web Pengelola Spreadsheet — Sinkronisasi 2-Arah Database Cloud & System</p>
      </footer>

      {/* Modals */}
      <SheetSelectorModal
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        onSelectSpreadsheet={loadGoogleSpreadsheet}
        onCreateNew={handleCreateNewSpreadsheet}
        onLoadSandboxTemplate={handleLoadSandboxTemplate}
        token={token}
        needsAuth={needsAuth}
        onLogin={handleLogin}
      />

      <ConfirmationModal
        isOpen={confirmationConfig.isOpen}
        title={confirmationConfig.title}
        description={confirmationConfig.description}
        confirmText={confirmationConfig.confirmText}
        confirmVariant={confirmationConfig.confirmVariant}
        onConfirm={confirmationConfig.onConfirm}
        onCancel={() => setConfirmationConfig((prev) => ({ ...prev, isOpen: false }))}
      />

      <AppsScriptConfigModal
        isOpen={isAppsScriptModalOpen}
        onClose={() => setIsAppsScriptModalOpen(false)}
        onSaved={() => triggerGlassFeedback('Apps Script Tersimpan', 'Konfigurasi Web App URL aktif.')}
      />

    </div>
  );
}
