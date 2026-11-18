"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  Edit3,
  Trash2,
  Download,
  AlertTriangle,
  CheckCircle2,
  Lock,
  MapPin,
  X,
} from "lucide-react";
import { MasterStok, UserRole } from "@/types/inventory";
import { formatRupiah } from "./DashboardView";

interface InventoryTableProps {
  inventory: MasterStok[];
  role: UserRole;
  onSaveProduct: (product: MasterStok, isNew: boolean) => Promise<void>;
  onDeleteProduct: (sku: string) => Promise<void>;
  onQuickRestock: (sku: string) => void;
}

const emptyProduct: MasterStok = {
  SKU: "",
  Nama_Produk: "",
  Kategori: "Sembako",
  Harga_Beli: 0,
  Harga_Jual: 0,
  Stok_Saat_Ini: 0,
  Batas_Minimum: 10,
  Lokasi_Rak: "RAK-A1",
};

export default function InventoryTable({
  inventory,
  role,
  onSaveProduct,
  onDeleteProduct,
  onQuickRestock,
}: InventoryTableProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "KRITIS" | "AMAN">("ALL");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(true);
  const [formData, setFormData] = useState<MasterStok>(emptyProduct);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const categories = useMemo(() => {
    const set = new Set(inventory.map((i) => i.Kategori));
    return ["ALL", ...Array.from(set)];
  }, [inventory]);

  const filteredItems = useMemo(() => {
    return inventory.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        item.SKU.toLowerCase().includes(q) ||
        item.Nama_Produk.toLowerCase().includes(q) ||
        item.Lokasi_Rak.toLowerCase().includes(q) ||
        item.Kategori.toLowerCase().includes(q);

      const matchCat = selectedCategory === "ALL" || item.Kategori === selectedCategory;
      const isKritis = item.Stok_Saat_Ini <= item.Batas_Minimum;
      const matchStatus =
        statusFilter === "ALL" ||
        (statusFilter === "KRITIS" && isKritis) ||
        (statusFilter === "AMAN" && !isKritis);

      return matchSearch && matchCat && matchStatus;
    });
  }, [inventory, search, selectedCategory, statusFilter]);

  const openCreateModal = () => {
    if (role !== "Admin") return;
    const nextNum = String(inventory.length + 1).padStart(3, "0");
    setFormData({
      ...emptyProduct,
      SKU: `BRG-${nextNum}`,
    });
    setIsNewRecord(true);
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (item: MasterStok) => {
    if (role !== "Admin") return;
    setFormData({ ...item });
    setIsNewRecord(false);
    setFormError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      await onSaveProduct(formData, isNewRecord);
      setModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan produk.");
    } finally {
      setSubmitting(false);
    }
  };

  const exportCsv = () => {
    const headers = [
      "SKU",
      "Nama_Produk",
      "Kategori",
      "Harga_Beli",
      "Harga_Jual",
      "Stok_Saat_Ini",
      "Batas_Minimum",
      "Lokasi_Rak",
      "Status_Stok",
    ];
    const rows = filteredItems.map((i) => [
      i.SKU,
      `"${i.Nama_Produk.replace(/"/g, '""')}"`,
      `"${i.Kategori}"`,
      i.Harga_Beli,
      i.Harga_Jual,
      i.Stok_Saat_Ini,
      i.Batas_Minimum,
      i.Lokasi_Rak,
      i.Stok_Saat_Ini <= i.Batas_Minimum ? "KRITIS" : "AMAN",
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Master_Stok_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* RBAC Notice for Staff */}
      {role === "Staff" && (
        <div className="bg-slate-100 border border-slate-300 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs text-slate-700">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-slate-500 shrink-0" />
            <span>
              <strong>Mode Staff Gudang (Read-Only Master Data):</strong> Penambahan, pengeditan
              harga/batas minimum, dan penghapusan produk dikunci khusus <strong>Admin</strong>.
              Gunakan menu <strong>Transaksi Masuk/Keluar</strong> untuk mencatat pergerakan stok.
            </span>
          </div>
        </div>
      )}

      {/* Header & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Tabel Master_Stok (Master Inventory Management)
            </h2>
            <p className="text-xs text-slate-500">
              Kelola SKU, Harga Beli/Jual, Lokasi Rak, dan Batas Minimum Peringatan Stok
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV / Sheet
            </button>
            <button
              type="button"
              disabled={role !== "Admin"}
              onClick={openCreateModal}
              className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition shadow-sm ${
                role === "Admin"
                  ? "bg-indigo-600 hover:bg-indigo-700 text-white"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              {role === "Admin" ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5" />}
              Tambah Produk Baru
            </button>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
          <div className="sm:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari SKU, Nama Produk, atau Lokasi Rak..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "ALL" ? "Semua Kategori" : cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="ALL">Semua Status Stok</option>
              <option value="KRITIS">Stok Kritis (&lt;= Min)</option>
              <option value="AMAN">Stok Aman (&gt; Min)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4">Nama Produk & Kategori</th>
                <th className="py-3.5 px-4">Lokasi Rak</th>
                <th className="py-3.5 px-4 text-right">Harga Beli</th>
                <th className="py-3.5 px-4 text-right">Harga Jual</th>
                <th className="py-3.5 px-4 text-center">Stok / Min</th>
                <th className="py-3.5 px-4 text-center">Status Stok</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-500">
                    Tidak ada data produk yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isLow = item.Stok_Saat_Ini <= item.Batas_Minimum;
                  return (
                    <tr
                      key={item.SKU}
                      className={`transition ${
                        isLow ? "bg-rose-50/30 hover:bg-rose-50/60" : "hover:bg-slate-50"
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono text-xs font-bold text-indigo-700">
                        {item.SKU}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{item.Nama_Produk}</div>
                        <span className="inline-block mt-0.5 text-[11px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {item.Kategori}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.Lokasi_Rak}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-700">
                        {formatRupiah(item.Harga_Beli)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-900">
                        {formatRupiah(item.Harga_Jual)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-base font-bold ${
                            isLow ? "text-rose-600" : "text-slate-900"
                          }`}
                        >
                          {item.Stok_Saat_Ini}
                        </span>
                        <span className="text-xs text-slate-400"> / {item.Batas_Minimum}</span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {item.Stok_Saat_Ini <= 0 ? "HABIS" : "STOK KRITIS"}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            AMAN
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onQuickRestock(item.SKU)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition"
                            title="Catat Barang Masuk / Keluar"
                          >
                            +Transaksi
                          </button>
                          {role === "Admin" ? (
                            <>
                              <button
                                type="button"
                                onClick={() => openEditModal(item)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 transition"
                                title="Edit Produk"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => onDeleteProduct(item.SKU)}
                                className="p-1.5 rounded-lg text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span
                              className="p-1.5 text-slate-300 cursor-not-allowed"
                              title="Terkunci (Hanya Admin)"
                            >
                              <Lock className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900">
                {isNewRecord ? "Tambah Produk Baru (Master_Stok)" : `Edit Produk: ${formData.SKU}`}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode SKU (Primary Key)
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!isNewRecord}
                    value={formData.SKU}
                    onChange={(e) => setFormData({ ...formData, SKU: e.target.value.toUpperCase() })}
                    placeholder="Contoh: BRG-009"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-mono disabled:bg-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lokasi Rak Gudang
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Lokasi_Rak}
                    onChange={(e) =>
                      setFormData({ ...formData, Lokasi_Rak: e.target.value.toUpperCase() })
                    }
                    placeholder="Contoh: RAK-A1"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Produk Lengkap
                </label>
                <input
                  type="text"
                  required
                  value={formData.Nama_Produk}
                  onChange={(e) => setFormData({ ...formData, Nama_Produk: e.target.value })}
                  placeholder="Contoh: Minyak Goreng Sawit 2L"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kategori
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.Kategori}
                    onChange={(e) => setFormData({ ...formData, Kategori: e.target.value })}
                    placeholder="Sembako / Kemasan"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Beli / HPP (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.Harga_Beli}
                    onChange={(e) =>
                      setFormData({ ...formData, Harga_Beli: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Harga Jual (Rp)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.Harga_Jual}
                    onChange={(e) =>
                      setFormData({ ...formData, Harga_Jual: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Stok Saat Ini (Unit)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.Stok_Saat_Ini}
                    onChange={(e) =>
                      setFormData({ ...formData, Stok_Saat_Ini: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batas Minimum Alert (Unit)
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.Batas_Minimum}
                    onChange={(e) =>
                      setFormData({ ...formData, Batas_Minimum: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm disabled:opacity-50"
                >
                  {submitting ? "Menyimpan..." : "Simpan ke Master_Stok"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
