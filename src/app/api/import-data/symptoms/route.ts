// app/api/import-data/symptoms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin";

// --- Interfaces (ensure these are consistent with your /types.ts) ---
interface Gejala {
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

// Define the expected structure for incoming Gejala data from JSON import
interface ImportGejalaItem {
    id?: string; // Optional ID for existing documents
    kode: string;
    nama: string;
    deskripsi?: string;
    kategori?: string;
    perangkat?: string[];
    mass_function?: Record<string, number>;
    gambar?: string;
}

// Interface for the incoming request body
interface ImportGejalaRequestBody {
    data: ImportGejalaItem[];
    replaceExisting: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json().catch(() => null);

        if (!body) {
            return NextResponse.json({ error: "Permintaan tidak valid: body tidak berisi JSON yang benar." }, { status: 400 });
        }

        const { data, replaceExisting }: ImportGejalaRequestBody = await request.json();
        const now = new Date().toISOString();
        const collectionRef = adminDb.collection("gejala");

        if (!data || !Array.isArray(data)) {
            return NextResponse.json({ error: "Permintaan tidak valid: data (array Gejala) wajib diisi." }, { status: 400 });
        }

        let importedCount = 0;
        let replacedCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];
        const warnings: string[] = [];
        const batch = adminDb.batch();

        // Fetch all existing 'kode' to check for uniqueness efficiently
        const existingDocsByKode: Map<string, string> = new Map(); // Map<kode, id>
        const existingGejalaSnapshot = await collectionRef.get();
        existingGejalaSnapshot.docs.forEach(doc => {
            const docData = doc.data() as Gejala;
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
            const docRef = hasProvidedId ? collectionRef.doc(item.id as string) : collectionRef.doc(); // Use provided ID or generate new

            const existingIdForKode = existingDocsByKode.get(cleanKode);

            let actionTaken = false;

            // Case 1: Item has a provided ID
            if (hasProvidedId) {
                const existingDocSnapshot = await docRef.get(); // Check if document with THIS ID exists

                if (existingDocSnapshot.exists) {
                    // Document with this ID exists
                    if (existingIdForKode && existingIdForKode !== existingDocSnapshot.id) {
                        // This means the provided ID points to one doc, but the code points to a DIFFERENT doc.
                        // This is an ambiguous state, so we warn and skip to prevent data corruption.
                        warnings.push(`Peringatan: Kode '${cleanKode}' sudah ada pada ID '${existingIdForKode}', tetapi item impor ini memiliki ID '${item.id}' yang berbeda. Item ini dilewati untuk menghindari konflik.`);
                        skippedCount++;
                        actionTaken = true;
                    } else if (replaceExisting) {
                        // Update existing document with provided ID, ensuring unique 'kode' is handled
                        const dataToUpdate: Partial<Gejala> = {
                            ...item,
                            updatedAt: now,
                            // Ensure mass_function logic
                            mass_function: item.mass_function ? item.mass_function : { uncertainty: 0.1 },
                            // Add or update createdAt if it's missing in the existing doc, but don't overwrite if present
                            createdAt: existingDocSnapshot.data()?.createdAt || now,
                        };
                        // Apply specific mass_function cleaning for gejala
                        if (dataToUpdate.mass_function) {
                            const massFunction = Object.fromEntries(
                                Object.entries(dataToUpdate.mass_function).filter(
                                    ([, value]) => typeof value === 'number' && value >= 0
                                ) // Allow 0 values, just filter out non-numbers
                            );
                            const currentTotal = Object.values(massFunction).reduce((sum, val) => sum + val, 0);
                            massFunction["uncertainty"] = parseFloat(Math.max(0, 1 - currentTotal).toFixed(3)); // Ensure uncertainty is not negative and fixed to 3 decimal places
                            dataToUpdate.mass_function = massFunction;
                        }

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
                        const dataToCreate: Gejala = {
                            id: docRef.id,
                            kode: cleanKode,
                            nama: item.nama,
                            deskripsi: item.deskripsi || "",
                            kategori: item.kategori || "System", // Default category
                            perangkat: item.perangkat || [],
                            mass_function: item.mass_function || { uncertainty: 0.1 },
                            gambar: item.gambar || "",
                            createdAt: now,
                            updatedAt: now,
                        };
                        // Apply mass_function cleaning
                        if (dataToCreate.mass_function) {
                            const massFunction = Object.fromEntries(
                                Object.entries(dataToCreate.mass_function).filter(
                                    ([, value]) => typeof value === 'number' && value >= 0
                                )
                            );
                            const currentTotal = Object.values(massFunction).reduce((sum, val) => sum + val, 0);
                            massFunction["uncertainty"] = parseFloat(Math.max(0, 1 - currentTotal).toFixed(3));
                            dataToCreate.mass_function = massFunction;
                        }

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
                        const existingDocSnapshot = await existingDocRef.get(); // Get the doc by its actual ID

                        const dataToUpdate: Partial<Gejala> = {
                            ...item,
                            updatedAt: now,
                            // Ensure mass_function logic
                            mass_function: item.mass_function ? item.mass_function : { uncertainty: 0.1 },
                            createdAt: existingDocSnapshot.data()?.createdAt || now,
                        };
                        // Apply specific mass_function cleaning for gejala
                        if (dataToUpdate.mass_function) {
                            const massFunction = Object.fromEntries(
                                Object.entries(dataToUpdate.mass_function).filter(
                                    ([, value]) => typeof value === 'number' && value >= 0
                                )
                            );
                            const currentTotal = Object.values(massFunction).reduce((sum, val) => sum + val, 0);
                            massFunction["uncertainty"] = parseFloat(Math.max(0, 1 - currentTotal).toFixed(3));
                            dataToUpdate.mass_function = massFunction;
                        }

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
                    const dataToCreate: Gejala = {
                        id: docRef.id, // Assign the newly generated ID
                        kode: cleanKode,
                        nama: item.nama,
                        deskripsi: item.deskripsi || "",
                        kategori: item.kategori || "System", // Default category
                        perangkat: item.perangkat || [],
                        mass_function: item.mass_function || { uncertainty: 0.1 },
                        gambar: item.gambar || "",
                        createdAt: now,
                        updatedAt: now,
                    };
                    // Apply mass_function cleaning
                    if (dataToCreate.mass_function) {
                        const massFunction = Object.fromEntries(
                            Object.entries(dataToCreate.mass_function).filter(
                                ([, value]) => typeof value === 'number' && value >= 0
                            )
                        );
                        const currentTotal = Object.values(massFunction).reduce((sum, val) => sum + val, 0);
                        massFunction["uncertainty"] = parseFloat(Math.max(0, 1 - currentTotal).toFixed(3));
                        dataToCreate.mass_function = massFunction;
                    }

                    batch.set(docRef, dataToCreate);
                    importedCount++;
                    actionTaken = true;
                }
            }
        }

        await batch.commit();

        let message = `Import data gejala selesai.`;
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
        console.error("Terjadi kesalahan saat proses import data gejala:", caughtError);
        let errorMessage = "Terjadi kesalahan server saat mengimpor data gejala.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}