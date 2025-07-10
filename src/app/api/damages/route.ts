// app/api/kerusakan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin";
import type { Kerusakan } from "@/types"; // Import your Kerusakan interface

// --- GET Request Handler (for fetching all damages) ---
export async function GET() {
    try {
        const snapshot = await adminDb.collection("kerusakan").get();
        const kerusakanList: Kerusakan[] = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id, // Crucially, include the Firestore document ID
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
        });

        return NextResponse.json(kerusakanList);
    } catch (caughtError: unknown) {
        console.error("Error fetching kerusakan list:", caughtError);
        let errorMessage = "Failed to fetch kerusakan list from database.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// --- POST Request Handler (for adding new damages) ---
export async function POST(request: NextRequest) {
    try {
        const newKerusakan: Omit<Kerusakan, 'id' | 'createdAt' | 'updatedAt'> & {
            createdAt?: string;
            updatedAt?: string;
        } = await request.json();
        const now = new Date().toISOString();

        // Basic validation
        if (!newKerusakan.kode || !newKerusakan.nama || !newKerusakan.deskripsi) {
            return NextResponse.json(
                { error: "Kode, nama, dan deskripsi kerusakan wajib diisi." },
                { status: 400 }
            );
        }

        // Validate prior_probability range
        if (typeof newKerusakan.prior_probability !== 'number' || newKerusakan.prior_probability <= 0 || newKerusakan.prior_probability > 0.5) {
            return NextResponse.json(
                { error: "Prior probability harus antara 0.01 dan 0.50." },
                { status: 400 }
            );
        }

        // Check if kode already exists (for preventing duplicate manual entries)
        const existingByKode = await adminDb
            .collection("kerusakan")
            .where("kode", "==", newKerusakan.kode)
            .limit(1)
            .get();

        if (!existingByKode.empty) {
            return NextResponse.json(
                { error: `Kerusakan dengan kode '${newKerusakan.kode}' sudah ada.` },
                { status: 409 } // Conflict
            );
        }

        const kerusakanToSave = {
            ...newKerusakan,
            createdAt: now,
            updatedAt: now,
            // Ensure proper default for tingkat_kerusakan if not provided
            tingkat_kerusakan: newKerusakan.tingkat_kerusakan || "Ringan",
            // Ensure prior_probability is a number
            prior_probability: Number(newKerusakan.prior_probability)
        };

        const docRef = await adminDb.collection("kerusakan").add(kerusakanToSave);

        const savedKerusakan: Kerusakan = {
            id: docRef.id,
            ...kerusakanToSave as Omit<Kerusakan, 'id'>
        };

        return NextResponse.json(
            { message: "Kerusakan berhasil ditambahkan.", data: savedKerusakan },
            { status: 201 }
        );
    } catch (caughtError: unknown) {
        console.error("Error adding kerusakan:", caughtError);
        let errorMessage = "Server error when adding kerusakan.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}