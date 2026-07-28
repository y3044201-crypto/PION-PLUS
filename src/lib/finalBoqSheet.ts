import Papa from 'papaparse';
import { FinalBoqHeaderData, FinalBoqItem } from '../components/FinalBoqPage';

export const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1wTolxezKK_KAfaAwe8J8-7nw5mAQWB6-7qrvx4BnxNI/edit?gid=1841494980#gid=1841494980';
export const SPREADSHEET_ID = '1wTolxezKK_KAfaAwe8J8-7nw5mAQWB6-7qrvx4BnxNI';
export const HEADER_GID = '1883203888';
export const ITEMS_GID = '1841494980';

/**
 * Removes leading zeroes and cleans spaces for comparison (e.g. "0010023" -> "10023")
 */
export function normalizeSonumb(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str) return '';
  if (/^0+\d+$/.test(str)) {
    const cleaned = str.replace(/^0+/, '');
    return cleaned === '' ? '0' : cleaned;
  }
  return str.toLowerCase();
}

/**
 * Helper to match column header names flexibly
 */
function findColumnValue(row: Record<string, string>, possibleNames: string[]): string {
  const rowKeys = Object.keys(row);
  for (const name of possibleNames) {
    const targetNorm = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const foundKey = rowKeys.find((k) => k.toLowerCase().replace(/[^a-z0-9]/g, '') === targetNorm);
    if (foundKey && row[foundKey] !== undefined && row[foundKey] !== null) {
      return String(row[foundKey]).trim();
    }
  }
  return '';
}

