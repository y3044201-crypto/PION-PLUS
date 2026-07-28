import { DriveFile, SheetGridData, SheetTab, SpreadsheetMetadata } from '../types';

/**
 * Storage key for Apps Script Web App URL
 */
const APPS_SCRIPT_URL_KEY = 'apps_script_url';

/**
 * Default fallback Apps Script URL if none configured
 */
export function getAppsScriptUrl(): string {
  return localStorage.getItem(APPS_SCRIPT_URL_KEY) || '';
}

export function setAppsScriptUrl(url: string): void {
  if (url) {
    localStorage.setItem(APPS_SCRIPT_URL_KEY, url.trim());
  } else {
    localStorage.removeItem(APPS_SCRIPT_URL_KEY);
  }
}

/**
 * Helper to call Google Apps Script Web App without requiring Google OAuth login
 */

async function callAppsScript(action: string, payload: any = {}): Promise<any> {
  const appsScriptUrl = getAppsScriptUrl();
  if (!appsScriptUrl) {
    throw new Error('Google Apps Script URL belum dikonfigurasi. Silakan atur URL Apps Script Web App di menu konfigurasi.');
  }

  const response = await fetch(appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!response.ok) {
    throw new Error(`Apps Script Error (${response.status}): ${response.statusText}`);
  }

  const data = await response.json();
  if (data.success === false) {
    throw new Error(data.error || 'Terjadi kesalahan pada Google Apps Script');
  }
  return data;
}

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
  const match = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  return trimmed;
}

/**
 * Fetch list of Google Spreadsheets owned by or accessible to user from Drive
 */
export async function listDriveSpreadsheets(token?: string | null): Promise<DriveFile[]> {
  if (!token) {
    return [];
  }
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
  token?: string | null
): Promise<SpreadsheetMetadata> {
  const appsUrl = getAppsScriptUrl();
  if (!token || appsUrl) {
    if (appsUrl) {
      try {
        const res = await callAppsScript('getMetadata', { spreadsheetId });
        return {
          id: res.id || spreadsheetId,
          title: res.title || 'Spreadsheet Cloud',
          spreadsheetUrl: res.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
          sheets: res.sheets || [{ sheetId: 0, title: 'Sheet1', index: 0 }],
        };
      } catch (err: any) {
        if (!token) throw err;
      }
    }
  }

  if (token) {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=spreadsheetId,properties.title,spreadsheetUrl,sheets.properties(sheetId,title,index)`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
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
  }

  throw new Error('Tidak dapat terhubung ke Google Sheets. Silakan konfigurasi URL Apps Script.');
}

/**
 * Fetch values for a specific sheet tab
 */
export async function getSheetGridData(
  spreadsheetId: string,
  sheetTitle: string,
  token?: string | null
): Promise<SheetGridData> {
  const appsUrl = getAppsScriptUrl();
  if (!token || appsUrl) {
    if (appsUrl) {
      try {
        const res = await callAppsScript('getGridData', { spreadsheetId, sheetTitle });
        const rawValues: string[][] = res.rawValues || [];
        const headers = res.headers || ['Kolom 1'];
        const rows = res.rows || [];

        return {
          spreadsheetId: res.spreadsheetId || spreadsheetId,
          sheetTitle: res.sheetTitle || sheetTitle,
          headers,
          rows,
          rawValues,
        };
      } catch (err: any) {
        if (!token) throw err;
      }
    }
  }

  if (token) {
    const encodedTitle = encodeURIComponent(sheetTitle);
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedTitle}'!A1:ZZ5000`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (response.ok) {
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
  }

  throw new Error('Gagal mengambil data dari lembar kerja. Periksa konfigurasi Apps Script Anda.');
}

/**
 * Update a single cell in Google Sheets (2-way sync)
 */
export async function updateSingleCell(
  spreadsheetId: string,
  sheetTitle: string,
  rowIdx1Based: number,
  colIdx0Based: number,
  value: string,
  token?: string | null
): Promise<any> {
  const appsUrl = getAppsScriptUrl();
  if (!token || appsUrl) {
    if (appsUrl) {
      try {
        return await callAppsScript('updateCell', {
          spreadsheetId,
          sheetTitle,
          rowIdx1Based,
          colIdx0Based,
          value,
        });
      } catch (err: any) {
        if (!token) throw err;
      }
    }
  }

  if (token) {
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
      throw new Error(`Gagal memperbarui sel: ${errorText}`);
    }

    return await response.json();
  }

  throw new Error('Memerlukan Apps Script URL atau Token OAuth');
}

/**
 * Update entire sheet values
 */
