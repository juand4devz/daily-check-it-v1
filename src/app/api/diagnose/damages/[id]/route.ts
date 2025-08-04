// /app/api/diagnose/damages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { getUserById } from "@/lib/firebase/service";
import { getKerusakanById, updateKerusakan, deleteKerusakan } from "@/lib/firebase/diagnose-service";
import { z } from "zod";

// Skema Zod untuk validasi data kerusakan
const kerusakanSchema = z.object({
    kode: z.string().min(1, { message: "Kode kerusakan tidak boleh kosong." }),
    nama: z.string().min(1, { message: "Nama kerusakan tidak boleh kosong." }),
    deskripsi: z.string().min(1, { message: "Deskripsi kerusakan tidak boleh kosong." }),
    prior_probability: z.number().min(0.01, { message: "Prior probability harus lebih dari 0." }).max(0.5, { message: "Prior probability tidak boleh lebih dari 0.5." }).optional(),
}).partial();

// --- GET Request Handler (for fetching a single damage by ID) ---
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    try {
        const { id } = await params;
        if (!id) {
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
        if (!id) {
            return NextResponse.json({ status: false, statusCode: 400, message: "ID kerusakan diperlukan untuk pembaruan." }, { status: 400 });
        }

        const body = await request.json();
        const validation = kerusakanSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({
                status: false,
                statusCode: 400,
                message: "Validasi gagal.",
                errors: validation.error.formErrors.fieldErrors,
            }, { status: 400 });
        }

        const updatedKerusakanData = validation.data;

        const kerusakanToUpdate = await getKerusakanById(id);
        if (!kerusakanToUpdate) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Kerusakan tidak ditemukan untuk diperbarui." }, { status: 404 });
        }

        await updateKerusakan(id, updatedKerusakanData);

        return NextResponse.json({ status: true, statusCode: 200, message: "Kerusakan berhasil diperbarui." });
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
        if (!id) {
            return NextResponse.json({ status: false, statusCode: 400, message: "ID kerusakan diperlukan untuk penghapusan." }, { status: 400 });
        }

        const kerusakanToDelete = await getKerusakanById(id);
        if (!kerusakanToDelete) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Kerusakan tidak ditemukan untuk dihapus." }, { status: 404 });
        }

        await deleteKerusakan(id);

        return NextResponse.json({ status: true, statusCode: 200, message: "Kerusakan berhasil dihapus." });
    } catch (caughtError: unknown) {
        console.error("Error deleting kerusakan:", caughtError);
        const errorMessage = "Terjadi kesalahan server saat menghapus kerusakan.";
        return NextResponse.json({ status: false, statusCode: 500, message: errorMessage }, { status: 500 });
    }
}