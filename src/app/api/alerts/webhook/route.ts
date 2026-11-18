import { NextRequest, NextResponse } from "next/server";
import { getAllInventory } from "@/lib/db";
import { buildLowStockWebhookPayload } from "@/lib/webhook";

export async function GET() {
  try {
    const inventory = getAllInventory();
    const payload = buildLowStockWebhookPayload(inventory, "API_Poll_Check");
    return NextResponse.json({ success: true, payload });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menyiapkan payload webhook" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const webhookUrl: string | undefined = body.webhookUrl;
    const triggeredBy: string = body.triggeredBy || "Manual_Trigger_Admin";

    const inventory = getAllInventory();
    const payload = buildLowStockWebhookPayload(inventory, triggeredBy);

    let externalResponseStatus: number | null = null;
    let simulated = true;

    if (webhookUrl && webhookUrl.startsWith("http")) {
      simulated = false;
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      externalResponseStatus = res.status;
    }

    return NextResponse.json({
      success: true,
      simulated,
      externalResponseStatus,
      message: simulated
        ? `Simulasi Webhook berhasil! ${payload.summary.critical_items_count} item stok kritis siap dikirim ke n8n / Telegram.`
        : `Webhook berhasil dikirim ke endpoint eksternal (HTTP ${externalResponseStatus}).`,
      payload,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mengirim webhook notifikasi." },
      { status: 500 }
    );
  }
}
