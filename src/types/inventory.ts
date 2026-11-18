export type UserRole = "Admin" | "Staff";

export interface MasterStok {
  SKU: string;
  Nama_Produk: string;
  Kategori: string;
  Harga_Beli: number;
  Harga_Jual: number;
  Stok_Saat_Ini: number;
  Batas_Minimum: number;
  Lokasi_Rak: string;
  // Computed / Tagged properties
  Status_Stok?: "AMAN" | "KRITIS" | "HABIS";
  Nilai_Stok?: number;
}

export type JenisTransaksi = "Masuk" | "Keluar";

export interface LogTransaksi {
  ID_Transaksi: string;
  Tanggal: string;
  Jenis: JenisTransaksi;
  SKU: string;
  Nama_Produk?: string;
  Jumlah: number;
  Keterangan: string;
  User: string;
}

export interface RingkasanDashboard {
  Total_Produk: number;
  Total_Unit_Stok: number;
  Total_Nilai_Stok: number;
  Total_Nilai_Jual: number;
  Estimasi_Potensi_Laba: number;
  Jumlah_Stok_Kritis: number;
  Total_Transaksi_Masuk: number;
  Total_Transaksi_Keluar: number;
}

export interface DailyMovement {
  tanggal: string;
  label: string;
  masuk: number;
  keluar: number;
}

export interface CategorySummary {
  kategori: string;
  jumlahProduk: number;
  totalUnit: number;
  nilaiStok: number;
}

export interface LowStockWebhookItem {
  SKU: string;
  Nama_Produk: string;
  Kategori: string;
  Stok_Saat_Ini: number;
  Batas_Minimum: number;
  Defisit: number;
  Rekomendasi_Order: number;
  Lokasi_Rak: string;
  Estimasi_Biaya_Restock: number;
  Status: "KRITIS" | "HABIS";
}

export interface WebhookPayload {
  event: "LOW_STOCK_ALERT";
  timestamp: string;
  source: "UMKM_Inventory_System";
  triggered_by: string;
  summary: {
    critical_items_count: number;
    total_estimated_restock_cost_idr: number;
  };
  telegram_message_markdown: string;
  items: LowStockWebhookItem[];
}
