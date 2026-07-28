export interface SheetTab {
  sheetId: number;
  title: string;
  index: number;
  rowCount?: number;
  columnCount?: number;
}

export interface SpreadsheetMetadata {
  id: string;
  title: string;
  spreadsheetUrl: string;
  sheets: SheetTab[];
}

export interface SheetGridData {
  spreadsheetId: string;
  sheetTitle: string;
  headers: string[];
  rows: string[][];
  rawValues: string[][]; // Includes header row at index 0
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
  webViewLink?: string;
  iconLink?: string;
}

export type SyncStatus = 'synced' | 'saving' | 'unsaved_changes' | 'error' | 'offline';

export interface PendingCellChange {
  rowIndex: number; // 0-based index in data rows (excluding header)
  colIndex: number;
  oldValue: string;
  newValue: string;
}

export interface ConfirmationConfig {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText: string;
  confirmVariant?: 'danger' | 'primary' | 'warning';
  onConfirm: () => void | Promise<void>;
}

export type ActiveView = 'table' | 'form' | 'analytics';

export interface SampleTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  headers: string[];
  rows: string[][];
}
