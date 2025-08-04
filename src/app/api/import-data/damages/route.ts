// app/api/import-data/kerusakan/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin";

// --- Interfaces (ensure these are consistent with your /types.ts) ---
interface Kerusakan {
    id: string;
    kode: string;
    nama: string;
    deskripsi: string;
    tingkat_kerusakan: "Ringan" | "Sedang" | "Berat";
    estimasi_biaya: string;
    waktu_perbaikan: string;
    prior_probability: number;
    solusi: string;
    gejala_terkait: string[];
    createdAt?: string;
    updatedAt?: string;
}

// Define the expected structure for incoming Kerusakan data from JSON import
interface ImportKerusakanItem {
    id?: string; // Optional ID for existing documents
    kode: string;
    nama: string;
    deskripsi?: string;
    tingkat_kerusakan?: "Ringan" | "Sedang" | "Berat";
    estimasi_biaya?: string;
    waktu_perbaikan?: string;
    prior_probability?: number;
    solusi?: string;
    gejala_terkait?: string[];
}

// Interface for the incoming request body
interface ImportKerusakanRequestBody {
    data: ImportKerusakanItem[];
    replaceExisting: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const { data, replaceExisting }: ImportKerusakanRequestBody = await request.json();
        const now = new Date().toISOString();
        const collectionRef = adminDb.collection("kerusakan");

        if (!data || !Array.isArray(data)) {
            return NextResponse.json({ error: "Permintaan tidak valid: data (array Kerusakan) wajib diisi." }, { status: 400 });
        }