export async function updateFullSheetValues(
  spreadsheetId: string,
  sheetTitle: string,
  fullValues: string[][],
  token?: string | null
): Promise<any> {
  const appsUrl = getAppsScriptUrl();
  if (!token || appsUrl) {
    if (appsUrl) {
      try {
        return await callAppsScript('updateFullSheet', {
          spreadsheetId,
          sheetTitle,
          fullValues,
        });
      } catch (err: any) {
        if (!token) throw err;
      }
    }
  }

  if (token) {
    const encodedTitle = encodeURIComponent(sheetTitle);
    await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedTitle}'!A1:ZZ5000:clear`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedTitle}'!A1?valueInputOption=USER_ENTERED`,
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
      const errorText = await response.text();
      throw new Error(`Gagal menyimpan perubahan ke lembar '${sheetTitle}': ${errorText}`);
    }

    return await response.json();
  }

  throw new Error('Memerlukan Apps Script URL atau Token OAuth');
}

/**
 * Append a new row to a sheet
 */
export async function appendRowToSheet(
  spreadsheetId: string,
  sheetTitle: string,
  rowValues: string[],
  token?: string | null
): Promise<any> {
  const appsUrl = getAppsScriptUrl();
  if (!token || appsUrl) {
    if (appsUrl) {
      try {
        return await callAppsScript('appendRow', {
          spreadsheetId,
          sheetTitle,
          rowValues,
        });
      } catch (err: any) {
        if (!token) throw err;
      }
    }
  }

  if (token) {
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
      throw new Error(`Gagal menambah baris: ${errorText}`);
    }

    return await response.json();
  }

  throw new Error('Memerlukan Apps Script URL atau Token OAuth');
}

/**
 * Delete a specific row by its 0-based index in the sheet
 */
export async function deleteRowInSheet(
  spreadsheetId: string,
  sheetId: number,
  rowIndex0Based: number,
  token?: string | null,
  sheetTitle?: string
): Promise<any> {
  const appsUrl = getAppsScriptUrl();
  if (!token || appsUrl) {
    if (appsUrl) {
      try {
        return await callAppsScript('deleteRow', {
          spreadsheetId,
          sheetId,
          sheetTitle,
          rowIndex0Based,
        });
      } catch (err: any) {
        if (!token) throw err;
      }
    }
  }

  if (token) {
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
      throw new Error(`Gagal menghapus baris: ${errorText}`);
    }

    return await response.json();
  }

  throw new Error('Memerlukan Apps Script URL atau Token OAuth');
}

/**
 * Add a new sheet tab
 */
export async function addNewSheetTab(
  spreadsheetId: string,
  tabTitle: string,
  token?: string | null
): Promise<any> {
  const appsUrl = getAppsScriptUrl();
  if (!token || appsUrl) {
    if (appsUrl) {
      try {
        return await callAppsScript('addSheetTab', {
          spreadsheetId,
          tabTitle,
        });
      } catch (err: any) {
        if (!token) throw err;
      }
    }
  }

  if (token) {
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
      throw new Error(`Gagal membuat tab baru: ${errorText}`);
    }

    return await response.json();
  }

  throw new Error('Memerlukan Apps Script URL atau Token OAuth');
}

/**
 * Delete a sheet tab
 */
export async function deleteSheetTab(
  spreadsheetId: string,
  sheetId: number,
  token?: string | null
): Promise<any> {
  const appsUrl = getAppsScriptUrl();
  if (!token || appsUrl) {
    if (appsUrl) {
      try {
        return await callAppsScript('deleteSheetTab', {
          spreadsheetId,
          sheetId,
        });
      } catch (err: any) {
        if (!token) throw err;
      }
    }
  }

  if (token) {
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

  throw new Error('Memerlukan Apps Script URL atau Token OAuth');
}

/**
 * Create a new Google Spreadsheet
 */
export async function createNewSpreadsheet(
  title: string,
  headers: string[],
  initialRows: string[][],
  token?: string | null
): Promise<SpreadsheetMetadata> {
  const appsUrl = getAppsScriptUrl();
  if (!token || appsUrl) {
    if (appsUrl) {
      try {
        const res = await callAppsScript('createSpreadsheet', {
          title,
          headers,
          initialRows,
        });
        return {
          id: res.id,
          title: res.title,
          spreadsheetUrl: res.spreadsheetUrl,
          sheets: res.sheets || [{ sheetId: 0, title: 'Sheet1', index: 0 }],
        };
      } catch (err: any) {
        if (!token) throw err;
      }
    }
  }

  if (token) {
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

    const fullValues = [headers, ...initialRows];
    await updateFullSheetValues(spreadsheetId, 'Sheet1', fullValues, token);

    return {
      id: spreadsheetId,
      title,
      spreadsheetUrl: created.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      sheets: [{ sheetId: created.sheets[0].properties.sheetId, title: 'Sheet1', index: 0 }],
    };
  }

  throw new Error('Memerlukan Apps Script URL atau Token OAuth');
}

/**
 * Helper to remove leading zeroes from numeric string values
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
 * Helper to convert strings into numbers for Google Sheets
 */
function parseNumericValue(val: string | number | null | undefined): number | string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'number') return isNaN(val) ? '' : val;

  const rawStr = String(val).trim();
  if (!rawStr) return '';

  const strippedStr = removeLeadingZeroes(rawStr);
  let cleaned = strippedStr.replace(/[^0-9.,-]/g, '');
  if (!cleaned) return strippedStr;

  if (cleaned.includes('.') && cleaned.includes(',')) {
    const lastDot = cleaned.lastIndexOf('.');
    const lastComma = cleaned.lastIndexOf(',');
    if (lastComma > lastDot) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    const parts = cleaned.split(',');
    if (parts.length === 2 && parts[1].length <= 2) {
      cleaned = cleaned.replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes('.')) {
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = cleaned.replace(/\./g, '');
    } else if (parts.length === 2) {
      if (parts[1].length === 3) {
        cleaned = cleaned.replace(/\./g, '');
      }
    }
  }

  const num = Number(cleaned);
  return isNaN(num) ? removeLeadingZeroes(strippedStr) : num;
}

/**
 * Save Purchase Order data to Google Sheets
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
  token?: string | null,
  spreadsheetId: string = '1wTolxezKK_KAfaAwe8J8-7nw5mAQWB6-7qrvx4BnxNI',
  targetGid: number = 1841494980
): Promise<{ success: boolean; rowsAdded: number; sheetTitle: string }> {
  const appsUrl = getAppsScriptUrl();

  // Primary: Use Apps Script Web App if available or if no token
  if (!token || appsUrl) {
    if (appsUrl) {
      try {
        const res = await callAppsScript('savePo', {
          poData,
          spreadsheetId,
          targetGid,
        });
        return {
          success: true,
          rowsAdded: res.rowsAdded || (poData.items?.length || 1),
          sheetTitle: res.sheetTitle || 'Sheet1',
        };
      } catch (err: any) {
        if (!token) throw err;
      }
    }
  }

  // Fallback to Google Sheets API v4 using OAuth token
  if (token) {
    let sheetTitle = 'Sheet1';
    try {
      const meta = await getSpreadsheetMetadata(spreadsheetId, token);
      const targetSheet = meta.sheets.find((s) => s.sheetId === targetGid);
      if (targetSheet) {
        sheetTitle = targetSheet.title;
      } else if (meta.sheets.length > 0) {
        sheetTitle = meta.sheets[0].title;
      }
    } catch (err) {
      console.warn('Metadata lookup warning:', err);
    }

    const encodedTitle = encodeURIComponent(sheetTitle);
    const rawSoNumber = (poData.soNumber || '').trim();
    const targetSoNumber = removeLeadingZeroes(rawSoNumber);
    let isDuplicate = false;
    let existingGridData: (string | number)[][] = [];

    if (targetSoNumber) {
      try {
        const checkResponse = await fetch(
          `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedTitle}'!A1:ZZ5000`,
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
        }
      } catch (checkErr: any) {
        console.warn('Error checking existing SO NUMBERs:', checkErr);
      }
    }

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
        '', '', '', '', '', '',
      ]);
    }

    if (isDuplicate && existingGridData.length > 0) {
      const updatedGrid = existingGridData.filter((row) => {
        if (row && row[0] !== undefined && row[0] !== null) {
          const cleanVal = removeLeadingZeroes(String(row[0]));
          return cleanVal.toLowerCase() !== targetSoNumber.toLowerCase();
        }
        return true;
      });

      const fullValuesToSave = [...updatedGrid, ...rowsToInsert] as string[][];
      await updateFullSheetValues(spreadsheetId, sheetTitle, fullValuesToSave, token);
      return { success: true, rowsAdded: rowsToInsert.length, sheetTitle };
    } else {
      const response = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/'${encodedTitle}'!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`,
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
        const errorText = await response.text();
        throw new Error(`Gagal menyimpan ke Database Cloud: ${response.statusText} (${errorText})`);
      }

      return { success: true, rowsAdded: rowsToInsert.length, sheetTitle };
    }
  }

  throw new Error('Konfigurasi Apps Script URL atau Token OAuth diperlukan.');
}
