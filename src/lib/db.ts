import fs from "fs";
import path from "path";
import {
  MasterStok,
  LogTransaksi,
  RingkasanDashboard,
  DailyMovement,
  CategorySummary,
  JenisTransaksi,
} from "@/types/inventory";
import { getStockStatus, buildLowStockWebhookPayload } from "@/lib/webhook";
import { createBackendSupabaseClient } from "@/utils/supabase/backend";

interface DatabaseSchema {
  master_stok: MasterStok[];
  log_transaksi: LogTransaksi[];
}

const DB_DIR = path.join(process.cwd(), "database");
const SEED_PATH = path.join(DB_DIR, "seed.json");
const DATA_PATH = path.join(DB_DIR, "data.json");

function readDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_PATH)) {
    const seedRaw = fs.readFileSync(SEED_PATH, "utf-8");
    fs.writeFileSync(DATA_PATH, seedRaw, "utf-8");
  }
  const raw = fs.readFileSync(DATA_PATH, "utf-8");
  return JSON.parse(raw) as DatabaseSchema;
}

function writeDb(data: DatabaseSchema): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function getAllInventory(): MasterStok[] {
  const db = readDb();
  return db.master_stok.map((item) => ({
    ...item,
    Status_Stok: getStockStatus(item),
    Nilai_Stok: item.Stok_Saat_Ini * item.Harga_Beli,
  }));
}

export function getProductBySku(sku: string): MasterStok | undefined {
  return getAllInventory().find((item) => item.SKU.toUpperCase() === sku.toUpperCase());
}

export function upsertProduct(product: MasterStok, isNew: boolean): MasterStok {
  const db = readDb();
  const normalizedSku = product.SKU.trim().toUpperCase();
  const existingIdx = db.master_stok.findIndex((item) => item.SKU.toUpperCase() === normalizedSku);

  if (isNew && existingIdx !== -1) {
    throw new Error(`SKU "${normalizedSku}" sudah terdaftar di Master_Stok.`);
  }
  if (!isNew && existingIdx === -1) {
    throw new Error(`SKU "${normalizedSku}" tidak ditemukan di Master_Stok.`);
  }

  const cleanRecord: MasterStok = {
    SKU: normalizedSku,
    Nama_Produk: product.Nama_Produk.trim(),
    Kategori: product.Kategori.trim(),
    Harga_Beli: Number(product.Harga_Beli),
    Harga_Jual: Number(product.Harga_Jual),
    Stok_Saat_Ini: Number(product.Stok_Saat_Ini),
    Batas_Minimum: Number(product.Batas_Minimum),
    Lokasi_Rak: product.Lokasi_Rak.trim().toUpperCase(),
  };

  if (isNew) {
    db.master_stok.push(cleanRecord);
  } else {
    db.master_stok[existingIdx] = cleanRecord;
  }

  writeDb(db);

  // Sync asynchronously to Supabase Cloud if table exists
  try {
    const supabase = createBackendSupabaseClient();
    supabase.from("master_stok").upsert(cleanRecord, { onConflict: "SKU" }).then(() => {});
  } catch {}

  return {
    ...cleanRecord,
    Status_Stok: getStockStatus(cleanRecord),
    Nilai_Stok: cleanRecord.Stok_Saat_Ini * cleanRecord.Harga_Beli,
  };
}

export function deleteProductBySku(sku: string): void {
  const db = readDb();
  const normalizedSku = sku.trim().toUpperCase();
  const exists = db.master_stok.some((item) => item.SKU.toUpperCase() === normalizedSku);
  if (!exists) {
    throw new Error(`Produk dengan SKU "${normalizedSku}" tidak ditemukan.`);
  }
  db.master_stok = db.master_stok.filter((item) => item.SKU.toUpperCase() !== normalizedSku);
  writeDb(db);

  try {
    const supabase = createBackendSupabaseClient();
    supabase.from("master_stok").delete().eq("SKU", normalizedSku).then(() => {});
  } catch {}
}

export function getAllTransactions(): LogTransaksi[] {
  const db = readDb();
  const skuMap = new Map(db.master_stok.map((p) => [p.SKU.toUpperCase(), p.Nama_Produk]));

  return [...db.log_transaksi]
    .sort((a, b) => new Date(b.Tanggal).getTime() - new Date(a.Tanggal).getTime())
    .map((trx) => ({
      ...trx,
      Nama_Produk: skuMap.get(trx.SKU.toUpperCase()) || trx.Nama_Produk || "Produk Terhapus",
    }));
}

