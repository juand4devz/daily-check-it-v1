// app/api/kerusakan/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin";
import type { Kerusakan } from "@/types"; // Import your Kerusakan interface

// --- GET Request Handler (for fetching a single damage by ID) ---
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "ID kerusakan diperlukan." }, { status: 400 });
        }

        const docRef = adminDb.collection("kerusakan").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Kerusakan tidak ditemukan." }, { status: 404 });
        }

        const data = doc.data();
        if (!data) {
            return NextResponse.json({ error: "Data kerusakan kosong." }, { status: 500 });
        }

        const kerusakan: Kerusakan = {
            id: doc.id,
            kode: data.kode as string,
            nama: data.nama as string,
            deskripsi: data.deskripsi as string,
            tingkat_kerusakan: (data.tingkat_kerusakan || "Ringan") as Kerusakan["tingkat_kerusakan"],
            estimasi_biaya: (data.estimasi_biaya as string) || "",
            waktu_perbaikan: (data.waktu_perbaikan as string) || "",
            prior_probability: Number(data.prior_probability) || 0.1,
            solusi: (data.solusi as string) || "",
            gejala_terkait: (data.gejala_terkait as string[]) || [],
            createdAt: (data.createdAt as string) || undefined,
            updatedAt: (data.updatedAt as string) || undefined,
        };

        return NextResponse.json(kerusakan);
    } catch (caughtError: unknown) {
        console.error("Error fetching single kerusakan:", caughtError);
        let errorMessage = "Failed to fetch kerusakan from database.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// --- PUT Request Handler (for updating a damage by ID) ---
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "ID kerusakan diperlukan untuk pembaruan." }, { status: 400 });
        }

        const updatedKerusakanData: Partial<Kerusakan> = await request.json();
        const now = new Date().toISOString();

        // Basic validation for required fields if they are being updated
        if (updatedKerusakanData.kode === null || updatedKerusakanData.kode === '') {
            return NextResponse.json({ error: "Kode kerusakan tidak boleh kosong." }, { status: 400 });
        }
        if (updatedKerusakanData.nama === null || updatedKerusakanData.nama === '') {
            return NextResponse.json({ error: "Nama kerusakan tidak boleh kosong." }, { status: 400 });
        }
        if (updatedKerusakanData.deskripsi === null || updatedKerusakanData.deskripsi === '') {
            return NextResponse.json({ error: "Deskripsi kerusakan tidak boleh kosong." }, { status: 400 });
        }

        // Validate prior_probability range if being updated
        if (updatedKerusakanData.prior_probability !== undefined && (updatedKerusakanData.prior_probability <= 0 || updatedKerusakanData.prior_probability > 0.5)) {
            return NextResponse.json(
                { error: "Prior probability harus antara 0.01 dan 0.50." },
                { status: 400 }
            );
        }

        const docRef = adminDb.collection("kerusakan").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Kerusakan tidak ditemukan untuk diperbarui." }, { status: 404 });
        }

        // Prepare data for update, excluding 'id' and 'createdAt' from direct update
        const dataToUpdate: Partial<Kerusakan> = {
            ...updatedKerusakanData,
            updatedAt: now,
            // Ensure prior_probability is a number if it exists
            prior_probability: updatedKerusakanData.prior_probability !== undefined ? Number(updatedKerusakanData.prior_probability) : undefined,
        };

        await docRef.update(dataToUpdate);

        return NextResponse.json({ message: "Kerusakan berhasil diperbarui." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error("Error updating kerusakan:", caughtError);
        let errorMessage = "Server error when updating kerusakan.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// --- DELETE Request Handler ---
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "ID kerusakan diperlukan untuk penghapusan." }, { status: 400 });
        }

        const docRef = adminDb.collection("kerusakan").doc(id);
        await docRef.delete();

        return NextResponse.json({ message: "Kerusakan berhasil dihapus." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error("Error deleting kerusakan:", caughtError);
        let errorMessage = "Server error when deleting kerusakan.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}