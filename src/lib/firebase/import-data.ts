// src/services/importer.ts
// Ini adalah file layanan yang berisi logika import khusus untuk koleksi tertentu.

import { clientDb } from "@/lib/firebase/firebase-client";
import {
    CollectionReference,
    doc,
    getDocs,
    writeBatch,
    getDoc,
    collection
} from "firebase/firestore";
import { ImportItem, Gejala, Kerusakan, ImportApiResponse } from "@/types/diagnose";
// import ImportApiResponse

/**
 * Fungsi internal untuk mendapatkan semua kode yang ada di koleksi.
 * Ini membantu efisiensi dengan menghindari query berulang di dalam loop.
 * @param collectionName Nama koleksi.
 * @returns Map dari kode ke ID dokumen.
 */
async function getExistingKodes<T>(collectionName: string): Promise<Map<string, string>> {
    const existingDocsByKode: Map<string, string> = new Map();
    const collectionRef = collection(clientDb, collectionName);
    const existingSnapshot = await getDocs(collectionRef);
    existingSnapshot.docs.forEach((d) => {
        const docData = d.data();
        if (docData && "kode" in docData) {
            existingDocsByKode.set(docData.kode as string, d.id);
        }
    });
    return existingDocsByKode;
}

/**
 * Mengimpor data gejala ke Firestore menggunakan batch.
 * @param data Array data gejala yang akan diimpor.
 * @param replaceExisting Opsi untuk mengganti dokumen yang sudah ada.
 * @returns Objek hasil yang merangkum operasi import.
 */
export async function importGejalaData(
    data: ImportItem<Gejala>[],
    replaceExisting: boolean
): Promise<ImportApiResponse> {
    const now = new Date().toISOString();
    const collectionRef = collection(clientDb, "gejala") as CollectionReference<Gejala>;

    if (!data || !Array.isArray(data)) {
        throw new Error("Permintaan tidak valid: data (array Gejala) wajib diisi.");
    }

    let importedCount = 0;
    let replacedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];
    const batch = writeBatch(clientDb);

    const existingDocsByKode = await getExistingKodes<Gejala>("gejala");

    for (const item of data) {
        if (typeof item.kode !== "string" || !item.kode.trim()) {
            errors.push(`Data dilewati karena 'kode' tidak valid atau kosong: ${JSON.stringify(item)}`);
            skippedCount++;
            continue;
        }
        if (typeof item.nama !== "string" || !item.nama.trim()) {
            errors.push(`Data dilewati karena 'nama' tidak valid atau kosong untuk kode ${item.kode}.`);
            skippedCount++;
            continue;
        }

        const cleanKode = item.kode.trim();
        const existingIdForKode = existingDocsByKode.get(cleanKode);
        const hasProvidedId = typeof item.id === "string" && item.id.trim() !== "";

        let docRef: ReturnType<typeof doc>;
        let docIdToUse: string;

        if (existingIdForKode) {
            // Kode sudah ada
            if (hasProvidedId && existingIdForKode !== item.id) {
                warnings.push(
                    `Peringatan: Kode '${cleanKode}' sudah ada pada ID '${existingIdForKode}', tetapi item impor ini memiliki ID '${item.id}' yang berbeda. Item ini dilewati.`
                );
                skippedCount++;
                continue;
            } else if (replaceExisting) {
                docRef = doc(collectionRef, existingIdForKode);
                docIdToUse = existingIdForKode;
                const existingDocSnapshot = await getDoc(docRef);
                const dataToUpdate = {
                    id: docIdToUse,
                    kode: cleanKode,
                    nama: item.nama,
                    deskripsi: item.deskripsi || "",
                    kategori: item.kategori || "System",
                    perangkat: item.perangkat || [],
                    mass_function: item.mass_function || { uncertainty: 0.1 },
                    gambar: item.gambar || "",
                    createdAt: existingDocSnapshot.data()?.createdAt || now,
                    updatedAt: now,
                };
                batch.set(docRef, dataToUpdate, { merge: true });
                replacedCount++;
            } else {
                warnings.push(`Data dilewati (Kode '${cleanKode}' sudah ada dan tidak ada opsi untuk diganti).`);
                skippedCount++;
                continue;
            }
        } else {
            // Kode belum ada, buat dokumen baru
            docRef = hasProvidedId ? doc(collectionRef, item.id) : doc(collectionRef);
            docIdToUse = docRef.id;
            const dataToCreate = {
                id: docIdToUse,
                kode: cleanKode,
                nama: item.nama,
                deskripsi: item.deskripsi || "",
                kategori: item.kategori || "System",
                perangkat: item.perangkat || [],
                mass_function: item.mass_function || { uncertainty: 0.1 },
                gambar: item.gambar || "",
                createdAt: now,
                updatedAt: now,
            };
            // Logika khusus untuk membersihkan mass_function
            if (dataToCreate.mass_function) {
                const massFunction = Object.fromEntries(
                    Object.entries(dataToCreate.mass_function).filter(
                        ([, value]) => typeof value === "number" && value >= 0
                    )
                );
                const currentTotal = Object.values(massFunction).reduce(
                    (sum, val) => sum + val,
                    0
                );
                massFunction["uncertainty"] = parseFloat(Math.max(0, 1 - currentTotal).toFixed(3));
                dataToCreate.mass_function = massFunction;
            }
            batch.set(docRef, dataToCreate);
            importedCount++;
        }
    }

    await batch.commit();

    let message = `Import data gejala selesai.`;
    if (importedCount > 0) message += ` ${importedCount} data baru ditambahkan.`;
    if (replacedCount > 0) message += ` ${replacedCount} data diganti.`;
    if (skippedCount > 0) message += ` ${skippedCount} data dilewati.`;
    if (errors.length > 0 || warnings.length > 0)
        message += ` Beberapa masalah terjadi.`;

    return { message, importedCount, replacedCount, skippedCount, errors, warnings };
}

