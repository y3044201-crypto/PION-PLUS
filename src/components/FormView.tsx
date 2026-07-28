import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  Trash2, 
  Plus, 
  FileText,
  CheckCircle2
} from 'lucide-react';

interface FormViewProps {
  headers: string[];
  rows: string[][];
  onCellEdit: (rowIndex: number, colIndex: number, newValue: string) => void;
  onAddRow: (rowValues: string[]) => void;
  onDeleteRow: (rowIndex: number) => void;
}

export const FormView: React.FC<FormViewProps> = ({
  headers,
  rows,
  onCellEdit,
  onAddRow,
  onDeleteRow,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [formData, setFormData] = useState<string[]>([]);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (rows.length > 0 && currentIndex < rows.length) {
      setFormData([...rows[currentIndex]]);
    } else {
      setFormData(Array(headers.length).fill(''));
    }
    setIsSaved(false);
  }, [currentIndex, rows, headers]);

  if (rows.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3 shadow-xl">
        <FileText className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-200">Belum Ada Data Rekaman</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Tambahkan baris data pertama melalui tampilan Tabel untuk mulai menggunakan Tampilan Form Record.
        </p>
      </div>
    );
  }

  const handleFieldChange = (colIdx: number, val: string) => {
    const updated = [...formData];
    updated[colIdx] = val;
    setFormData(updated);
    setIsSaved(false);
  };

  const handleSaveForm = () => {
    formData.forEach((val, colIdx) => {
      if (val !== rows[currentIndex][colIdx]) {
        onCellEdit(currentIndex, colIdx, val);
      }
    });
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      
      {/* Form Card Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        
        {/* Record Header Controls */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              Baris Rekaman #{currentIndex + 1}
            </span>
            <h3 className="text-sm font-bold text-white mt-1">Detail Baris Data</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              title="Rekaman Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs text-slate-400 font-medium px-1">
              {currentIndex + 1} / {rows.length}
            </span>

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(rows.length - 1, prev + 1))}
              disabled={currentIndex === rows.length - 1}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-colors"
              title="Rekaman Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Form Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {headers.map((header, colIdx) => (
            <div key={colIdx} className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>{header}</span>
                <span className="text-[10px] font-mono text-slate-500">Kolom {colIdx + 1}</span>
              </label>
              <input
                type="text"
                value={formData[colIdx] || ''}
                onChange={(e) => handleFieldChange(colIdx, e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          ))}
        </div>

        {/* Card Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={() => onDeleteRow(currentIndex)}
            className="px-3.5 py-2 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Hapus Rekaman Ini
          </button>

          <div className="flex items-center gap-2">
            {isSaved && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Tersimpan
              </span>
            )}

            <button
              onClick={handleSaveForm}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-all flex items-center gap-2 active:scale-95"
            >
              <Save className="w-4 h-4" />
              Simpan Perubahan Baris
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
