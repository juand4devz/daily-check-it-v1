// /lib/role-ai/logical-rules.ts

/**
 * Logical Rules for Symptom Contradiction Detection
 *
 * This file defines logical rules to detect contradictory or impossible
 * symptom combinations in computer diagnosis.
 */

export interface LogicalRule {
  id: string
  name: string
  contradictorySymptoms: string[]
  reason: string
  severity: "high" | "medium" | "low"
  alternativeExplanation?: string
}

export const logicalRules: LogicalRule[] = [
  {
    id: "display_bsod_contradiction",
    name: "Display vs BSOD Contradiction",
    contradictorySymptoms: ["G001", "G002", "G003", "G015"], // No display + BSOD related
    reason:
      "Jika tidak ada tampilan di layar, pengguna tidak mungkin melihat Blue Screen of Death atau error display lainnya",
    severity: "high",
    alternativeExplanation: "Kemungkinan masalah pada power supply, kabel display, atau VGA card",
  },
  {
    id: "power_vs_operation",
    name: "Power vs Operation Contradiction",
    contradictorySymptoms: ["G001", "G020", "G021"], // No power + operational symptoms
    reason: "Jika komputer tidak menyala atau LED power mati, tidak mungkin ada aktivitas operasional",
    severity: "high",
    alternativeExplanation: "Fokus pada masalah power supply atau motherboard",
  },
  {
    id: "boot_vs_os_symptoms",
    name: "Boot vs OS Contradiction",
    contradictorySymptoms: ["G005", "G015", "G016"], // Boot failure + OS symptoms
    reason: "Jika komputer gagal boot atau tidak ada POST, tidak mungkin mencapai tahap OS untuk mengalami BSOD",
    severity: "high",
    alternativeExplanation: "Masalah hardware fundamental seperti RAM, motherboard, atau storage",
  },
  {
    id: "network_vs_display",
    name: "Network vs Display Issues",
    contradictorySymptoms: ["G002", "G025", "G026"], // No display + network issues
    reason: "Jika tidak ada tampilan, sulit memverifikasi masalah jaringan kecuali ada indikator LED",
    severity: "medium",
    alternativeExplanation: "Prioritaskan perbaikan display terlebih dahulu",
  },
  {
    id: "audio_vs_power",
    name: "Audio vs Power Contradiction",
    contradictorySymptoms: ["G001", "G018", "G019"], // No power + audio issues
    reason: "Jika komputer tidak menyala, tidak mungkin ada masalah audio karena sistem tidak beroperasi",
    severity: "high",
    alternativeExplanation: "Masalah utama pada sistem power, bukan audio",
  },
  {
    id: "performance_vs_boot",
    name: "Performance vs Boot Issues",
    contradictorySymptoms: ["G005", "G022", "G023"], // Boot failure + performance issues
    reason: "Jika komputer tidak bisa boot, tidak mungkin mengalami masalah performa karena OS tidak berjalan",
    severity: "high",
    alternativeExplanation: "Fokus pada masalah boot terlebih dahulu sebelum menangani performa",
  },
]

// Function to detect contradictory symptoms
export function detectContradictions(selectedSymptoms: string[]): {
  hasContradiction: boolean
  contradictions: LogicalRule[]
  severity: "high" | "medium" | "low" | "none"
} {
  const contradictions: LogicalRule[] = []

  for (const rule of logicalRules) {
    const matchingSymptoms = rule.contradictorySymptoms.filter((symptom) => selectedSymptoms.includes(symptom))

    // If at least 2 contradictory symptoms are selected
    if (matchingSymptoms.length >= 2) {
      contradictions.push(rule)
    }
  }

  const hasContradiction = contradictions.length > 0
  const severity =
    contradictions.length > 0
      ? contradictions.reduce(
        (max, rule) => {
          const severityOrder = { low: 1, medium: 2, high: 3 }
          return severityOrder[rule.severity] > severityOrder[max] ? rule.severity : max
        },
        "low" as "high" | "medium" | "low",
      )
      : "none"

  return {
    hasContradiction,
    contradictions,
    severity,
  }
}

// Function to suggest alternative diagnosis
export function suggestAlternativeDiagnosis(selectedSymptoms: string[], contradictions: LogicalRule[]): string[] {
  const suggestions: string[] = []

  // Priority-based suggestions
  const hasDisplayIssue = selectedSymptoms.some((s) => ["G002", "G003"].includes(s))
  const hasPowerIssue = selectedSymptoms.some((s) => ["G001"].includes(s))
  const hasBootIssue = selectedSymptoms.some((s) => ["G005"].includes(s))

  if (hasPowerIssue) {
    suggestions.push("Kerusakan Power Supply")
    suggestions.push("Kerusakan Motherboard")
  }

  if (hasDisplayIssue && !hasPowerIssue) {
    suggestions.push("Kerusakan VGA Card")
    suggestions.push("Kerusakan Monitor/Kabel Display")
  }

  if (hasBootIssue) {
    suggestions.push("Kerusakan RAM")
    suggestions.push("Kerusakan Storage (HDD/SSD)")
  }

  return [...new Set(suggestions)] // Remove duplicates
}
