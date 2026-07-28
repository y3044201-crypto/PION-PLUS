import React, { useState } from 'react';
import { Plus, Trash2, Download, RefreshCw, Table, Sparkles, Save, Loader2, Database, FileText, ClipboardCheck, Search } from 'lucide-react';
import { fetchBoqBySonumb } from '../lib/finalBoqSheet';
import { GlobalLoadingOverlay } from './GlobalLoadingOverlay';

export interface FinalBoqHeaderData {
  poNumber: string;
  poDate: string;
  sonumb: string;
  siteId: string;
  siteName: string;
  company: string;
  operator: string;
  regional: string;
  projectType: string;
  alamat: string;
  subjectPo: string;
  noKontrak2023: string;
  namaKontrak: string;
  pmSacme: string;
  aro: string;
  pmCme: string;
}

export interface FinalBoqItem {
  id: string;
  no: string;
  item: string;
  unit: string;
  qtyPo: string;
  qtyAktual: string;
  addwork: string;
  minusWork: string;
}

export interface BalapItem {
  id: string;
  no: string;
  item: string;
  unit: string;
  qtyPo: string;
  qtyBalap: string;
  deviasi: string;
  keterangan: string;
  volGdl?: string;
  noGdl?: string;
  opname?: string;
}

interface FinalBoqPageProps {
  showToast?: (msg: string) => void;
}

const DEFAULT_HEADER_DATA: FinalBoqHeaderData = {
  poNumber: '',
  poDate: '',
  sonumb: '',
  siteId: '',
  siteName: '',
  company: '',
  operator: '',
  regional: '',
  projectType: '',
  alamat: '',
  subjectPo: '',
  noKontrak2023: '',
  namaKontrak: '',
  pmSacme: '',
  aro: '',
  pmCme: '',
};

