import { DriveFile, SheetGridData, SheetTab, SpreadsheetMetadata } from '../types';

/**
 * Converts a 0-based column index to A1 notation letter(s).
 * 0 -> A, 1 -> B, 25 -> Z, 26 -> AA, etc.
 */
export function columnIndexToLetter(index: number): string {
  let temp: number;
  let letter = '';
  let col = index + 1;
  while (col > 0) {
    temp = (col - 1) % 26;
    letter = String.fromCharCode(65 + temp) + letter;
    col = Math.floor((col - temp) / 26);
  }
  return letter;
}

/**
 * Extracts Google Spreadsheet ID from a full Google Sheets URL or raw ID string.
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  // Check if URL format
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Fetch list of Google Spreadsheets owned by or accessible to user from Drive
 */
export async function listDriveSpreadsheets(token: string): Promise<DriveFile[]> {
  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,mimeType,modifiedTime,webViewLink,iconLink)&pageSize=50&orderBy=modifiedTime%20desc`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal mengambil daftar File Data dari Drive: ${response.statusText} (${errorText})`);
  }

  const data = await response.json();
  return data.files || [];
}

/**
 * Fetch spreadsheet metadata including titles and tab sheets
 */
export async function getSpreadsheetMetadata(
  spreadsheetId: string,
  token: string
): Promise<SpreadsheetMetadata> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,spreadsheetUrl,sheets.properties(sheetId,title,index)`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal membaca metadata Data ID '${spreadsheetId}': ${errorText}`);
  }

  const data = await response.json();
  const sheets: SheetTab[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties.sheetId,
    title: s.properties.title,
    index: s.properties.index,
  }));

  return {
    id: data.spreadsheetId,
    title: data.properties.title,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheets,
  };
}

/**
 * Fetch values for a specific sheet tab
 */
export async function getSheetGridData(
  spreadsheetId: string,
  sheetTitle: string,
  token: string
): Promise<SheetGridData> {
  const encodedTitle = encodeURIComponent(sheetTitle);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedTitle}'!A1:ZZ5000`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal mengambil data dari lembar '${sheetTitle}': ${errorText}`);
  }

  const data = await response.json();
  const rawValues: string[][] = data.values || [];

  if (rawValues.length === 0) {
    return {
      spreadsheetId,
      sheetTitle,
      headers: ['Kolom 1'],
      rows: [],
      rawValues: [['Kolom 1']],
    };
  }

  const headers = rawValues[0] || [];
  const rows = rawValues.slice(1);

  // Normalize rows so each row matches headers length
  const maxCols = Math.max(headers.length, ...rows.map((r) => r.length));
  const normalizedHeaders = [...headers];
  for (let i = headers.length; i < maxCols; i++) {
    normalizedHeaders.push(`Kolom ${i + 1}`);
  }

  const normalizedRows = rows.map((row) => {
    const padded = [...row];
    while (padded.length < normalizedHeaders.length) {
      padded.push('');
    }
    return padded;
  });

  return {
    spreadsheetId,
    sheetTitle,
    headers: normalizedHeaders,
    rows: normalizedRows,
    rawValues,
  };
}

/**
 * Update a single cell in Google Sheets (2-way sync)
 */
export async function updateSingleCell(
  spreadsheetId: string,
  sheetTitle: string,
  rowIdx1Based: number, // 1 is header, 2 is first data row
  colIdx0Based: number,
  value: string,
  token: string
): Promise<any> {
  const colLetter = columnIndexToLetter(colIdx0Based);
  const range = `'${sheetTitle}'!${colLetter}${rowIdx1Based}`;
  const encodedRange = encodeURIComponent(range);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [[value]],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal memperbarui sel ${colLetter}${rowIdx1Based}: ${errorText}`);
  }

  return await response.json();
}

/**
 * Update entire sheet values (e.g., when adding/deleting columns or full sync)
 */
export async function updateFullSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  fullValues: string[][],
  token: string
): Promise<any> {
  // Clear first then write
  const encodedTitle = encodeURIComponent(sheetTitle);
  const clearRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedTitle}!A1:ZZ5000:clear`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!clearRes.ok) {
    if (clearRes.status === 401 || clearRes.status === 403) {
      throw new Error('UNAUTHORIZED_TOKEN: Sesi Google Access Token telah kedaluwarsa atau tidak valid. Silakan login ulang.');
    }
  }

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedTitle}!A1?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: fullValues,
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('UNAUTHORIZED_TOKEN: Sesi Google Access Token telah kedaluwarsa atau tidak valid. Silakan login ulang.');
    }
    const errorText = await response.text();
    throw new Error(`Gagal menyimpan perubahan ke lembar '${sheetTitle}': ${errorText}`);
  }

  return await response.json();
}

/**
 * Append a new row to a sheet
 */
