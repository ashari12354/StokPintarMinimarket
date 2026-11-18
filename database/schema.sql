-- ============================================================================
-- UMKM & WAREHOUSE INVENTORY MANAGEMENT SYSTEM
-- Relational Database Schema (PostgreSQL / MySQL / SQLite Compatible)
-- Also compatible with Google Sheets / CSV 3-Sheet Architecture
-- ============================================================================

-- 1. TABEL MASTER_STOK
CREATE TABLE IF NOT EXISTS Master_Stok (
    SKU VARCHAR(32) PRIMARY KEY,
    Nama_Produk VARCHAR(150) NOT NULL,
    Kategori VARCHAR(80) NOT NULL,
    Harga_Beli DECIMAL(15, 2) NOT NULL CHECK (Harga_Beli >= 0),
    Harga_Jual DECIMAL(15, 2) NOT NULL CHECK (Harga_Jual >= 0),
    Stok_Saat_Ini INT NOT NULL DEFAULT 0 CHECK (Stok_Saat_Ini >= 0),
    Batas_Minimum INT NOT NULL DEFAULT 5 CHECK (Batas_Minimum >= 0),
    Lokasi_Rak VARCHAR(50) NOT NULL,
    Updated_At TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_master_stok_kategori ON Master_Stok(Kategori);
CREATE INDEX idx_master_stok_kritis ON Master_Stok(Stok_Saat_Ini, Batas_Minimum);

-- 2. TABEL LOG_TRANSAKSI
CREATE TABLE IF NOT EXISTS Log_Transaksi (
    ID_Transaksi VARCHAR(36) PRIMARY KEY,
    Tanggal TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Jenis VARCHAR(10) NOT NULL CHECK (Jenis IN ('Masuk', 'Keluar')),
    SKU VARCHAR(32) NOT NULL,
    Jumlah INT NOT NULL CHECK (Jumlah > 0),
    Keterangan VARCHAR(255),
    "User" VARCHAR(80) NOT NULL,
    CONSTRAINT fk_transaksi_sku
        FOREIGN KEY (SKU) REFERENCES Master_Stok(SKU)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

CREATE INDEX idx_log_transaksi_tanggal ON Log_Transaksi(Tanggal DESC);
CREATE INDEX idx_log_transaksi_sku ON Log_Transaksi(SKU);
CREATE INDEX idx_log_transaksi_jenis ON Log_Transaksi(Jenis);

-- 3. VIEW RINGKASAN_DASHBOARD (Real-Time Aggregated Metrics)
CREATE VIEW Ringkasan_Dashboard AS
SELECT
    COUNT(SKU) AS Total_Produk,
    COALESCE(SUM(Stok_Saat_Ini), 0) AS Total_Unit_Stok,
    COALESCE(SUM(Stok_Saat_Ini * Harga_Beli), 0) AS Total_Nilai_Stok,
    COALESCE(SUM(Stok_Saat_Ini * Harga_Jual), 0) AS Total_Nilai_Jual,
    COUNT(CASE WHEN Stok_Saat_Ini <= Batas_Minimum THEN 1 END) AS Jumlah_Stok_Kritis
FROM Master_Stok;

-- 4. VIEW ITEM STOK KRITIS (For Low Stock Alert / n8n Webhook Payload)
CREATE VIEW View_Stok_Kritis AS
SELECT
    SKU,
    Nama_Produk,
    Kategori,
    Stok_Saat_Ini,
    Batas_Minimum,
    (Batas_Minimum - Stok_Saat_Ini) AS Defisit_Stok,
     GREATEST((Batas_Minimum * 2) - Stok_Saat_Ini, Batas_Minimum) AS Rekomendasi_Restock,
    Lokasi_Rak,
    Harga_Beli,
    CASE
        WHEN Stok_Saat_Ini = 0 THEN 'HABIS'
        WHEN Stok_Saat_Ini <= Batas_Minimum THEN 'KRITIS'
        ELSE 'AMAN'
    END AS Status_Stok
FROM Master_Stok
WHERE Stok_Saat_Ini <= Batas_Minimum
ORDER BY Stok_Saat_Ini ASC;