const DEFAULT_ITEMS: FinalBoqItem[] = [];
const DEFAULT_BALAP_ITEMS: BalapItem[] = [
  { id: 'balap-1', no: '1', item: 'Survey', unit: 'Ls', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-2', no: '2', item: 'Permit', unit: 'Ls', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-3', no: '3', item: 'Transportasi', unit: 'Ls', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-4', no: '4', item: 'Pulling Aerial', unit: 'm', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-5', no: '5', item: 'Pulling Duct', unit: 'm', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-6', no: '6', item: 'Trenching', unit: 'm', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-7', no: '7', item: 'HDPE Placement', unit: 'm', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-8', no: '8', item: 'Instalasi Slack Support', unit: 'set', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-9', no: '9', item: 'Instalasi Riser pipe', unit: 'm', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-10', no: '10', item: 'Splicing', unit: 'core', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-11', no: '11', item: 'Termination', unit: 'core', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-12', no: '12', item: 'Instalasi ODP/OTB', unit: 'unit', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-13', no: '13', item: 'Integrasi Operator', unit: 'site', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-14', no: '14', item: 'Pole Fiber Optic 7 meter', unit: 'btg', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-15', no: '15', item: 'Pole Fiber Optic 9 meter', unit: 'btg', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-16', no: '16', item: 'Supply, Install, Delivery Patchcord 5.0 m', unit: 'pcs', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
  { id: 'balap-17', no: '17', item: 'Supply, Install, Delivery Patchcord 20.0 m', unit: 'pcs', qtyPo: '0', qtyBalap: '', deviasi: '0', keterangan: '', volGdl: '', noGdl: '', opname: '' },
];

const calculateAddworkAndMinusWork = (qtyPo: string, qtyAktual: string) => {
  if (!qtyAktual || qtyAktual.trim() === '') {
    return { addwork: '0', minusWork: '0' };
  }
  const poNum = parseFloat(qtyPo.replace(/,/g, '')) || 0;
  const aktualNum = parseFloat(qtyAktual.replace(/,/g, '')) || 0;

  if (aktualNum > poNum) {
    const diff = aktualNum - poNum;
    const diffStr = Number.isInteger(diff) ? diff.toString() : diff.toFixed(2).replace(/\.?0+$/, '');
    return { addwork: diffStr, minusWork: '0' };
  } else if (poNum > aktualNum) {
    const diff = poNum - aktualNum;
    const diffStr = Number.isInteger(diff) ? diff.toString() : diff.toFixed(2).replace(/\.?0+$/, '');
    return { addwork: '0', minusWork: diffStr };
  } else {
    return { addwork: '0', minusWork: '0' };
  }
};

const calculateDeviasi = (qtyPo: string, qtyBalap: string) => {
  if (!qtyBalap || qtyBalap.trim() === '') {
    return '0';
  }
  const poNum = parseFloat(qtyPo.replace(/,/g, '')) || 0;
  const balapNum = parseFloat(qtyBalap.replace(/,/g, '')) || 0;
  const diff = balapNum - poNum;
  if (isNaN(diff)) return '0';
  return Number.isInteger(diff) ? diff.toString() : diff.toFixed(2).replace(/\.?0+$/, '');
};

export const FinalBoqPage: React.FC<FinalBoqPageProps> = ({ showToast }) => {
  const [headerData, setHeaderData] = useState<FinalBoqHeaderData>(DEFAULT_HEADER_DATA);
  const [items, setItems] = useState<FinalBoqItem[]>(DEFAULT_ITEMS);
  const [balapItems, setBalapItems] = useState<BalapItem[]>(DEFAULT_BALAP_ITEMS);
  const [searchTerm, setSearchTerm] = useState('');
  const [balapSearchTerm, setBalapSearchTerm] = useState('');
  const [isFetchingSheet, setIsFetchingSheet] = useState(false);

  const handleHeaderChange = (field: keyof FinalBoqHeaderData, value: string) => {
    setHeaderData((prev) => ({ ...prev, [field]: value }));
  };

  // Fetch Google Sheets data matching SONUMB
  const handleFetchSheet = async () => {
    if (!headerData.sonumb.trim()) {
      showToast?.('Silakan masukkan SONUMB terlebih dahulu');
      return;
    }

    setIsFetchingSheet(true);
    try {
      const res = await fetchBoqBySonumb(headerData.sonumb);
      if (res.success && res.headerData) {
        setHeaderData((prev) => ({
          ...prev,
          ...res.headerData,
        }));

        if (res.items && res.items.length > 0) {
          setItems(res.items);

          // Update standard VOLUME AKTUAL items with fetched items where matching
          const updatedBalap = DEFAULT_BALAP_ITEMS.map((stdItem) => {
            const matched = res.items.find((it) =>
              it.item.toLowerCase().includes(stdItem.item.toLowerCase()) ||
              stdItem.item.toLowerCase().includes(it.item.toLowerCase())
            );
            if (matched) {
              return {
                ...stdItem,
                unit: matched.unit || stdItem.unit,
                qtyPo: matched.qtyPo || '0',
                qtyBalap: matched.qtyAktual || stdItem.qtyBalap,
                deviasi: calculateDeviasi(matched.qtyPo || '0', matched.qtyAktual || stdItem.qtyBalap),
                keterangan: 'Sesuai Survei Lapangan',
              };
            }
            return stdItem;
          });

          // Also include any non-standard items from fetched list
          const extraItems: BalapItem[] = res.items
            .filter((it) => !DEFAULT_BALAP_ITEMS.some((std) =>
              it.item.toLowerCase().includes(std.item.toLowerCase()) ||
              std.item.toLowerCase().includes(it.item.toLowerCase())
            ))
            .map((it, idx) => ({
              id: `balap-extra-${it.id}`,
              no: String(DEFAULT_BALAP_ITEMS.length + idx + 1),
              item: it.item,
              unit: it.unit,
              qtyPo: it.qtyPo,
              qtyBalap: it.qtyAktual || '',
              deviasi: calculateDeviasi(it.qtyPo, it.qtyAktual || ''),
              keterangan: 'Sesuai Survei Lapangan',
            }));

          setBalapItems([...updatedBalap, ...extraItems]);
        }

        showToast?.(res.message);
      } else {
        showToast?.(res.message);
      }
    } catch (err: any) {
      showToast?.(`Error: ${err?.message || 'Gagal mengambil data dari Database Cloud'}`);
    } finally {
      setIsFetchingSheet(false);
    }
  };

  // Handle cell edits for Change Order Request
  const handleItemChange = (id: string, field: keyof FinalBoqItem, value: string) => {
    setItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'qtyAktual' || field === 'qtyPo') {
          const { addwork, minusWork } = calculateAddworkAndMinusWork(updated.qtyPo, updated.qtyAktual);
          updated.addwork = addwork;
          updated.minusWork = minusWork;
        }
        return updated;
      })
    );
  };

  // Handle cell edits for BALAP
  const handleBalapItemChange = (id: string, field: keyof BalapItem, value: string) => {
    setBalapItems((prev) =>
      prev.map((it) => {
        if (it.id !== id) return it;
        const updated = { ...it, [field]: value };
        if (field === 'qtyBalap' || field === 'qtyPo') {
          updated.deviasi = calculateDeviasi(updated.qtyPo, updated.qtyBalap);
        }
        return updated;
      })
    );
  };

  // Handle Enter key to move focus to the same column in the next row
  const handleBalapKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number, field: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const nextInput = document.querySelector<HTMLInputElement>(
        `[data-balap-row="${index + 1}"][data-balap-field="${field}"]`
      );
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      } else if (index === filteredBalapItems.length - 1) {
        handleAddBalapRow();
        setTimeout(() => {
          const newlyAddedInput = document.querySelector<HTMLInputElement>(
            `[data-balap-row="${index + 1}"][data-balap-field="${field}"]`
          );
          if (newlyAddedInput) {
            newlyAddedInput.focus();
            newlyAddedInput.select();
          }
        }, 50);
      }
    }
  };

  // Add new empty row for Change Order
  const handleAddRow = () => {
    const newRow: FinalBoqItem = {
      id: Date.now().toString(),
      no: String(items.length + 1),
      item: '',
      unit: '',
      qtyPo: '0',
      qtyAktual: '',
      addwork: '0',
      minusWork: '0',
    };
    setItems((prev) => [...prev, newRow]);
    showToast?.('Baris baru Change Order telah ditambahkan');
  };

  // Add new empty row for BALAP
  const handleAddBalapRow = () => {
    const newRow: BalapItem = {
      id: `balap-${Date.now()}`,
      no: String(balapItems.length + 1),
      item: '',
      unit: '',
      qtyPo: '0',
      qtyBalap: '',
      deviasi: '0',
      keterangan: '',
      volGdl: '',
      noGdl: '',
      opname: '',
    };
    setBalapItems((prev) => [...prev, newRow]);
    showToast?.('Baris baru VOLUME AKTUAL telah ditambahkan');
  };

  // Delete row for Change Order
  const handleDeleteRow = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    showToast?.('Baris Change Order berhasil dihapus');
  };

  // Delete row for BALAP
  const handleDeleteBalapRow = (id: string) => {
    setBalapItems((prev) => prev.filter((it) => it.id !== id));
    showToast?.('Baris VOLUME AKTUAL berhasil dihapus');
  };

  // Save handler
  const handleSave = () => {
    showToast?.('Data Change Order Request dan VOLUME AKTUAL berhasil disimpan');
  };

  // Reset table & header data
  const handleReset = () => {
    setHeaderData(DEFAULT_HEADER_DATA);
    setItems(DEFAULT_ITEMS);
    setBalapItems(DEFAULT_BALAP_ITEMS);
    setSearchTerm('');
    setBalapSearchTerm('');
    showToast?.('Halaman Final BOQ & VOLUME AKTUAL direset ke kondisi awal');
  };

  // Export Change Order to CSV
  const handleExportCsv = () => {
    const headerLines = [
      ['FIELD', 'VALUE'],
      ['PO Number', headerData.poNumber],
      ['PO Date', headerData.poDate],
      ['Sonumb', headerData.sonumb],
      ['Site ID', headerData.siteId],
      ['Site Name', headerData.siteName],
      ['Company', headerData.company],
      ['Operator', headerData.operator],
      ['Regional', headerData.regional],
      ['Project Type', headerData.projectType],
      ['Alamat', `"${headerData.alamat.replace(/"/g, '""')}"`],
      ['Subject PO', `"${headerData.subjectPo.replace(/"/g, '""')}"`],
      ['No Kontrak', headerData.noKontrak2023],
      ['Nama Kontrak', headerData.namaKontrak],
      ['PM SACME', headerData.pmSacme],
      ['ARO', headerData.aro],
      ['PM CME', headerData.pmCme],
      [],
      ['NO', 'ITEM', 'UNIT', 'QTY PO', 'AKTUAL', 'ADDWORK', 'MINUS WORK']
    ];

    const itemRows = items.map(it => [
      it.no,
      `"${it.item.replace(/"/g, '""')}"`,
      it.unit,
      it.qtyPo,
      it.qtyAktual,
      it.addwork,
      it.minusWork
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [...headerLines.map(e => e.join(',')), ...itemRows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `CHANGE_ORDER_${headerData.poNumber || 'DATA'}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Data Change Order Request berhasil di-export ke CSV');
  };

  // Export VOLUME AKTUAL to CSV
  const handleExportBalapCsv = () => {
    const headerLines = [
      ['FIELD', 'VALUE'],
      ['PO Number', headerData.poNumber],
      ['PO Date', headerData.poDate],
      ['Sonumb', headerData.sonumb],
      ['Site ID', headerData.siteId],
      ['Site Name', headerData.siteName],
      ['Company', headerData.company],
      ['Operator', headerData.operator],
      [],
      ['NO', 'ITEM', 'UNIT', 'AKTUAL', 'VOL GDL', 'NO GDL', 'OPNAME']
    ];

    const itemRows = balapItems.map(it => [
      it.no,
      `"${it.item.replace(/"/g, '""')}"`,
      it.unit,
      it.qtyBalap,
      it.volGdl || '',
      `"${(it.noGdl || '').replace(/"/g, '""')}"`,
      `"${(it.opname || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [...headerLines.map(e => e.join(',')), ...itemRows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VOLUME_AKTUAL_${headerData.poNumber || 'DATA'}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast?.('Data VOLUME AKTUAL berhasil di-export ke CSV');
  };

  // Filter items
  const filteredItems = items.filter(
    (it) =>
      it.item.toLowerCase().includes(searchTerm.toLowerCase()) ||
      it.no.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBalapItems = balapItems.filter(
    (it) =>
      it.item.toLowerCase().includes(balapSearchTerm.toLowerCase()) ||
      it.no.toLowerCase().includes(balapSearchTerm.toLowerCase()) ||
      it.keterangan.toLowerCase().includes(balapSearchTerm.toLowerCase())
  );

  return (
    <div className="p-3 md:p-5 max-w-full mx-auto w-full space-y-4">
      {/* Global Ultra-Premium Loading Overlay for Sheet Fetching */}
      <GlobalLoadingOverlay
        isVisible={isFetchingSheet}
        title="Mengambil Data Final BOQ"
        description="Mencari dan mencocokkan nomor SONUMB di Database Cloud..."
        smartStatus="Fetching BOQ Records..."
      />

      {/* Metadata Form Section (16 Textboxes) */}
      <div className="bg-white rounded-xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          {/* Sonumb on far left - distinctive color badge with Fetch Sheet button */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200/90 rounded-lg px-2.5 py-1 focus-within:bg-white focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-500/30 transition-all shadow-xs">
              <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-600 inline-block"></span>
                Sonumb:
              </span>
              <input
                type="text"
                value={headerData.sonumb}
                onChange={(e) => handleHeaderChange('sonumb', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleFetchSheet();
                  }
                }}
                placeholder="SO Number..."
                className="w-28 sm:w-36 bg-transparent text-xs font-mono font-bold text-indigo-950 focus:outline-none placeholder:text-indigo-300"
              />
              <button
                type="button"
                onClick={handleFetchSheet}
                disabled={isFetchingSheet}
                title="Tekan Enter atau Klik untuk mengambil data dari Database berdasarkan SONUMB"
                className="px-2 py-0.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer active:scale-95 disabled:opacity-60"
              >
                {isFetchingSheet ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Database className="w-3 h-3" />
                )}
                <span>Ambil Data Sheet</span>
              </button>
            </div>
          </div>

          {/* Action buttons on the right */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Simpan Data</span>
            </button>
            <button
              onClick={handleReset}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
              title="Reset ke data awal"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* 1. PO Number */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">PO Number</label>
            <input
              type="text"
              value={headerData.poNumber}
              onChange={(e) => handleHeaderChange('poNumber', e.target.value)}
              placeholder="Masukkan PO Number..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-mono font-bold"
            />
          </div>

          {/* 2. PO Date */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">PO Date</label>
            <input
              type="text"
              value={headerData.poDate}
              onChange={(e) => handleHeaderChange('poDate', e.target.value)}
              placeholder="YYYY-MM-DD / Tanggal PO..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-mono font-bold"
            />
          </div>

          {/* 4. Site ID */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">Site ID</label>
            <input
              type="text"
              value={headerData.siteId}
              onChange={(e) => handleHeaderChange('siteId', e.target.value)}
              placeholder="Site ID..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-mono font-bold"
            />
          </div>

          {/* 5. Site Name */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">Site Name</label>
            <input
              type="text"
              value={headerData.siteName}
              onChange={(e) => handleHeaderChange('siteName', e.target.value)}
              placeholder="Nama Site..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-bold"
            />
          </div>

          {/* 6. Company */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">Company</label>
            <input
              type="text"
              value={headerData.company}
              onChange={(e) => handleHeaderChange('company', e.target.value)}
              placeholder="Nama Perusahaan / PT..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-bold"
            />
          </div>

          {/* 7. Operator */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">Operator</label>
            <input
              type="text"
              value={headerData.operator}
              onChange={(e) => handleHeaderChange('operator', e.target.value)}
              placeholder="Operator Telco..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-bold"
            />
          </div>

          {/* 8. Regional */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">Regional</label>
            <input
              type="text"
              value={headerData.regional}
              onChange={(e) => handleHeaderChange('regional', e.target.value)}
              placeholder="Wilayah / Regional..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-bold"
            />
          </div>

          {/* 9. Project Type */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">Project Type</label>
            <input
              type="text"
              value={headerData.projectType}
              onChange={(e) => handleHeaderChange('projectType', e.target.value)}
              placeholder="Jenis Project..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-bold"
            />
          </div>

          {/* 10. No Kontrak */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">No Kontrak</label>
            <input
              type="text"
              value={headerData.noKontrak2023}
              onChange={(e) => handleHeaderChange('noKontrak2023', e.target.value)}
              placeholder="No Kontrak..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-mono font-bold"
            />
          </div>

          {/* 11. Nama Kontrak */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">Nama Kontrak</label>
            <input
              type="text"
              value={headerData.namaKontrak}
              onChange={(e) => handleHeaderChange('namaKontrak', e.target.value)}
              placeholder="Nama Kontrak Induk/Turunan..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-bold"
            />
          </div>

          {/* 12. PM SACME */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">PM SACME</label>
            <input
              type="text"
              value={headerData.pmSacme}
              onChange={(e) => handleHeaderChange('pmSacme', e.target.value)}
              placeholder="Nama PM SACME..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-bold"
            />
          </div>

          {/* 13. ARO */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">ARO</label>
            <input
              type="text"
              value={headerData.aro}
              onChange={(e) => handleHeaderChange('aro', e.target.value)}
              placeholder="Nama ARO..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-bold"
            />
          </div>

          {/* 14. PM CME */}
          <div className="space-y-0.5">
            <label className="text-[11px] font-semibold text-slate-600 block">PM CME</label>
            <input
              type="text"
              value={headerData.pmCme}
              onChange={(e) => handleHeaderChange('pmCme', e.target.value)}
              placeholder="Nama PM CME..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-bold"
            />
          </div>

          {/* 15. Alamat */}
          <div className="space-y-0.5 sm:col-span-1">
            <label className="text-[11px] font-semibold text-slate-600 block">Alamat</label>
            <input
              type="text"
              value={headerData.alamat}
              onChange={(e) => handleHeaderChange('alamat', e.target.value)}
              placeholder="Alamat lokasi..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-bold"
            />
          </div>

          {/* 16. Subject PO */}
          <div className="space-y-0.5 sm:col-span-2">
            <label className="text-[11px] font-semibold text-slate-600 block">Subject PO</label>
            <input
              type="text"
              value={headerData.subjectPo}
              onChange={(e) => handleHeaderChange('subjectPo', e.target.value)}
              placeholder="Subjek / Deskripsi Pekerjaan PO..."
              className="w-full px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 transition-all font-bold"
            />
          </div>
        </div>
      </div>

      {/* ---------------- 1. CHANGE ORDER REQUEST TABLE SECTION ---------------- */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
          {/* Toolbar inside Table Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-slate-200/80 bg-slate-50/60">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm sm:text-base">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <span>Change Order Request</span>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 font-medium">
              <div className="relative hidden md:block">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari item Change Order..."
                  className="pl-8 pr-3 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 w-48 font-medium"
                />
              </div>
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs">
                <Table className="w-3.5 h-3.5 text-emerald-600" />
                <span>Total Items: <strong className="text-slate-900">{items.length}</strong></span>
              </span>
              <button
                onClick={handleAddRow}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Item</span>
              </button>
              <button
                onClick={handleExportCsv}
                className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-800 text-slate-100 text-[11px] font-bold uppercase tracking-wider divide-x divide-slate-700/60">
                  <th className="px-3 py-3.5 text-center w-12">NO</th>
                  <th className="px-4 py-3.5 min-w-[220px]">ITEM</th>
                  <th className="px-3 py-3.5 text-center w-20">UNIT</th>
                  <th className="px-3 py-3.5 text-right w-24">QTY PO</th>
                  <th className="px-3 py-3.5 text-right w-24">AKTUAL</th>
                  <th className="px-3 py-3.5 text-right w-24">ADDWORK</th>
                  <th className="px-3 py-3.5 text-right w-24">MINUS WORK</th>
                  <th className="px-2 py-3.5 text-center w-12">AKSI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-xs text-slate-700 font-medium">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <Sparkles className="w-6 h-6 text-slate-300" />
                        <p>Tidak ada data item Change Order Request.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/80 transition-colors group divide-x divide-slate-100"
                    >
                      {/* NO */}
                      <td className="px-2 py-2 text-center">
                        <input
                          type="text"
                          value={row.no}
                          onChange={(e) => handleItemChange(row.id, 'no', e.target.value)}
                          className="w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1 py-1 focus:bg-white focus:outline-none font-bold text-slate-800"
                        />
                      </td>

                      {/* ITEM */}
                      <td className="px-2 py-2">
                        <input
                          type="text"
                          value={row.item}
                          onChange={(e) => handleItemChange(row.id, 'item', e.target.value)}
                          placeholder="Nama deskripsi item..."
                          className="w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-2 py-1 focus:bg-white focus:outline-none font-bold text-slate-900"
                        />
                      </td>

                      {/* UNIT */}
                      <td className="px-2 py-2 text-center">
                        <input
                          type="text"
                          value={row.unit}
                          onChange={(e) => handleItemChange(row.id, 'unit', e.target.value)}
                          placeholder="Satuan"
                          className="w-full text-center bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1 py-1 focus:bg-white focus:outline-none font-bold text-slate-700"
                        />
                      </td>

                      {/* QTY PO */}
                      <td className="px-2 py-2 text-right">
                        <input
                          type="text"
                          value={row.qtyPo}
                          onChange={(e) => handleItemChange(row.id, 'qtyPo', e.target.value)}
                          className="w-full text-right bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1.5 py-1 focus:bg-white focus:outline-none font-bold text-slate-800 font-mono"
                        />
                      </td>

                      {/* QTY AKTUAL */}
                      <td className="px-2 py-2 text-right">
                        <input
                          type="text"
                          value={row.qtyAktual}
                          onChange={(e) => handleItemChange(row.id, 'qtyAktual', e.target.value)}
                          placeholder="-"
                          className="w-full text-right bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1.5 py-1 focus:bg-white focus:outline-none font-bold text-slate-900 font-mono placeholder:text-slate-300"
                        />
                      </td>

                      {/* ADDWORK */}
                      <td className="px-2 py-2 text-right">
                        <input
                          type="text"
                          value={row.addwork}
                          onChange={(e) => handleItemChange(row.id, 'addwork', e.target.value)}
                          className="w-full text-right bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1.5 py-1 focus:bg-white focus:outline-none text-emerald-700 font-bold font-mono"
                        />
                      </td>

                      {/* MINUS WORK */}
                      <td className="px-2 py-2 text-right">
                        <input
                          type="text"
                          value={row.minusWork}
                          onChange={(e) => handleItemChange(row.id, 'minusWork', e.target.value)}
                          className="w-full text-right bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded px-1.5 py-1 focus:bg-white focus:outline-none text-rose-600 font-bold font-mono"
                        />
                      </td>

                      {/* AKSI */}
                      <td className="px-2 py-2 text-center">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Hapus baris"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer info */}
          <div className="bg-slate-50 border-t border-slate-200/80 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Menampilkan <strong className="text-slate-800">{filteredItems.length}</strong> dari{' '}
              <strong className="text-slate-800">{items.length}</strong> item Change Order Request
            </div>
          </div>
        </div>

      {/* ---------------- 2. NEW PAGE / SECTION: VOLUME AKTUAL ---------------- */}
      <div id="balap-section" className="bg-white rounded-2xl border border-indigo-200/80 shadow-sm overflow-hidden">
          {/* Header Toolbar for VOLUME AKTUAL */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-4 border-b border-indigo-100 bg-gradient-to-r from-indigo-50/80 via-slate-50 to-blue-50/50">
            <div className="flex items-center gap-2.5 text-slate-800 font-bold text-sm sm:text-base">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <ClipboardCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-indigo-950 font-extrabold tracking-tight">VOLUME AKTUAL</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 text-xs text-slate-600 font-medium">
              <span className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-indigo-100 shadow-xs">
                <Table className="w-3.5 h-3.5 text-indigo-600" />
                <span>Total VOLUME AKTUAL: <strong className="text-indigo-950">{balapItems.length}</strong></span>
              </span>
              <button
                onClick={handleAddBalapRow}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Item VOLUME AKTUAL</span>
              </button>
              <button
                onClick={handleExportBalapCsv}
                className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 hover:bg-indigo-50 text-indigo-900 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>Export CSV VOLUME AKTUAL</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-auto text-left border-collapse">
              <thead>
                <tr className="bg-indigo-950 text-indigo-100 text-[11px] font-bold uppercase tracking-wider divide-x divide-indigo-900">
                  <th className="px-3 py-3 text-left w-12">NO</th>
                  <th className="px-4 py-3 text-left w-auto whitespace-nowrap">ITEM PEKERJAAN</th>
                  <th className="px-3 py-3 text-left w-20">SATUAN</th>
                  <th className="px-3 py-3 text-left w-auto whitespace-nowrap">AKTUAL</th>
                  <th className="px-3 py-3 text-left w-auto whitespace-nowrap">VOL GDL</th>
                  <th className="px-3 py-3 text-left w-auto whitespace-nowrap">NO GDL</th>
                  <th className="px-3 py-3 text-left w-auto whitespace-nowrap">OPNAME</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-xs text-slate-700 font-medium">
                {filteredBalapItems.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium bg-slate-50/40">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <ClipboardCheck className="w-7 h-7 text-indigo-300" />
                        <p className="font-semibold text-slate-700">Tabel VOLUME AKTUAL Masih Kosong</p>
                        <p className="text-xs text-slate-400 max-w-sm">
                          Klik tombol &quot;Tambah Item VOLUME AKTUAL&quot; di atas untuk menambahkan data hasil verifikasi survei lapangan secara manual atau ambil data melalui SO Number.
                        </p>
                        <button
                          onClick={handleAddBalapRow}
                          className="mt-2 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Tambah Baris VOLUME AKTUAL Pertama</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredBalapItems.map((row, index) => {
                    return (
                      <tr
                        key={row.id}
                        className="hover:bg-indigo-50/40 transition-colors group divide-x divide-slate-100"
                      >
                        {/* NO */}
                        <td className="px-2 py-2 text-left">
                          <input
                            type="text"
                            value={row.no}
                            onChange={(e) => handleBalapItemChange(row.id, 'no', e.target.value)}
                            onKeyDown={(e) => handleBalapKeyDown(e, index, 'no')}
                            data-balap-row={index}
                            data-balap-field="no"
                            className="w-full text-left bg-transparent border border-transparent hover:border-indigo-300 focus:border-indigo-500 rounded px-1 py-1 focus:bg-white focus:outline-none font-bold text-slate-800"
                          />
                        </td>

                        {/* ITEM */}
                        <td className="px-2 py-2 text-left w-auto">
                          <input
                            type="text"
                            value={row.item}
                            onChange={(e) => handleBalapItemChange(row.id, 'item', e.target.value)}
                            onKeyDown={(e) => handleBalapKeyDown(e, index, 'item')}
                            data-balap-row={index}
                            data-balap-field="item"
                            placeholder="Deskripsi item..."
                            className="w-[320px] bg-transparent border border-transparent hover:border-indigo-300 focus:border-indigo-500 rounded px-2 py-1 focus:bg-white focus:outline-none font-bold text-slate-900"
                          />
                        </td>

                        {/* UNIT */}
                        <td className="px-2 py-2 text-left">
                          <input
                            type="text"
                            value={row.unit}
                            onChange={(e) => handleBalapItemChange(row.id, 'unit', e.target.value)}
                            onKeyDown={(e) => handleBalapKeyDown(e, index, 'unit')}
                            data-balap-row={index}
                            data-balap-field="unit"
                            placeholder="Satuan"
                            className="w-full text-left bg-transparent border border-transparent hover:border-indigo-300 focus:border-indigo-500 rounded px-1 py-1 focus:bg-white focus:outline-none font-bold text-slate-700"
                          />
                        </td>

                        {/* QTY VOLUME AKTUAL */}
                        <td className="px-2 py-2 text-left w-auto">
                          <input
                            type="text"
                            value={row.qtyBalap}
                            onChange={(e) => handleBalapItemChange(row.id, 'qtyBalap', e.target.value)}
                            onKeyDown={(e) => handleBalapKeyDown(e, index, 'qtyBalap')}
                            data-balap-row={index}
                            data-balap-field="qtyBalap"
                            placeholder="-"
                            className="w-24 text-left bg-transparent border border-transparent hover:border-indigo-300 focus:border-indigo-500 rounded px-1.5 py-1 focus:bg-white focus:outline-none font-bold text-indigo-950 font-mono placeholder:text-slate-300"
                          />
                        </td>

                        {/* VOL GDL */}
                        <td className="px-2 py-2 text-left w-auto">
                          <input
                            type="text"
                            value={row.volGdl || ''}
                            onChange={(e) => handleBalapItemChange(row.id, 'volGdl', e.target.value)}
                            onKeyDown={(e) => handleBalapKeyDown(e, index, 'volGdl')}
                            data-balap-row={index}
                            data-balap-field="volGdl"
                            placeholder="-"
                            className="w-24 text-left bg-transparent border border-transparent hover:border-indigo-300 focus:border-indigo-500 rounded px-1.5 py-1 focus:bg-white focus:outline-none font-bold text-slate-800 font-mono placeholder:text-slate-300"
                          />
                        </td>

                        {/* NO GDL */}
                        <td className="px-2 py-2 text-left w-auto">
                          <input
                            type="text"
                            value={row.noGdl || ''}
                            onChange={(e) => handleBalapItemChange(row.id, 'noGdl', e.target.value)}
                            onKeyDown={(e) => handleBalapKeyDown(e, index, 'noGdl')}
                            data-balap-row={index}
                            data-balap-field="noGdl"
                            placeholder="-"
                            className="w-28 text-left bg-transparent border border-transparent hover:border-indigo-300 focus:border-indigo-500 rounded px-1.5 py-1 focus:bg-white focus:outline-none font-medium text-slate-800 placeholder:text-slate-300"
                          />
                        </td>

                        {/* OPNAME */}
                        <td className="px-2 py-2 text-left w-auto">
                          <input
                            type="text"
                            value={row.opname || ''}
                            onChange={(e) => handleBalapItemChange(row.id, 'opname', e.target.value)}
                            onKeyDown={(e) => handleBalapKeyDown(e, index, 'opname')}
                            data-balap-row={index}
                            data-balap-field="opname"
                            placeholder="-"
                            className="w-28 text-left bg-transparent border border-transparent hover:border-indigo-300 focus:border-indigo-500 rounded px-1.5 py-1 focus:bg-white focus:outline-none font-medium text-slate-800 placeholder:text-slate-300"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Footer info */}
          <div className="bg-indigo-50/50 border-t border-indigo-100 p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Menampilkan <strong className="text-indigo-950">{filteredBalapItems.length}</strong> dari{' '}
              <strong className="text-indigo-950">{balapItems.length}</strong> item Volume Aktual
            </div>
          </div>
        </div>

    </div>
  );
};

