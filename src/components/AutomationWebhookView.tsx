"use client";

import React, { useState } from "react";
import {
  BellRing,
  Copy,
  Check,
  Send,
  Terminal,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
import { WebhookPayload, UserRole } from "@/types/inventory";
import { formatRupiah } from "./DashboardView";

interface AutomationWebhookViewProps {
  webhookPayload: WebhookPayload;
  role: UserRole;
  onTriggerWebhook: (webhookUrl?: string) => Promise<string>;
}

export default function AutomationWebhookView({
  webhookPayload,
  role,
  onTriggerWebhook,
}: AutomationWebhookViewProps) {
  const [webhookUrl, setWebhookUrl] = useState(
    "https://n8n.umkm-gudang.id/webhook/low-stock-telegram"
  );
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedTg, setCopiedTg] = useState(false);
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const copyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(webhookPayload, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const copyTelegram = () => {
    navigator.clipboard.writeText(webhookPayload.telegram_message_markdown);
    setCopiedTg(true);
    setTimeout(() => setCopiedTg(false), 2000);
  };

  const handleSendTest = async (useRealUrl: boolean) => {
    setSending(true);
    setStatusMessage(null);
    try {
      const msg = await onTriggerWebhook(useRealUrl ? webhookUrl : undefined);
      setStatusMessage(msg);
    } catch (err: any) {
      setStatusMessage(err.message || "Gagal memicu webhook.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 shrink-0">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Pusat Otomasi Low-Stock Alert (n8n / Telegram / WhatsApp Gateway)
              </h2>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                Setiap kali transaksi menyebabkan{" "}
                <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">
                  Stok_Saat_Ini &lt;= Batas_Minimum
                </code>
                , sistem secara otomatis menyusun payload JSON terstruktur beserta pesan Telegram
                Markdown yang siap diteruskan ke workflow otomasi eksternal melalui endpoint{" "}
                <code className="font-mono text-indigo-600">POST /api/alerts/webhook</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-right">
              <div className="text-[11px] font-semibold uppercase text-rose-500">
                Item Kritis Aktif
              </div>
              <div className="text-lg font-bold text-rose-700">
                {webhookPayload.summary.critical_items_count} SKU
              </div>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
              <div className="text-[11px] font-semibold uppercase text-slate-400">
                Estimasi Restock
              </div>
              <div className="text-lg font-bold text-slate-800">
                {formatRupiah(webhookPayload.summary.total_estimated_restock_cost_idr)}
              </div>
            </div>
          </div>
        </div>

        {/* Webhook Trigger Controls */}
        <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Target Endpoint Webhook (n8n / Make / Custom Bot)
            </label>
            <input
              type="url"
              value={webhookUrl}
              disabled={role !== "Admin"}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://n8n.domain-anda.com/webhook/..."
              className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60"
            />
          </div>
          <div className="flex items-center gap-2 sm:pt-5">
            <button
              type="button"
              disabled={sending}
              onClick={() => handleSendTest(false)}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-1.5 transition"
            >
              <Send className="w-3.5 h-3.5" />
              {sending ? "Mengirim..." : "Simulasi Trigger Webhook"}
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            ✅ {statusMessage}
          </div>
        )}
      </div>

      {/* Preview Grid: Telegram Message + Raw JSON Payload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Telegram / WhatsApp Formatted Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Preview Pesan Bot Telegram / WhatsApp
              </h3>
            </div>
            <button
              type="button"
              onClick={copyTelegram}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            >
              {copiedTg ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  Tersalin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Salin Teks
                </>
              )}
            </button>
          </div>

          <div className="p-5 flex-1 bg-slate-50">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm font-sans text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
              {webhookPayload.telegram_message_markdown}
            </div>

            {webhookPayload.items.length > 0 && (
              <div className="mt-4 space-y-2">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Rekomendasi Purchase Order Otomatis:
                </div>
                {webhookPayload.items.map((item) => (
                  <div
                    key={item.SKU}
                    className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{item.Nama_Produk}</span>{" "}
                      <span className="font-mono text-indigo-600">({item.SKU})</span>
                      <div className="text-[11px] text-slate-500">
                        Stok: <strong className="text-rose-600">{item.Stok_Saat_Ini}</strong> / Min:{" "}
                        {item.Batas_Minimum} • Rak: {item.Lokasi_Rak}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-emerald-700">
                        Order +{item.Rekomendasi_Order} unit
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {formatRupiah(item.Estimasi_Biaya_Restock)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Raw JSON Webhook Payload */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-slate-200">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold">JSON Payload (n8n / Webhook Ready)</h3>
            </div>
            <button
              type="button"
              onClick={copyJson}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
            >
              {copiedJson ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  JSON Tersalin
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy JSON
                </>
              )}
            </button>
          </div>

          <pre className="p-5 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed flex-1">
            {JSON.stringify(webhookPayload, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
