// app/api/diagnose/route.ts
import { type NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin"; // Pastikan path ini benar

// --- Interfaces ---
interface MassFunction {
  [hypothesis: string]: number;
}

interface Gejala {
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

interface Kerusakan {
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

interface DiagnosisResult {
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

// --- Helper Functions ---
function normalizeMassFunction(massFunction: MassFunction): MassFunction {
  const normalized: MassFunction = {};
  let total = 0;

  for (const [key, value] of Object.entries(massFunction)) {
    if (key !== "uncertainty" && value > 0) {
      total += value;
    }
  }

  if (total > 1) {
    const scaleFactor = 0.9 / total;
    for (const [key, value] of Object.entries(massFunction)) {
      if (key !== "uncertainty" && value > 0) {
        normalized[key] = value * scaleFactor;
      }
    }
    normalized["uncertainty"] = 0.1;
  } else {
    for (const [key, value] of Object.entries(massFunction)) {
      if (key !== "uncertainty" && value > 0) {
        normalized[key] = value;
      }
    }
    normalized["uncertainty"] = Math.max(0.05, 1 - total);
  }

  const finalSum = Object.values(normalized).reduce((sum, val) => sum + val, 0);
  if (Math.abs(finalSum - 1) > 0.0001) {
    const difference = 1 - finalSum;
    normalized["uncertainty"] = (normalized["uncertainty"] || 0) + difference;
  }

  return normalized;
}

function combineEvidence(m1: MassFunction, m2: MassFunction): MassFunction {
  const combined: MassFunction = {};
  let conflict = 0;

  const norm_m1 = normalizeMassFunction(m1);
  const norm_m2 = normalizeMassFunction(m2);

  const allHypotheses = new Set([
    ...Object.keys(norm_m1).filter((k) => k !== "uncertainty"),
    ...Object.keys(norm_m2).filter((k) => k !== "uncertainty"),
  ]);

  allHypotheses.forEach((h) => (combined[h] = 0));
  combined["uncertainty"] = 0;

  for (const [h1, v1] of Object.entries(norm_m1)) {
    for (const [h2, v2] of Object.entries(norm_m2)) {
      const product = v1 * v2;

      if (h1 === h2) {
        combined[h1] = (combined[h1] || 0) + product;
      } else if (h1 === "uncertainty") {
        combined[h2] = (combined[h2] || 0) + product;
      } else if (h2 === "uncertainty") {
        combined[h1] = (combined[h1] || 0) + product;
      } else {
        conflict += product;
      }
    }
  }

  if (conflict >= 0.9) {
    const totalSupport = Object.values(combined).reduce((sum, val) => sum + val, 0);
    const scaleFactor = 0.3 / totalSupport;

    for (const key in combined) {
      if (key !== "uncertainty") {
        combined[key] *= scaleFactor;
      }
    }
    combined["uncertainty"] = 0.7;
  } else if (conflict > 0.001) {
    const normalizationFactor = 1 - conflict;
    for (const key in combined) {
      combined[key] = combined[key] / normalizationFactor;
    }
  }

  const finalTotal = Object.values(combined).reduce((sum, val) => sum + val, 0);
  if (Math.abs(finalTotal - 1) > 0.001) {
    const adjustment = 1 - finalTotal;
    combined["uncertainty"] = Math.max(0.01, (combined["uncertainty"] || 0) + adjustment);
  }

  return combined;
}

function calculateBeliefPlausibility(massFunction: MassFunction, hypothesis: string) {
  const belief = Math.min(1.0, Math.max(0.0, massFunction[hypothesis] || 0));
  const uncertainty = massFunction["uncertainty"] || 0;
  const plausibility = Math.min(1.0, belief + uncertainty);

  return { belief, plausibility };
}

function getConfidenceLevel(belief: number): string {
  if (belief >= 0.8) return "Sangat Tinggi";
  if (belief >= 0.6) return "Tinggi";
  if (belief >= 0.4) return "Sedang";
  if (belief >= 0.2) return "Rendah";
  return "Sangat Rendah";
}

async function getKerusakanList(): Promise<Kerusakan[]> {
  const snapshot = await adminDb.collection("kerusakan").get();
  const kerusakanList: Kerusakan[] = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      kode: data.kode as string,
      nama: data.nama as string,
      deskripsi: data.deskripsi as string,
      tingkat_kerusakan: data.tingkat_kerusakan as string,
      estimasi_biaya: data.estimasi_biaya as string,
      waktu_perbaikan: data.waktu_perbaikan as string,
      prior_probability: data.prior_probability as number,
      solusi: data.solusi as string,
      gejala_terkait: (data.gejala_terkait as string[]) || [],
      createdAt: (data.createdAt as string) || undefined,
      updatedAt: (data.updatedAt as string) || undefined,
    };
  });
  return kerusakanList;
}

function diagnoseWithDempsterShafer(
  selectedSymptomCodes: string[],
  deviceType: string | undefined,
  gejalaListClient: Gejala[],
  kerusakanList: Kerusakan[],
): DiagnosisResult[] {
  if (selectedSymptomCodes.length === 0) {
    return [];
  }

  const evidences: MassFunction[] = [];

  selectedSymptomCodes.forEach((symptomCode) => {
    const symptom = gejalaListClient.find((g) => g.kode === symptomCode);
    if (symptom && symptom.mass_function) {
      const normalizedMass = normalizeMassFunction(symptom.mass_function);
      evidences.push(normalizedMass);
    }
  });

  if (evidences.length === 0) {
    return [];
  }

  let combinedMass = evidences[0];
  for (let i = 1; i < evidences.length; i++) {
    combinedMass = combineEvidence(combinedMass, evidences[i]);
  }

  const results: DiagnosisResult[] = [];

  kerusakanList.forEach((kerusakan) => {
    const deviceMatch =
      !deviceType ||
      selectedSymptomCodes.some((symptomCode) => {
        const gejala = gejalaListClient.find((g) => g.kode === symptomCode);
        return gejala?.perangkat.includes(deviceType.toLowerCase());
      });

    if (!deviceMatch) return;

    const { belief, plausibility } = calculateBeliefPlausibility(combinedMass, kerusakan.kode);
    const uncertainty = Math.max(0, plausibility - belief);

    if (belief > 0.001) {
      const contributingSymptoms = selectedSymptomCodes.filter((symptomCode) => {
        const gejala = gejalaListClient.find((g) => g.kode === symptomCode);
        return gejala?.mass_function && gejala.mass_function[kerusakan.kode] > 0;
      });

      results.push({
        kode: kerusakan.kode,
        nama: kerusakan.nama,
        belief: Math.round(belief * 1000) / 1000,
        plausibility: Math.round(plausibility * 1000) / 1000,
        uncertainty: Math.round(uncertainty * 1000) / 1000,
        solusi: kerusakan.solusi,
        tingkat_kerusakan: kerusakan.tingkat_kerusakan,
        estimasi_biaya: kerusakan.estimasi_biaya,
        waktu_perbaikan: kerusakan.waktu_perbaikan,
        confidence_level: getConfidenceLevel(belief),
        contributing_symptoms: contributingSymptoms,
        mass_assignments: {
          belief: belief,
          plausibility: plausibility,
          uncertainty: uncertainty,
        },
      });
    }
  });

  return results.sort((a, b) => b.belief - a.belief).slice(0, 10);
}

// --- POST Request Handler ---
export async function POST(request: NextRequest) {
  try {
    const body: { gejala: string[]; perangkat?: string; gejalaList: Gejala[] } = await request.json();
    const { gejala: selectedSymptomCodes, perangkat, gejalaList: gejalaListClient } = body;

    const kerusakanList = await getKerusakanList();

    // Validasi input
    if (!selectedSymptomCodes || !Array.isArray(selectedSymptomCodes) || selectedSymptomCodes.length === 0) {
      return NextResponse.json({ error: "Gejala harus berupa array dan tidak boleh kosong." }, { status: 400 });
    }

    if (selectedSymptomCodes.length > 5) {
      return NextResponse.json({ error: "Maksimal 5 gejala dapat dipilih." }, { status: 400 });
    }

    const validSymptoms = selectedSymptomCodes.filter((kode) => gejalaListClient.some((g) => g.kode === kode));

    if (validSymptoms.length === 0) {
      return NextResponse.json({ error: "Tidak ada gejala yang valid ditemukan." }, { status: 400 });
    }

    if (perangkat && !["komputer", "laptop"].includes(perangkat.toLowerCase())) {
      return NextResponse.json({ error: "Jenis perangkat tidak valid." }, { status: 400 });
    }

    const results = diagnoseWithDempsterShafer(validSymptoms, perangkat, gejalaListClient, kerusakanList);

    const topResult = results[0];
    const accuracy = topResult ? Math.min(100, Math.round(topResult.belief * 100)) : 0;

    // --- Sertakan detail gejala yang dipilih ke respons ---
    const selectedSymptomsDetailsFull: Gejala[] = validSymptoms.map(kode => {
      const gejala = gejalaListClient.find(g => g.kode === kode);
      // Mengembalikan objek gejala lengkap, atau objek placeholder jika tidak ditemukan
      return gejala || {
        kode: kode,
        nama: `Gejala ${kode}`, // Placeholder nama
        deskripsi: `Detail gejala ${kode} tidak tersedia.`, // Placeholder deskripsi
        kategori: "Unknown",
        perangkat: [],
        mass_function: {},
        gambar: "", // Placeholder gambar
      };
    });

    const categoriesOfSymptoms = selectedSymptomsDetailsFull.map((gejala: Gejala) => gejala.kategori || "Unknown");

    const categoryCount = categoriesOfSymptoms.reduce(
      (acc: Record<string, number>, cat: string) => {
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const dominantCategory = Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0]?.[0] || "Mixed";

    await new Promise((resolve) => setTimeout(resolve, 1000));

    return NextResponse.json({
      input: selectedSymptomCodes, // Tetap kirim hanya kode input
      selectedGejalaDetails: selectedSymptomsDetailsFull, // <--- DETAIL LENGKAP GEJALA YANG DIPILIH
      device_type: perangkat || "Tidak ditentukan",
      result: results,
      analysis: {
        total_symptoms: validSymptoms.length,
        dominant_category: dominantCategory,
        category_distribution: categoryCount,
        severity_level: validSymptoms.length >= 4 ? "Tinggi" : validSymptoms.length >= 2 ? "Sedang" : "Rendah",
        device_type: perangkat || "Unknown",
        evidence_strength: validSymptoms.length / 5.0,
        accuracy_percentage: accuracy,
        confidence_level: topResult ? topResult.confidence_level : "Tidak Ada",
        total_possible_damages: results.length,
        algorithm_used: "Enhanced Dempster-Shafer Theory",
        evidence_combination: results.length > 0 ? "Berhasil" : "Tidak Ada Evidence",
        uncertainty_level: topResult ? Math.round(topResult.uncertainty * 100) : 0,
      },
      timestamp: new Date().toISOString(),
      message: "Diagnosa berhasil diproses menggunakan Enhanced Dempster-Shafer Theory",
    });
  } catch (caughtError: unknown) {
    console.error("Terjadi kesalahan saat memproses diagnosa:", caughtError);
    let errorMessage = "Terjadi kesalahan saat memproses diagnosa.";
    if (caughtError instanceof Error) {
      errorMessage = caughtError.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// --- GET Request Handler (for initial info) ---
export async function GET() {
  try {
    const kerusakanList = await getKerusakanList();

    const maxSymptoms = 5;
    const availableDevices = ["Komputer", "Laptop"];

    return NextResponse.json({
      message: "Enhanced Diagnosa API menggunakan Dempster-Shafer Theory",
      usage: "POST /api/diagnosa dengan body { gejala: string[], perangkat?: string, gejalaList: Gejala[] }",
      algorithm: "Enhanced Dempster-Shafer Theory with Conflict Resolution",
      max_symptoms: maxSymptoms,
      available_devices: availableDevices,
      available_symptoms: [],
      total_symptoms: 0,
      total_damages: kerusakanList.length,
      improvements: [
        "Enhanced conflict resolution",
        "Better normalization",
        "Bounds checking for belief/plausibility",
        "Improved uncertainty handling",
        "Flexible knowledge base support",
        "Dynamic damage data fetching from Firestore",
        "Gejala data sent by client for diagnosis",
      ],
      timestamp: new Date().toISOString(),
    });
  } catch (caughtError: unknown) {
    console.error("Terjadi kesalahan saat mengambil data untuk request GET:", caughtError);
    let errorMessage = "Terjadi kesalahan saat mengambil data.";
    if (caughtError instanceof Error) {
      errorMessage = caughtError.message;
    }
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}