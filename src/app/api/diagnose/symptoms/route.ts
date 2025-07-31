// /app/api/diagnose/symptoms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getUserById } from "@/lib/firebase/service";
import { addGejala, getAllGejala, getGejalaByKode } from "@/lib/firebase/diagnose-service";
import { Gejala } from "@/types/diagnose";

// --- GET Request Handler (untuk mengambil semua gejala) ---
export async function GET() {
    const session = await auth();
    // Validasi: Pengguna harus login untuk mengakses data ini
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    try {
        const gejalaList = await getAllGejala();
        return NextResponse.json({ status: true, statusCode: 200, message: "Gejala berhasil diambil.", data: gejalaList });
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat mengambil daftar gejala:", caughtError);
        const errorMessage = "Gagal mengambil daftar gejala dari database.";
        return NextResponse.json({ status: false, statusCode: 500, message: errorMessage }, { status: 500 });
    }
}

// --- POST Request Handler (untuk menambah gejala baru) ---
export async function POST(request: NextRequest) {
    const session = await auth();
    // Validasi: Hanya admin yang dapat menambah gejala
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }
    const user = await getUserById(session.user.id);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Only administrators can add symptoms." }, { status: 403 });
    }

    try {
        const newGejala: Omit<Gejala, 'id'> = await request.json();

        if (!newGejala.kode || !newGejala.nama) {
            return NextResponse.json({ status: false, statusCode: 400, message: "Kode dan Nama gejala wajib diisi." }, { status: 400 });
        }

        const existingGejala = await getGejalaByKode(newGejala.kode);
        if (existingGejala) {
            return NextResponse.json({ status: false, statusCode: 409, message: `Gejala dengan kode '${newGejala.kode}' sudah ada.` }, { status: 409 });
        }

        const savedGejala = await addGejala(newGejala);

        return NextResponse.json({ status: true, statusCode: 201, message: "Gejala berhasil ditambahkan.", data: savedGejala });
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat menambah gejala:", caughtError);
        const errorMessage = "Terjadi kesalahan server saat menambah gejala.";
        return NextResponse.json({ status: false, statusCode: 500, message: errorMessage }, { status: 500 });
    }
}