import { type NextRequest, NextResponse } from "next/server"
import gejalaData from "@/data/gejala.json"
import kerusakanData from "@/data/kerusakan.json"

interface MassFunction {
  [hypothesis: string]: number
}

interface Gejala {
  kode: string
  nama: string
  deskripsi: string
  kategori: string
  perangkat: string[]
  mass_function: Record<string, number>
  gambar: string
}

interface Kerusakan {
  kode: string
  nama: string
  deskripsi: string
  tingkat_kerusakan: string
  estimasi_biaya: string
  waktu_perbaikan: string
  prior_probability: number
  solusi: string
  gejala_terkait: string[]
}

interface DiagnosisResult {
  kode: string
  nama: string
  belief: number
  plausibility: number
  uncertainty: number
  solusi: string
  tingkat_kerusakan?: string
  estimasi_biaya?: string
  waktu_perbaikan?: string
  confidence_level: string
  contributing_symptoms: string[]
  mass_assignments: { [key: string]: number }
}

// Type assertions for imported JSON data
const gejalaList = gejalaData as Gejala[]
const kerusakanList = kerusakanData as Kerusakan[]

// Improved mass function normalization
function normalizeMassFunction(massFunction: MassFunction): MassFunction {
  const normalized: MassFunction = {}
  let total = 0

  // Calculate total excluding uncertainty
  for (const [key, value] of Object.entries(massFunction)) {
    if (key !== "uncertainty" && value > 0) {
      total += value
    }
  }

  // If total exceeds 1, normalize proportionally
  if (total > 1) {
    const scaleFactor = 0.9 / total // Leave 10% for uncertainty
    for (const [key, value] of Object.entries(massFunction)) {
      if (key !== "uncertainty" && value > 0) {
        normalized[key] = value * scaleFactor
      }
    }
    normalized["uncertainty"] = 0.1
  } else {
    // Copy existing values and set uncertainty
    for (const [key, value] of Object.entries(massFunction)) {
      if (key !== "uncertainty" && value > 0) {
        normalized[key] = value
      }
    }
    normalized["uncertainty"] = Math.max(0.05, 1 - total)
  }

  return normalized
}

// Improved Dempster-Shafer combination rule with conflict handling
function combineEvidence(m1: MassFunction, m2: MassFunction): MassFunction {
  const combined: MassFunction = {}
  let conflict = 0

  // Normalize input mass functions
  const norm_m1 = normalizeMassFunction(m1)
  const norm_m2 = normalizeMassFunction(m2)

  // Get all hypotheses
  const allHypotheses = new Set([
    ...Object.keys(norm_m1).filter((k) => k !== "uncertainty"),
    ...Object.keys(norm_m2).filter((k) => k !== "uncertainty"),
  ])

  // Initialize combined mass function
  allHypotheses.forEach((h) => (combined[h] = 0))
  combined["uncertainty"] = 0

  // Apply Dempster's rule of combination
  for (const [h1, v1] of Object.entries(norm_m1)) {
    for (const [h2, v2] of Object.entries(norm_m2)) {
      const product = v1 * v2

      if (h1 === h2) {
        // Same hypothesis - direct support
        combined[h1] = (combined[h1] || 0) + product
      } else if (h1 === "uncertainty") {
        // First is uncertainty, support second
        combined[h2] = (combined[h2] || 0) + product
      } else if (h2 === "uncertainty") {
        // Second is uncertainty, support first
        combined[h1] = (combined[h1] || 0) + product
      } else {
        // Different specific hypotheses - conflict
        conflict += product
      }
    }
  }

  // Handle high conflict situations
  if (conflict >= 0.9) {
    // Very high conflict - distribute more to uncertainty
    const totalSupport = Object.values(combined).reduce((sum, val) => sum + val, 0)
    const scaleFactor = 0.3 / totalSupport // Reduce confidence significantly

    for (const key in combined) {
      if (key !== "uncertainty") {
        combined[key] *= scaleFactor
      }
    }
    combined["uncertainty"] = 0.7
  } else if (conflict > 0.001) {
    // Normal conflict - apply normalization
    const normalizationFactor = 1 - conflict
    for (const key in combined) {
      combined[key] = combined[key] / normalizationFactor
    }
  }

  // Final validation and adjustment
  const finalTotal = Object.values(combined).reduce((sum, val) => sum + val, 0)
  if (Math.abs(finalTotal - 1) > 0.001) {
    // Adjust uncertainty to ensure total = 1
    const adjustment = 1 - finalTotal
    combined["uncertainty"] = Math.max(0.01, (combined["uncertainty"] || 0) + adjustment)
  }

  return combined
}

// Calculate belief and plausibility with bounds checking
function calculateBeliefPlausibility(massFunction: MassFunction, hypothesis: string) {
  const belief = Math.min(1.0, Math.max(0.0, massFunction[hypothesis] || 0))
  const uncertainty = massFunction["uncertainty"] || 0
  const plausibility = Math.min(1.0, belief + uncertainty)

  return { belief, plausibility }
}

