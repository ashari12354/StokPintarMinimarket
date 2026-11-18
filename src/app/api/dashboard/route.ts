import { NextResponse } from "next/server";
import { getDashboardSummary, getAllInventory, getAllTransactions } from "@/lib/db";
import { buildLowStockWebhookPayload } from "@/lib/webhook";

export async function GET() {
  try {
    const summary = getDashboardSummary();
    const inventory = getAllInventory();
    const transactions = getAllTransactions();
    const webhookPreview = buildLowStockWebhookPayload(inventory, "Dashboard_Sync");

    return NextResponse.json({
      success: true,
      data: {
        ...summary,
        inventory,
        transactions,
        webhookPreview,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat Ringkasan_Dashboard" },
      { status: 500 }
    );
  }
}