export async function appendRowToSheet(
  spreadsheetId: string,
  sheetTitle: string,
  rowValues: string[],
  token: string
): Promise<any> {
  const encodedTitle = encodeURIComponent(sheetTitle);
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedTitle}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        values: [rowValues],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal menambah baris ke '${sheetTitle}': ${errorText}`);
  }

  return await response.json();
}

/**
 * Delete a specific row by its 0-based index in the sheet
 */
export async function deleteRowInSheet(
  spreadsheetId: string,
  sheetId: number,
  rowIndex0Based: number, // 0 is header, 1 is row 2 in sheet
  token: string
): Promise<any> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId,
                dimension: 'ROWS',
                startIndex: rowIndex0Based,
                endIndex: rowIndex0Based + 1,
              },
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal menghapus baris di Database Cloud: ${errorText}`);
  }

  return await response.json();
}

/**
 * Add a new sheet tab
 */
export async function addNewSheetTab(
  spreadsheetId: string,
  tabTitle: string,
  token: string
): Promise<any> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: {
                title: tabTitle,
              },
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal membuat tab lembar baru '${tabTitle}': ${errorText}`);
  }

  return await response.json();
}

/**
 * Delete a sheet tab
 */
export async function deleteSheetTab(
  spreadsheetId: string,
  sheetId: number,
  token: string
): Promise<any> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            deleteSheet: {
              sheetId,
            },
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal menghapus tab lembar: ${errorText}`);
  }

  return await response.json();
}

/**
 * Create a new Google Spreadsheet in Drive with template data
 */