// Get confidence level based on belief value
function getConfidenceLevel(belief: number): string {
  if (belief >= 0.8) return "Sangat Tinggi"
  if (belief >= 0.6) return "Tinggi"
  if (belief >= 0.4) return "Sedang"
  if (belief >= 0.2) return "Rendah"
  return "Sangat Rendah"
}

// Enhanced Dempster-Shafer diagnosis function
function diagnoseWithDempsterShafer(selectedSymptoms: string[], deviceType?: string): DiagnosisResult[] {
  if (selectedSymptoms.length === 0) {
    return []
  }

  // Get and validate mass functions from selected symptoms
  const evidences: MassFunction[] = []

  selectedSymptoms.forEach((symptomCode) => {
    const symptom = gejalaList.find((g) => g.kode === symptomCode)
    if (symptom && symptom.mass_function) {
      const normalizedMass = normalizeMassFunction(symptom.mass_function)
      evidences.push(normalizedMass)
    }
  })

  if (evidences.length === 0) {
    return []
  }

  // Combine all evidence using Dempster's rule
  let combinedMass = evidences[0]
  for (let i = 1; i < evidences.length; i++) {
    combinedMass = combineEvidence(combinedMass, evidences[i])
  }

  // Convert to diagnosis results
  const results: DiagnosisResult[] = []

  kerusakanList.forEach((kerusakan) => {
    // Filter by device type if specified
    const deviceMatch =
      !deviceType ||
      selectedSymptoms.some((symptom) => {
        const gejala = gejalaList.find((g) => g.kode === symptom)
        return gejala?.perangkat.includes(deviceType.toLowerCase())
      })

    if (!deviceMatch) return

    const { belief, plausibility } = calculateBeliefPlausibility(combinedMass, kerusakan.kode)
    const uncertainty = Math.max(0, plausibility - belief)

    // Only include results with meaningful belief (threshold lowered for better coverage)
    if (belief > 0.001) {
      const contributingSymptoms = selectedSymptoms.filter((symptom) => {
        const gejala = gejalaList.find((g) => g.kode === symptom)
        return gejala?.mass_function && gejala.mass_function[kerusakan.kode] > 0
      })

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
      })
    }
  })

  // Sort by belief value (highest first) and limit results
  return results.sort((a, b) => b.belief - a.belief).slice(0, 10) // Limit to top 10 results
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { gejala, perangkat } = body as { gejala: string[]; perangkat?: string }

    // Enhanced input validation
    if (!gejala || !Array.isArray(gejala) || gejala.length === 0) {
      return NextResponse.json({ error: "Gejala harus berupa array dan tidak boleh kosong" }, { status: 400 })
    }

    if (gejala.length > 5) {
      return NextResponse.json({ error: "Maksimal 5 gejala dapat dipilih" }, { status: 400 })
    }

    // Validate symptoms exist
    const validSymptoms = gejala.filter((kode) => gejalaList.some((g) => g.kode === kode))

    if (validSymptoms.length === 0) {
      return NextResponse.json({ error: "Tidak ada gejala yang valid ditemukan" }, { status: 400 })
    }

    // Validate device type
    if (perangkat && !["Komputer", "Laptop"].includes(perangkat)) {
      return NextResponse.json({ error: "Jenis perangkat tidak valid" }, { status: 400 })
    }

    // Process diagnosis using improved Dempster-Shafer
    const results = diagnoseWithDempsterShafer(validSymptoms, perangkat)

    // Calculate accuracy and analysis
    const topResult = results[0]
    const accuracy = topResult ? Math.min(100, Math.round(topResult.belief * 100)) : 0

    // Enhanced analysis
    const categories = validSymptoms.map((kode) => {
      const gejala = gejalaList.find((g) => g.kode === kode)
      return gejala?.kategori || "Unknown"
    })

    const categoryCount = categories.reduce(
      (acc, cat) => {
        acc[cat] = (acc[cat] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const dominantCategory = Object.entries(categoryCount).sort(([, a], [, b]) => b - a)[0]?.[0] || "Mixed"

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return NextResponse.json({
      input: validSymptoms,
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
    })
  } catch (error) {
    console.error("Error processing diagnosis:", error)
    return NextResponse.json({ error: "Terjadi kesalahan saat memproses diagnosa" }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Enhanced Diagnosa API menggunakan Dempster-Shafer Theory",
    usage: "POST /api/diagnosa dengan body { gejala: string[], perangkat?: string }",
    algorithm: "Enhanced Dempster-Shafer Theory with Conflict Resolution",
    max_symptoms: 5,
    available_devices: ["Komputer", "Laptop"],
    available_symptoms: gejalaList.map((g) => g.kode),
    available_damages: kerusakanList.map((k) => k.kode),
    total_symptoms: gejalaList.length,
    total_damages: kerusakanList.length,
    improvements: [
      "Enhanced conflict resolution",
      "Better normalization",
      "Bounds checking for belief/plausibility",
      "Improved uncertainty handling",
      "Flexible knowledge base support",
    ],
  })
}
