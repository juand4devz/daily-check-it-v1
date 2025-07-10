// types/definitions.ts

/**
 * Merepresentasikan 'Mass Function' dalam teori Dempster-Shafer.
 * Kunci adalah kode hipotesis (misal: kode kerusakan), dan nilai adalah tingkat kepercayaan.
 */
export interface MassFunction {
    [hypothesis: string]: number;
}

/**
 * Struktur data untuk satu dokumen dari koleksi 'gejala' di Firestore.
 */
export interface Gejala {
    kode: string;
    nama: string;
    deskripsi: string;
    kategori: string;
    perangkat: string[];
    mass_function: MassFunction;
    gambar: string;
}

/**
 * Struktur data untuk satu dokumen dari koleksi 'kerusakan' di Firestore.
 */
export interface Kerusakan {
    kode: string;
    nama: string;
    deskripsi: string;
    tingkat_kerusakan: string;
    estimasi_biaya: string;
    waktu_perbaikan: string;
    prior_probability: number;
    solusi: string;
    gejala_terkait: string[];
}

/**
 * Struktur data untuk hasil akhir diagnosa yang akan dikirim ke halaman hasil.
 */
export interface DiagnosisResult {
    kode: string;
    nama: string;
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