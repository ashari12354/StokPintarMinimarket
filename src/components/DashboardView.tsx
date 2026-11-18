"use client";

import React from "react";
import {
  Package,
  AlertTriangle,
  Wallet,
  TrendingUp,
  ArrowDownLeft,
  ArrowUpRight,
  BellRing,
  PlusCircle,
  MapPin,
} from "lucide-react";
import {
  RingkasanDashboard,
  MasterStok,
  DailyMovement,
  CategorySummary,
} from "@/types/inventory";

interface DashboardViewProps {
  ringkasan: RingkasanDashboard;
  criticalItems: MasterStok[];
  dailyMovements: DailyMovement[];
  categorySummary: CategorySummary[];
  onQuickRestock: (sku: string) => void;
  onOpenAutomation: () => void;
}

export function formatRupiah(num: number): string {
  return "Rp " + Math.round(num).toLocaleString("id-ID");
}

export default function DashboardView({
  ringkasan,
  criticalItems,
  dailyMovements,
  categorySummary,
  onQuickRestock,
  onOpenAutomation,
}: DashboardViewProps) {
  const maxMovement = Math.max(
    10,
    ...dailyMovements.flatMap((d) => [d.masuk, d.keluar])
  );

  return (
    <div className="space-y-6">
      {/* Top Banner Alert if Low Stock exists */}
      {criticalItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-100 text-amber-700 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900">
                Peringatan Stok Kritis: {criticalItems.length} SKU Mencapai Batas Minimum!
              </h3>
              <p className="text-xs text-amber-700 mt-0.5">
                Sistem otomatis menandai produk dengan{" "}
                <code className="font-mono bg-amber-100 px-1 py-0.5 rounded">
                  Stok_Saat_Ini &lt;= Batas_Minimum
                </code>{" "}
                dan menyiapkan payload webhook untuk n8n / Telegram.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenAutomation}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm transition shrink-0"
          >
            <BellRing className="w-4 h-4" />
            Kirim / Lihat Payload Webhook
          </button>
        </div>
      )}

      {/* 1. Ringkasan_Dashboard KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Produk (SKU)
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Package className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {ringkasan.Total_Produk} <span className="text-sm font-normal text-slate-500">SKU</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Total fisik:{" "}
            <span className="font-semibold text-slate-700">
              {ringkasan.Total_Unit_Stok.toLocaleString("id-ID")} unit
            </span>{" "}
            di gudang
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Nilai Stok (HPP)
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {formatRupiah(ringkasan.Total_Nilai_Stok)}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Akumulasi <code className="text-[11px]">Stok_Saat_Ini × Harga_Beli</code>
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Estimasi Nilai Jual
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-slate-900">
            {formatRupiah(ringkasan.Total_Nilai_Jual)}
          </div>
          <p className="mt-1 text-xs text-emerald-600 font-medium">
            Potensi margin: +{formatRupiah(ringkasan.Estimasi_Potensi_Laba)}
          </p>
        </div>

        <div
          className={`rounded-2xl border p-5 shadow-sm ${
            ringkasan.Jumlah_Stok_Kritis > 0
              ? "bg-rose-50/70 border-rose-200"
              : "bg-white border-slate-200"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-rose-600">
              Jumlah Stok Kritis
            </span>
            <div className="p-2 rounded-xl bg-rose-100 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-2xl font-bold text-rose-700">
            {ringkasan.Jumlah_Stok_Kritis}{" "}
            <span className="text-sm font-normal text-rose-600">Produk</span>
          </div>
          <p className="mt-1 text-xs text-rose-600">
            Status: {ringkasan.Jumlah_Stok_Kritis > 0 ? "Perlu Restock Segera" : "Semua Stok Aman"}
          </p>
        </div>
      </div>

      {/* 2. Quick Movement Chart & Category Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Stock Movement Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Grafik Pergerakan Barang (7 Hari Terakhir)
              </h2>
              <p className="text-xs text-slate-500">
                Perbandingan jumlah unit Barang Masuk (Restock) vs Barang Keluar (Penjualan/Pemakaian)
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-emerald-700">
                <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
                Masuk ({ringkasan.Total_Transaksi_Masuk} unit)
              </span>
              <span className="flex items-center gap-1.5 text-rose-700">
                <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
                Keluar ({ringkasan.Total_Transaksi_Keluar} unit)
              </span>
            </div>
          </div>

          <div className="h-56 flex items-end justify-between gap-2 sm:gap-4 pt-6 pb-2 px-2 border-b border-slate-100">
            {dailyMovements.map((day) => {
              const masukHeight = Math.round((day.masuk / maxMovement) * 100);
              const keluarHeight = Math.round((day.keluar / maxMovement) * 100);
              return (
                <div
                  key={day.tanggal}
                  className="flex-1 flex flex-col items-center h-full justify-end group"
                >
                  <div className="w-full flex items-end justify-center gap-1 sm:gap-1.5 h-44">
                    {/* Masuk Bar */}
                    <div className="flex flex-col items-center justify-end h-full w-3 sm:w-5">
                      {day.masuk > 0 && (
                        <span className="text-[10px] font-semibold text-emerald-700 mb-1">
                          +{day.masuk}
                        </span>
                      )}
                      <div
                        style={{ height: `${Math.max(masukHeight, day.masuk > 0 ? 8 : 2)}%` }}
                        className={`w-full rounded-t-md transition-all ${
                          day.masuk > 0 ? "bg-emerald-500 group-hover:bg-emerald-600" : "bg-slate-100"
                        }`}
                        title={`${day.label} - Masuk: ${day.masuk} unit`}
                      />
                    </div>
                    {/* Keluar Bar */}
                    <div className="flex flex-col items-center justify-end h-full w-3 sm:w-5">
                      {day.keluar > 0 && (
                        <span className="text-[10px] font-semibold text-rose-700 mb-1">
                          -{day.keluar}
                        </span>
                      )}
                      <div
                        style={{ height: `${Math.max(keluarHeight, day.keluar > 0 ? 8 : 2)}%` }}
                        className={`w-full rounded-t-md transition-all ${
                          day.keluar > 0 ? "bg-rose-500 group-hover:bg-rose-600" : "bg-slate-100"
                        }`}
                        title={`${day.label} - Keluar: ${day.keluar} unit`}
                      />
                    </div>
                  </div>
                  <span className="mt-2 text-[11px] font-medium text-slate-500">{day.label}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 pt-1">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
              <div className="p-2 rounded-lg bg-emerald-100 text-emerald-700">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-emerald-700 font-medium">Total Barang Masuk</div>
                <div className="text-sm font-bold text-emerald-900">
                  {ringkasan.Total_Transaksi_Masuk} Unit
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-50/70 border border-rose-100">
              <div className="p-2 rounded-lg bg-rose-100 text-rose-700">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs text-rose-700 font-medium">Total Barang Keluar</div>
                <div className="text-sm font-bold text-rose-900">
                  {ringkasan.Total_Transaksi_Keluar} Unit
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Valuation Breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Distribusi Kategori Gudang</h2>
            <p className="text-xs text-slate-500 mb-4">
              Proporsi nilai aset stok per kategori produk
            </p>
            <div className="space-y-3.5">
              {categorySummary.map((cat) => {
                const pct =
                  ringkasan.Total_Nilai_Stok > 0
                    ? Math.round((cat.nilaiStok / ringkasan.Total_Nilai_Stok) * 100)
                    : 0;
                return (
                  <div key={cat.kategori} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">
                        {cat.kategori}{" "}
                        <span className="font-normal text-slate-400">
                          ({cat.jumlahProduk} SKU • {cat.totalUnit} unit)
                        </span>
                      </span>
                      <span className="font-bold text-slate-700">{pct}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all"
                        style={{ width: `${Math.max(pct, 4)}%` }}
                      />
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Nilai Stok: {formatRupiah(cat.nilaiStok)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Skema: Sheet / Relational Ready</span>
            <span className="font-semibold text-indigo-600">Real-Time Sync</span>
          </div>
        </div>
      </div>

      {/* 3. Critical Low-Stock Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">
                Daftar Peringatan Stok Kritis (Low Stock Alert)
              </h2>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-700">
                {criticalItems.length} Item
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Otomatis menampilkan produk di mana{" "}
              <code className="font-mono text-rose-600">Stok_Saat_Ini &lt;= Batas_Minimum</code>
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAutomation}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition"
          >
            <BellRing className="w-3.5 h-3.5" />
            Payload Webhook n8n / Telegram
          </button>
        </div>

        {criticalItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Semua stok produk berada di atas batas minimum aman.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Lokasi Rak</th>
                  <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                  <th className="py-3 px-4 text-center">Batas Minimum</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {criticalItems.map((item) => (
                  <tr key={item.SKU} className="hover:bg-rose-50/40 transition">
                    <td className="py-3 px-4 font-mono text-xs font-bold text-slate-800">
                      {item.SKU}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900">{item.Nama_Produk}</div>
                      <div className="text-xs text-slate-500">{item.Kategori}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {item.Lokasi_Rak}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-rose-600">
                      {item.Stok_Saat_Ini}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-600">{item.Batas_Minimum}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" />
                        {item.Stok_Saat_Ini <= 0 ? "HABIS" : "KRITIS"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onQuickRestock(item.SKU)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Restock Masuk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
