"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle2,
  AlertTriangle,
  Download,
  History,
  Send,
} from "lucide-react";
import {
  MasterStok,
  LogTransaksi,
  JenisTransaksi,
  UserRole,
} from "@/types/inventory";

interface TransactionFormProps {
  inventory: MasterStok[];
  transactions: LogTransaksi[];
  role: UserRole;
  preselectedSku?: string | null;
  onSubmitTransaction: (payload: {
    Jenis: JenisTransaksi;
    SKU: string;
    Jumlah: number;
    Keterangan: string;
    User: string;
  }) => Promise<void>;
}

export default function TransactionForm({
  inventory,
  transactions,
  role,
  preselectedSku,
  onSubmitTransaction,
}: TransactionFormProps) {
  const [jenis, setJenis] = useState<JenisTransaksi>("Masuk");
  const [sku, setSku] = useState<string>(inventory[0]?.SKU || "");
  const [jumlah, setJumlah] = useState<number>(10);
  const [keterangan, setKeterangan] = useState<string>("");
  const [filterJenis, setFilterJenis] = useState<"ALL" | "Masuk" | "Keluar">("ALL");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(
    null
  );

  useEffect(() => {
    if (preselectedSku) {
      setSku(preselectedSku);
      setJenis("Masuk");
    } else if (!sku && inventory.length > 0) {
      setSku(inventory[0].SKU);
    }
  }, [preselectedSku, inventory, sku]);

  const selectedProduct = inventory.find((p) => p.SKU === sku);
  const stokAwal = selectedProduct?.Stok_Saat_Ini ?? 0;
  const stokAkhir = jenis === "Masuk" ? stokAwal + Number(jumlah || 0) : stokAwal - Number(jumlah || 0);
  const isInsufficient = jenis === "Keluar" && stokAkhir < 0;
  const willTriggerLowStock =
    selectedProduct && !isInsufficient && stokAkhir <= selectedProduct.Batas_Minimum;

  const currentUserName =
    role === "Admin" ? "Budi (Admin)" : "Rina (Staff Gudang)";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || isInsufficient || jumlah <= 0) return;

    setSubmitting(true);
    setFeedback(null);
    try {
      await onSubmitTransaction({
        Jenis: jenis,
        SKU: sku,
        Jumlah: Number(jumlah),
        Keterangan:
          keterangan.trim() ||
          (jenis === "Masuk"
            ? "Restock barang masuk dari supplier"
            : "Barang keluar penjualan / pemakaian"),
        User: currentUserName,
      });
      setFeedback({
        type: "success",
        text: `Transaksi ${jenis} (${jumlah} unit) untuk ${selectedProduct.Nama_Produk} berhasil dicatat! Stok diperbarui menjadi ${stokAkhir} unit.`,
      });
      setKeterangan("");
    } catch (err: any) {
      setFeedback({
        type: "error",
        text: err.message || "Gagal mencatat transaksi.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const filteredLogs = transactions.filter(
    (t) => filterJenis === "ALL" || t.Jenis === filterJenis
  );

  const exportLogsCsv = () => {
    const headers = [
      "ID_Transaksi",
      "Tanggal",
      "Jenis",
      "SKU",
      "Nama_Produk",
      "Jumlah",
      "Keterangan",
      "User",
    ];
    const rows = filteredLogs.map((t) => [
      t.ID_Transaksi,
      t.Tanggal,
      t.Jenis,
      t.SKU,
      `"${(t.Nama_Produk || "").replace(/"/g, '""')}"`,
      t.Jumlah,
      `"${(t.Keterangan || "").replace(/"/g, '""')}"`,
      `"${t.User}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `Log_Transaksi_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Input Form */}
      <div className="lg:col-span-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sticky top-20">
          <h2 className="text-base font-bold text-slate-900">
            Form Input Log_Transaksi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 mb-5">
            Otomatis menghitung ulang <code className="font-mono">Stok_Saat_Ini</code> di tabel{" "}
            <code className="font-mono">Master_Stok</code>
          </p>

          {feedback && (
            <div
              className={`mb-4 p-3.5 rounded-xl border text-xs font-medium flex items-start gap-2 ${
                feedback.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                  : "bg-rose-50 border-rose-200 text-rose-800"
              }`}
            >
              {feedback.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{feedback.text}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Jenis Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Jenis Pergerakan Barang
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setJenis("Masuk")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                    jenis === "Masuk"
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <ArrowDownLeft className="w-4 h-4" />
                  Barang Masuk (Restock)
                </button>
                <button
                  type="button"
                  onClick={() => setJenis("Keluar")}
                  className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                    jenis === "Keluar"
                      ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Barang Keluar (Jual/Pakai)
                </button>
              </div>
            </div>

            {/* Product SKU Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pilih Produk (SKU)
              </label>
              <select
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {inventory.map((item) => (
                  <option key={item.SKU} value={item.SKU}>
                    [{item.SKU}] {item.Nama_Produk} (Stok: {item.Stok_Saat_Ini} | Rak: {item.Lokasi_Rak})
                  </option>
                ))}
              </select>
            </div>

            {/* Jumlah & User */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jumlah Unit
                </label>
                <input
                  type="number"
                  min={1}
                  required
                  value={jumlah}
                  onChange={(e) => setJumlah(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Petugas (User)
                </label>
                <input
                  type="text"
                  disabled
                  value={currentUserName}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-slate-100 text-slate-600 font-medium"
                />
              </div>
            </div>

            {/* Live Stock Calculation Preview */}
            {selectedProduct && (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Kalkulasi Otomatis Master_Stok:</span>
                  <span className="font-mono font-semibold text-slate-700">
                    Batas Min: {selectedProduct.Batas_Minimum} unit
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-slate-600">
                    Stok Awal: {stokAwal} {jenis === "Masuk" ? "+" : "-"} {jumlah}
                  </span>
                  <span
                    className={
                      isInsufficient
                        ? "text-rose-600"
                        : willTriggerLowStock
                        ? "text-amber-600"
                        : "text-emerald-600"
                    }
                  >
                    ➔ Stok Akhir: {stokAkhir} unit
                  </span>
                </div>
                {isInsufficient && (
                  <p className="text-xs text-rose-600 font-semibold">
                    ⚠️ Stok tidak cukup! Maksimal barang keluar adalah {stokAwal} unit.
                  </p>
                )}
                {willTriggerLowStock && (
                  <p className="text-xs text-amber-700 font-medium">
                    ⚡ Stok akhir ({stokAkhir}) berada di bawah/sama dengan Batas Minimum (
                    {selectedProduct.Batas_Minimum}). Notifikasi Low Stock Webhook akan diaktifkan!
                  </p>
                )}
              </div>
            )}

            {/* Keterangan */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Keterangan / Catatan Transaksi
              </label>
              <input
                type="text"
                value={keterangan}
                onChange={(e) => setKeterangan(e.target.value)}
                placeholder={
                  jenis === "Masuk"
                    ? "Contoh: Faktur Supplier #INV-882"
                    : "Contoh: Pesanan Pelanggan / Pemakaian Cabang"
                }
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || isInsufficient}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white shadow-sm flex items-center justify-center gap-2 transition ${
                isInsufficient
                  ? "bg-slate-300 cursor-not-allowed"
                  : jenis === "Masuk"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              <Send className="w-4 h-4" />
              {submitting
                ? "Memproses Transaksi..."
                : `Simpan Transaksi ${jenis} & Update Stok`}
            </button>
          </form>
        </div>
      </div>

      {/* Right: Transaction History Table */}
      <div className="lg:col-span-7">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Riwayat Log_Transaksi Gudang
                </h3>
                <p className="text-xs text-slate-500">
                  Jejak audit lengkap barang masuk & keluar beserta pencatatnya
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={filterJenis}
                onChange={(e) => setFilterJenis(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium bg-white"
              >
                <option value="ALL">Semua Jenis</option>
                <option value="Masuk">Hanya Masuk</option>
                <option value="Keluar">Hanya Keluar</option>
              </select>
              <button
                type="button"
                onClick={exportLogsCsv}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">ID & Waktu</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Produk (SKU)</th>
                  <th className="py-3 px-4 text-center">Jumlah</th>
                  <th className="py-3 px-4">Keterangan & User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredLogs.map((trx) => (
                  <tr key={trx.ID_Transaksi} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono text-xs font-bold text-slate-800">
                        {trx.ID_Transaksi}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(trx.Tanggal).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {trx.Jenis === "Masuk" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                          <ArrowDownLeft className="w-3 h-3" />
                          Masuk
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700">
                          <ArrowUpRight className="w-3 h-3" />
                          Keluar
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{trx.Nama_Produk}</div>
                      <div className="font-mono text-xs text-indigo-600">{trx.SKU}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">
                      <span
                        className={
                          trx.Jenis === "Masuk" ? "text-emerald-600" : "text-rose-600"
                        }
                      >
                        {trx.Jenis === "Masuk" ? `+${trx.Jumlah}` : `-${trx.Jumlah}`}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-slate-800">{trx.Keterangan}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Oleh: {trx.User}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