async function fetchCsvTextByUrl(url: string): Promise<string> {
  const csvUrls = [
    url,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`
  ];

  for (const u of csvUrls) {
    try {
      const res = await fetch(u);
      if (res.ok) {
        const text = await res.text();
        if (text && (text.includes(',') || text.includes('\t') || text.includes(';'))) {
          return text;
        }
      }
    } catch {
      // Continue trying next URL
    }
  }
  return '';
}

/**
 * Helper to fetch CSV text from Google Sheet tab
 */
async function fetchCsvText(gid: string): Promise<string> {
  const primaryUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
  return fetchCsvTextByUrl(primaryUrl);
}

export function parseCurrencyNumber(val: string | number | undefined | null): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let str = String(val).trim();
  if (!str) return 0;

  // Remove currency prefix if present
  str = str.replace(/^(rp|idr|\$)\s*/i, '').trim();

  if (str.includes(',') && str.includes('.')) {
    if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/\./g, '');
    }
  } else if (str.includes(',')) {
    const parts = str.split(',');
    if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
      str = str.replace(/,/g, '');
    } else if (parts.length === 2 && parts[1].length <= 2) {
      str = str.replace(',', '.');
    }
  }

  const clean = str.replace(/[^0-9.-]+/g, '');
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
}

export interface FetchBoqResult {
  success: boolean;
  message: string;
  headerData?: Partial<FinalBoqHeaderData>;
  items?: FinalBoqItem[];
  foundRowsCount?: number;
}

/**
 * Fetch Google Sheet CSV data and match the row corresponding to the search input
 */
export async function fetchBoqBySonumb(sonumbInput: string): Promise<FetchBoqResult> {
  const qClean = sonumbInput.trim();
  const qLower = qClean.toLowerCase();
  const targetSonumbNorm = normalizeSonumb(sonumbInput);

  if (!qClean) {
    return {
      success: false,
      message: 'Silakan masukkan kata kunci pencarian (SO Number, PO Number, atau Item).',
    };
  }

  // 1. Fetch Header Metadata Tab (gid=1883203888)
  const headerCsvText = await fetchCsvText(HEADER_GID);
  // 2. Fetch Items Tab (gid=1841494980)
  const itemsCsvText = await fetchCsvText(ITEMS_GID);

  const sonumbPossibleCols = ['Sonumb', 'SO Number', 'SONUMB', 'SO NUMB', 'NO SO', 'SO NO', 'SO', 'Sonumber', 'SO_NUMBER', 'SO_NUMB'];
  const poNumberPossibleCols = ['PO Number', 'No PO', 'PO NO', 'NO. PO', 'PURCHASE ORDER', 'PO', 'Po Number', 'Nomor PO', 'PO_NUMBER', 'No. PO', 'Purchase Order', 'NO_PO'];
  const poDatePossibleCols = ['PO Date', 'Tanggal PO', 'Tgl PO', 'PO DATE', 'TANGGAL PO', 'Place/Date', 'Place Date', 'Date', 'Tanggal', 'TGL', 'PO_DATE', 'Tgl_PO'];
  const contractNoPossibleCols = ['No Kontrak', 'NO KONTRAK', 'No Kontrak 2023', 'Contract No', 'Nomor Kontrak', 'No. Kontrak', 'CONTRACT NO', 'CONTRACT_NO', 'Kontrak No'];
  const subjectPossibleCols = ['Subject PO', 'SUBJECT PO', 'Subjek PO', 'Perihal', 'Deskripsi PO', 'Pekerjaan', 'Subject', 'Perihal PO', 'SUBJECT', 'Nama Kontrak', 'NAMA KONTRAK', 'Site Name', 'SITE NAME', 'Project', 'Judul Kontrak', 'Scope'];

  const unitPricePossibleCols = [
    'UNIT PRICE (IDR)',
    'Unit Price (IDR)',
    'Harga Satuan (IDR)',
    'HARGA SATUAN',
    'Harga Satuan',
    'UNIT PRICE',
    'Unit Price',
    'UnitPrice',
    'HARGA',
    'Price',
    'RATE',
    'Harga',
    'UNIT_PRICE',
    'PRICE'
  ];

  const totalPossibleCols = [
    'TOTAL (IDR)',
    'Total (IDR)',
    'JUMLAH HARGA (IDR)',
    'JUMLAH HARGA',
    'Jumlah Harga',
    'TOTAL',
    'Total',
    'TotalPrice',
    'JUMLAH',
    'Amount',
    'AMOUNT',
    'Subtotal',
    'TOTAL_PRICE',
    'TOTAL_AMOUNT'
  ];

  const rowMatchesQuery = (r: Record<string, string>) => {
    const sonumbVal = findColumnValue(r, sonumbPossibleCols);
    if (targetSonumbNorm && normalizeSonumb(sonumbVal) === targetSonumbNorm) return true;
    if (sonumbVal && sonumbVal.toLowerCase().includes(qLower)) return true;

    const poVal = findColumnValue(r, poNumberPossibleCols);
    if (poVal && poVal.toLowerCase().includes(qLower)) return true;

    const contractVal = findColumnValue(r, contractNoPossibleCols);
    if (contractVal && contractVal.toLowerCase().includes(qLower)) return true;

    const siteVal = findColumnValue(r, ['Site ID', 'Site Name', 'Subject PO', 'ITEM DESCRIPTION', 'Item', 'Deskripsi', 'Pekerjaan']);
    if (siteVal && siteVal.toLowerCase().includes(qLower)) return true;

    return Object.values(r).some((v) => String(v).toLowerCase().includes(qLower));
  };

  let matchedHeaderData: Partial<FinalBoqHeaderData> = {};
  let headerFound = false;

  if (headerCsvText) {
    const parseResult = Papa.parse<Record<string, string>>(headerCsvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    const rows = parseResult.data || [];
    const matchingHeaderRows = rows.filter(rowMatchesQuery);

    if (matchingHeaderRows.length > 0) {
      headerFound = true;
      const primaryRow = matchingHeaderRows[0];
      matchedHeaderData = {
        sonumb: findColumnValue(primaryRow, sonumbPossibleCols) || qClean,
        poNumber: findColumnValue(primaryRow, poNumberPossibleCols),
        poDate: findColumnValue(primaryRow, poDatePossibleCols),
        siteId: findColumnValue(primaryRow, ['Site ID', 'SiteId', 'SITE ID', 'ID Site', 'Site_ID', 'ID SITE', 'Site ID Operator']),
        siteName: findColumnValue(primaryRow, ['Site Name', 'SiteName', 'SITE NAME', 'Nama Site', 'NAMA SITE', 'Site']),
        company: findColumnValue(primaryRow, ['Company', 'COMPANY', 'Perusahaan', 'PT', 'Customer', 'Nama Perusahaan', 'Penyedia']),
        operator: findColumnValue(primaryRow, ['Operator', 'OPERATOR', 'Telco', 'Operator Telco', 'Client']),
        regional: findColumnValue(primaryRow, ['Regional', 'REGIONAL', 'Region', 'Wilayah', 'Area']),
        projectType: findColumnValue(primaryRow, ['Project Type', 'PROJECT TYPE', 'Jenis Project', 'Scope', 'Type', 'Jenis Pekerjaan']),
        alamat: findColumnValue(primaryRow, ['Alamat', 'ALAMAT', 'Address', 'Lokasi', 'Alamat Site', 'Location']),
        subjectPo: findColumnValue(primaryRow, subjectPossibleCols),
        noKontrak2023: findColumnValue(primaryRow, contractNoPossibleCols),
        namaKontrak: findColumnValue(primaryRow, ['Nama Kontrak', 'NAMA KONTRAK', 'Contract Name', 'Judul Kontrak', 'Kontrak Induk']),
        pmSacme: findColumnValue(primaryRow, ['PM SACME', 'PM Sacme', 'PM_SACME', 'SACME PM', 'PM SACME / ARO', 'PM']),
        aro: findColumnValue(primaryRow, ['ARO', 'Aro', 'Nama ARO', 'Aro PM']),
        pmCme: findColumnValue(primaryRow, ['PM CME', 'PM Cme', 'PM_CME', 'CME PM', 'PM CME']),
      };
    }
  }

  // Parse items from ITEMS_GID (1841494980) or fallback to HEADER_GID if empty
  const extractedItems: FinalBoqItem[] = [];
  const csvForItems = itemsCsvText || headerCsvText;

  if (csvForItems) {
    const parseResult = Papa.parse<Record<string, string>>(csvForItems, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim(),
    });
    const rows = parseResult.data || [];
    const matchingItemRows = rows.filter(rowMatchesQuery);

    if (matchingItemRows.length > 0) {
      const primaryItemRow = matchingItemRows[0];
      matchedHeaderData = {
        sonumb: matchedHeaderData.sonumb || findColumnValue(primaryItemRow, sonumbPossibleCols) || qClean,
        poNumber: matchedHeaderData.poNumber || findColumnValue(primaryItemRow, poNumberPossibleCols),
        poDate: matchedHeaderData.poDate || findColumnValue(primaryItemRow, poDatePossibleCols),
        siteId: matchedHeaderData.siteId || findColumnValue(primaryItemRow, ['Site ID', 'SiteId', 'SITE ID', 'ID Site', 'Site_ID']),
        siteName: matchedHeaderData.siteName || findColumnValue(primaryItemRow, ['Site Name', 'SiteName', 'SITE NAME', 'Nama Site', 'Site']),
        subjectPo: matchedHeaderData.subjectPo || findColumnValue(primaryItemRow, subjectPossibleCols),
        noKontrak2023: matchedHeaderData.noKontrak2023 || findColumnValue(primaryItemRow, contractNoPossibleCols),
      };
      headerFound = true;
    }

    matchingItemRows.forEach((row, idx) => {
      const itemDesc = findColumnValue(row, [
        'ITEM DESCRIPTION',
        'Item Description',
        'Item',
        'ITEM',
        'Deskripsi',
        'Description',
        'Pekerjaan',
        'Uraian Pekerjaan',
        'Nama Barang'
      ]);

      if (itemDesc) {
        const unitVal = findColumnValue(row, ['UOM', 'uom', 'Unit', 'UNIT', 'Satuan', 'UoM']) || 'Pcs';
        const qtyPoVal = findColumnValue(row, ['QTY', 'Qty', 'qty', 'QTY PO', 'Qty Po', 'QTY_PO']) || '1';
        const qtyAktualVal = findColumnValue(row, ['QTY AKTUAL', 'Qty Aktual', 'QTY_AKTUAL', 'Qty Realisasi']);

        let addworkVal = findColumnValue(row, ['ADDWORK', 'Addwork', 'Tambah', 'Add Work']) || '0';
        let minusWorkVal = findColumnValue(row, ['MINUS WORK', 'Minus Work', 'Kurang', 'MinusWork']) || '0';

        if (qtyAktualVal && qtyAktualVal.trim() !== '') {
          const poNum = parseFloat(qtyPoVal.replace(/,/g, '')) || 0;
          const aktNum = parseFloat(qtyAktualVal.replace(/,/g, '')) || 0;
          if (aktNum > poNum) {
            const diff = aktNum - poNum;
            addworkVal = Number.isInteger(diff) ? diff.toString() : diff.toFixed(2).replace(/\.?0+$/, '');
            minusWorkVal = '0';
          } else if (poNum > aktNum) {
            const diff = poNum - aktNum;
            minusWorkVal = Number.isInteger(diff) ? diff.toString() : diff.toFixed(2).replace(/\.?0+$/, '');
            addworkVal = '0';
          } else {
            addworkVal = '0';
            minusWorkVal = '0';
          }
        } else {
          addworkVal = '0';
          minusWorkVal = '0';
        }

        const priceRaw = findColumnValue(row, unitPricePossibleCols);
        const totalRaw = findColumnValue(row, totalPossibleCols);

        const qtyNum = parseCurrencyNumber(qtyPoVal) || 1;
        let priceNum = parseCurrencyNumber(priceRaw);
        let totalNum = parseCurrencyNumber(totalRaw);

        if (totalNum === 0 && priceNum > 0) {
          totalNum = priceNum * qtyNum;
        } else if (priceNum === 0 && totalNum > 0 && qtyNum > 0) {
          priceNum = totalNum / qtyNum;
        }

        const formattedPrice = priceNum > 0
          ? priceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : (priceRaw || '0');
        const formattedTotal = totalNum > 0
          ? totalNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
          : (totalRaw || '0');

        extractedItems.push({
          id: `sheet-${idx + 1}-${Date.now()}`,
          no: findColumnValue(row, ['NO', 'No', 'Item No', 'No Item']) || String(idx + 1),
          item: itemDesc,
          unit: unitVal,
          qtyPo: qtyPoVal,
          qtyAktual: qtyAktualVal,
          addwork: addworkVal,
          minusWork: minusWorkVal,
          unitPrice: formattedPrice,
          total: formattedTotal,
        } as any);
      }
    });
  }

  // Fallback to Master Data CSV if nothing matched
  if (!headerFound && extractedItems.length === 0) {
    try {
      const masterCsvText = await fetchCsvTextByUrl('https://docs.google.com/spreadsheets/d/1mcnmLr92VJMsgIZbz1LeiVHMnI43pmB1Q6QOVVlYliA/export?format=csv&gid=1393425582');
      if (masterCsvText) {
        const parseResult = Papa.parse<Record<string, string>>(masterCsvText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (h) => h.trim(),
        });
        const rows = parseResult.data || [];
        const matchingMasterRows = rows.filter((r) =>
          Object.values(r).some((v) => String(v).toLowerCase().includes(qLower))
        );

        if (matchingMasterRows.length > 0) {
          const firstRow = matchingMasterRows[0];
          matchedHeaderData = {
            sonumb: findColumnValue(firstRow, sonumbPossibleCols) || qClean,
            poNumber: findColumnValue(firstRow, poNumberPossibleCols) || '',
            siteId: findColumnValue(firstRow, ['Site ID', 'SITE ID', 'SiteId']) || '',
            siteName: findColumnValue(firstRow, ['Site Name', 'SITE NAME', 'Site']) || '',
            noKontrak2023: findColumnValue(firstRow, contractNoPossibleCols) || '',
            subjectPo: findColumnValue(firstRow, subjectPossibleCols) || '',
          };
          headerFound = true;

          matchingMasterRows.forEach((row, idx) => {
            const itemDesc = findColumnValue(row, ['ITEM DESCRIPTION', 'Item Description', 'Pekerjaan', 'Item', 'Deskripsi', 'Scope']) || Object.values(row)[0] || '';
            const qtyVal = findColumnValue(row, ['QTY', 'Qty', 'Volume', 'JUMLAH']) || '1';
            const unitVal = findColumnValue(row, ['UOM', 'Satuan', 'Unit']) || 'Pcs';
            const priceRaw = findColumnValue(row, unitPricePossibleCols);
            const totalRaw = findColumnValue(row, totalPossibleCols);

            const qtyNum = parseCurrencyNumber(qtyVal) || 1;
            let priceNum = parseCurrencyNumber(priceRaw);
            let totalNum = parseCurrencyNumber(totalRaw);

            if (totalNum === 0 && priceNum > 0) {
              totalNum = priceNum * qtyNum;
            } else if (priceNum === 0 && totalNum > 0 && qtyNum > 0) {
              priceNum = totalNum / qtyNum;
            }

            const formattedPrice = priceNum > 0
              ? priceNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : (priceRaw || '0');
            const formattedTotal = totalNum > 0
              ? totalNum.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
              : (totalRaw || '0');

            extractedItems.push({
              id: `master-${idx + 1}-${Date.now()}`,
              no: String(idx + 1),
              item: itemDesc,
              unit: unitVal,
              qtyPo: qtyVal,
              qtyAktual: '',
              addwork: '0',
              minusWork: '0',
              unitPrice: formattedPrice,
              total: formattedTotal,
            } as any);
          });
        }
      }
    } catch (err) {
      console.error('Master CSV search error:', err);
    }
  }

  if (!headerFound && extractedItems.length === 0) {
    return {
      success: false,
      message: `Data dengan kata kunci "${qClean}" tidak ditemukan di Database.`,
    };
  }

  return {
    success: true,
    message: `Berhasil mengambil data untuk "${qClean}" dari Database!${extractedItems.length > 0 ? ` (${extractedItems.length} item ditemukan)` : ''}`,
    headerData: headerFound ? matchedHeaderData : undefined,
    items: extractedItems.length > 0 ? extractedItems : undefined,
    foundRowsCount: extractedItems.length,
  };
}
