import React, { useState } from 'react';
import { BarChart3, TrendingUp, DollarSign, Calculator, Layers, PieChart } from 'lucide-react';

interface AnalyticsViewProps {
  headers: string[];
  rows: string[][];
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ headers, rows }) => {
  // Detect numeric columns
  const numericColumns = headers
    .map((header, colIdx) => {
      const sampleVals = rows.map((r) => r[colIdx]).filter(Boolean);
      const numericVals = sampleVals.map((v) => parseFloat(v)).filter((v) => !isNaN(v));
      const isNumeric = sampleVals.length > 0 && numericVals.length / sampleVals.length > 0.5;
      return { colIdx, header, isNumeric, values: numericVals };
    })
    .filter((c) => c.isNumeric);

  const [selectedNumColIdx, setSelectedNumColIdx] = useState<number>(
    numericColumns.length > 0 ? numericColumns[0].colIdx : 0
  );

  if (rows.length === 0 || numericColumns.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center text-slate-400 space-y-3 shadow-xl">
        <BarChart3 className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-sm font-semibold text-slate-200">Belum Ada Kolom Angka/Statistik</h3>
        <p className="text-xs text-slate-400 max-w-sm mx-auto">
          Tambahkan kolom data numerik (seperti Harga, Kuantitas, Stok, atau Jumlah) pada lembar kerja Anda untuk menampilkan grafik dan analisis statistik otomatis.
        </p>
      </div>
    );
  }

  const selectedColObj = headers[selectedNumColIdx];
  const rawValues = rows.map((r) => parseFloat(r[selectedNumColIdx])).filter((v) => !isNaN(v));

  const totalSum = rawValues.reduce((acc, curr) => acc + curr, 0);
  const avgVal = rawValues.length > 0 ? totalSum / rawValues.length : 0;
  const minVal = rawValues.length > 0 ? Math.min(...rawValues) : 0;
  const maxVal = rawValues.length > 0 ? Math.max(...rawValues) : 0;

  // Format IDR currency if large number
  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + ' Jt';
    }
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Prepare chart bar points (limit to 12 rows max for visual presentation)
  const chartPoints = rows.slice(0, 12).map((r, idx) => {
    const val = parseFloat(r[selectedNumColIdx]) || 0;
    const label = r[0] || `Baris ${idx + 1}`;
    return { label, val };
  });

  const maxChartVal = Math.max(...chartPoints.map((p) => p.val), 1);

  return (
    <div className="space-y-6">
      
      {/* Top Controls & Column Selector */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Ringkasan Statistik & Grafik Data</h3>
            <p className="text-xs text-slate-400">Analisis metrik otomatis untuk kolom numerik</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-400 whitespace-nowrap font-medium">Pilih Kolom:</label>
          <select
            value={selectedNumColIdx}
            onChange={(e) => setSelectedNumColIdx(Number(e.target.value))}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-semibold w-full sm:w-auto"
          >
            {numericColumns.map((col) => (
              <option key={col.colIdx} value={col.colIdx}>
                {col.header}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Penjumlahan</span>
            <Calculator className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-white truncate" title={totalSum.toString()}>
            {formatNumber(totalSum)}
          </div>
          <p className="text-[10px] text-slate-500">Akumulasi {rawValues.length} nilai</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Rata-Rata (Average)</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-white truncate" title={avgVal.toString()}>
            {formatNumber(Math.round(avgVal))}
          </div>
          <p className="text-[10px] text-slate-500">Nilai rata-rata per baris</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Nilai Tertinggi</span>
            <DollarSign className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-white truncate" title={maxVal.toString()}>
            {formatNumber(maxVal)}
          </div>
          <p className="text-[10px] text-slate-500">Angka maksimum</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1 shadow-lg">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Nilai Terendah</span>
            <Layers className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-white truncate" title={minVal.toString()}>
            {formatNumber(minVal)}
          </div>
          <p className="text-[10px] text-slate-500">Angka minimum</p>
        </div>
      </div>

      {/* Visual Chart Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-emerald-400" />
            Grafik Visual: {selectedColObj}
          </h4>
          <span className="text-[11px] text-slate-500">12 Rekaman Pertama</span>
        </div>

        {/* SVG/CSS Bar Chart */}
        <div className="pt-4 pb-2">
          <div className="flex items-end gap-3 h-48 w-full border-b border-slate-800 pb-2 px-2 overflow-x-auto">
            {chartPoints.map((point, idx) => {
              const heightPercent = Math.max(8, Math.round((point.val / maxChartVal) * 100));
              return (
                <div key={idx} className="flex-1 min-w-[36px] flex flex-col items-center gap-2 group relative">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-8 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 text-emerald-400 text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 whitespace-nowrap z-10 pointer-events-none">
                    {point.val}
                  </div>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full bg-gradient-to-t from-emerald-600 to-teal-400 rounded-t-md group-hover:brightness-125 transition-all shadow-md"
                  />

                  <span className="text-[10px] text-slate-400 truncate w-full text-center" title={point.label}>
                    {point.label.slice(0, 8)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

    </div>
  );
};
