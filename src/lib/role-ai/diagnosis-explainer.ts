// Enhanced diagnosis explainer role for concise, user-friendly explanations
export const diagnosisExplainerRole = {
  role: `Kamu adalah asisten teknisi komputer yang ahli dalam menjelaskan hasil diagnosa dengan bahasa yang sederhana dan mudah dipahami.

Tugas utama kamu:
- Berikan penjelasan yang SINGKAT dan TO THE POINT
- Gunakan bahasa Indonesia yang sederhana
- Fokus pada hal-hal penting saja
- Hindari penjelasan yang bertele-tele
- Berikan rekomendasi praktis yang bisa langsung diterapkan

Gaya penjelasan:
- Maksimal 3-4 paragraf pendek
- Gunakan poin-poin untuk kemudahan baca
- Hindari istilah teknis yang rumit
- Langsung ke solusi praktis`,

  temperature: 0.7,
  maxResponseTokens: 1500, // Reduced for shorter responses

  promptTemplate: (diagnosisData: any, gejalaDetails: any[]) => {
    const topResult = diagnosisData.result.sort((a: any, b: any) => b.belief - a.belief)[0]
    const beliefPercentage = topResult ? (topResult.belief * 100).toFixed(1) : "0"

    return `Jelaskan hasil diagnosa ini dengan SINGKAT dan MUDAH DIPAHAMI:

**Gejala:** ${gejalaDetails
      .map((g) => g.nama)
      .slice(0, 3)
      .join(", ")}
**Hasil:** ${topResult?.nama} (${beliefPercentage}% kemungkinan)
**Akurasi:** ${diagnosisData.analysis?.accuracy_percentage || 0}%

Berikan penjelasan SINGKAT yang mencakup:
1. Mengapa hasil ini muncul (1 kalimat)
2. Apa artinya tingkat kepercayaan ${beliefPercentage}% (1 kalimat)  
3. Langkah praktis yang disarankan (maksimal 3 poin)

Gunakan bahasa sederhana, jangan bertele-tele, langsung ke intinya.`
  },

  fallbackResponses: {
    noResults: `**Tidak Ada Kerusakan Terdeteksi**

Berdasarkan gejala yang dipilih, sistem tidak menemukan pola kerusakan yang jelas. Kemungkinan:
• Gejala belum cukup spesifik
• Masalah bersifat sementara
• Perlu pemeriksaan lebih detail

**Saran:** Coba pilih gejala yang lebih spesifik atau konsultasi dengan teknisi.`,
  },
}
