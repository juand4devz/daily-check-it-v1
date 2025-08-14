// /api/ai-assistance/route.ts
import { type NextRequest, NextResponse } from "next/server"
import { generateStreamWithFallback, getModelStrategy, type ModelContext } from "@/lib/ai-service"

// Enhanced AI role for concise, to-the-point responses
const AI_CHAT_ROLE = `Kamu adalah asisten teknisi komputer yang ahli dan berpengalaman. Tugasmu adalah membantu pengguna dengan masalah teknologi komputer, laptop, dan perangkat elektronik.

GAYA KOMUNIKASI:
- Berikan jawaban yang SINGKAT, PADAT, dan TO THE POINT
- Maksimal 3000 karakter per response
- Gunakan bahasa Indonesia yang sopan dan mudah dipahami
- Hindari penjelasan yang bertele-tele atau terlalu panjang
- Fokus pada solusi praktis yang bisa langsung diterapkan
- Gunakan bullet points untuk kemudahan baca

STRUKTUR JAWABAN SINGKAT:
- Identifikasi masalah (1-2 kalimat)
- Berikan 3-5 langkah solusi utama
- Tambahkan 1-2 tips pencegahan jika perlu
- Akhiri dengan saran singkat

PRINSIP PENTING:
- Jawaban harus LENGKAP tapi RINGKAS
- Prioritaskan informasi yang paling penting
- Hindari repetisi atau penjelasan berlebihan
- Berikan solusi yang actionable
- Jangan memotong kalimat di tengah

Berikan jawaban yang efektif dan efisien, langsung ke solusi utama.`

// Specialized AI role for diagnosis explanations
const DIAGNOSIS_AI_ROLE = `Kamu adalah asisten AI yang ahli dalam menjelaskan hasil diagnosa teknis komputer. Tugasmu adalah memberikan penjelasan yang mudah dipahami tentang hasil diagnosa sistem pakar.

GAYA KOMUNIKASI UNTUK DIAGNOSA:
- Berikan penjelasan yang AKURAT dan PROFESIONAL
- Maksimal 3000 karakter per response
- Gunakan bahasa Indonesia yang mudah dipahami
- Fokus pada interpretasi hasil dan langkah praktis
- Hindari jargon teknis yang rumit

STRUKTUR PENJELASAN DIAGNOSA:
1. **Mengapa Diagnosa Ini Muncul** (1-2 kalimat singkat)
2. **Interpretasi Tingkat Kepercayaan** (1 kalimat)
3. **Langkah Praktis yang Disarankan** (maksimal 3-4 poin)
4. **Peringatan Penting** (jika diperlukan)

PRINSIP PENTING:
- Jelaskan dengan bahasa awam yang mudah dipahami
- Berikan konteks mengapa sistem sampai pada kesimpulan ini
- Fokus pada actionable advice
- Selalu ingatkan bahwa ini prediksi, bukan diagnosa pasti
- Prioritaskan keamanan data dan kehati-hatian

Berikan penjelasan yang membantu pengguna memahami dan mengambil tindakan yang tepat.`

// Request body interface
interface ChatRequest {
    message: string
    image?: string
    history?: Array<{ role: string; content: string }>
    context?: string
}

// Response data interface
interface ResponseData {
    content: string
    model: string
    isComplete?: boolean
    context: string
    strategy?: string
    error?: boolean
}