export async function createNewSpreadsheet(
  title: string,
  headers: string[],
  initialRows: string[][],
  token: string
): Promise<SpreadsheetMetadata> {
  const response = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: { title },
      sheets: [
        {
          properties: { title: 'Sheet1' },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gagal membuat File Data baru '${title}': ${errorText}`);
  }

  const created = await response.json();
  const spreadsheetId = created.spreadsheetId;

  // Insert headers and initial data
  const fullValues = [headers, ...initialRows];
  await updateFullSheetValues(spreadsheetId, 'Sheet1', fullValues, token);

  return {
    id: spreadsheetId,
    title,
    spreadsheetUrl: created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheets: [{ sheetId: created.sheets[0].properties.sheetId, title: 'Sheet1', index: 0 }],
  };
}

/**
 * Helper to remove leading zeroes from numeric string values (e.g. "0040064920041" -> "40064920041")
 */
export function removeLeadingZeroes(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return '';
  const str = String(val).trim();
  if (!str) return '';

  if (/^0+\d+$/.test(str)) {
    const cleaned = str.replace(/^0+/, '');
    return cleaned === '' ? '0' : cleaned;
  }
  return str;
}

/**
 * Helper to convert strings (e.g. "Rp 1.500.000", "1.000,00", "10") into numbers for Google Sheets
 */
function parseNumericValue(val: string | number | null | undefined): number | string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return isNaN(val) ? '' : val;

  const rawStr = String(val).trim();
  if (!rawStr) return '';

  // Remove leading zeroes if it's a numeric string with leading zeroes
  const strippedStr = removeLeadingZeroes(rawStr);

  // Remove currency symbols, IDR, Rp, spaces, letters, except digits, comma, dot, minus
  let cleaned = strippedStr.replace(/[^0-9.,-]/g, '');
  if (!cleaned) return strippedStr;

  // Handle various decimal and thousands separator formats
  if (cleaned.includes('.') && cleaned.includes(',')) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    if (lastComma > lastDot) {
      // e.g. 1.500.000,50 (Indonesian standard) -> 1500000.50
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      // e.g. 1,500,000.50 (US standard) -> 1500000.50
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    // Only comma present
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      // Decimal comma: e.g. "10,5" or "1000,50" -> "10.5"
      cleaned = cleaned.replace(',', '.');
    } else {
      // Thousands comma: e.g. "1,000,000" -> "1000000"
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes('.')) {
    // Only dot present
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      // Multiple dots: e.g. "1.500.000" -> "1500000"
      cleaned = cleaned.replace(/\./g, '');
    } else if (parts.length === 2) {
      // Single dot: e.g. "1.000" (thousands in IDR) or "10.5" (decimal)
      if (parts[1].length === 3) {
        cleaned = cleaned.replace(/\./g, '');
      }
    }
  }

  const num = Number(cleaned);
  return isNaN(num) ? removeLeadingZeroes(strippedStr) : num;
}

/**
 * Save Purchase Order data to Google Sheets with SO NUMBER in column 1 and PURCHASE ORDER in column 2
 */
export async function savePoToGoogleSheet(
  poData: {
    purchaseOrder: string;
    placeDate: string;
    contractNo: string;
    soNumber: string;
    subject: string;
    items: Array<{
      no: string;
      description: string;
      qty: string;
      uom: string;
      unitPrice: string;
      total: string;
    }>;
  },
  token: string,
  spreadsheetId: string = '1wTolxezKK_KAfaAwe8J8-7nw5mAQWB6-7qrvx4BnxNI',
  targetGid: number = 1841494980
): Promise<{ success: boolean; rowsAdded: number; sheetTitle: string }> {
  // 1. Resolve sheet title from target GID
  let sheetTitle = 'Sheet1';
  try {
    const meta = await getSpreadsheetMetadata(spreadsheetId, token);
    const targetSheet = meta.sheets.find((s) => s.sheetId === targetGid);
    if (targetSheet) {
      sheetTitle = targetSheet.title;
    } else if (meta.sheets.length > 0) {
      sheetTitle = meta.sheets[0].title;
    }
  } catch (err: any) {
    const errStr = String(err?.message || err);
    if (errStr.includes('401') || errStr.includes('403') || errStr.includes('Unauthenticated') || errStr.includes('Invalid Credentials')) {
      throw new Error(`UNAUTHORIZED_TOKEN: Sesi Google Access Token telah kedaluwarsa atau tidak valid. ${errStr}`);
    }
    console.warn('Metadata lookup warning:', err);
  }

  const encodedTitle = encodeURIComponent(sheetTitle);

  // 1b. Check if SO NUMBER already exists in column A (ignoring leading zeroes)
  const rawSoNumber = (poData.soNumber || '').trim();
  const targetSoNumber = removeLeadingZeroes(rawSoNumber);
  let isDuplicate = false;
  let existingGridData: (string | number)[][] = [];

  if (targetSoNumber) {
    try {
      const checkResponse = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedTitle}!A1:ZZ5000`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (checkResponse.ok) {
        const checkData = await checkResponse.json();
        existingGridData = checkData.values || [];
        isDuplicate = existingGridData.some((row) => {
          if (row && row[0] !== undefined && row[0] !== null) {
            const existingClean = removeLeadingZeroes(String(row[0]));
            return existingClean.toLowerCase() === targetSoNumber.toLowerCase();
          }
          return false;
        });
      } else if (checkResponse.status === 401 || checkResponse.status === 403) {
        throw new Error('UNAUTHORIZED_TOKEN: Sesi Google Access Token telah kedaluwarsa atau tidak valid.');
      }
    } catch (checkErr: any) {
      if (checkErr?.message?.includes('UNAUTHORIZED_TOKEN')) {
        throw checkErr;
      }
      console.warn('Error checking existing SO NUMBERs in Google Sheets:', checkErr);
    }
  }

  // 2. Build row values
  // Column 1: SO NUMBER (tanpa 0 di depan)
  // Column 2: PURCHASE ORDER
  // Column 3: TANGGAL
  // Column 4: NO KONTRAK
  // Column 5: PERIHAL
  // Column 6: NO ITEM (tanpa 0 di depan jika angka)
  // Column 7: DESKRIPSI ITEM
  // Column 8: QTY (angka)
  // Column 9: SATUAN
  // Column 10: HARGA SATUAN / UNIT PRICE (angka)
  // Column 11: TOTAL HARGA / TOTAL (angka)

  const rowsToInsert: (string | number)[][] = [];

  if (poData.items && poData.items.length > 0) {
    for (const item of poData.items) {
      rowsToInsert.push([
        targetSoNumber || '',
        poData.purchaseOrder || '',
        poData.placeDate || '',
        poData.contractNo || '',
        poData.subject || '',
        removeLeadingZeroes(item.no || ''),
        item.description || '',
        parseNumericValue(item.qty),
        item.uom || '',
        parseNumericValue(item.unitPrice),
        parseNumericValue(item.total),
      ]);
    }
  } else {
    rowsToInsert.push([
      targetSoNumber || '',
      poData.purchaseOrder || '',
      poData.placeDate || '',
      poData.contractNo || '',
      poData.subject || '',
      '',
      '',
      '',
      '',
      '',
      '',
    ]);
  }

  // 3. Save or Update in sheet
  if (isDuplicate && existingGridData.length > 0) {
    // Overwrite existing rows for targetSoNumber
    const updatedGrid = existingGridData.filter((row) => {
      if (row && row[0] !== undefined && row[0] !== null) {
        const cleanVal = removeLeadingZeroes(String(row[0]));
        return cleanVal.toLowerCase() !== targetSoNumber.toLowerCase();
      }
      return true;
    });

    // Append new rows to updatedGrid
    const fullValuesToSave = [...updatedGrid, ...rowsToInsert] as string[][];
    await updateFullSheetValues(spreadsheetId, sheetTitle, fullValuesToSave, token);
    return { success: true, rowsAdded: rowsToInsert.length, sheetTitle };
  } else {
    // Append to sheet
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedTitle}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: rowsToInsert,
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('UNAUTHORIZED_TOKEN: Sesi Google Access Token telah kedaluwarsa atau tidak valid. Silakan login ulang.');
      }
      const errorText = await response.text();
      throw new Error(`Gagal menyimpan ke Database Cloud: ${response.statusText} (${errorText})`);
    }

    return { success: true, rowsAdded: rowsToInsert.length, sheetTitle };
  }
}

