import React, { useState, useRef, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalLoadingOverlay } from './GlobalLoadingOverlay';
import { 
  FileText, 
  Upload, 
  Trash2, 
  RefreshCw, 
  RotateCcw,
  CheckCircle2, 
  AlertCircle, 
  Sparkles,
  Save,
  FileSpreadsheet,
  Calendar,
  FileCode2,
  Hash,
  Tag,
  AlignLeft,
  Building2,
  X,
  Search,
  Loader2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Plus,
  Lock,
  Key,
  ShieldCheck
} from 'lucide-react';
import { getAccessToken, googleSignIn, clearAccessToken, setAccessTokenManual } from '../lib/auth';
import { savePoToGoogleSheet, removeLeadingZeroes } from '../lib/sheetsApi';
import { fetchBoqBySonumb, parseCurrencyNumber } from '../lib/finalBoqSheet';

// Configure pdfjs worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;

export interface PoTableItem {
  id: string;
  no: string;
  description: string;
  qty: string;
  uom: string;
  unitPrice: string;
  total: string;
}

export interface PoData {
  purchaseOrder: string;
  placeDate: string;
  contractNo: string;
  soNumber: string;
  subject: string;
  items: PoTableItem[];
}

// Empty initial PO state
const EMPTY_PO_DATA: PoData = {
  purchaseOrder: '',
  placeDate: '',
  contractNo: '',
  soNumber: '',
  subject: '',
  items: []
};

interface FinalBoqViewProps {
  showToast?: (msg: string) => void;
  onRegisterHeaderActions?: (actions: {
    onSave: () => void;
    onUpload: () => void;
    onReset: () => void;
    isProcessing: boolean;
    isSaving?: boolean;
  } | null) => void;
}