export async function POST(request: NextRequest) {
    try {
        const { message, image, history = [], context = "chat" }: ChatRequest = await request.json()

        if (!message && !image) {
            return NextResponse.json({ error: "Message or image is required" }, { status: 400 })
        }

        // Validate context and get model strategy
        const modelContext: ModelContext = context === "diagnosis" ? "diagnosis" : "aiChat"
        const modelStrategy = getModelStrategy(modelContext)
        const aiRole = context === "diagnosis" ? DIAGNOSIS_AI_ROLE : AI_CHAT_ROLE

        console.log(`🤖 API Context: ${context}`)
        console.log(`📋 Using model strategy: ${modelStrategy.join(" → ")}`)

        // Build conversation context
        let conversationContext = ""
        if (history.length > 0) {
            // Include last 4 messages for context (2 exchanges)
            const recentHistory = history.slice(-4)
            conversationContext = recentHistory
                .map((msg) => `${msg.role === "user" ? "User" : "Assistant"}: ${msg.content}`)
                .join("\n")
        }

        // Build the full prompt with character limit instruction
        let fullPrompt = `${aiRole}\n\n`

        if (conversationContext) {
            fullPrompt += `KONTEKS PERCAKAPAN SEBELUMNYA:\n${conversationContext}\n\n`
        }

        fullPrompt += `PERTANYAAN SAAT INI: ${message}\n\n`

        // Different instructions based on context
        if (context === "diagnosis") {
            fullPrompt += `PENTING: Ini adalah penjelasan diagnosa medis/teknis. Berikan penjelasan yang akurat, profesional, dan mudah dipahami. Maksimal 3000 karakter. Fokus pada:
1. Penjelasan mengapa diagnosa ini muncul
2. Interpretasi tingkat kepercayaan
3. Langkah praktis yang disarankan
4. Peringatan penting jika ada

CATATAN: Menggunakan Gemini Pro sebagai prioritas utama untuk akurasi maksimal dalam penjelasan diagnosa.`
        } else {
            fullPrompt += `PENTING: Berikan jawaban yang lengkap tapi ringkas, maksimal 3000 karakter. Langsung ke solusi utama, jangan bertele-tele.

KHUSUS UNTUK TABEL: Jika diminta membuat tabel, gunakan format markdown yang benar dan pastikan setiap baris tabel lengkap. Contoh:
| Kolom 1 | Kolom 2 | Kolom 3 |
|---------|---------|---------|
| Data 1  | Data 2  | Data 3  |
| Data 4  | Data 5  | Data 6  |

Pastikan tabel selesai sampai akhir dan tidak terpotong di tengah.`
        }

        if (image) {
            fullPrompt += `\n\nCATATAN: Pengguna juga mengirim gambar. Analisis gambar ini dan berikan penjelasan singkat yang relevan.`
        }

        // Create a ReadableStream for Server-Sent Events
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    const encoder = new TextEncoder()

                    // Send initial connection with context info
                    const initialData: ResponseData = {
                        content: "",
                        model: "connecting",
                        context: context,
                        strategy: context === "diagnosis" ? "PRO_FIRST" : "FLASH_FIRST",
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`))

                    let hasContent = false
                    let currentModel = "offline"
                    let fullContent = "" // Track full content for table completion

                    console.log(`🚀 Starting generation with strategy: ${modelStrategy.join(" → ")}`)

                    // Try to generate with selected model strategy
                    for await (const chunk of generateStreamWithFallback(fullPrompt, modelStrategy, {
                        temperature: context === "diagnosis" ? 0.5 : 0.7,
                        maxOutputTokens: 4500,
                        image: image,
                    })) {
                        hasContent = true
                        currentModel = chunk.model

                        if (chunk.content) {
                            fullContent += chunk.content

                            // Special handling for tables - ensure they're complete
                            const data: ResponseData = {
                                content: chunk.content,
                                model: chunk.model,
                                isComplete: chunk.isComplete,
                                context: context,
                            }
                            controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                        }

                        if (chunk.isComplete) {
                            console.log(`✅ Generation completed using: ${chunk.model}`)

                            // Final validation for tables
                            if (fullContent.includes("|") && !fullContent.match(/\|\s*$/m)) {
                                // If content contains tables but might be incomplete, add a small delay
                                await new Promise((resolve) => setTimeout(resolve, 100))
                            }

                            break
                        }
                    }

                    // If no AI response, provide offline fallback
                    if (!hasContent) {
                        console.log("⚠️ No AI response, using offline fallback")
                        const offlineResponse =
                            context === "diagnosis"
                                ? generateOfflineDiagnosisResponse(message)
                                : generateOfflineResponse(message, image)
                        const data: ResponseData = {
                            content: offlineResponse,
                            model: "offline",
                            isComplete: true,
                            context: context,
                        }
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
                    }

                    // Send completion signal
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
                    controller.close()
                } catch (error) {
                    console.error("Streaming error:", error)
                    const encoder = new TextEncoder()
                    const errorResponse: ResponseData = {
                        content: "Maaf, terjadi kesalahan saat memproses permintaan Anda. Silakan coba lagi dalam beberapa saat.",
                        model: "error",
                        error: true,
                        context: context,
                    }
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorResponse)}\n\n`))
                    controller.enqueue(encoder.encode(`data: [DONE]\n\n`))
                    controller.close()
                }
            },
        })

        return new Response(stream, {
            headers: {
                "Content-Type": "text/plain; charset=utf-8",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        })
    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
}

