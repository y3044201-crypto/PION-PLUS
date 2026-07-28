import React, { useState } from 'react';
import { MasterDataView } from './MasterDataView';
import { ProgresDataView } from './ProgresDataView';
import { MaterialDataView } from './MaterialDataView';
import { FinalBoqView } from './FinalBoqView';
import { FinalBoqPage } from './FinalBoqPage';
import { GlobalLoadingOverlay } from './GlobalLoadingOverlay';
import { 
  LayoutDashboard, 
  FolderKanban, 
  BarChart3, 
  Image as MediaIcon, 
  FileText, 
  Settings, 
  Heart, 
  Home, 
  Camera, 
  BarChart2, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  MoreVertical, 
  CheckCircle2, 
  Sparkles,
  Search,
  Bell,
  User as UserIcon,
  Filter,
  Download,
  Share2,
  RefreshCw,
  Sliders,
  ChevronRight,
  ShieldCheck,
  Layers,
  Activity,
  Database,
  FileSpreadsheet,
  Plus,
  Inbox,
  PlusCircle,
  Upload,
  RotateCcw,
  Save,
  X
} from 'lucide-react';

interface DashboardViewProps {
  onSwitchToSpreadsheet?: () => void;
  userEmail?: string;
  userName?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSwitchToSpreadsheet,
  userEmail = 'y3044201@gmail.com',
  userName = 'Administrator'
}) => {
  // Navigation Menu State
  const [activeMenu, setActiveMenu] = useState<string>('Dashboard');
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [masterSearchTerm, setMasterSearchTerm] = useState<string>('');
  const [generalSearchTerm, setGeneralSearchTerm] = useState<string>('');
  // Global Loading Overlay & Glassmorphism Feedback State
  const [loadingOverlay, setLoadingOverlay] = useState<{
    isVisible: boolean;
    title?: string;
    description?: string;
    smartStatus?: string;
    progress?: number;
    autoCloseMs?: number;
  }>({ isVisible: false });

  const triggerGlobalLoading = (
    title: string, 
    description?: string, 
    durationMs: number = 400, 
    callback?: () => void
  ) => {
    setLoadingOverlay({
      isVisible: true,
      title,
      description: description || 'Memproses permintaan Anda secara aman. Data telah dienkripsi dan dioptimalkan.',
    });

    setTimeout(() => {
      setLoadingOverlay({ isVisible: false });
      if (callback) callback();
    }, durationMs);
  };

  const [boqHeaderActions, setBoqHeaderActions] = useState<{
    onSave?: () => void;
    onUpload: () => void;
    onReset: () => void;
    isProcessing: boolean;
    isSaving?: boolean;
  } | null>(null);

  const showToast = (msg: string) => {
    if (!msg || msg.toLowerCase().includes('dimuat')) return;
    setLoadingOverlay({
      isVisible: true,
      title: 'Informasi Sistem',
      description: msg,
      smartStatus: 'Selesai',
      progress: 100,
      autoCloseMs: 800,
    });
  };

  // Bar chart data JAN to JUL
  const chartData = [
    { month: 'JAN', value: 65, amount: 'Rp 42.5 M', grow: '+12%' },
    { month: 'FEB', value: 48, amount: 'Rp 31.0 M', grow: '-5%' },
    { month: 'MAR', value: 85, amount: 'Rp 58.2 M', grow: '+24%' },
    { month: 'APR', value: 72, amount: 'Rp 49.0 M', grow: '+8%' },
    { month: 'MAY', value: 92, amount: 'Rp 64.8 M', grow: '+31%' },
    { month: 'JUN', value: 58, amount: 'Rp 39.4 M', grow: '-2%' },
    { month: 'JUL', value: 98, amount: 'Rp 71.2 M', grow: '+38%' },
  ];

  // Table Data with Objects & Data Percentages
  const tableObjects = [
    { id: 'OBJ-001', name: 'Object Alpha - Core Engine', category: 'Project Platform', percentage: 94, status: 'Active', trend: '+4.2%' },
    { id: 'OBJ-002', name: 'Object Beta - Media Hub', category: 'Media Asset', percentage: 87, status: 'Active', trend: '+2.8%' },
    { id: 'OBJ-003', name: 'Object Gamma - Analytics API', category: 'Statistics', percentage: 62, status: 'Syncing', trend: '+1.5%' },
    { id: 'OBJ-004', name: 'Object Delta - User Portal', category: 'Reports', percentage: 45, status: 'Pending', trend: '-0.8%' },
    { id: 'OBJ-005', name: 'Object Epsilon - Storage Sync', category: 'Settings', percentage: 98, status: 'Active', trend: '+5.6%' },
    { id: 'OBJ-006', name: 'Object Zeta - Security Mesh', category: 'System', percentage: 79, status: 'Active', trend: '+3.1%' },
  ];

  const menuItems = [
    { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'Master', label: 'MASTER', icon: Database },
    { id: 'Progres', label: 'PROGRES', icon: Activity },
    { id: 'Material', label: 'MATERIAL', icon: FolderKanban },
    { id: 'Statistics', label: 'PURCHASE ORDER', icon: FileSpreadsheet },
    { id: 'Settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="flex h-screen w-full bg-[#050816] font-sans text-slate-100 overflow-hidden select-none relative">
      
      {/* Global Ultra-Premium Glassmorphism 2.0 Loading & Status Overlay */}
      <GlobalLoadingOverlay
        isVisible={loadingOverlay.isVisible}
        title={loadingOverlay.title}
        description={loadingOverlay.description}
        smartStatus={loadingOverlay.smartStatus}
        progress={loadingOverlay.progress}
        autoCloseMs={loadingOverlay.autoCloseMs}
        onClose={() => setLoadingOverlay({ isVisible: false })}
      />

      {/* Background Ambient Glow Lights */}
      <div className="ambient-glow-1"></div>
      <div className="ambient-glow-2"></div>
      <div className="ambient-glow-3"></div>

      {/* ==================== LEFT SIDEBAR (ULTRA DARK GLASS) ==================== */}
      <aside className="w-64 bg-[#0b1020]/80 backdrop-blur-2xl text-slate-200 flex flex-col justify-between shrink-0 border-r border-white/10 shadow-2xl z-20">
        <div>
          {/* Cyber Logo Header */}
          <div className="p-6 flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 p-[1px] shadow-[0_0_20px_rgba(6,182,212,0.35)]">
                <div className="w-full h-full bg-[#0b1020] rounded-[15px] flex items-center justify-center text-cyan-400">
                  <Activity className="w-5 h-5 stroke-[2.5]" />
                </div>
              </div>
              <div>
                <span className="text-base font-black tracking-wider text-white block leading-tight">
                  PION <span className="bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent font-extrabold">PLUS</span>
                </span>
                <span className="text-[9px] text-cyan-400/90 font-extrabold tracking-widest uppercase block mt-0.5">
                  Pro Enterprise
                </span>
              </div>
            </div>
          </div>

          {/* Menu Navigation */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3.5 py-2 text-[9px] text-cyan-400/90 font-extrabold tracking-widest uppercase">
              Main Navigation
            </div>
            
            {menuItems.map((menu) => {
              const Icon = menu.icon;
              const isActive = activeMenu === menu.id;

              return (
                <button
                  key={menu.id}
                  id={`menu-${menu.id.toLowerCase()}`}
                  onClick={() => {
                    if (activeMenu !== menu.id) {
                      triggerGlobalLoading(
                        `Loading ${menu.label}`,
                        `Preparing ${menu.label} interface and syncing modules...`,
                        300,
                        () => {
                          setActiveMenu(menu.id);
                        }
                      );
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-bold transition-all duration-200 group relative ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 text-white font-extrabold border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.2)]'
                      : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`} />
                    <span>{menu.label}</span>
                  </div>
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]"></span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>


      </aside>

      {/* ==================== RIGHT MAIN CONTENT PANEL (ULTRA DARK SaaS CANVAS) ==================== */}
      <main className="flex-1 flex flex-col bg-[#050816] overflow-y-auto min-w-0 z-10">
        
        {/* Top Header Bar */}
        {activeMenu !== 'Dashboard' && (
          <header className="sticky top-0 z-20 bg-[#0b1020]/80 backdrop-blur-2xl border-b border-white/10 px-8 py-4 flex items-center justify-between gap-4 shadow-xl">
            <div>
              <h1 className="text-lg font-black text-white flex items-center gap-2 tracking-tight">
                <span>{activeMenu === 'Master' ? 'MASTER VOLUME' : activeMenu === 'Progres' ? 'PROGRES LAPANGAN' : activeMenu === 'Material' ? 'MATERIAL' : activeMenu === 'Statistics' ? 'PURCHASE ORDER' : activeMenu === 'FinalBoq' ? 'FINAL BOQ' : `Halaman ${menuItems.find(m => m.id === activeMenu)?.label || activeMenu}`}</span>
              </h1>
              {activeMenu !== 'Statistics' && (
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {activeMenu === 'Master'
                    ? 'DATA VOLUME MASTER PION X'
                    : activeMenu === 'Progres'
                    ? 'LAPORAN PION X'
                    : activeMenu === 'Material'
                    ? 'DATA MATERIAL PION X'
                    : activeMenu === 'FinalBoq'
                    ? 'Modul dan area kerja Final BOQ (siap ditata ulang).'
                    : `Modul dan area manajemen ${activeMenu.toLowerCase()}.`}
                </p>
              )}
            </div>

            {/* Quick Controls */}
            <div className="flex items-center gap-3">
              {activeMenu === 'Master' ? (
                <div key="master-search-container" className="relative hidden md:block w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    key="master-search-input"
                    type="text" 
                    value={masterSearchTerm}
                    onChange={(e) => setMasterSearchTerm(e.target.value)}
                    placeholder="Cari master data..." 
                    className="pl-10 pr-8 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 w-full transition-all font-medium"
                  />
                  {masterSearchTerm && (
                    <button 
                      onClick={() => setMasterSearchTerm('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ) : activeMenu === 'Statistics' ? (
                <div key="boq-header-actions" className="flex items-center gap-2">
                  <button
                    onClick={() => boqHeaderActions?.onSave?.()}
                    disabled={boqHeaderActions?.isSaving}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-xs transition-all shadow-[0_0_15px_rgba(59,130,246,0.3)] flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer border border-blue-400/30"
                    title="Simpan Data Purchase Order ke Database Cloud"
                  >
                    {boqHeaderActions?.isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                        <span>MENYIMPAN...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5 text-white" />
                        <span>SIMPAN</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => boqHeaderActions?.onUpload()}
                    disabled={boqHeaderActions?.isProcessing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-emerald-400 hover:opacity-90 text-slate-950 font-black text-xs transition-all shadow-[0_0_15px_rgba(6,182,212,0.3)] flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer border border-cyan-300/40"
                  >
                    {boqHeaderActions?.isProcessing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-950" />
                        <span>Mengekstrak PDF...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5 text-slate-950" />
                        <span>Unggah PDF PO</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => boqHeaderActions?.onReset()}
                    className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs transition-all border border-white/10 shadow-sm flex items-center gap-1.5 active:scale-95 cursor-pointer"
                    title="Reset Data"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Reset</span>
                  </button>
                </div>
              ) : activeMenu === 'Progres' || activeMenu === 'Material' ? null : (
                <div key="general-search-container" className="relative hidden md:block">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    key="general-search-input"
                    type="text" 
                    value={generalSearchTerm}
                    onChange={(e) => setGeneralSearchTerm(e.target.value)}
                    placeholder="Cari objek atau data..." 
                    className="pl-10 pr-10 py-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 w-64 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-500 px-1.5 py-0.5 rounded border border-white/10 bg-white/5">
                    ⌘K
                  </span>
                </div>
              )}

              <button 
                onClick={() => showToast('Notifikasi diperbarui')}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition-colors relative border border-white/10"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)]"></span>
              </button>
            </div>
          </header>
        )}

        {/* Dynamic Page Content depending on Active Menu */}
        {activeMenu === 'Dashboard' ? (
          /* Dashboard Main Content */
          <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">

            {/* ---------------- SECTION 1: 4 LUXURY FLOATING KPI CARDS ---------------- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Favorites / Heart */}
              <div className="bg-[#111827]/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-pink-500/40 hover:shadow-[0_10px_30px_rgba(236,72,153,0.15)] flex items-center justify-between group">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Favorites / Heart
                  </span>
                  <div className="text-3xl font-black text-white tracking-tight">
                    12,840
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+18.4% bulan ini</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 flex items-center justify-center text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.25)] group-hover:scale-110 transition-transform">
                  <Heart className="w-7 h-7 fill-pink-500/20 stroke-[2.2]" />
                </div>
              </div>

              {/* Card 2: Assets / House */}
              <div className="bg-[#111827]/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-amber-500/40 hover:shadow-[0_10px_30px_rgba(245,158,11,0.15)] flex items-center justify-between group">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    House / Assets
                  </span>
                  <div className="text-3xl font-black text-white tracking-tight">
                    450
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+12 Unit Baru</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] group-hover:scale-110 transition-transform">
                  <Home className="w-7 h-7 stroke-[2.2]" />
                </div>
              </div>

              {/* Card 3: Camera / Media */}
              <div className="bg-[#111827]/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-cyan-500/40 hover:shadow-[0_10px_30px_rgba(6,182,212,0.15)] flex items-center justify-between group">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Camera / Media
                  </span>
                  <div className="text-3xl font-black text-white tracking-tight">
                    3,210
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+340 Terunggah</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.25)] group-hover:scale-110 transition-transform">
                  <Camera className="w-7 h-7 stroke-[2.2]" />
                </div>
              </div>

              {/* Card 4: Bar Chart / Rate */}
              <div className="bg-[#111827]/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-500/40 hover:shadow-[0_10px_30px_rgba(16,185,129,0.15)] flex items-center justify-between group">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest block">
                    Bar Chart / Rate
                  </span>
                  <div className="text-3xl font-black text-white tracking-tight">
                    84.5%
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-emerald-400">
                    <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Optimal Rate</span>
                  </div>
                </div>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] group-hover:scale-110 transition-transform">
                  <BarChart2 className="w-7 h-7 stroke-[2.2]" />
                </div>
              </div>

            </div>

            {/* ---------------- SECTION 2: OBJECT TABLE & TELEMETRY CHART ---------------- */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* TABLE SECTION (OBJECT NAMES & DATA PERCENTAGES) - 12 cols */}
              <div className="lg:col-span-12 bg-[#111827]/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/10 shadow-2xl space-y-4">
                
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40 text-cyan-400">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span>Daftar Objek & Persentase Data</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Indikator performa dan status sinkronisasi objek sistem
                    </p>
                  </div>

                  <button 
                    onClick={() => showToast('Memuat ulang tabel data...')}
                    className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors border border-white/10"
                    title="Refresh Table"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Object Data Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-slate-400 font-extrabold border-b border-white/10 uppercase tracking-widest text-[10px]">
                        <th className="pb-3 font-semibold">Nama Objek</th>
                        <th className="pb-3 font-semibold text-center">Data %</th>
                        <th className="pb-3 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tableObjects.map((obj) => (
                        <tr key={obj.id} className="hover:bg-white/5 transition-colors group">
                          <td className="py-3.5 font-medium text-slate-200">
                            <div className="font-bold text-white group-hover:text-cyan-400 transition-colors text-xs">
                              {obj.name}
                            </div>
                            <div className="text-[10px] text-slate-500 font-normal mt-0.5">
                              {obj.category} • {obj.id}
                            </div>
                          </td>
                          <td className="py-3.5 text-center">
                            <div className="inline-flex items-center gap-2">
                              <span className="font-extrabold text-white w-8 text-right text-xs">
                                {obj.percentage}%
                              </span>
                              <div className="w-20 h-2 rounded-full bg-white/10 overflow-hidden hidden sm:block">
                                <div 
                                  style={{ width: `${obj.percentage}%` }}
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    obj.percentage > 80 
                                      ? 'bg-gradient-to-r from-emerald-400 to-teal-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' 
                                      : obj.percentage > 60 
                                      ? 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]' 
                                      : 'bg-gradient-to-r from-amber-400 to-orange-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                                  }`}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 text-right">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide ${
                              obj.status === 'Active' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.2)]' 
                                : obj.status === 'Syncing'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                            }`}>
                              {obj.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

            {/* ---------------- SECTION 3: 3 LARGER RECTANGULAR COLORFUL ACTION BUTTONS ---------------- */}
            <div className="space-y-4 pt-4 border-t border-white/10">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-300 uppercase tracking-widest flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  <span>Action Control Panels</span>
                </h3>
                <span className="text-xs text-slate-500">Pilih aksi untuk menjalankan modul</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* BUTTON 1: DARK GREY RECTANGULAR BUTTON */}
                <button
                  id="btn-dark-grey-action"
                  onClick={() => {
                    triggerGlobalLoading(
                      'Exporting System Audit Log',
                      'Encrypting and generating security audit logs...',
                      900,
                      () => showToast('Menjalankan Modul Aksi Dark Grey (System Export & Log)')
                    );
                  }}
                  className="w-full py-5 px-6 rounded-3xl bg-[#111827]/80 hover:bg-[#1f293d] text-white font-bold text-base shadow-2xl transition-all duration-300 border border-white/10 hover:border-purple-500/40 hover:shadow-[0_10px_30px_rgba(168,85,247,0.2)] flex items-center justify-between group active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 group-hover:scale-110 transition-transform">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="block leading-tight text-white font-black text-sm">Dark Grey Action</span>
                      <span className="text-xs font-normal text-slate-400 mt-0.5 block">Ekspor Log & Audit Sistem</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-300 group-hover:translate-x-1 transition-all" />
                </button>

                {/* BUTTON 2: ORANGE-RED RECTANGULAR BUTTON */}
                <button
                  id="btn-orange-red-action"
                  onClick={() => {
                    triggerGlobalLoading(
                      'Syncing Real-Time Telemetry',
                      'Updating performance charts and analytics dataset...',
                      850,
                      () => showToast('Menjalankan Modul Aksi Orange-Red (Sync Chart Data)')
                    );
                  }}
                  className="w-full py-5 px-6 rounded-3xl bg-gradient-to-r from-orange-600/90 to-red-600/90 hover:from-orange-500 hover:to-red-500 text-white font-bold text-base shadow-[0_10px_30px_rgba(234,88,12,0.25)] hover:shadow-[0_15px_35px_rgba(234,88,12,0.4)] transition-all duration-300 border border-orange-400/40 flex items-center justify-between group active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md group-hover:scale-110 transition-transform">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="block leading-tight text-white font-black text-sm">Orange-Red Action</span>
                      <span className="text-xs font-normal text-orange-100 mt-0.5 block">Sinkronisasi Grafik Live</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-orange-200 group-hover:translate-x-1 transition-transform" />
                </button>

                {/* BUTTON 3: TEAL RECTANGULAR BUTTON */}
                <button
                  id="btn-teal-action"
                  onClick={() => {
                    triggerGlobalLoading(
                      'Generating PDF Report',
                      'Compiling high-resolution report graphics and document layout...',
                      1100,
                      () => showToast('Menjalankan Modul Aksi Teal (Generate Full Report)')
                    );
                  }}
                  className="w-full py-5 px-6 rounded-3xl bg-gradient-to-r from-teal-600/90 to-cyan-600/90 hover:from-teal-500 hover:to-cyan-500 text-white font-bold text-base shadow-[0_10px_30px_rgba(13,148,136,0.25)] hover:shadow-[0_15px_35px_rgba(13,148,136,0.4)] transition-all duration-300 border border-teal-400/40 flex items-center justify-between group active:scale-[0.98] cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md group-hover:scale-110 transition-transform">
                      <Download className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <span className="block leading-tight text-white font-black text-sm">Teal Action</span>
                      <span className="text-xs font-normal text-teal-100 mt-0.5 block">Cetak Laporan PDF</span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-teal-200 group-hover:translate-x-1 transition-transform" />
                </button>

              </div>
            </div>

          </div>
        ) : activeMenu === 'Master' ? (
          <MasterDataView 
            onBackToDashboard={() => setActiveMenu('Dashboard')}
            showToast={showToast}
            searchTerm={masterSearchTerm}
            setSearchTerm={setMasterSearchTerm}
          />
        ) : activeMenu === 'Progres' ? (
          <ProgresDataView 
            onBackToDashboard={() => setActiveMenu('Dashboard')}
            showToast={showToast}
          />
        ) : activeMenu === 'Material' ? (
          <MaterialDataView
            onBackToDashboard={() => setActiveMenu('Dashboard')}
            showToast={showToast}
            searchTerm={masterSearchTerm}
            setSearchTerm={setMasterSearchTerm}
          />
        ) : activeMenu === 'Statistics' ? (
          <FinalBoqView
            showToast={showToast}
            onRegisterHeaderActions={setBoqHeaderActions}
          />
        ) : activeMenu === 'FinalBoq' ? (
          <FinalBoqPage
            showToast={showToast}
          />
        ) : (
          /* Blank Page for Other Navigation Items */
          <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
            <div className="bg-[#111827]/70 backdrop-blur-2xl rounded-3xl p-12 border border-white/10 shadow-2xl flex flex-col items-center justify-center text-center space-y-6 min-h-[480px]">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-purple-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.3)] relative">
                <Inbox className="w-10 h-10 stroke-[2]" />
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 ring-4 ring-[#0b1020] animate-pulse"></span>
              </div>

              <div className="max-w-md space-y-2">
                <h3 className="text-xl font-black text-white tracking-tight">
                  Halaman {activeMenu} Kosong
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Halaman {activeMenu} saat ini belum berisi entitas atau item data. Silakan tambahkan data baru untuk mulai menggunakan modul ini.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => showToast(`Membuat data ${activeMenu} baru...`)}
                  className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-indigo-500 hover:opacity-90 text-slate-950 text-xs font-black transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 text-slate-950" />
                  <span>Buat {activeMenu} Baru</span>
                </button>
                <button
                  onClick={() => {
                    setActiveMenu('Dashboard');
                    showToast('Memuat Dashboard Utama');
                  }}
                  className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  Buka Dashboard Utama
                </button>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};
