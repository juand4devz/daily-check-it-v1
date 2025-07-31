// /app/api/diagnose/damages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getUserById } from "@/lib/firebase/service";
import { getAllKerusakan, addKerusakan, getKerusakanByKode } from "@/lib/firebase/diagnose-service";
import { Kerusakan } from "@/types/diagnose";

// --- GET Request Handler (for fetching all damages) ---
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    try {
        const kerusakanList = await getAllKerusakan();
        return NextResponse.json({ status: true, statusCode: 200, message: "Daftar kerusakan berhasil diambil.", data: kerusakanList });
    } catch (caughtError: unknown) {
        console.error("Error fetching kerusakan list:", caughtError);
        const errorMessage = "Failed to fetch kerusakan list from database.";
        return NextResponse.json({ status: false, statusCode: 500, message: errorMessage }, { status: 500 });
    }
}

// --- POST Request Handler (for adding new damages) ---
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }
    const user = await getUserById(session.user.id);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Only administrators can add damages." }, { status: 403 });
    }

    try {
        const newKerusakan: Omit<Kerusakan, 'id'> = await request.json();

        if (!newKerusakan.kode || !newKerusakan.nama || !newKerusakan.deskripsi) {
            return NextResponse.json({ status: false, statusCode: 400, message: "Kode, nama, dan deskripsi kerusakan wajib diisi." }, { status: 400 });
        }

        if (typeof newKerusakan.prior_probability !== 'number' || newKerusakan.prior_probability <= 0 || newKerusakan.prior_probability > 0.5) {
            return NextResponse.json({ status: false, statusCode: 400, message: "Prior probability harus antara 0.01 dan 0.50." }, { status: 400 });
        }

        const existingKerusakan = await getKerusakanByKode(newKerusakan.kode);
        if (existingKerusakan) {
            return NextResponse.json({ status: false, statusCode: 409, message: `Kerusakan dengan kode '${newKerusakan.kode}' sudah ada.` }, { status: 409 });
        }

        const savedKerusakan = await addKerusakan(newKerusakan);

        return NextResponse.json({ status: true, statusCode: 201, message: "Kerusakan berhasil ditambahkan.", data: savedKerusakan });
    } catch (caughtError: unknown) {
        console.error("Error adding kerusakan:", caughtError);
        const errorMessage = "Server error when adding kerusakan.";
        return NextResponse.json({ status: false, statusCode: 500, message: errorMessage }, { status: 500 });
    }
}