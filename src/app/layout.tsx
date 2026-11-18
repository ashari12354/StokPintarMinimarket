import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Stok Pintar Minimarket - Sistem Manajemen Inventaris & Gudang",
  description:
    "Aplikasi Web Manajemen Inventaris & Gudang UMKM dengan Master Stok, Log Transaksi Otomatis, Peringatan Stok Kritis, Webhook n8n/Telegram, dan RBAC.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