export const FinalBoqView: React.FC<FinalBoqViewProps> = ({
  showToast: externalShowToast,
  onRegisterHeaderActions,
}) => {
  const [poData, setPoData] = useState<PoData>(EMPTY_PO_DATA);
  const [isProcessingPdf, setIsProcessingPdf] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>('Belum ada berkas');
  const [extractedText, setExtractedText] = useState<string>('');
  const [showExtractedText, setShowExtractedText] = useState<boolean>(false);
  const [isCopiedExtractedText, setIsCopiedExtractedText] = useState<boolean>(false);
  const [spreadsheetSearchTerm, setSpreadsheetSearchTerm] = useState<string>('');
  const [isSearchingSpreadsheet, setIsSearchingSpreadsheet] = useState<boolean>(false);
  const [isCopiedTable, setIsCopiedTable] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [authModalError, setAuthModalError] = useState<string>('');
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const [hasToken, setHasToken] = useState<boolean>(false);
  const [noticeOverlay, setNoticeOverlay] = useState<{
    isVisible: boolean;
    title?: string;
    description?: string;
  }>({ isVisible: false });

  useEffect(() => {
    getAccessToken().then(tok => {
      setHasToken(!!tok);
    });
  }, [showAuthModal]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLTextAreaElement>(null);

  const handleCopyTableToExcel = async () => {
    if (!poData.items || poData.items.length === 0) {
      const msg = 'Tabel masih kosong. Silakan unggah PDF atau cari item terlebih dahulu.';
      showNotification(msg);
      if (externalShowToast) externalShowToast(msg);
      return;
    }

    const headers = ['NO', 'ITEM DESCRIPTION', 'QTY', 'UOM', 'UNIT PRICE (IDR)', 'TOTAL (IDR)'];
    const rows = poData.items.map((item, idx) => [
      item.no || String(idx + 1),
      item.description || '',
      item.qty || '0',
      item.uom || 'Pcs',
      item.unitPrice || '0',
      item.total || '0',
    ]);

    const tsvContent = [
      headers.join('\t'),
      ...rows.map(row => row.join('\t'))
    ].join('\n');

    const htmlRows = poData.items.map((item, idx) => `
      <tr>
        <td style="text-align: center;">${item.no || String(idx + 1)}</td>
        <td>${(item.description || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>
        <td style="text-align: right;">${item.qty || '0'}</td>
        <td style="text-align: center;">${item.uom || 'Pcs'}</td>
        <td style="text-align: right;">${item.unitPrice || '0'}</td>
        <td style="text-align: right;">${item.total || '0'}</td>
      </tr>
    `).join('');

    const grandTotalNum = poData.items.reduce((acc, curr) => acc + (parseFloat((curr.total || '0').replace(/,/g, '')) || 0), 0);
    const grandTotalStr = grandTotalNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const htmlContent = `
      <table border="1" style="border-collapse: collapse; font-family: sans-serif; font-size: 12px;">
        <thead>
          <tr style="background-color: #f1f5f9; font-weight: bold;">
            <th>NO</th>
            <th>ITEM DESCRIPTION</th>
            <th>QTY</th>
            <th>UOM</th>
            <th>UNIT PRICE (IDR)</th>
            <th>TOTAL (IDR)</th>
          </tr>
        </thead>
        <tbody>
          ${htmlRows}
        </tbody>
        <tfoot>
          <tr style="background-color: #0f172a; color: #ffffff; font-weight: bold;">
            <td colspan="5" style="text-align: left;">GRAND TOTAL</td>
            <td style="text-align: right; color: #34d399;">${grandTotalStr}</td>
          </tr>
        </tfoot>
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

      const succMsg = `Berhasil menyalin ${poData.items.length} item tabel ke clipboard! Siap di-paste ke Excel.`;
      setIsCopiedTable(true);
      setTimeout(() => setIsCopiedTable(false), 3000);
      showNotification(succMsg);
      if (externalShowToast) externalShowToast(succMsg);
    } catch (err) {
      console.error('Copy table error:', err);
      try {
        await navigator.clipboard.writeText(tsvContent);
        const succMsg = `Berhasil menyalin ${poData.items.length} item tabel ke clipboard! Siap di-paste ke Excel.`;
        setIsCopiedTable(true);
        setTimeout(() => setIsCopiedTable(false), 3000);
        showNotification(succMsg);
        if (externalShowToast) externalShowToast(succMsg);
      } catch (fallbackErr) {
        const errMsg = 'Gagal menyalin isi tabel ke clipboard.';
        showNotification(errMsg);
        if (externalShowToast) externalShowToast(errMsg);
      }
    }
  };

  const handleSpreadsheetSearch = async () => {
    const term = spreadsheetSearchTerm.trim();
    if (!term) {
      const msg = 'Silakan masukkan kata kunci pencarian (SO Number, PO Number, atau Item).';
      showNotification(msg);
      if (externalShowToast) externalShowToast(msg);
      return;
    }

    setIsSearchingSpreadsheet(true);
    try {
      const res = await fetchBoqBySonumb(term);
      if (res.success && (res.headerData || (res.items && res.items.length > 0))) {
        const newItems: PoTableItem[] = res.items && res.items.length > 0
          ? res.items.map((it, idx) => {
              const qtyVal = it.qtyPo || (it as any).qty || '1';
              const qtyNum = parseCurrencyNumber(qtyVal) || 1;
              let priceNum = parseCurrencyNumber((it as any).unitPrice);
              let totalNum = parseCurrencyNumber((it as any).total);

              if (totalNum === 0 && priceNum > 0) {
                totalNum = priceNum * qtyNum;
              } else if (priceNum === 0 && totalNum > 0 && qtyNum > 0) {
                priceNum = totalNum / qtyNum;
              }

              const formattedPrice = priceNum > 0
                ? priceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : (String((it as any).unitPrice || '0'));

              const formattedTotal = totalNum > 0
                ? totalNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : (String((it as any).total || '0'));

              return {
                id: it.id || `sheet-${idx + 1}-${Date.now()}`,
                no: it.no || String(idx + 1),
                description: it.item || (it as any).description || '',
                qty: qtyVal,
                uom: it.unit || (it as any).uom || 'Pcs',
                unitPrice: formattedPrice,
                total: formattedTotal,
              };
            })
          : poData.items;

        const hData = res.headerData || {};
        setPoData((prev) => ({
          purchaseOrder: hData.poNumber || prev.purchaseOrder || term,
          placeDate: hData.poDate || prev.placeDate || '',
          contractNo: hData.noKontrak2023 || prev.contractNo || '',
          soNumber: hData.sonumb || prev.soNumber || term,
          subject: hData.subjectPo || hData.namaKontrak || prev.subject || '',
          items: newItems,
        }));

        const succMsg = res.message || `Berhasil menemukan data untuk "${term}"!`;
        showNotification(succMsg);
        if (externalShowToast) externalShowToast(succMsg);
      } else {
        const errMsg = res.message || `Data tidak ditemukan untuk "${term}".`;
        showNotification(errMsg);
        if (externalShowToast) externalShowToast(errMsg);
      }
    } catch (err: any) {
      console.error('Search error:', err);
      const msg = `Gagal mencari data: ${err.message || 'Error'}`;
      showNotification(msg);
      if (externalShowToast) externalShowToast(msg);
    } finally {
      setIsSearchingSpreadsheet(false);
    }
  };

  const isPageEmpty =
    !poData.soNumber.trim() &&
    !poData.purchaseOrder.trim() &&
    !poData.contractNo.trim() &&
    !poData.placeDate.trim() &&
    !poData.subject.trim() &&
    (!poData.items || poData.items.length === 0 || poData.items.every(item => !item.description.trim() && !item.qty.trim() && !item.unitPrice.trim() && !item.total.trim()));

  const handleUploadClick = () => {
    if (!isPageEmpty) {
      const msg = 'Harap simpan atau reset terlebih dahulu data yang ada untuk dapat melanjutkan unggah PDF PO baru.';
      showNotification(msg);
      if (externalShowToast) externalShowToast(msg);
      return;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    fileInputRef.current?.click();
  };

  const handleGoogleSignInFromModal = async () => {
    setIsLoggingIn(true);
    setAuthModalError('');
    try {
      const res = await googleSignIn();
      if (res?.accessToken) {
        setHasToken(true);
        setShowAuthModal(false);
        const successMsg = 'Berhasil terhubung ke Google! Menyimpan data ke Database Cloud...';
        showNotification(successMsg);
        if (externalShowToast) externalShowToast(successMsg);
        await doSaveToSheet(res.accessToken);
      }
    } catch (err: any) {
      if (err?.code === 'auth/unauthorized-domain') {
        setAuthModalError('Domain Vercel/Website ini belum didaftarkan di Firebase Console (Authentication -> Authorized Domains). Silakan masukkan Token Google secara manual di bawah.');
      } else if (err?.code === 'auth/popup-closed-by-user' || err?.code === 'auth/cancelled-popup-request') {
        setAuthModalError('Popup login Google ditutup sebelum selesai.');
      } else {
        setAuthModalError(`Gagal Login Google: ${err?.message || 'Izin login diperlukan'}`);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSaveManualToken = async () => {
    if (!manualTokenInput.trim()) {
      setAuthModalError('Masukkan Google Access Token terlebih dahulu.');
      return;
    }
    const cleanTok = manualTokenInput.trim();
    setAccessTokenManual(cleanTok);
    setHasToken(true);
    setShowAuthModal(false);
    showNotification('Access Token disimpan. Menyimpan data ke Database Cloud...');
    await doSaveToSheet(cleanTok);
  };

  const handleSaveLocalOnly = () => {
    setShowAuthModal(false);
    const msg = 'Data Purchase Order tersimpan aman di Database Lokal.';
    showNotification(msg);
    if (externalShowToast) externalShowToast(msg);
  };

  const doSaveToSheet = async (tokenToUse: string) => {
    setIsSaving(true);
    showNotification('Menyimpan data ke Database Cloud Google Sheets...');
    if (externalShowToast) {
      externalShowToast('Menyimpan data ke Database Cloud Google Sheets...');
    }

    try {
      const res = await savePoToGoogleSheet(poData, tokenToUse);
      if (res) {
        const successMsg = `Berhasil disimpan ke Database Cloud Google Sheets! (${res.rowsAdded} baris tersimpan)`;
        showNotification(successMsg);
        if (externalShowToast) externalShowToast(successMsg);

        // Reset data ke kondisi awal setelah berhasil simpan
        setPoData(EMPTY_PO_DATA);
        setFileName('Belum ada berkas');
        setExtractedText('');
        try {
          localStorage.removeItem('saved_po_data');
        } catch (e) {}
      }
    } catch (sheetErr: any) {
      console.error('Save to Sheets error:', sheetErr);
      const errText = String(sheetErr?.message || sheetErr);
      if (errText.includes('UNAUTHORIZED_TOKEN') || errText.includes('401') || errText.includes('403')) {
        clearAccessToken();
        setHasToken(false);
        setAuthModalError('Sesi Token Google telah kedaluwarsa atau tidak valid. Silakan login Google ulang di bawah.');
        setShowAuthModal(true);
      } else {
        const rawMsg = sheetErr?.message || 'Error';
        const errMsg = rawMsg.includes('sudah ada di') || rawMsg.includes('sudah ada')
          ? rawMsg.replace(/Google Sheets/g, 'Database')
          : `Tersimpan di Lokal. Gagal Sync Cloud: ${rawMsg.replace(/Google Sheets/g, 'Database')}`;
        showNotification(errMsg);
        if (externalShowToast) externalShowToast(errMsg);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSave = async () => {
    if (isPageEmpty) {
      const msg = 'Halaman Purchase Order masih kosong. Silakan unggah file PDF PO terlebih dahulu sebelum menyimpan data.';
      showNotification(msg);
      if (externalShowToast) externalShowToast(msg);
      return;
    }

    if (!poData.soNumber.trim()) {
      const msg = 'Gagal menyimpan: SO NUMBER belum diisi.';
      showNotification(msg);
      if (externalShowToast) externalShowToast(msg);
      return;
    }

    // Always store a copy in local PO database history so data is 100% safe
    try {
      localStorage.setItem('saved_po_data', JSON.stringify(poData));
      const existingHistoryRaw = localStorage.getItem('po_history_list');
      let historyList = existingHistoryRaw ? JSON.parse(existingHistoryRaw) : [];
      if (!Array.isArray(historyList)) historyList = [];
      const cleanSo = poData.soNumber.trim();
      const existingIdx = historyList.findIndex((item: any) => item?.soNumber?.trim()?.toLowerCase() === cleanSo.toLowerCase());
      if (existingIdx >= 0) {
        historyList[existingIdx] = { ...poData, savedAt: new Date().toISOString() };
      } else {
        historyList.push({ ...poData, savedAt: new Date().toISOString() });
      }
      localStorage.setItem('po_history_list', JSON.stringify(historyList));
    } catch (e) {
      console.error('Local history save error:', e);
    }

    const token = await getAccessToken();
    if (!token) {
      setAuthModalError('');
      setShowAuthModal(true);
      return;
    }

    await doSaveToSheet(token);
  };

  useEffect(() => {
    if (onRegisterHeaderActions) {
      onRegisterHeaderActions({
        onSave: handleSave,
        onUpload: handleUploadClick,
        onReset: handleResetAll,
        isProcessing: isProcessingPdf,
        isSaving,
      });
    }
  }, [isProcessingPdf, isSaving, onRegisterHeaderActions, poData, isPageEmpty]);

  useEffect(() => {
    if (subjectRef.current) {
      subjectRef.current.style.height = 'auto';
      subjectRef.current.style.height = `${Math.max(60, subjectRef.current.scrollHeight)}px`;
    }
  }, [poData.subject]);

  const showNotification = (msg: string) => {
    setNoticeOverlay({
      isVisible: true,
      title: 'Informasi Purchase Order',
      description: msg,
    });
  };

  // PDF Text Extraction & Pattern Detection
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
      showNotification('Harap unggah berkas bertipe PDF (.pdf)');
      return;
    }

    setIsProcessingPdf(true);
    setFileName(file.name);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        let pageText = '';
        for (const item of textContent.items as any[]) {
          pageText += item.str + (item.hasEOL ? '\n' : ' ');
        }
        if (!pageText.trim()) {
          pageText = textContent.items.map((item: any) => item.str).join(' ');
        }
        fullText += pageText + '\n';
      }

      // Auto detect metadata from text using Regex rules
      const textLines = fullText
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean);

      const numberedText = textLines.map((line, idx) => `${idx + 1}: ${line}`).join('\n');
      setExtractedText(numberedText);

      const extracted = parsePdfPoText(fullText);
      setPoData(extracted);
      showNotification(`Berhasil konversi PDF ${file.name} dan membaca data PO otomatis!`);
    } catch (err) {
      console.error('Failed to parse PDF:', err);
      showNotification('Gagal membaca PDF. Pastikan file PDF tidak terkunci.');
      setPoData(EMPTY_PO_DATA);
    } finally {
      setIsProcessingPdf(false);
    }
  };

  // Heuristic PDF Parser for Purchase Orders
  const parsePdfPoText = (text: string): PoData => {
    // 1. Detect Purchase Order
    const poMatch = text.match(/PO\/[A-Z0-9\/_-]+/i) || text.match(/PURCHASE\s+ORDER[\s\S]*?(PO\/[^\s]+)/i);
    const purchaseOrder = poMatch ? poMatch[0].replace('PURCHASE ORDER', '').trim() : '';

    // 2. Detect Place/Date
    let rawPlaceDate = '';
    const placeDateLineMatch = text.match(/Place\/Date\s*:\s*([^\n\r]+)/i);
    if (placeDateLineMatch) {
      rawPlaceDate = placeDateLineMatch[1].trim();
    } else {
      const afterCommaMatch = text.match(/,\s*(\d{2}-[A-Za-z]+-\d{4})/);
      if (afterCommaMatch) {
        rawPlaceDate = afterCommaMatch[1].trim();
      } else {
        const standaloneDateMatch = text.match(/(\d{2}-[A-Za-z]+-\d{4})/);
        if (standaloneDateMatch) {
          rawPlaceDate = standaloneDateMatch[1].trim();
        }
      }
    }

    // Helper to strip out trailing noise like "TO : Vendor Code...", "PT.", etc.
    const cleanPlaceDate = (str: string): string => {
      if (!str) return '';
      let cleaned = str
        .replace(/\s*TO\s*:[\s\S]*/i, '')
        .replace(/\s*Vendor[\s\S]*/i, '')
        .replace(/\s*Address[\s\S]*/i, '')
        .replace(/\s*Attn[\s\S]*/i, '')
        .replace(/\s*Phone[\s\S]*/i, '')
        .replace(/\s*Fax[\s\S]*/i, '')
        .replace(/\s*E-Mail[\s\S]*/i, '')
        .replace(/\s*PT\.[\s\S]*/i, '')
        .replace(/\s*3938[\s\S]*/i, '')
        .replace(/\s*Pedukuhan[\s\S]*/i, '')
        .trim();

      if (cleaned.includes(',')) {
        const parts = cleaned.split(',');
        if (parts[1] && parts[1].trim()) {
          cleaned = parts[1].trim();
        }
      }

      const dateMatch = cleaned.match(/(\d{1,2}-[A-Za-z]+-\d{4}|\d{1,2}\s+[A-Za-z]+\s+\d{4}|\d{1,2}[\/\.-]\d{1,2}[\/\.-]\d{2,4})/);
      if (dateMatch) {
        return dateMatch[1].trim();
      }

      return cleaned.trim();
    };

    const placeDate = cleanPlaceDate(rawPlaceDate);

    // 3. Detect Contract No from 2 lines after the line containing "Contract No" in PDF text
    let contractNo = '';
    const textLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const contractIndex = textLines.findIndex(line => /contract\s*no/i.test(line));

    if (contractIndex !== -1 && contractIndex + 2 < textLines.length) {
      let targetLine = textLines[contractIndex + 2];
      targetLine = targetLine.replace(/^\d+:\s*/, '');
      if (targetLine.includes(':')) {
        targetLine = targetLine.substring(targetLine.indexOf(':') + 1).trim();
      }
      contractNo = targetLine
        .replace(/\s*(Attn|Phone|Fax|E-Mail|Vendor|Address|PT\.|Requestor|PR\s+No)[\s\S]*/i, '')
        .trim();
    }

    // Fallback: check the line containing Contract No itself or regex match
    if (!contractNo && contractIndex !== -1) {
      let val = textLines[contractIndex];
      if (val.includes(':')) {
        val = val.substring(val.indexOf(':') + 1).trim();
      } else {
        val = val.replace(/contract\s*no/i, '').trim();
      }
      contractNo = val
        .replace(/\s*(Attn|Phone|Fax|E-Mail|Vendor|Address|PT\.|Requestor|PR\s+No)[\s\S]*/i, '')
        .trim();
    }

    if (!contractNo) {
      const contractMatch = text.match(/Contract\s+No\s*:\s*([^\n\r]+)/i);
      if (contractMatch && contractMatch[1].trim()) {
        contractNo = contractMatch[1].trim()
          .replace(/\s*(Attn|Phone|Fax|E-Mail|Vendor|Address|PT\.|Requestor|PR\s+No)[\s\S]*/i, '')
          .trim();
      }
    }

    // 4. Detect SO Number from 2 lines BEFORE the line containing "SO Number" in PDF text
    let soNumber = '';
    const soIndex = textLines.findIndex(line => /SO\s*Number|SO\s*No/i.test(line));

    if (soIndex !== -1 && soIndex - 2 >= 0) {
      let targetLine = textLines[soIndex - 2];
      targetLine = targetLine.replace(/^\d+:\s*/, '');
      if (targetLine.includes(':')) {
        targetLine = targetLine.substring(targetLine.indexOf(':') + 1).trim();
      }
      soNumber = targetLine
        .replace(/\s*(SUBJECT|Subject|Contract|Place|Date|Vendor|Address|Attn|Phone|Fax)[\s\S]*/i, '')
        .trim();
    }

    // Fallback if 2 lines before was empty or not found
    if (!soNumber) {
      const soMatch = text.match(/SO\s*(?:Number|No)?\s*:\s*([^\n\r]+)/i) || text.match(/\b(00400\d{8}|\d{13})\b/);
      if (soMatch) {
        let rawSo = soMatch[1] || soMatch[0];
        soNumber = rawSo
          .replace(/\s*(SUBJECT|Subject|Contract|Place|Date|Vendor|Address|Attn|Phone|Fax)[\s\S]*/i, '')
          .trim();
      }
    }

    // 5. Detect SUBJECT from line with "Pekerjaan Jasa" until 2 lines before "Contract No"
    let subject = '';
    const pekJasaIdx = textLines.findIndex(l => /pekerjaan\s*jasa/i.test(l));
    const contractIdx = textLines.findIndex(l => /contract\s*no/i.test(l));

    if (pekJasaIdx !== -1) {
      let endIdx = pekJasaIdx;
      if (contractIdx !== -1 && contractIdx - 2 >= pekJasaIdx) {
        endIdx = contractIdx - 2;
      }
      const collected = textLines
        .slice(pekJasaIdx, endIdx + 1)
        .map(l => {
          let cleaned = l.replace(/^\d+:\s*/, '').trim();
          if (/^subject\s*:\s*/i.test(cleaned)) {
            cleaned = cleaned.replace(/^subject\s*:\s*/i, '');
          }
          return cleaned;
        })
        .filter(l => !/No\s+Item\s+Description\s+Qty\s+UoM/i.test(l))
        .filter(Boolean);
      subject = collected.join(' ').replace(/\s+/g, ' ').trim();
    }

    // Fallback if "Pekerjaan Jasa" was not found
    if (!subject) {
      const subjectMatch = text.match(/SUBJECT\s*:\s*([\s\S]*?)(?=Contract|No\s+Item|Item\s+No|Note|0005|SO\s+Number|$)/i);
      if (subjectMatch && subjectMatch[1].trim()) {
        subject = subjectMatch[1].replace(/\s+/g, ' ').trim();
      }
    }

    // Clean any table header remnants from subject
    subject = subject
      .replace(/No\s+Item\s+Description\s+Qty\s+UoM\s+Unit\s+Price\s*\([^)]*\)\s*Total\s*\([^)]*\)/gi, '')
      .replace(/Item\s+Description\s+Qty\s+UoM\s+Unit\s+Price\s*\([^)]*\)\s*Total\s*\([^)]*\)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    // 6. Detect Table Rows
    const items: PoTableItem[] = [];
    const lineRegex = /(\d+)\s+([A-Za-z0-9\s\.\(\)\/_\-\,\;\&]+?)\s+([\d\.,]+)\s+(M|unit|ls|set|pcs|bh|m2|m3|titik|lot|kg|m|ea|pak|box)\s+([\d\.,]+)\s+([\d\.,]+)/gi;
    
    let match;
    let count = 1;
    while ((match = lineRegex.exec(text)) !== null) {
      let rawNo = match[1] || `${count}`;
      let cleanDesc = match[2].trim();

      // Filter out header row text if present inside item description
      cleanDesc = cleanDesc
        .replace(/No\s+Item\s+Description\s+Qty\s+UoM\s+Unit\s+Price\s*\([^)]*\)\s*Total\s*\([^)]*\)/gi, '')
        .replace(/No\s+Item\s+Description\s+Qty\s+UoM\s+Unit\s+Price\s*IDR\s*Total\s*IDR/gi, '')
        .replace(/Item\s+Description\s+Qty\s+UoM\s+Unit\s+Price\s*\([^)]*\)\s*Total\s*\([^)]*\)/gi, '')
        .replace(/No\s+Item\s+Description\s+Qty\s+UoM/gi, '')
        .replace(/Item\s+Description/gi, '')
        .replace(/Unit\s+Price\s*\([^)]*\)/gi, '')
        .replace(/Total\s*\([^)]*\)/gi, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!cleanDesc) continue;

      let itemNo = rawNo;
      // Extract leading digits/number before letters from cleanDesc if present,
      // assign to 'no' and remove from description
      const leadingNumMatch = cleanDesc.match(/^(\d+(?:[\.\-]\d+)*)\s*[\.\-:]?\s*([A-Za-z].*)$/);
      if (leadingNumMatch) {
        itemNo = leadingNumMatch[1];
        cleanDesc = leadingNumMatch[2].trim();
      }

      items.push({
        id: `row-${count}`,
        no: itemNo,
        description: cleanDesc,
        qty: match[3],
        uom: match[4],
        unitPrice: match[5],
        total: match[6]
      });
      count++;
    }

    return {
      purchaseOrder,
      placeDate,
      contractNo,
      soNumber: removeLeadingZeroes(soNumber),
      subject,
      items
    };
  };

  // Handlers for metadata textboxes
  const handleFieldChange = (field: keyof Omit<PoData, 'items'>, value: string) => {
    let newValue = value;
    if (field === 'soNumber') {
      newValue = removeLeadingZeroes(value);
    }
    setPoData(prev => ({ ...prev, [field]: newValue }));
  };

  // Handlers for table rows
  const handleItemChange = (id: string, field: keyof PoTableItem, value: string) => {
    setPoData(prev => {
      const updatedItems = prev.items.map(item => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };

        if (field === 'description') {
          const leadingNumMatch = value.match(/^(\d+(?:[\.\-]\d+)*)\s*[\.\-:]?\s*([A-Za-z].*)$/);
          if (leadingNumMatch) {
            updated.no = leadingNumMatch[1];
            updated.description = leadingNumMatch[2].trim();
          }
        }

        // Recalculate total if qty or unitPrice changed
        if (field === 'qty' || field === 'unitPrice') {
          const qtyNum = parseFloat((field === 'qty' ? value : item.qty).replace(/,/g, '')) || 0;
          const priceNum = parseFloat((field === 'unitPrice' ? value : item.unitPrice).replace(/,/g, '')) || 0;
          if (qtyNum > 0 && priceNum > 0) {
            updated.total = (qtyNum * priceNum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
        }
        return updated;
      });
      return { ...prev, items: updatedItems };
    });
  };

  // Add new table row
  const handleAddRow = () => {
    const newRow: PoTableItem = {
      id: `row-${Date.now()}`,
      no: `${poData.items.length + 1}`,
      description: 'Pekerjaan Baru',
      qty: '1.00',
      uom: 'M',
      unitPrice: '10,000.00',
      total: '10,000.00'
    };
    setPoData(prev => ({ ...prev, items: [...prev.items, newRow] }));
    showNotification('Baris item baru berhasil ditambahkan');
  };

  // Delete table row
  const handleDeleteRow = (id: string) => {
    setPoData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
    showNotification('Baris item telah dihapus');
  };

  // Reset all data (kosongkan semua data)
  const handleResetAll = () => {
    setPoData(EMPTY_PO_DATA);
    setFileName('Belum ada berkas');
    setExtractedText('');
    try {
      localStorage.removeItem('saved_po_data');
    } catch (e) {}
    showNotification('Semua data berhasil dikosongkan (Reset)');
  };

  // Export to CSV
  const handleExportCsv = () => {
    const csvContent = [
      ['FIELD', 'VALUE'].join(','),
      ['PURCHASE ORDER', `"${poData.purchaseOrder}"`],
      ['Place/Date', `"${poData.placeDate}"`],
      ['Contract No', `"${poData.contractNo}"`],
      ['SO Number', `"${poData.soNumber}"`],
      ['SUBJECT', `"${poData.subject.replace(/"/g, '""')}"`],
      [''],
      ['No', 'Item Description', 'Qty', 'UoM', 'Unit Price (IDR)', 'Total (IDR)'].join(','),
      ...poData.items.map(i => [
        `"${i.no}"`,
        `"${i.description.replace(/"/g, '""')}"`,
        `"${i.qty}"`,
        `"${i.uom}"`,
        `"${i.unitPrice}"`,
        `"${i.total}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FINAL_BOQ_${poData.purchaseOrder.replace(/[\/\\]/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showNotification('Data Final BOQ berhasil diunduh sebagai CSV');
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full text-slate-900">
      
      {/* Global Ultra-Premium Glassmorphism 2.0 Loading Overlay for PO operations */}
      <GlobalLoadingOverlay
        isVisible={isProcessingPdf || isSaving}
        title={isProcessingPdf ? 'Extracting PDF Purchase Order' : 'Saving Purchase Order to Database'}
        description={
          isProcessingPdf 
            ? 'AI parsing document text structure, detecting metadata fields, and extracting line items...'
            : 'Synchronizing Purchase Order record to connected Cloud database...'
        }
        smartStatus={isProcessingPdf ? 'Parsing PDF text...' : 'Writing rows to Cloud Database...'}
      />

      {/* Ultra-Premium Glassmorphism 2.0 Notice Overlay */}
      <GlobalLoadingOverlay
        isVisible={noticeOverlay.isVisible}
        title={noticeOverlay.title}
        description={noticeOverlay.description}
        smartStatus="Selesai"
        progress={100}
        autoCloseMs={800}
        onClose={() => setNoticeOverlay({ isVisible: false })}
      />

      {/* Hidden file input for header action upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        accept=".pdf" 
        onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} 
        className="hidden" 
      />

      {/* ---------------- METADATA TEXTBOXES SECTION ---------------- */}
      <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200/80 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-emerald-600" />
            <span>Informasi Purchase Order</span>
          </h3>
          <div className="relative flex items-center min-w-[260px] sm:w-80 md:w-96">
            <Search className="w-4 h-4 absolute left-3 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={spreadsheetSearchTerm}
              onChange={(e) => setSpreadsheetSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSpreadsheetSearch();
                }
              }}
              placeholder="Cari . . . "
              className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
            {spreadsheetSearchTerm && (
              <button
                type="button"
                onClick={() => setSpreadsheetSearchTerm('')}
                className="absolute right-14 text-slate-400 hover:text-slate-600 text-xs font-bold p-1"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleSpreadsheetSearch}
              disabled={isSearchingSpreadsheet}
              className="absolute right-1 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm"
            >
              {isSearchingSpreadsheet ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <span>Cari</span>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          
          {/* 1. PURCHASE ORDER */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Tag className="w-3.5 h-3.5 text-emerald-600" />
              <span>PURCHASE ORDER</span>
            </label>
            <input
              type="text"
              value={poData.purchaseOrder}
              onChange={(e) => handleFieldChange('purchaseOrder', e.target.value)}
              placeholder="Contoh: PO/TB/23/N014590"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* 2. Place/Date: */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Place/Date:</span>
            </label>
            <input
              type="text"
              value={poData.placeDate}
              onChange={(e) => handleFieldChange('placeDate', e.target.value)}
              placeholder="Contoh: 24-April-2026"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* 3. Contract No: */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Hash className="w-3.5 h-3.5 text-emerald-600" />
              <span>Contract No:</span>
            </label>
            <input
              type="text"
              value={poData.contractNo}
              onChange={(e) => handleFieldChange('contractNo', e.target.value)}
              placeholder="Contoh: 0005/TBG-TBG-00/VEM-JIFO/04/I/2023"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

          {/* 4. SO Number: */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>SO Number:</span>
            </label>
            <input
              type="text"
              value={poData.soNumber}
              onChange={(e) => handleFieldChange('soNumber', e.target.value)}
              placeholder="Contoh: 0040064920041"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all"
            />
          </div>

        </div>

        {/* 5. SUBJECT: */}
        <div className="space-y-1.5 pt-2">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 uppercase tracking-wider">
            <AlignLeft className="w-3.5 h-3.5 text-emerald-600" />
            <span>SUBJECT :</span>
          </label>
          <textarea
            ref={subjectRef}
            value={poData.subject}
            onChange={(e) => {
              handleFieldChange('subject', e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = `${Math.max(60, e.target.scrollHeight)}px`;
            }}
            placeholder='Contoh: "Pekerjaan Jasa & Instalasi (WH to Site) - INTERSITE FO ISAT Project Regional JATIM site..."'
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all overflow-hidden"
          />
        </div>

      </div>

      {/* ---------------- EXTRACTED PDF TEXT SECTION ---------------- */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowExtractedText(!showExtractedText)}
            className="flex items-center gap-2.5 text-sm font-bold text-slate-900 hover:text-emerald-600 transition-colors cursor-pointer group"
          >
            <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <FileText className="w-4 h-4" />
            </div>
            <span>Teks Hasil Ekstrak PDF</span>
            <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {extractedText ? `${extractedText.split('\n').length} baris` : 'Kosong'}
            </span>
            {showExtractedText ? (
              <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-emerald-600" />
            )}
          </button>

          {extractedText && (
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(extractedText);
                setIsCopiedExtractedText(true);
                setTimeout(() => setIsCopiedExtractedText(false), 2000);
                showNotification('Teks hasil ekstrak PDF tersalin ke clipboard!');
              }}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isCopiedExtractedText ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>{isCopiedExtractedText ? 'Tersalin' : 'Salin Teks PDF'}</span>
            </button>
          )}
        </div>

        {showExtractedText && (
          <div className="mt-2 bg-slate-900 text-slate-200 p-4 rounded-2xl font-mono text-xs max-h-96 overflow-y-auto leading-relaxed border border-slate-800 whitespace-pre-wrap select-all shadow-inner">
            {extractedText || (
              <span className="text-slate-500 italic">
                Belum ada file PDF yang diunggah. Silakan unggah file PDF Purchase Order untuk melihat teks hasil ekstraksi secara otomatis di sini.
              </span>
            )}
          </div>
        )}
      </div>

      {/* ---------------- TABLE SECTION: ITEM DESCRIPTION & PRICING ---------------- */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
        
        {/* Table Header Bar */}
        <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-slate-50/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              <span>DAFTAR ITEM</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Rincian item pekerjaan, kuantitas, satuan, dan harga satuan
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={handleAddRow}
              className="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer border bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 active:scale-95"
              title="Tambah baris item baru ke dalam tabel"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Item</span>
            </button>

            <button
              type="button"
              onClick={handleCopyTableToExcel}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer border ${
                isCopiedTable
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border-slate-300 hover:border-emerald-500'
              }`}
              title="Salin isi tabel ke clipboard untuk ditempelkan (paste) langsung ke Microsoft Excel / Google Sheets"
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

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-2 w-12 text-center whitespace-nowrap">No</th>
                <th className="py-2.5 px-2.5 min-w-[180px]">Item Description</th>
                <th className="py-2.5 px-2 text-right w-20 whitespace-nowrap">Qty</th>
                <th className="py-2.5 px-2 w-16 whitespace-nowrap">UoM</th>
                <th className="py-2.5 px-2 text-right w-28 whitespace-nowrap">Unit Price (IDR)</th>
                <th className="py-2.5 px-2 text-right w-32 whitespace-nowrap">Total (IDR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {poData.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-xs text-slate-600">Belum ada item pekerjaan</p>
                  </td>
                </tr>
              ) : (
                poData.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    
                    {/* No */}
                    <td className="py-1.5 px-1 text-center">
                      <input
                        type="text"
                        value={item.no}
                        onChange={(e) => handleItemChange(item.id, 'no', e.target.value)}
                        className="w-full text-center bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded px-1 py-0.5 outline-none font-mono text-xs text-slate-600"
                      />
                    </td>

                    {/* Item Description */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        className="w-full bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded px-1.5 py-0.5 outline-none font-semibold text-xs text-slate-900"
                      />
                    </td>

                    {/* Qty */}
                    <td className="py-1.5 px-2 text-right">
                      <input
                        type="text"
                        value={item.qty}
                        onChange={(e) => handleItemChange(item.id, 'qty', e.target.value)}
                        className="w-full bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded px-1.5 py-0.5 outline-none font-bold text-xs text-slate-900 text-right font-mono"
                      />
                    </td>

                    {/* UoM */}
                    <td className="py-1.5 px-2">
                      <input
                        type="text"
                        value={item.uom}
                        onChange={(e) => handleItemChange(item.id, 'uom', e.target.value)}
                        className="w-full bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded px-1 py-0.5 outline-none text-xs text-slate-700 font-semibold"
                      />
                    </td>

                    {/* Unit Price (IDR) */}
                    <td className="py-1.5 px-2 text-right">
                      <input
                        type="text"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', e.target.value)}
                        className="w-full bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded px-1.5 py-0.5 outline-none font-mono text-xs text-slate-800 text-right"
                      />
                    </td>

                    {/* Total (IDR) */}
                    <td className="py-1.5 px-2 text-right">
                      <input
                        type="text"
                        value={item.total}
                        onChange={(e) => handleItemChange(item.id, 'total', e.target.value)}
                        className="w-full bg-transparent focus:bg-white border border-transparent focus:border-slate-300 rounded px-1.5 py-0.5 outline-none font-mono font-bold text-xs text-emerald-700 text-right"
                      />
                    </td>

                  </tr>
                ))
              )}
            </tbody>
            
            {/* Table Footer Grand Total Row */}
            <tfoot className="bg-slate-900 text-white font-bold text-xs border-t-2 border-slate-800">
              <tr>
                <td colSpan={5} className="py-2.5 px-3">
                  <div className="flex items-center gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>GRAND TOTAL</span>
                  </div>
                </td>
                <td className="py-2.5 px-2 text-right text-emerald-400 text-sm font-mono font-extrabold">
                  {poData.items.reduce((acc, curr) => acc + (parseFloat(curr.total.replace(/,/g, '')) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

      </div>

      {/* ==================== GOOGLE AUTH & ACCESS TOKEN MODAL ==================== */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-slate-800 space-y-5">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 text-white flex items-center justify-center shadow-md shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    Otorisasi Google Sheets (Database Cloud)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Satu langkah lagi untuk menyimpan data PO ke Database Cloud
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowAuthModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error / Alert banner if any */}
            {authModalError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{authModalError}</div>
              </div>
            )}

            {/* Option 1: Direct Google Login Button */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Opsi 1: Masuk dengan Akun Google</span>
              </p>
              <button
                onClick={handleGoogleSignInFromModal}
                disabled={isLoggingIn}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-cyan-400" />
                    <span>Menghubungkan ke Google...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                    </svg>
                    <span>Login Google Sekarang</span>
                  </>
                )}
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="border-t border-slate-200 w-full"></div>
              <span className="bg-white px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider absolute">
                Atau Manual Token
              </span>
            </div>

            {/* Option 2: Manual Google Access Token */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-indigo-600" />
                <span>Opsi 2: Input Access Token OAuth2 (Vercel / Custom Domain)</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Paste ya29.a0A..."
                  value={manualTokenInput}
                  onChange={(e) => setManualTokenInput(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 font-mono text-slate-800"
                />
                <button
                  onClick={handleSaveManualToken}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  Gunakan Token
                </button>
              </div>
            </div>

            {/* Local Save Fallback Option */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleSaveLocalOnly}
                className="text-xs text-slate-500 hover:text-slate-800 font-semibold underline underline-offset-2 transition-colors cursor-pointer"
              >
                Simpan di Database Lokal Saja
              </button>
              <span className="text-[10px] text-slate-400">Data tersimpan 100% aman</span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
