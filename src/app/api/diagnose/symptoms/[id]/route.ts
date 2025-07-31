// /app/api/diagnose/symptoms/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { getUserById } from "@/lib/firebase/service";
import { getGejalaById, updateGejala, deleteGejala } from "@/lib/firebase/diagnose-service";
import { Gejala } from "@/types/diagnose";

// --- GET Request Handler (for fetching a single symptom by ID) ---
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ status: false, statusCode: 400, message: "ID gejala diperlukan." }, { status: 400 });
        }

        const gejala = await getGejalaById(id);

        if (!gejala) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Gejala tidak ditemukan." }, { status: 404 });
        }

        return NextResponse.json({ status: true, statusCode: 200, message: "Gejala berhasil diambil.", data: gejala });
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat mengambil gejala berdasarkan ID:", caughtError);
        const errorMessage = "Gagal mengambil gejala dari database.";
        return NextResponse.json({ status: false, statusCode: 500, message: errorMessage }, { status: 500 });
    }
}

// --- PUT Request Handler (for updating a symptom by ID) ---
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }
    const user = await getUserById(session.user.id);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Only administrators can update symptoms." }, { status: 403 });
    }

    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ status: false, statusCode: 400, message: "ID gejala diperlukan untuk pembaruan." }, { status: 400 });
        }

        const updatedGejalaData: Partial<Gejala> = await request.json();

        if (updatedGejalaData.kode === null || updatedGejalaData.kode === '') {
            return NextResponse.json({ status: false, statusCode: 400, message: "Kode gejala tidak boleh kosong." }, { status: 400 });
        }
        if (updatedGejalaData.nama === null || updatedGejalaData.nama === '') {
            return NextResponse.json({ status: false, statusCode: 400, message: "Nama gejala tidak boleh kosong." }, { status: 400 });
        }

        const gejalaToUpdate = await getGejalaById(id);
        if (!gejalaToUpdate) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Gejala tidak ditemukan untuk diperbarui." }, { status: 404 });
        }

        await updateGejala(id, updatedGejalaData);

        return NextResponse.json({ status: true, statusCode: 200, message: "Gejala berhasil diperbarui." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat memperbarui gejala:", caughtError);
        const errorMessage = "Terjadi kesalahan server saat memperbarui gejala.";
        return NextResponse.json({ status: false, statusCode: 500, message: errorMessage }, { status: 500 });
    }
}

// --- DELETE Request Handler ---
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }
    const user = await getUserById(session.user.id);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Only administrators can delete symptoms." }, { status: 403 });
    }

    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ status: false, statusCode: 400, message: "ID gejala diperlukan untuk penghapusan." }, { status: 400 });
        }

        await deleteGejala(id);

        return NextResponse.json({ status: true, statusCode: 200, message: "Gejala berhasil dihapus." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat menghapus gejala:", caughtError);
        const errorMessage = "Terjadi kesalahan server saat menghapus gejala.";
        return NextResponse.json({ status: false, statusCode: 500, message: errorMessage }, { status: 500 });
    }
}