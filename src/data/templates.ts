import { SampleTemplate } from '../types';

export const SAMPLE_TEMPLATES: SampleTemplate[] = [
  {
    id: 'sales',
    title: 'Laporan Penjualan Produk',
    description: 'Template pencatatan transaksi bulanan, produk, kuantitas, harga, dan status pembayaran.',
    icon: 'TrendingUp',
    headers: ['ID Transaksi', 'Tanggal', 'Nama Produk', 'Kategori', 'Jumlah Terjual', 'Harga Satuan (Rp)', 'Status Pembayaran'],
    rows: [
      ['TRX-1001', '2026-07-01', 'Kopi Arabika Premium 250g', 'Minuman', '15', '85000', 'Lunas'],
      ['TRX-1002', '2026-07-02', 'Cangkir Keramik Estetik', 'Perlengkapan', '8', '65000', 'Lunas'],
      ['TRX-1003', '2026-07-03', 'Biji Kopi Robusta 500g', 'Minuman', '20', '110000', 'Lunas'],
      ['TRX-1004', '2026-07-04', 'Syrup Karamel 750ml', 'Bahan Baku', '5', '145000', 'Pending'],
      ['TRX-1005', '2026-07-05', 'Mesin Espresso Manual', 'Peralatan', '2', '2450000', 'Lunas'],
      ['TRX-1006', '2026-07-06', 'Filter Paper V60 (100pcs)', 'Perlengkapan', '30', '42000', 'Lunas'],
      ['TRX-1007', '2026-07-07', 'Susu UHT Full Cream 1L', 'Bahan Baku', '45', '21000', 'Lunas'],
    ],
  },
  {
    id: 'tasks',
    title: 'Manajemen Tugas & Tim',
    description: 'Melacak daftar pekerjaan, penanggung jawab, prioritas, dan tenggat waktu tim.',
    icon: 'CheckSquare',
    headers: ['ID Tugas', 'Nama Pekerjaan', 'Penanggung Jawab', 'Prioritas', 'Tanggal Mulai', 'Tenggat Waktu', 'Status Progress'],
    rows: [
      ['TSK-01', 'Redesain Halaman Utama App', 'Ahmad Rizki', 'Tinggi', '2026-07-10', '2026-07-25', 'Sedang Dikerjakan'],
      ['TSK-02', 'Integrasi API Database Cloud 2 Arah', 'Siti Nurhaliza', 'Mendesak', '2026-07-15', '2026-07-22', 'Selesai'],
      ['TSK-03', 'Penyusunan Laporan Keuangan Q2', 'Budi Santoso', 'Sedang', '2026-07-18', '2026-07-30', 'Belum Dimulai'],
      ['TSK-04', 'Testing Unit & E2E Verification', 'Dewi Anggraini', 'Tinggi', '2026-07-20', '2026-07-28', 'Sedang Dikerjakan'],
      ['TSK-05', 'Rapat Koordinasi Evaluasi Bulanan', 'Ahmad Rizki', 'Rendah', '2026-07-24', '2026-07-24', 'Belum Dimulai'],
    ],
  },
  {
    id: 'inventory',
    title: 'Inventaris Stok Barang',
    description: 'Pemantauan persediaan barang, stok masuk, keluar, dan peringatan batas minimum.',
    icon: 'Package',
    headers: ['Kode Barang', 'Nama Barang', 'Kategori', 'Stok Awal', 'Barang Masuk', 'Barang Keluar', 'Stok Akhir', 'Lokasi Rak'],
    rows: [
      ['INV-A01', 'Laptop Pro 14 Inch', 'Elektronik', '10', '5', '3', '12', 'Rak A1'],
      ['INV-A02', 'Monitor UltraWide 27"', 'Elektronik', '8', '2', '4', '6', 'Rak A2'],
      ['INV-B01', 'Keyboard Mekanikal RGB', 'Aksesori', '25', '10', '15', '20', 'Rak B1'],
      ['INV-B02', 'Mouse Nirkabel Ergonomis', 'Aksesori', '40', '15', '22', '33', 'Rak B2'],
      ['INV-C01', 'Headset Noise Cancelling', 'Audio', '15', '0', '7', '8', 'Rak C1'],
    ],
  },
  {
    id: 'blank',
    title: 'Lembar Kerja Kosong',
    description: 'Mulai dari awal dengan struktur kolom kustom.',
    icon: 'FileText',
    headers: ['Nama', 'Email', 'Jabatan', 'Status'],
    rows: [
      ['Budi Gunawan', 'budi@example.com', 'Manager', 'Aktif'],
      ['Ani Wijaya', 'ani@example.com', 'Developer', 'Aktif'],
    ],
  },
];
