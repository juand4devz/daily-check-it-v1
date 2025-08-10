// /app/api/diagnose/damages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { getUserById } from "@/lib/firebase/service";
import { getKerusakanById, updateKerusakan, deleteKerusakan } from "@/lib/firebase/diagnose-service";
import { Kerusakan } from "@/types/diagnose";

// --- GET Request Handler (for fetching a single damage by ID) ---
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    try {
        const { id } = await params;
        if (!id || id.trim() === '') {
            return NextResponse.json({ status: false, statusCode: 400, message: "ID kerusakan diperlukan." }, { status: 400 });
        }

        const kerusakan = await getKerusakanById(id);

        if (!kerusakan) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Kerusakan tidak ditemukan." }, { status: 404 });
        }

        return NextResponse.json({ status: true, statusCode: 200, message: "Kerusakan berhasil diambil.", data: kerusakan });
    } catch (caughtError: unknown) {
        console.error("Error fetching single kerusakan:", caughtError);
        const errorMessage = "Failed to fetch kerusakan from database.";
        return NextResponse.json({ status: false, statusCode: 500, message: errorMessage }, { status: 500 });
    }
}

// --- PUT Request Handler (for updating a damage by ID) ---
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }
    const user = await getUserById(session.user.id);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Only administrators can update damages." }, { status: 403 });
    }

    try {
        const { id } = await params;
        if (!id || id.trim() === '') {
            return NextResponse.json({ status: false, statusCode: 400, message: "ID kerusakan diperlukan untuk pembaruan." }, { status: 400 });
        }

        const body: Partial<Kerusakan> = await request.json();

        // Validasi minimal untuk nama kerusakan
        if (!body.nama || body.nama.trim() === '') {
            return NextResponse.json({ status: false, statusCode: 400, message: "Nama kerusakan tidak boleh kosong." }, { status: 400 });
        }

        const kerusakanToUpdate = await getKerusakanById(id);
        if (!kerusakanToUpdate) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Kerusakan tidak ditemukan untuk diperbarui." }, { status: 404 });
        }

        await updateKerusakan(id, body);

        return NextResponse.json({ status: true, statusCode: 200, message: "Kerusakan berhasil diperbarui." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error("Error updating kerusakan:", caughtError);
        const errorMessage = "Server error when updating kerusakan.";
        return NextResponse.json({ status: false, statusCode: 500, message: errorMessage }, { status: 500 });
    }
}

// --- DELETE Request Handler ---
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }
    const user = await getUserById(session.user.id);
    if (!user || user.role !== 'admin') {
        return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Only administrators can delete damages." }, { status: 403 });
    }

    try {
        const { id } = await params;
        if (!id || id.trim() === '') {
            return NextResponse.json({ status: false, statusCode: 400, message: "ID kerusakan diperlukan untuk penghapusan." }, { status: 400 });
        }

        const kerusakanToDelete = await getKerusakanById(id);
        if (!kerusakanToDelete) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Kerusakan tidak ditemukan untuk dihapus." }, { status: 404 });
        }

        await deleteKerusakan(id);

        return NextResponse.json({ status: true, statusCode: 200, message: "Kerusakan berhasil dihapus." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error("Error deleting kerusakan:", caughtError);
        const errorMessage = "Terjadi kesalahan server saat menghapus kerusakan.";
        return NextResponse.json({ status: false, statusCode: 500, message: errorMessage }, { status: 500 });
    }
}