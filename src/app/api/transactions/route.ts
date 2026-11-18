import { NextRequest, NextResponse } from "next/server";
import { getAllTransactions, createTransaction } from "@/lib/db";
import { JenisTransaksi } from "@/types/inventory";

export async function GET() {
  try {
    const data = getAllTransactions();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat Log_Transaksi" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { Jenis, SKU, Jumlah, Keterangan, User, Tanggal } = body as {
      Jenis: JenisTransaksi;
      SKU: string;
      Jumlah: number;
      Keterangan: string;
      User: string;
      Tanggal?: string;
    };

    if (!Jenis || !["Masuk", "Keluar"].includes(Jenis)) {
      return NextResponse.json(
        { success: false, message: "Jenis transaksi harus 'Masuk' atau 'Keluar'." },
        { status: 400 }
      );
    }

    if (!SKU || !Jumlah) {
      return NextResponse.json(
        { success: false, message: "SKU dan Jumlah wajib diisi." },
        { status: 400 }
      );
    }

    const result = createTransaction({
      Jenis,
      SKU,
      Jumlah: Number(Jumlah),
      Keterangan: Keterangan || "",
      User: User || "Staff Gudang",
      Tanggal,
    });

    return NextResponse.json({
      success: true,
      message: `Transaksi ${result.transaction.ID_Transaksi} (${Jenis} ${Jumlah} unit) berhasil dicatat. Stok kini: ${result.stokSesudah}.`,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal mencatat transaksi." },
      { status: 400 }
    );
  }
}
