# Stok Pintar Minimarket — Web-Based Inventory & Warehouse Management System

Sistem Manajemen Inventaris & Gudang berbasis Web untuk operasional UMKM, dibangun dengan **Next.js (React + TypeScript)**, **Tailwind CSS**, **Next.js API Routes**, serta arsitektur database relasional & Sheet-compatible.

---

## 1. Struktur Database & Skema (`database/schema.sql` & `database/seed.json`)

1. **`Master_Stok`**:
   - `SKU` (Primary Key), `Nama_Produk`, `Kategori`, `Harga_Beli`, `Harga_Jual`, `Stok_Saat_Ini`, `Batas_Minimum`, `Lokasi_Rak`
   - Tagging otomatis: `Status_Stok = 'KRITIS'` apabila `Stok_Saat_Ini <= Batas_Minimum`.
2. **`Log_Transaksi`**:
   - `ID_Transaksi` (Primary Key), `Tanggal`, `Jenis` (`Masuk` / `Keluar`), `SKU` (Foreign Key), `Jumlah`, `Keterangan`, `User`
   - Setiap input transaksi otomatis menghitung ulang `Stok_Saat_Ini` di `Master_Stok` dan memvalidasi ketersediaan stok untuk transaksi `Keluar`.
3. **`Ringkasan_Dashboard`**:
   - Metrik agregasi real-time: `Total_Produk`, `Total_Unit_Stok`, `Total_Nilai_Stok` (HPP), `Total_Nilai_Jual`, `Jumlah_Stok_Kritis`, grafik pergerakan 7 hari terakhir, dan distribusi kategori.

---

## 2. Daftar Endpoint API (Next.js App Router)

- `GET /api/dashboard` — Mengambil agregasi `Ringkasan_Dashboard`, daftar stok kritis, grafik pergerakan 7 hari, dan preview payload webhook.
- `GET | POST | PUT | DELETE /api/inventory` — Operasi CRUD untuk `Master_Stok` dengan proteksi header RBAC (`x-user-role: Admin`).
- `GET | POST /api/transactions` — Mencatat transaksi `Masuk` / `Keluar` ke `Log_Transaksi`, mengalkulasi ulang `Master_Stok.Stok_Saat_Ini` secara atomik, dan memicu payload webhook apabila stok mencapai batas minimum.
- `GET | POST /api/alerts/webhook` — Menghasilkan dan mengirim payload JSON & format pesan Telegram Markdown siap pakai untuk integrasi **n8n / Telegram Bot / WhatsApp Gateway**.

---

## 3. Cara Menjalankan

### Opsi A: Menjalankan Fullstack Next.js Server
Pastikan Node.js (v18+) sudah terinstal, lalu jalankan:
```bash
npm install
npm run dev
```
Buka `http://localhost:3000` di browser.

### Opsi B: Membuka Langsung Tanpa Instalasi (Standalone Preview)
Buka file `index.html` secara langsung di browser (double-click di Windows Explorer) untuk mencoba seluruh fitur interaktif (Dashboard, CRUD Master Stok, Kalkulasi Transaksi Masuk/Keluar, RBAC Admin/Staff, dan Generator Payload Webhook n8n/Telegram) secara instan.
