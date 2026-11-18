"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar, { ActiveTab } from "@/components/Navbar";
import DashboardView from "@/components/DashboardView";
import InventoryTable from "@/components/InventoryTable";
import TransactionForm from "@/components/TransactionForm";
import AutomationWebhookView from "@/components/AutomationWebhookView";
import {
  UserRole,
  MasterStok,
  LogTransaksi,
  RingkasanDashboard,
  DailyMovement,
  CategorySummary,
  WebhookPayload,
  JenisTransaksi,
} from "@/types/inventory";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [role, setRole] = useState<UserRole>("Admin");
  const [preselectedSku, setPreselectedSku] = useState<string | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [inventory, setInventory] = useState<MasterStok[]>([]);
  const [transactions, setTransactions] = useState<LogTransaksi[]>([]);
  const [ringkasan, setRingkasan] = useState<RingkasanDashboard>({
    Total_Produk: 0,
    Total_Unit_Stok: 0,
    Total_Nilai_Stok: 0,
    Total_Nilai_Jual: 0,
    Estimasi_Potensi_Laba: 0,
    Jumlah_Stok_Kritis: 0,
    Total_Transaksi_Masuk: 0,
    Total_Transaksi_Keluar: 0,
  });
  const [criticalItems, setCriticalItems] = useState<MasterStok[]>([]);
  const [dailyMovements, setDailyMovements] = useState<DailyMovement[]>([]);
  const [categorySummary, setCategorySummary] = useState<CategorySummary[]>([]);
  const [webhookPreview, setWebhookPreview] = useState<WebhookPayload>({
    event: "LOW_STOCK_ALERT",
    timestamp: new Date().toISOString(),
    source: "UMKM_Inventory_System",
    triggered_by: "Init",
    summary: { critical_items_count: 0, total_estimated_restock_cost_idr: 0 },
    telegram_message_markdown: "",
    items: [],
  });

  const fetchAllData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (json.success) {
        setInventory(json.data.inventory);
        setTransactions(json.data.transactions);
        setRingkasan(json.data.ringkasan);
        setCriticalItems(json.data.criticalItems);
        setDailyMovements(json.data.dailyMovements);
        setCategorySummary(json.data.categorySummary);
        setWebhookPreview(json.data.webhookPreview);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleSaveProduct = async (product: MasterStok, isNew: boolean) => {
    const res = await fetch("/api/inventory", {
      method: isNew ? "POST" : "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-user-role": role,
      },
      body: JSON.stringify(product),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Gagal menyimpan produk");
    }
    await fetchAllData();
  };

  const handleDeleteProduct = async (sku: string) => {
    if (!window.confirm(`Hapus produk dengan SKU ${sku} dari Master_Stok?`)) return;
    const res = await fetch(`/api/inventory?sku=${encodeURIComponent(sku)}`, {
      method: "DELETE",
      headers: {
        "x-user-role": role,
      },
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      alert(json.message || "Gagal menghapus produk");
      return;
    }
    await fetchAllData();
  };

  const handleCreateTransaction = async (payload: {
    Jenis: JenisTransaksi;
    SKU: string;
    Jumlah: number;
    Keterangan: string;
    User: string;
  }) => {
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Gagal mencatat transaksi");
    }
    await fetchAllData();
  };

  const handleTriggerWebhook = async (webhookUrl?: string): Promise<string> => {
    const res = await fetch("/api/alerts/webhook", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        webhookUrl,
        triggeredBy: `${role} Manual Trigger`,
      }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || "Gagal mengirim webhook");
    }
    return json.message;
  };

  const handleQuickRestock = (sku: string) => {
    setPreselectedSku(sku);
    setActiveTab("transactions");
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        role={role}
        setRole={setRole}
        criticalCount={ringkasan.Jumlah_Stok_Kritis}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-20 text-center text-sm text-slate-500">
            Memuat data inventaris gudang...
          </div>
        ) : (
          <>
            {activeTab === "dashboard" && (
              <DashboardView
                ringkasan={ringkasan}
                criticalItems={criticalItems}
                dailyMovements={dailyMovements}
                categorySummary={categorySummary}
                onQuickRestock={handleQuickRestock}
                onOpenAutomation={() => setActiveTab("automation")}
              />
            )}

            {activeTab === "inventory" && (
              <InventoryTable
                inventory={inventory}
                role={role}
                onSaveProduct={handleSaveProduct}
                onDeleteProduct={handleDeleteProduct}
                onQuickRestock={handleQuickRestock}
              />
            )}

            {activeTab === "transactions" && (
              <TransactionForm
                inventory={inventory}
                transactions={transactions}
                role={role}
                preselectedSku={preselectedSku}
                onSubmitTransaction={handleCreateTransaction}
              />
            )}

            {activeTab === "automation" && (
              <AutomationWebhookView
                webhookPayload={webhookPreview}
                role={role}
                onTriggerWebhook={handleTriggerWebhook}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div>
            <strong>Stok Pintar Minimarket</strong> — Relational & Sheet-Compatible Inventory Management
            System
          </div>
          <div>
            Tabel Aktif: <code>Master_Stok</code> • <code>Log_Transaksi</code> •{" "}
            <code>Ringkasan_Dashboard</code> | Mode RBAC: <strong>{role}</strong>
          </div>
        </div>
      </footer>
    </div>
  );
}
