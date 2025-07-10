import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin";

// --- Interfaces (Pastikan ini konsisten di seluruh proyek) ---
// Add 'id' to the Gejala interface as it will be part of the data fetched from Firestore
export interface Gejala {
    id: string; // Firestore document ID
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

// --- GET Request Handler (untuk mengambil semua gejala) ---
export async function GET() {
    try {
        const snapshot = await adminDb.collection("gejala").get();
        const gejalaList: Gejala[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id, // Crucially, include the Firestore document ID
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
        });

        return NextResponse.json(gejalaList);
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat mengambil daftar gejala:", caughtError);
        let errorMessage = "Gagal mengambil daftar gejala dari database.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// --- POST Request Handler (untuk menambah gejala baru) ---
export async function POST(request: NextRequest) {
    try {
        const newGejala: Omit<Gejala, 'id' | 'createdAt' | 'updatedAt'> & {
            createdAt?: string;
            updatedAt?: string;
        } = await request.json(); // Don't expect 'id' from client for new creation
        const now = new Date().toISOString();

        // Validasi basic
        if (!newGejala.kode || !newGejala.nama) {
            return NextResponse.json(
                { error: "Kode dan Nama gejala wajib diisi." },
                { status: 400 }
            );
        }

        // Cek apakah kode gejala sudah ada
        const existingGejala = await adminDb
            .collection("gejala")
            .where("kode", "==", newGejala.kode)
            .limit(1)
            .get();

        if (!existingGejala.empty) {
            return NextResponse.json(
                { error: `Gejala dengan kode '${newGejala.kode}' sudah ada.` },
                { status: 409 } // Conflict
            );
        }

        // Siapkan data dengan timestamp dan bersihkan mass_function
        const gejalaToSave = {
            ...newGejala,
            createdAt: now,
            updatedAt: now,
            mass_function: Object.fromEntries(
                Object.entries(newGejala.mass_function || {}).filter(
                    ([, value]) => typeof value === 'number' && value > 0
                )
            ) || { uncertainty: 0.05 },
        };

        // Tambahkan uncertainty jika belum ada atau total kurang dari 1 (setelah filter)
        const currentTotal = Object.values(gejalaToSave.mass_function).reduce((sum, val) => sum + val, 0);
        if (!gejalaToSave.mass_function.hasOwnProperty("uncertainty")) {
            gejalaToSave.mass_function["uncertainty"] = Math.max(0.05, 1 - currentTotal);
        } else {
            gejalaToSave.mass_function["uncertainty"] = Math.max(0.05, gejalaToSave.mass_function["uncertainty"]);
        }

        // Tambahkan gejala baru ke Firestore. Firestore akan meng-generate ID dokumen.
        const docRef = await adminDb.collection("gejala").add(gejalaToSave);

        // Include the generated ID in the response
        const savedGejala: Gejala = {
            id: docRef.id,
            ...gejalaToSave as Omit<Gejala, 'id'> // Cast to remove 'id' from GejalaToSave for type compatibility
        };

        return NextResponse.json(
            { message: "Gejala berhasil ditambahkan.", data: savedGejala },
            { status: 201 }
        );
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat menambah gejala:", caughtError);
        let errorMessage = "Terjadi kesalahan server saat menambah gejala.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}