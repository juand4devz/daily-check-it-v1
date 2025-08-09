// // /types/diagnose.ts

// /**
//  * Merepresentasikan 'Mass Function' dalam teori Dempster-Shafer.
//  * Kunci adalah kode hipotesis (misal: kode kerusakan), dan nilai adalah tingkat kepercayaan.
//  */
// export interface MassFunction {
//     [hypothesis: string]: number;
// }

// /**
//  * Struktur data untuk satu dokumen dari koleksi 'gejala' di Firestore.
//  */
// export interface Gejala {
//     kode: string;
//     nama: string;
//     deskripsi: string;
//     kategori: string;
//     perangkat: string[];
//     mass_function: MassFunction;
//     gambar: string;
// }

// /**
//  * Struktur data untuk satu dokumen dari koleksi 'kerusakan' di Firestore.
//  */
// export interface Kerusakan {
//     kode: string;
//     nama: string;
//     deskripsi: string;
//     tingkat_kerusakan: string;
//     estimasi_biaya: string;
//     waktu_perbaikan: string;
//     prior_probability: number;
//     solusi: string;
//     gejala_terkait: string[];
// }

// /**
//  * Struktur data untuk hasil akhir diagnosa yang akan dikirim ke halaman hasil.
//  */
// export interface DiagnosisResult {
//     kode: string;
//     nama: string;
//     belief: number;
//     plausibility: number;
//     uncertainty: number;
//     solusi: string;
//     tingkat_kerusakan?: string;
//     estimasi_biaya?: string;
//     waktu_perbaikan?: string;
//     confidence_level: string;
//     contributing_symptoms: string[];
//     mass_assignments: { [key: string]: number };
// }

// /types/diagnose.ts

// --- DEDUKSI DARI LOGIKA ANDA ---
// MassFunction adalah objek dengan kunci string (hipotesis, e.g., kode kerusakan)
// dan nilai number (nilai mass-nya)
export interface MassFunction {
    [hypothesis: string]: number;
}

// Ini adalah tipe untuk data yang disimpan di Firestore
export interface Gejala {
    id?: string;
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

export interface Kerusakan {
    id?: string;
    kode: string;
    nama: string;
    deskripsi: string;
    tingkat_kerusakan: string;
    estimasi_biaya: string;
    waktu_perbaikan: string;
    prior_probability: number;
    solusi: string;
    gejala_terkait: string[];
    createdAt?: string;
    updatedAt?: string;
}

// Tipe untuk entri mass function yang digunakan di form
export interface MassFunctionEntry {
    kerusakan: string;
    value: number;
}

// Tipe untuk opsi combobox kerusakan
export interface KerusakanOption {
    value: string;
    label: string;
}

// Tipe untuk data yang digabungkan untuk halaman MassScope
export interface CombinedMassFunctionData {
    gejalaId?: string;
    gejalaKode: string;
    gejalaNama: string;
    kategori: string;
    kerusakanKode: string;
    kerusakanNama: string;
    value: number;
    uncertainty: number;
}

// Ini adalah tipe untuk hasil diagnosa setelah perhitungan di API
export interface DiagnosisResult {
    kode: string;
    nama: string;
    // Tambahkan deskripsi ke tipe ini
    deskripsi?: string;
    belief: number;
    plausibility: number;
    uncertainty: number;
    solusi: string;
    tingkat_kerusakan?: string;
    estimasi_biaya?: string;
    waktu_perbaikan?: string;
    confidence_level: string;
    contributing_symptoms: string[];
    mass_assignments: { [key: string]: number };
}

// Tipe respons yang konsisten untuk API
export interface ApiResponse<T> {
    status: boolean;
    statusCode: number;
    message: string;
    data?: T;
    error?: string;
    // Tambahan untuk menangani respons dari API Import
    errors?: string[];
    warnings?: string[];
    importedCount?: number;
    replacedCount?: number;
    skippedCount?: number;
}

// Tipe untuk data yang disimpan di sessionStorage
export interface StoredDiagnosisResult {
    input: string[];
    selectedGejalaDetails: Gejala[];
    device_type?: string;
    result: DiagnosisResult[];
    analysis: {
        accuracy_percentage: number;
        dominant_category: string;
        severity_level: string;
        total_symptoms: number;
        confidence_level: string;
        total_possible_damages: number;
        algorithm_used: string;
        evidence_combination: string;
        uncertainty_level: number;
    };
    timestamp: string;
    message: string;
    loading_duration: number;
}

export interface MediaFileTemp {
    id: string; // Temporary ID for internal tracking
    file?: File; // Original file object
    preview: string; // Blob URL for client-side preview
    type: "image" | "video";
    uploading: boolean; // Indicates if this specific file is uploading
    progress: number; // Upload progress for this file
    uploadedUrl: string | undefined; // Final ImageKit URL after upload
    filename?: string;
}

export type ImportItem<T> = Partial<Omit<T, 'id'>> & { id?: string };

// Tipe respons yang konsisten untuk API import
export interface ImportApiResponse {
    message: string;
    importedCount: number;
    replacedCount: number;
    skippedCount: number;
    errors: string[];
    warnings: string[];
}

// Tipe untuk body request import
export interface ImportRequestBody<T> {
    data: ImportItem<T>[];
    replaceExisting: boolean;
}
