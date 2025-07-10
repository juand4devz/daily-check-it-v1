import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin";

// --- Interfaces ---
// Ensure this interface matches your src/types.ts file
// Add 'id' as a required field for client-side representation
export interface Gejala {
    id: string; // Add Firestore document ID
    kode: string;
    nama: string;
    deskripsi: string;
    kategori: string;
    perangkat: string[];
    mass_function: Record<string, number>;
    gambar: string;
    createdAt?: string;
    updatedAt?: string;
}

// --- GET Request Handler (for fetching a single symptom by ID) ---
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "ID gejala diperlukan." }, { status: 400 });
        }

        const docRef = adminDb.collection("gejala").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Gejala tidak ditemukan." }, { status: 404 });
        }

        const data = doc.data();
        if (!data) {
            return NextResponse.json({ error: "Data gejala kosong." }, { status: 500 });
        }

        const gejala: Gejala = {
            id: doc.id,
            kode: data.kode as string,
            nama: data.nama as string,
            deskripsi: data.deskripsi as string,
            kategori: data.kategori as string,
            perangkat: (data.perangkat as string[]) || [],
            mass_function: (data.mass_function as Record<string, number>) || {},
            gambar: (data.gambar as string) || "",
            createdAt: (data.createdAt as string) || undefined,
            updatedAt: (data.updatedAt as string) || undefined,
        };

        return NextResponse.json(gejala);
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat mengambil gejala berdasarkan ID:", caughtError);
        let errorMessage = "Gagal mengambil gejala dari database.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// --- PUT Request Handler (for updating a symptom by ID) ---
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "ID gejala diperlukan untuk pembaruan." }, { status: 400 });
        }

        const updatedGejalaData: Partial<Gejala> = await request.json();
        const now = new Date().toISOString();

        // Basic validation for required fields if they are being updated
        if (updatedGejalaData.kode === null || updatedGejalaData.kode === '') {
            return NextResponse.json({ error: "Kode gejala tidak boleh kosong." }, { status: 400 });
        }
        if (updatedGejalaData.nama === null || updatedGejalaData.nama === '') {
            return NextResponse.json({ error: "Nama gejala tidak boleh kosong." }, { status: 400 });
        }

        const docRef = adminDb.collection("gejala").doc(id);
        const doc = await docRef.get();

        if (!doc.exists) {
            return NextResponse.json({ error: "Gejala tidak ditemukan untuk diperbarui." }, { status: 404 });
        }

        // Prepare data for update, excluding 'id' and 'createdAt' from direct update
        const dataToUpdate: Partial<Gejala> = {
            ...updatedGejalaData,
            updatedAt: now,
        };

        // Handle mass_function cleaning and uncertainty
        if (dataToUpdate.mass_function) {
            dataToUpdate.mass_function = Object.fromEntries(
                Object.entries(dataToUpdate.mass_function).filter(
                    ([, value]) => typeof value === 'number' && value > 0
                )
            );
            const currentTotal = Object.values(dataToUpdate.mass_function).reduce((sum, val) => sum + val, 0);
            if (!dataToUpdate.mass_function.hasOwnProperty("uncertainty")) {
                dataToUpdate.mass_function["uncertainty"] = Math.max(0.05, 1 - currentTotal);
            } else {
                dataToUpdate.mass_function["uncertainty"] = Math.max(0.05, dataToUpdate.mass_function["uncertainty"]);
            }
        }


        await docRef.update(dataToUpdate);

        return NextResponse.json({ message: "Gejala berhasil diperbarui." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat memperbarui gejala:", caughtError);
        let errorMessage = "Terjadi kesalahan server saat memperbarui gejala.";
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
            return NextResponse.json({ error: "ID gejala diperlukan untuk penghapusan." }, { status: 400 });
        }

        const docRef = adminDb.collection("gejala").doc(id);
        await docRef.delete();

        return NextResponse.json({ message: "Gejala berhasil dihapus." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat menghapus gejala:", caughtError);
        let errorMessage = "Terjadi kesalahan server saat menghapus gejala.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}