/**
 * Mengimpor data kerusakan ke Firestore menggunakan batch.
 * @param data Array data kerusakan yang akan diimpor.
 * @param replaceExisting Opsi untuk mengganti dokumen yang sudah ada.
 * @returns Objek hasil yang merangkum operasi import.
 */
export async function importKerusakanData(
    data: ImportItem<Kerusakan>[],
    replaceExisting: boolean
): Promise<ImportApiResponse> {
    const now = new Date().toISOString();
    const collectionRef = collection(clientDb, "kerusakan") as CollectionReference<Kerusakan>;

    if (!data || !Array.isArray(data)) {
        throw new Error("Permintaan tidak valid: data (array Kerusakan) wajib diisi.");
    }

    let importedCount = 0;
    let replacedCount = 0;
    let skippedCount = 0;
    const errors: string[] = [];
    const warnings: string[] = [];
    const batch = writeBatch(clientDb);

    const existingDocsByKode = await getExistingKodes<Kerusakan>("kerusakan");

    for (const item of data) {
        if (typeof item.kode !== "string" || !item.kode.trim()) {
            errors.push(`Data dilewati karena 'kode' tidak valid atau kosong: ${JSON.stringify(item)}`);
            skippedCount++;
            continue;
        }
        if (typeof item.nama !== "string" || !item.nama.trim()) {
            errors.push(`Data dilewati karena 'nama' tidak valid atau kosong untuk kode ${item.kode}.`);
            skippedCount++;
            continue;
        }

        const cleanKode = item.kode.trim();
        const existingIdForKode = existingDocsByKode.get(cleanKode);
        const hasProvidedId = typeof item.id === "string" && item.id.trim() !== "";

        let docRef: ReturnType<typeof doc>;
        let docIdToUse: string;

        if (existingIdForKode) {
            if (hasProvidedId && existingIdForKode !== item.id) {
                warnings.push(`Peringatan: Kode '${cleanKode}' sudah ada pada ID '${existingIdForKode}', tetapi item impor ini memiliki ID '${item.id}' yang berbeda. Item ini dilewati.`);
                skippedCount++;
                continue;
            } else if (replaceExisting) {
                docRef = doc(collectionRef, existingIdForKode);
                docIdToUse = existingIdForKode;
                const existingDocSnapshot = await getDoc(docRef);
                const dataToUpdate = {
                    id: docIdToUse,
                    kode: cleanKode,
                    nama: item.nama,
                    deskripsi: item.deskripsi || "",
                    tingkat_kerusakan: item.tingkat_kerusakan || "Ringan",
                    estimasi_biaya: item.estimasi_biaya || "",
                    waktu_perbaikan: item.waktu_perbaikan || "",
                    prior_probability: item.prior_probability !== undefined ? item.prior_probability : 0.1,
                    solusi: item.solusi || "",
                    gejala_terkait: item.gejala_terkait || [],
                    createdAt: existingDocSnapshot.data()?.createdAt || now,
                    updatedAt: now,
                };
                batch.set(docRef, dataToUpdate, { merge: true });
                replacedCount++;
            } else {
                warnings.push(`Data dilewati (Kode '${cleanKode}' sudah ada dan tidak ada opsi untuk diganti).`);
                skippedCount++;
                continue;
            }
        } else {
            docRef = hasProvidedId ? doc(collectionRef, item.id) : doc(collectionRef);
            docIdToUse = docRef.id;
            const dataToCreate = {
                id: docIdToUse,
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
        }
    }

    await batch.commit();

    let message = `Import data kerusakan selesai.`;
    if (importedCount > 0) message += ` ${importedCount} data baru ditambahkan.`;
    if (replacedCount > 0) message += ` ${replacedCount} data diganti.`;
    if (skippedCount > 0) message += ` ${skippedCount} data dilewati.`;
    if (errors.length > 0 || warnings.length > 0)
        message += ` Beberapa masalah terjadi.`;

    return { message, importedCount, replacedCount, skippedCount, errors, warnings };
}