        let importedCount = 0;
        let replacedCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];
        const warnings: string[] = [];
        const batch = adminDb.batch();

        // Fetch all existing 'kode' to check for uniqueness efficiently
        const existingDocsByKode: Map<string, string> = new Map(); // Map<kode, id>
        const existingKerusakanSnapshot = await collectionRef.get();
        existingKerusakanSnapshot.docs.forEach(doc => {
            const docData = doc.data() as Kerusakan;
            if (docData.kode) {
                existingDocsByKode.set(docData.kode, doc.id);
            }
        });

        for (const item of data) {
            // Basic validation for common required fields
            if (typeof item.kode !== 'string' || !item.kode.trim()) {
                errors.push(`Data dilewati karena 'kode' tidak valid atau kosong: ${JSON.stringify(item)}`);
                skippedCount++;
                continue;
            }
            if (typeof item.nama !== 'string' || !item.nama.trim()) {
                errors.push(`Data dilewati karena 'nama' tidak valid atau kosong untuk kode ${item.kode}.`);
                skippedCount++;
                continue;
            }

            const cleanKode = item.kode.trim();
            const hasProvidedId = typeof item.id === 'string' && item.id.trim() !== '';
            const docRef = hasProvidedId ? collectionRef.doc(item.id as string) : collectionRef.doc();

            const existingIdForKode = existingDocsByKode.get(cleanKode);

            let actionTaken = false;

            // Case 1: Item has a provided ID
            if (hasProvidedId) {
                const existingDocSnapshot = await docRef.get(); // Check if document with THIS ID exists

                if (existingDocSnapshot.exists) {
                    // Document with this ID exists
                    if (existingIdForKode && existingIdForKode !== existingDocSnapshot.id) {
                        // This means the provided ID points to one doc, but the code points to a DIFFERENT doc.
                        warnings.push(`Peringatan: Kode '${cleanKode}' sudah ada pada ID '${existingIdForKode}', tetapi item impor ini memiliki ID '${item.id}' yang berbeda. Item ini dilewati untuk menghindari konflik.`);
                        skippedCount++;
                        actionTaken = true;
                    } else if (replaceExisting) {
                        // Update existing document with provided ID, ensuring unique 'kode' is handled
                        const dataToUpdate: Partial<Kerusakan> = {
                            ...item,
                            updatedAt: now,
                            tingkat_kerusakan: item.tingkat_kerusakan || "Ringan",
                            prior_probability: item.prior_probability !== undefined ? item.prior_probability : 0.1,
                            createdAt: existingDocSnapshot.data()?.createdAt || now,
                        };

                        batch.set(docRef, dataToUpdate, { merge: true });
                        replacedCount++;
                        actionTaken = true;
                    } else {
                        warnings.push(`Data dilewati (ID '${item.id}' sudah ada dan tidak ada opsi untuk diganti).`);
                        skippedCount++;
                        actionTaken = true;
                    }
                } else {
                    // Document with this provided ID does NOT exist, check if code exists elsewhere
                    if (existingIdForKode) {
                        warnings.push(`Peringatan: Kode '${cleanKode}' sudah ada pada ID '${existingIdForKode}', tetapi item impor ini memiliki ID baru '${item.id}'. Item ini dilewati untuk menghindari duplikasi kode.`);
                        skippedCount++;
                        actionTaken = true;
                    } else {
                        // No doc with this ID, and no other doc with this code, so create new with provided ID
                        const dataToCreate: Kerusakan = {
                            id: docRef.id, // Assign the newly generated ID
                            kode: cleanKode,
                            nama: item.nama,
                            deskripsi: item.deskripsi || "",
                            tingkat_kerusakan: item.tingkat_kerusakan || "Ringan",
                            estimasi_biaya: item.estimasi_biaya || "",
                            waktu_perbaikan: item.waktu_perbaikan || "",
                            prior_probability: item.prior_probability !== undefined ? item.prior_probability : 0.1,
                            solusi: item.solusi || "",
                            gejala_terkait: item.gejala_terkait || [],
                            createdAt: now,
                            updatedAt: now,
                        };
                        batch.set(docRef, dataToCreate);
                        importedCount++;
                        actionTaken = true;
                    }
                }
            }
            // Case 2: Item does NOT have a provided ID (or provided ID was empty/invalid)
            else {
                // Check if code already exists
                if (existingIdForKode) {
                    if (replaceExisting) {
                        // Kode exists, replace the document associated with that code
                        const existingDocRef = collectionRef.doc(existingIdForKode);
                        const existingDocSnapshot = await existingDocRef.get();

                        const dataToUpdate: Partial<Kerusakan> = {
                            ...item,
                            updatedAt: now,
                            tingkat_kerusakan: item.tingkat_kerusakan || "Ringan",
                            prior_probability: item.prior_probability !== undefined ? item.prior_probability : 0.1,
                            createdAt: existingDocSnapshot.data()?.createdAt || now,
                        };

                        batch.set(existingDocRef, dataToUpdate, { merge: true });
                        replacedCount++;
                        actionTaken = true;
                    } else {
                        warnings.push(`Data dilewati (Kode '${cleanKode}' sudah ada dan tidak ada opsi untuk diganti).`);
                        skippedCount++;
                        actionTaken = true;
                    }
                } else {
                    // Kode does not exist, create a new document with auto-generated ID
                    const dataToCreate: Kerusakan = {
                        id: docRef.id, // Assign the newly generated ID
                        kode: cleanKode,
                        nama: item.nama,
                        deskripsi: item.deskripsi || "",
                        tingkat_kerusakan: item.tingkat_kerusakan || "Ringan",
                        estimasi_biaya: item.estimasi_biaya || "",
                        waktu_perbaikan: item.waktu_perbaikan || "",
                        prior_probability: item.prior_probability !== undefined ? item.prior_probability : 0.1,
                        solusi: item.solusi || "",
                        gejala_terkait: item.gejala_terkait || [],
                        createdAt: now,
                        updatedAt: now,
                    };
                    batch.set(docRef, dataToCreate);
                    importedCount++;
                    actionTaken = true;
                }
            }
        }

        await batch.commit();

        let message = `Import data kerusakan selesai.`;
        if (importedCount > 0) message += ` ${importedCount} data baru ditambahkan.`;
        if (replacedCount > 0) message += ` ${replacedCount} data diganti.`;
        if (skippedCount > 0) message += ` ${skippedCount} data dilewati.`;
        if (errors.length > 0 || warnings.length > 0) message += ` Beberapa masalah terjadi.`;


        return NextResponse.json({
            message,
            importedCount,
            replacedCount,
            skippedCount,
            errors,
            warnings
        }, { status: (errors.length > 0 || warnings.length > 0) ? 202 : 200 });

    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat proses import data kerusakan:", caughtError);
        let errorMessage = "Terjadi kesalahan server saat mengimpor data kerusakan.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}