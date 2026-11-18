import { MasterStok, LowStockWebhookItem, WebhookPayload } from "@/types/inventory";

export function isLowStock(item: Pick<MasterStok, "Stok_Saat_Ini" | "Batas_Minimum">): boolean {
  return item.Stok_Saat_Ini <= item.Batas_Minimum;
}

export function getStockStatus(item: Pick<MasterStok, "Stok_Saat_Ini" | "Batas_Minimum">): "AMAN" | "KRITIS" | "HABIS" {
  if (item.Stok_Saat_Ini <= 0) return "HABIS";
  if (item.Stok_Saat_Ini <= item.Batas_Minimum) return "KRITIS";
  return "AMAN";
}

export function buildLowStockWebhookPayload(
  allItems: MasterStok[],
  triggeredBy: string = "System_Auto_Check"
): WebhookPayload {
  const criticalItems: LowStockWebhookItem[] = allItems
    .filter((item) => isLowStock(item))
    .map((item) => {
      const defisit = Math.max(0, item.Batas_Minimum - item.Stok_Saat_Ini);
      const rekomendasiOrder = Math.max(item.Batas_Minimum * 2 - item.Stok_Saat_Ini, item.Batas_Minimum);
      return {
        SKU: item.SKU,
        Nama_Produk: item.Nama_Produk,
        Kategori: item.Kategori,
        Stok_Saat_Ini: item.Stok_Saat_Ini,
        Batas_Minimum: item.Batas_Minimum,
        Defisit: defisit,
        Rekomendasi_Order: rekomendasiOrder,
        Lokasi_Rak: item.Lokasi_Rak,
        Estimasi_Biaya_Restock: rekomendasiOrder * item.Harga_Beli,
        Status: item.Stok_Saat_Ini <= 0 ? "HABIS" : "KRITIS",
      };
    });

  const totalRestockCost = criticalItems.reduce((acc, item) => acc + item.Estimasi_Biaya_Restock, 0);

  const lines = [
    `⚠️ *PERINGATAN STOK KRITIS GUDANG UMKM*`,
    `📅 Waktu: ${new Date().toLocaleString("id-ID")}`,
    `👤 Pemicu: ${triggeredBy}`,
    `📦 Total Item Kritis: *${criticalItems.length} Produk*`,
    ``,
    ...criticalItems.map(
      (i, idx) =>
        `${idx + 1}. *${i.Nama_Produk}* (\`${i.SKU}\`)\n   • Stok: *${i.Stok_Saat_Ini}* / Min: ${i.Batas_Minimum} [${i.Status}]\n   • Rak: ${i.Lokasi_Rak} | Saran Order: +${i.Rekomendasi_Order} unit`
    ),
    ``,
    `💰 Estimasi Biaya Restock: *Rp ${totalRestockCost.toLocaleString("id-ID")}*`,
  ];

  return {
    event: "LOW_STOCK_ALERT",
    timestamp: new Date().toISOString(),
    source: "UMKM_Inventory_System",
    triggered_by: triggeredBy,
    summary: {
      critical_items_count: criticalItems.length,
      total_estimated_restock_cost_idr: totalRestockCost,
    },
    telegram_message_markdown: lines.join("\n"),
    items: criticalItems,
  };
}