export function createTransaction(input: {
  Jenis: JenisTransaksi;
  SKU: string;
  Jumlah: number;
  Keterangan: string;
  User: string;
  Tanggal?: string;
}) {
  const db = readDb();
  const normalizedSku = input.SKU.trim().toUpperCase();
  const productIdx = db.master_stok.findIndex((p) => p.SKU.toUpperCase() === normalizedSku);

  if (productIdx === -1) {
    throw new Error(`Produk dengan SKU "${normalizedSku}" tidak ditemukan di Master_Stok.`);
  }

  const jumlah = Number(input.Jumlah);
  if (!Number.isFinite(jumlah) || jumlah <= 0) {
    throw new Error("Jumlah transaksi harus lebih besar dari 0.");
  }

  const product = db.master_stok[productIdx];
  const stokSebelum = product.Stok_Saat_Ini;

  if (input.Jenis === "Keluar" && stokSebelum < jumlah) {
    throw new Error(
      `Stok tidak mencukupi untuk "${product.Nama_Produk}". Stok tersedia: ${stokSebelum}, diminta: ${jumlah}.`
    );
  }

  const stokSesudah = input.Jenis === "Masuk" ? stokSebelum + jumlah : stokSebelum - jumlah;
  db.master_stok[productIdx].Stok_Saat_Ini = stokSesudah;

  const dateNow = input.Tanggal ? new Date(input.Tanggal) : new Date();
  const datePart = dateNow.toISOString().slice(0, 10).replace(/-/g, "");
  const seq = String(db.log_transaksi.length + 1).padStart(3, "0");

  const newTrx: LogTransaksi = {
    ID_Transaksi: `TRX-${datePart}-${seq}`,
    Tanggal: dateNow.toISOString(),
    Jenis: input.Jenis,
    SKU: product.SKU,
    Jumlah: jumlah,
    Keterangan:
      input.Keterangan.trim() ||
      (input.Jenis === "Masuk" ? "Barang Masuk / Restock" : "Barang Keluar / Penjualan"),
    User: input.User.trim() || "Staff Gudang",
  };

  db.log_transaksi.unshift(newTrx);
  writeDb(db);

  // Sync asynchronously to Supabase Cloud if tables exist
  try {
    const supabase = createBackendSupabaseClient();
    supabase
      .from("master_stok")
      .update({ Stok_Saat_Ini: stokSesudah })
      .eq("SKU", product.SKU)
      .then(() => {
        supabase.from("log_transaksi").insert(newTrx).then(() => {});
      });
  } catch {}

  const updatedProduct: MasterStok = {
    ...db.master_stok[productIdx],
    Status_Stok: getStockStatus(db.master_stok[productIdx]),
    Nilai_Stok: db.master_stok[productIdx].Stok_Saat_Ini * db.master_stok[productIdx].Harga_Beli,
  };

  const triggeredLowStock = updatedProduct.Stok_Saat_Ini <= updatedProduct.Batas_Minimum;
  const webhookPayload = triggeredLowStock
    ? buildLowStockWebhookPayload(db.master_stok, `${newTrx.User} (${newTrx.ID_Transaksi})`)
    : null;

  return {
    transaction: {
      ...newTrx,
      Nama_Produk: updatedProduct.Nama_Produk,
    },
    updatedProduct,
    stokSebelum,
    stokSesudah,
    triggeredLowStock,
    webhookPayload,
  };
}

export function getDashboardSummary(): {
  ringkasan: RingkasanDashboard;
  criticalItems: MasterStok[];
  dailyMovements: DailyMovement[];
  categorySummary: CategorySummary[];
} {
  const inventory = getAllInventory();
  const transactions = getAllTransactions();

  const totalProduk = inventory.length;
  const totalUnitStok = inventory.reduce((sum, i) => sum + i.Stok_Saat_Ini, 0);
  const totalNilaiStok = inventory.reduce((sum, i) => sum + i.Stok_Saat_Ini * i.Harga_Beli, 0);
  const totalNilaiJual = inventory.reduce((sum, i) => sum + i.Stok_Saat_Ini * i.Harga_Jual, 0);
  const criticalItems = inventory.filter((i) => i.Stok_Saat_Ini <= i.Batas_Minimum);

  const totalMasuk = transactions
    .filter((t) => t.Jenis === "Masuk")
    .reduce((sum, t) => sum + t.Jumlah, 0);
  const totalKeluar = transactions
    .filter((t) => t.Jenis === "Keluar")
    .reduce((sum, t) => sum + t.Jumlah, 0);

  const dayMap = new Map<string, DailyMovement>();
  const baseDate = new Date("2026-11-18T12:00:00Z");
  for (let i = 6; i >= 0; i--) {
    const d = new Date(baseDate);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
    dayMap.set(key, { tanggal: key, label, masuk: 0, keluar: 0 });
  }

  transactions.forEach((trx) => {
    const key = trx.Tanggal.slice(0, 10);
    if (!dayMap.has(key)) {
      const d = new Date(trx.Tanggal);
      const label = d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" });
      dayMap.set(key, { tanggal: key, label, masuk: 0, keluar: 0 });
    }
    const entry = dayMap.get(key)!;
    if (trx.Jenis === "Masuk") entry.masuk += trx.Jumlah;
    else entry.keluar += trx.Jumlah;
  });

  const dailyMovements = Array.from(dayMap.values())
    .sort((a, b) => a.tanggal.localeCompare(b.tanggal))
    .slice(-7);

  const catMap = new Map<string, CategorySummary>();
  inventory.forEach((item) => {
    const current = catMap.get(item.Kategori) || {
      kategori: item.Kategori,
      jumlahProduk: 0,
      totalUnit: 0,
      nilaiStok: 0,
    };
    current.jumlahProduk += 1;
    current.totalUnit += item.Stok_Saat_Ini;
    current.nilaiStok += item.Stok_Saat_Ini * item.Harga_Beli;
    catMap.set(item.Kategori, current);
  });

  return {
    ringkasan: {
      Total_Produk: totalProduk,
      Total_Unit_Stok: totalUnitStok,
      Total_Nilai_Stok: totalNilaiStok,
      Total_Nilai_Jual: totalNilaiJual,
      Estimasi_Potensi_Laba: totalNilaiJual - totalNilaiStok,
      Jumlah_Stok_Kritis: criticalItems.length,
      Total_Transaksi_Masuk: totalMasuk,
      Total_Transaksi_Keluar: totalKeluar,
    },
    criticalItems,
    dailyMovements,
    categorySummary: Array.from(catMap.values()),
  };
}
