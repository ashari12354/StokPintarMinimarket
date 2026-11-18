import { NextRequest, NextResponse } from "next/server";
import { getAllInventory, upsertProduct, deleteProductBySku } from "@/lib/db";
import { MasterStok, UserRole } from "@/types/inventory";

function checkAdminRole(req: NextRequest): boolean {
  const role = (req.headers.get("x-user-role") as UserRole) || "Admin";
  return role === "Admin";
}

export async function GET() {
  try {
    const data = getAllInventory();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memuat data Master_Stok" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!checkAdminRole(req)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak (RBAC): Hanya Role 'Admin' yang dapat menambah Master_Stok.",
        },
        { status: 403 }
      );
    }

    const body = (await req.json()) as MasterStok;
    if (!body.SKU || !body.Nama_Produk || !body.Kategori || !body.Lokasi_Rak) {
      return NextResponse.json(
        { success: false, message: "SKU, Nama_Produk, Kategori, dan Lokasi_Rak wajib diisi." },
        { status: 400 }
      );
    }

    const created = upsertProduct(body, true);
    return NextResponse.json({
      success: true,
      message: `Produk ${created.Nama_Produk} (${created.SKU}) berhasil ditambahkan.`,
      data: created,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menambah produk." },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!checkAdminRole(req)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak (RBAC): Hanya Role 'Admin' yang dapat mengubah Master_Stok.",
        },
        { status: 403 }
      );
    }

    const body = (await req.json()) as MasterStok;
    if (!body.SKU) {
      return NextResponse.json({ success: false, message: "SKU wajib disertakan." }, { status: 400 });
    }

    const updated = upsertProduct(body, false);
    return NextResponse.json({
      success: true,
      message: `Produk ${updated.Nama_Produk} (${updated.SKU}) berhasil diperbarui.`,
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal memperbarui produk." },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!checkAdminRole(req)) {
      return NextResponse.json(
        {
          success: false,
          message: "Akses Ditolak (RBAC): Hanya Role 'Admin' yang dapat menghapus produk.",
        },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const sku = searchParams.get("sku");
    if (!sku) {
      return NextResponse.json({ success: false, message: "Parameter SKU wajib diisi." }, { status: 400 });
    }

    deleteProductBySku(sku);
    return NextResponse.json({
      success: true,
      message: `Produk dengan SKU ${sku} berhasil dihapus dari Master_Stok.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Gagal menghapus produk." },
      { status: 400 }
    );
  }
}
