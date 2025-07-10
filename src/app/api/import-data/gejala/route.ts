// app/api/import-data/route.ts
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

// You'll define your Kerusakan interface here or import it from types.ts
interface Kerusakan {
    id: string;
    kode: string;
    nama: string;
    deskripsi: string;
    // Add other fields specific to Kerusakan
    createdAt?: string;
    updatedAt?: string;
}

// Define a union type for importable data
type ImportableData = Gejala | Kerusakan;

// Interface for the incoming request body
interface ImportRequestBody {
    dataType: "gejala" | "kerusakan"; // Add other types as needed
    data: ImportableData[];
    replaceExisting: boolean;
}

export async function POST(request: NextRequest) {
    try {
        const { dataType, data, replaceExisting }: ImportRequestBody = await request.json();
        const now = new Date().toISOString();

        if (!dataType || !data || !Array.isArray(data)) {
            return NextResponse.json({ error: "Permintaan tidak valid: dataType dan data (array) wajib diisi." }, { status: 400 });
        }

        let collectionRef;
        switch (dataType) {
            case "gejala":
                collectionRef = adminDb.collection("gejala");
                break;
            case "kerusakan":
                collectionRef = adminDb.collection("kerusakan");
                // Add validation specific to Kerusakan here if necessary
                break;
            default:
                return NextResponse.json({ error: "Tipe data tidak didukung." }, { status: 400 });
        }

        let importedCount = 0;
        let replacedCount = 0;
        let skippedCount = 0;
        const errors: string[] = [];
        const batch = adminDb.batch(); // Use Firestore batch for efficient writes

        for (const item of data) {
            if (!item.id || !item.kode) { // Ensure 'id' and 'kode' are present for basic validity
                errors.push(`Data dilewati karena ID atau Kode tidak valid: ${JSON.stringify(item)}`);
                skippedCount++;
                continue;
            }

            const docRef = collectionRef.doc(item.id);

            // Fetch existing document to check for existence
            const existingDoc = await docRef.get();

            if (existingDoc.exists) {
                if (replaceExisting) {
                    // Replace existing document
                    const dataToUpdate = { ...item, updatedAt: now };
                    // For mass_function, ensure proper handling during update
                    if (dataType === "gejala" && (item as Gejala).mass_function) {
                        const gejalaItem = item as Gejala;
                        const massFunction = Object.fromEntries(
                            Object.entries(gejalaItem.mass_function || {}).filter(
                                ([, value]) => typeof value === 'number' && value > 0
                            )
                        );
                        const currentTotal = Object.values(massFunction).reduce((sum, val) => sum + val, 0);
                        massFunction["uncertainty"] = Math.max(0.05, 1 - currentTotal);
                        (dataToUpdate as Gejala).mass_function = massFunction;
                    }
                    batch.set(docRef, dataToUpdate, { merge: true }); // Use merge: true to avoid overwriting all fields if some are missing in import
                    replacedCount++;
                } else {
                    // Skip if not replacing and ID exists
                    errors.push(`Data dilewati (ID sudah ada dan tidak ada opsi untuk diganti): ${item.id}`);
                    skippedCount++;
                }
            } else {
                // Add new document
                const dataToCreate = { ...item, createdAt: now, updatedAt: now };
                // For mass_function, ensure proper handling during creation
                if (dataType === "gejala" && (item as Gejala).mass_function) {
                    const gejalaItem = item as Gejala;
                    const massFunction = Object.fromEntries(
                        Object.entries(gejalaItem.mass_function || {}).filter(
                            ([, value]) => typeof value === 'number' && value > 0
                        )
                    );
                    const currentTotal = Object.values(massFunction).reduce((sum, val) => sum + val, 0);
                    massFunction["uncertainty"] = Math.max(0.05, 1 - currentTotal);
                    (dataToCreate as Gejala).mass_function = massFunction;
                } else if (dataType === "gejala" && !(item as Gejala).mass_function) {
                    // Ensure mass_function exists with uncertainty for new gejala if not provided
                    (dataToCreate as Gejala).mass_function = { uncertainty: 0.1 };
                }

                batch.set(docRef, dataToCreate); // Set explicitly with provided ID
                importedCount++;
            }
        }

        await batch.commit();

        let message = `Import data ${dataType} selesai.`;
        if (importedCount > 0) message += ` ${importedCount} data baru ditambahkan.`;
        if (replacedCount > 0) message += ` ${replacedCount} data diganti.`;
        if (skippedCount > 0) message += ` ${skippedCount} data dilewati.`;
        if (errors.length > 0) message += ` Beberapa error terjadi.`;

        return NextResponse.json({
            message,
            importedCount,
            replacedCount,
            skippedCount,
            errors,
        }, { status: errors.length > 0 ? 202 : 200 }); // 202 Accepted if some errors, 200 OK otherwise

    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat proses import data:", caughtError);
        let errorMessage = "Terjadi kesalahan server saat mengimpor data.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}