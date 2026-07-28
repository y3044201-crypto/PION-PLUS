export const APPS_SCRIPT_CODE = `/**
 * ============================================================================
 * GOOGLE APPS SCRIPT BACKEND (TANPA LOGIN / OAUTH TOKEN)
 * ============================================================================
 * Petunjuk Penyebaran (Deployment Instructions):
 * 1. Buka Google Sheets Anda -> Klik menu 'Ekstensi' -> 'Apps Script'.
 * 2. Hapus semua isi kode default di Editor Apps Script.
 * 3. Tempel seluruh kode di bawah ini ke dalam editor Apps Script.
 * 4. Klik tombol 'Terapkan' (Deploy) di kanan atas -> Pilih 'Terapkan Baru' (New deployment).
 * 5. Klik ikon Roda Gigi (Select type) -> Pilih 'Aplikasi Web' (Web App).
 * 6. Atur Konfigurasi:
 *    - Deskripsi: Backend Web App Editor Data
 *    - Jalankan sebagai (Execute as): Saya (Me)
 *    - Siapa yang memiliki akses (Who has access): Siapa saja (Anyone)
 * 7. Klik 'Terapkan' (Deploy), berikan izin akses jika diminta, lalu SALIN 'URL Aplikasi Web'.
 * 8. Tempel URL tersebut ke dalam aplikasi web ini pada modal 'Konfigurasi Apps Script'.
 * ============================================================================
 */

function doGet(e) {
  var params = e ? e.parameter : {};
  var action = params.action || 'getGridData';
  
  try {
    var result = handleAction(action, params);
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e && e.parameter) {
      data = e.parameter;
    }
    
    var action = data.action || 'getGridData';
    var result = handleAction(action, data);
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

function handleAction(action, data) {
  var defaultSpreadsheetId = '1wTolxezKK_KAfaAwe8J8-7nw5mAQWB6-7qrvx4BnxNI';
  var spreadsheetId = data.spreadsheetId || defaultSpreadsheetId;
  var ss;
  
  // 1. Aksi Membuat Spreadsheet Baru
  if (action === 'createSpreadsheet') {
    var title = data.title || 'Data Baru';
    var newSs = SpreadsheetApp.create(title);
    var sheet = newSs.getActiveSheet();
    sheet.setName('Sheet1');
    if (data.headers && data.headers.length) {
      var fullValues = [data.headers];
      if (data.initialRows && data.initialRows.length) {
        fullValues = fullValues.concat(data.initialRows);
      }
      sheet.getRange(1, 1, fullValues.length, fullValues[0].length).setValues(fullValues);
    }
    return {
      success: true,
      id: newSs.getId(),
      title: title,
      spreadsheetUrl: newSs.getUrl(),
      sheets: [{ sheetId: sheet.getSheetId(), title: 'Sheet1', index: 0 }]
    };
  }

  // Buka Spreadsheet Berdasarkan ID
  try {
    ss = SpreadsheetApp.openById(spreadsheetId);
  } catch (openErr) {
    return { success: false, error: 'Gagal membuka Spreadsheet ID: ' + spreadsheetId + '. Pastikan ID benar dan sheet telah dibagikan.' };
  }

  // 2. Aksi Mengambil Metadata
  if (action === 'getMetadata') {
    var sheets = ss.getSheets().map(function(s, idx) {
      return { sheetId: s.getSheetId(), title: s.getName(), index: idx };
    });
    return {
      success: true,
      id: ss.getId(),
      title: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      sheets: sheets
    };
  }

  // 3. Aksi Mengambil Seluruh Grid Data (Headers & Rows)
  if (action === 'getGridData') {
    var sheetTitle = data.sheetTitle;
    var sheet = sheetTitle ? ss.getSheetByName(sheetTitle) : ss.getSheets()[0];
    if (!sheet) sheet = ss.getSheets()[0];

    var rawValues = sheet.getDataRange().getDisplayValues();
    if (!rawValues || rawValues.length === 0) {
      return {
        success: true,
        spreadsheetId: ss.getId(),
        sheetTitle: sheet.getName(),
        headers: ['Kolom 1'],
        rows: [],
        rawValues: [['Kolom 1']]
      };
    }
    var headers = rawValues[0] || [];
    var rows = rawValues.slice(1);
    return {
      success: true,
      spreadsheetId: ss.getId(),
      sheetTitle: sheet.getName(),
      headers: headers,
      rows: rows,
      rawValues: rawValues
    };
  }

  // 4. Aksi Update Satu Sel (2-Way Sync)
  if (action === 'updateCell') {
    var sheetTitle = data.sheetTitle;
    var rowIdx1Based = parseInt(data.rowIdx1Based, 10);
    var colIdx0Based = parseInt(data.colIdx0Based, 10);
    var value = data.value !== undefined ? data.value : '';
    
    var sheet = sheetTitle ? ss.getSheetByName(sheetTitle) : ss.getSheets()[0];
    if (!sheet) sheet = ss.getSheets()[0];

    sheet.getRange(rowIdx1Based, colIdx0Based + 1).setValue(value);
    return { success: true };
  }

  // 5. Aksi Update Full Sheet
  if (action === 'updateFullSheet') {
    var sheetTitle = data.sheetTitle;
    var fullValues = data.fullValues || [];
    var sheet = sheetTitle ? ss.getSheetByName(sheetTitle) : ss.getSheets()[0];
    if (!sheet) sheet = ss.getSheets()[0];

    sheet.clearContents();
    if (fullValues.length > 0 && fullValues[0].length > 0) {
      sheet.getRange(1, 1, fullValues.length, fullValues[0].length).setValues(fullValues);
    }
    return { success: true };
  }

  // 6. Aksi Tambah Baris Baru (Append Row)
  if (action === 'appendRow') {
    var sheetTitle = data.sheetTitle;
    var rowValues = data.rowValues || [];
    var sheet = sheetTitle ? ss.getSheetByName(sheetTitle) : ss.getSheets()[0];
    if (!sheet) sheet = ss.getSheets()[0];

    sheet.appendRow(rowValues);
    return { success: true };
  }

  // 7. Aksi Hapus Baris
  if (action === 'deleteRow') {
    var sheetTitle = data.sheetTitle;
    var rowIndex0Based = parseInt(data.rowIndex0Based, 10);
    var sheet = sheetTitle ? ss.getSheetByName(sheetTitle) : ss.getSheets()[0];
    if (!sheet) sheet = ss.getSheets()[0];

    sheet.deleteRow(rowIndex0Based + 1);
    return { success: true };
  }

  // 8. Aksi Tambah Tab Lembar Kerja Baru
  if (action === 'addSheetTab') {
    var tabTitle = data.tabTitle || 'Sheet Baru';
    var newSheet = ss.insertSheet(tabTitle);
    return { success: true, sheetId: newSheet.getSheetId(), title: tabTitle };
  }

  // 9. Aksi Hapus Tab Lembar Kerja
  if (action === 'deleteSheetTab') {
    var sheetId = parseInt(data.sheetId, 10);
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId() === sheetId) {
        ss.deleteSheet(sheets[i]);
        return { success: true };
      }
    }
    return { success: false, error: 'Tab tidak ditemukan' };
  }

  // 10. Aksi Simpan Purchase Order (PO Data)
  if (action === 'savePo' || action === 'appendPo') {
    var poData = data.poData || data;
    var targetGid = data.targetGid || 1841494980;
    var sheet;
    var sheets = ss.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getSheetId() == targetGid) {
        sheet = sheets[i];
        break;
      }
    }
    if (!sheet) sheet = sheets[0];

    var rawSoNumber = (poData.soNumber || '').toString().trim();
    var cleanSoNumber = rawSoNumber.replace(/^0+/, '');
    if (cleanSoNumber === '') cleanSoNumber = '0';

    var rowsToInsert = [];
    if (poData.items && poData.items.length > 0) {
      for (var j = 0; j < poData.items.length; j++) {
        var item = poData.items[j];
        var itemNo = (item.no || '').toString().trim().replace(/^0+/, '');
        rowsToInsert.push([
          cleanSoNumber,
          poData.purchaseOrder || '',
          poData.placeDate || '',
          poData.contractNo || '',
          poData.subject || '',
          itemNo,
          item.description || '',
          item.qty || '',
          item.uom || '',
          item.unitPrice || '',
          item.total || ''
        ]);
      }
    } else {
      rowsToInsert.push([
        cleanSoNumber,
        poData.purchaseOrder || '',
        poData.placeDate || '',
        poData.contractNo || '',
        poData.subject || '',
        '', '', '', '', '', ''
      ]);
    }

    var displayValues = sheet.getDataRange().getDisplayValues();
    var existingRows = displayValues || [];
    var isDuplicate = false;
    var matchedIndices = [];

    for (var r = 0; r < existingRows.length; r++) {
      if (existingRows[r] && existingRows[r][0] !== undefined) {
        var existingClean = String(existingRows[r][0]).trim().replace(/^0+/, '');
        if (existingClean.toLowerCase() === cleanSoNumber.toLowerCase()) {
          isDuplicate = true;
          matchedIndices.push(r);
        }
      }
    }

    if (isDuplicate && existingRows.length > 0) {
      var newGrid = [];
      for (var r = 0; r < existingRows.length; r++) {
        if (matchedIndices.indexOf(r) === -1) {
          newGrid.push(existingRows[r]);
        }
      }
      for (var k = 0; k < rowsToInsert.length; k++) {
        newGrid.push(rowsToInsert[k]);
      }
      sheet.clearContents();
      if (newGrid.length > 0 && newGrid[0].length > 0) {
        sheet.getRange(1, 1, newGrid.length, newGrid[0].length).setValues(newGrid);
      }
      return { success: true, rowsAdded: rowsToInsert.length, sheetTitle: sheet.getName(), updated: true };
    } else {
      for (var k = 0; k < rowsToInsert.length; k++) {
        sheet.appendRow(rowsToInsert[k]);
      }
      return { success: true, rowsAdded: rowsToInsert.length, sheetTitle: sheet.getName() };
    }
  }

  return { success: false, error: 'Aksi tidak dikenal: ' + action };
}

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