// Specialized offline response for diagnosis context
function generateOfflineDiagnosisResponse(): string {
    return `**Penjelasan Diagnosa (Mode Offline)**

Berdasarkan hasil diagnosa yang telah dilakukan, berikut penjelasan singkat:

**Mengapa Diagnosa Ini Muncul:**
Sistem menganalisis pola gejala yang Anda pilih dan mencocokkannya dengan database kerusakan yang ada. Tingkat kepercayaan dihitung menggunakan metode Dempster-Shafer yang mempertimbangkan evidence dari setiap gejala.

**Interpretasi Tingkat Kepercayaan:**
• **70-100%**: Kemungkinan tinggi - Gejala sangat sesuai dengan pola kerusakan
• **40-69%**: Kemungkinan sedang - Perlu pemeriksaan tambahan untuk konfirmasi  
• **0-39%**: Kemungkinan rendah - Mungkin ada faktor lain yang belum teridentifikasi

**Langkah yang Disarankan:**
1. **Backup Data** - Selalu backup data penting sebelum perbaikan
2. **Verifikasi Gejala** - Pastikan gejala yang dipilih benar-benar terjadi
3. **Ikuti Solusi Bertahap** - Mulai dari langkah yang paling mudah dan aman
4. **Konsultasi Teknisi** - Untuk kerusakan dengan tingkat kepercayaan tinggi

**Peringatan Penting:**
Hasil diagnosa ini adalah prediksi berdasarkan gejala, bukan diagnosa pasti. Selalu berhati-hati saat melakukan perbaikan dan konsultasi dengan teknisi profesional jika diperlukan.

*Mode offline - Penjelasan terbatas pada informasi dasar.*`
}

// Concise offline response generator for regular chat
function generateOfflineResponse(message: string, image?: string): string {
    const lowerMessage = message.toLowerCase()

    // Image analysis fallback
    if (image) {
        return `**Analisis Gambar (Mode Offline)**

Untuk masalah yang Anda tunjukkan dalam gambar:

**Langkah Cepat:**
• Periksa koneksi kabel dan port
• Restart perangkat
• Cek indikator LED/lampu status
• Update driver jika perlu

**Jika Masalah Hardware:**
• Pastikan komponen terpasang dengan benar
• Bersihkan debu dari port/koneksi
• Test dengan kabel/komponen lain

**Backup data penting sebelum perbaikan besar. Konsultasi teknisi jika masalah berlanjut.**`
    }

    // Common computer problems - concise responses
    if (lowerMessage.includes("tidak bisa nyala") || lowerMessage.includes("tidak menyala")) {
        return `**Komputer Tidak Menyala**

**Penyebab Umum:** Power supply, RAM, atau koneksi bermasalah

**Solusi Cepat:**
1. **Cek Power** - Pastikan kabel power terhubung, saklar PSU ON
2. **Reset RAM** - Cabut dan pasang kembali RAM dengan benar
3. **Periksa Koneksi** - Pastikan semua kabel internal terpasang
4. **Test Minimal** - Coba nyalakan hanya dengan RAM dan processor

**Peringatan:** Matikan dan cabut kabel power sebelum membuka casing.

**Jika tetap tidak menyala, kemungkinan PSU atau motherboard rusak - konsultasi teknisi.**`
    }

    if (lowerMessage.includes("lambat") || lowerMessage.includes("lemot")) {
        return `**Komputer Lambat**

**Penyebab Utama:** RAM penuh, storage penuh, atau terlalu banyak program startup

**Solusi Cepat:**
1. **Bersihkan Startup** - Ctrl+Shift+Esc → Startup → Disable program tidak perlu
2. **Free Up Storage** - Hapus file temporary, uninstall program tidak terpakai
3. **Check RAM Usage** - Task Manager → Performance, jika >80% perlu upgrade
4. **Scan Virus** - Gunakan Windows Defender full scan

**Tips:** Restart berkala, update sistem, defrag HDD (bukan SSD).

**Jika masih lambat setelah langkah di atas, pertimbangkan upgrade RAM atau ganti ke SSD.**`
    }

    if (lowerMessage.includes("blue screen") || lowerMessage.includes("bsod")) {
        return `**Blue Screen (BSOD)**

**Penyebab Umum:** Driver rusak, RAM bermasalah, atau overheating

**Solusi Langsung:**
1. **Catat Kode Error** - Foto kode error untuk troubleshooting spesifik
2. **Safe Mode** - Restart → F8 → Safe Mode → Uninstall driver/program baru
3. **Memory Test** - Windows Memory Diagnostic untuk cek RAM
4. **Update Driver** - Download driver terbaru dari website resmi

**Pencegahan:** Backup data, update sistem berkala, monitor suhu hardware.

**Jika BSOD terus berulang dengan kode sama, kemungkinan hardware rusak - perlu diagnosa teknisi.**`
    }

    // Generic helpful response - concise
    return `**Troubleshooting Umum**

Untuk masalah: "${message}"

**Langkah Dasar:**
1. **Restart** - Solusi paling sederhana untuk banyak masalah
2. **Update** - Driver dan sistem operasi ke versi terbaru
3. **Scan Virus** - Gunakan Windows Defender atau antivirus
4. **Check Hardware** - Pastikan semua koneksi kabel baik

**Info yang Dibutuhkan:**
• Kapan masalah mulai terjadi?
• Ada pesan error spesifik?
• Hardware/software baru yang diinstall?

**Backup data penting sebelum perbaikan besar. Konsultasi teknisi jika masalah kompleks atau hardware rusak.**`
}
