// /lib/ai-service.ts
import { GoogleGenerativeAI } from "@google/generative-ai"
import { diagnosisExplainerRole } from "./role-ai/diagnosis-explainer"
import { detectContradictions, suggestAlternativeDiagnosis } from "./role-ai/logical-rules"
import gejalaData from "@/data/gejala.json"

// Available AI Models Configuration - Updated with new models
export const AI_MODELS = {
  GEMINI_PRO: "gemini-2.5-pro",
  GEMINI_FLASH: "gemini-2.5-flash",
  GEMINI_FLASH_LITE: "gemini-2.5-flash-lite",
  GEMINI_FLASH_V2: "gemini-2.0-flash",
  GEMINI_FLASH_LITE_V2: "gemini-2.0-flash-lite",
  LEARNLM_FLASH: "learnlm-2.0-flash-experimental",
} as const

export type AIModelType = (typeof AI_MODELS)[keyof typeof AI_MODELS]

// Model Configuration Interface
interface ModelConfig {
  name: AIModelType
  priority: number
  description: string
}

// New Model Configuration with Updated Priorities
export const MODEL_CONFIG = {
  aiChat: [
    { name: AI_MODELS.GEMINI_FLASH, priority: 1, description: "Flash2.5" },
    { name: AI_MODELS.GEMINI_FLASH_V2, priority: 2, description: "Flash 2.0" },
    { name: AI_MODELS.GEMINI_FLASH_LITE_V2, priority: 3, description: "Lite 2.0" },
    { name: AI_MODELS.LEARNLM_FLASH, priority: 4, description: "LearnLM 2.0" },
    { name: AI_MODELS.GEMINI_PRO, priority: 5, description: "Pro 2.5" },
  ],
  diagnosis: [
    { name: AI_MODELS.GEMINI_PRO, priority: 1, description: "Pro 2.5" },
    { name: AI_MODELS.GEMINI_FLASH, priority: 2, description: "Flash 2.5" },
    { name: AI_MODELS.GEMINI_FLASH_LITE, priority: 3, description: "Lite 2.5" },
    { name: AI_MODELS.LEARNLM_FLASH, priority: 4, description: "LearnLM 2.0" },
  ],
} as const

// Context Types
export type ModelContext = keyof typeof MODEL_CONFIG

// Helper function to get model strategy by context
export const getModelStrategy = (context: ModelContext): readonly AIModelType[] => {
  const models = [...MODEL_CONFIG[context]] as ModelConfig[]
  return models
    .sort((a: ModelConfig, b: ModelConfig) => a.priority - b.priority)
    .map((model: ModelConfig) => model.name)
}

// Legacy support - update MODEL_STRATEGIES to use new config
export const MODEL_STRATEGIES = {
  DIAGNOSIS_EXPLANATION: getModelStrategy("diagnosis"),
  AI_CHAT: getModelStrategy("aiChat"),
} as const

// Model Display Names with versions
export const MODEL_DISPLAY_NAMES: Record<AIModelType, string> = {
  [AI_MODELS.GEMINI_PRO]: "Gemini Pro 2.5",
  [AI_MODELS.GEMINI_FLASH]: "Gemini Flash 2.5",
  [AI_MODELS.GEMINI_FLASH_LITE]: "Gemini Lite 2.5",
  [AI_MODELS.GEMINI_FLASH_V2]: "Gemini Flash 2.0",
  [AI_MODELS.GEMINI_FLASH_LITE_V2]: "Gemini Lite 2.0",
  [AI_MODELS.LEARNLM_FLASH]: "LearnLM 2.0",
}

// Initialize Google Generative AI with API key
let genAI: GoogleGenerativeAI | null = null

// Debug mode for development
const DEBUG_MODE = process.env.NODE_ENV === "development"

// Model usage tracking interface
interface ModelUsage {
  count: number
  lastReset: number
}

// Model usage tracking for rate limiting
const modelUsageTracker = new Map<AIModelType, ModelUsage>()

// Generation options interface
interface GenerationOptions {
  temperature?: number
  maxOutputTokens?: number
  image?: string
  enableTableMode?: boolean
}

// Generation result interface
interface GenerationResult {
  content: string
  model: AIModelType
}

// Streaming chunk interface
interface StreamingChunk {
  content: string
  model: AIModelType
  isComplete: boolean
}

// Initialize the AI service
export const initAIService = (): GoogleGenerativeAI | null => {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || process.env.GOOGLE_AI_API_KEY

  if (!apiKey) {
    console.warn("Google AI API key not found. Using user-friendly fallback responses.")
    return null
  }

  try {
    genAI = new GoogleGenerativeAI(apiKey)
    if (DEBUG_MODE) {
      console.log("Google AI service initialized successfully")
    }
    return genAI
  } catch (error) {
    console.error("Failed to initialize Google AI:", error)
    return null
  }
}

// Get AI service instance
export const getAIService = (): GoogleGenerativeAI | null => {
  if (!genAI) {
    return initAIService()
  }
  return genAI
}

// Check if model has exceeded rate limit (simple implementation)
const isModelRateLimited = (model: AIModelType): boolean => {
  const usage = modelUsageTracker.get(model)
  if (!usage) return false

  const now = Date.now()
  const hoursSinceReset = (now - usage.lastReset) / (1000 * 60 * 60)

  // Reset counter every hour
  if (hoursSinceReset >= 1) {
    modelUsageTracker.set(model, { count: 0, lastReset: now })
    return false
  }

  // Simple rate limit: 100 requests per hour per model
  return usage.count >= 100
}

// Track model usage
const trackModelUsage = (model: AIModelType): void => {
  const usage = modelUsageTracker.get(model) || { count: 0, lastReset: Date.now() }
  usage.count += 1
  modelUsageTracker.set(model, usage)
}

// Try multiple models with fallback strategy - Enhanced for table handling
export const generateWithFallback = async (
  prompt: string,
  models: readonly AIModelType[],
  options: GenerationOptions = {},
): Promise<GenerationResult | null> => {
  const ai = getAIService()
  if (!ai) return null

  const { temperature = 0.7, maxOutputTokens = 4096, image, enableTableMode = false } = options

  if (DEBUG_MODE) {
    console.log(`Trying models in order: ${models.join(" → ")}`)
  }

  for (const model of models) {
    // Skip if model is rate limited
    if (isModelRateLimited(model)) {
      if (DEBUG_MODE) {
        console.log(`Model ${model} is rate limited, trying next...`)
      }
      continue
    }

    try {
      if (DEBUG_MODE) {
        console.log(`Attempting to use model: ${model}`)
      }

      const aiModel = ai.getGenerativeModel({
        model,
        generationConfig: {
          temperature,
          maxOutputTokens: enableTableMode ? maxOutputTokens + 1000 : maxOutputTokens, // Extra tokens for tables
          topP: 0.9,
          topK: 40,
        },
      })

      const timeoutMs = enableTableMode ? 45000 : 30000 // Longer timeout for tables

      let result
      if (image) {
        // Handle image input
        const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "")
        result = await Promise.race([
          aiModel.generateContent([
            { text: prompt },
            {
              inlineData: {
                data: base64Data,
                mimeType: "image/jpeg",
              },
            },
          ]),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Model timeout")), timeoutMs)),
        ])
      } else {
        // Text only
        result = await Promise.race([
          aiModel.generateContent(prompt),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Model timeout")), timeoutMs)),
        ])
      }

      const response = result.response
      const text = response.text()

      if (text && text.trim().length > 50) {
        trackModelUsage(model)
        if (DEBUG_MODE) {
          console.log(`✅ Successfully generated content using model: ${model}`)
        }
        return { content: text.trim(), model }
      }
    } catch (error) {
      if (DEBUG_MODE) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.warn(`❌ Model ${model} failed:`, errorMessage)
      }

      // If it's a quota/rate limit error, mark model as rate limited
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
        const usage = modelUsageTracker.get(model) || { count: 0, lastReset: Date.now() }
        usage.count = 100 // Mark as rate limited
        modelUsageTracker.set(model, usage)
      }

      continue // Try next model
    }
  }

  if (DEBUG_MODE) {
    console.log("❌ All models failed")
  }
  return null // All models failed
}

// Streaming version with enhanced table support
export const generateStreamWithFallback = async function* (
  prompt: string,
  models: readonly AIModelType[],
  options: GenerationOptions = {},
): AsyncGenerator<StreamingChunk, void, unknown> {
  const ai = getAIService()
  if (!ai) return

  const { temperature = 0.7, maxOutputTokens = 4096, image, enableTableMode = false } = options

  // Detect if table mode should be enabled
  const shouldEnableTableMode =
    enableTableMode || prompt.toLowerCase().includes("tabel") || prompt.toLowerCase().includes("table")

  if (DEBUG_MODE) {
    console.log(`Streaming - Trying models in order: ${models.join(" → ")}`)
    if (shouldEnableTableMode) console.log(`📊 Table mode enabled`)
  }

  for (const model of models) {
    if (isModelRateLimited(model)) {
      if (DEBUG_MODE) {
        console.log(`Model ${model} is rate limited, trying next...`)
      }
      continue
    }

    try {
      if (DEBUG_MODE) {
        console.log(`Streaming - Attempting to use model: ${model}`)
      }

      const aiModel = ai.getGenerativeModel({
        model,
        generationConfig: {
          temperature,
          maxOutputTokens: shouldEnableTableMode ? maxOutputTokens + 1000 : maxOutputTokens,
          topP: 0.9,
          topK: 40,
        },
      })

      let result
      if (image) {
        const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, "")
        result = await aiModel.generateContentStream([
          { text: prompt },
          {
            inlineData: {
              data: base64Data,
              mimeType: "image/jpeg",
            },
          },
        ])
      } else {
        result = await aiModel.generateContentStream(prompt)
      }

      let hasContent = false

      for await (const chunk of result.stream) {
        const chunkText = chunk.text()
        if (chunkText) {
          hasContent = true

          // For table mode, buffer chunks slightly to ensure table rows are complete
          if (shouldEnableTableMode && chunkText.includes("|")) {
            // Small delay to allow table row completion
            await new Promise((resolve) => setTimeout(resolve, 50))
          }

          yield { content: chunkText, model, isComplete: false }
        }
      }

      if (hasContent) {
        trackModelUsage(model)
        if (DEBUG_MODE) {
          console.log(`✅ Streaming successful using model: ${model}`)
        }
        yield { content: "", model, isComplete: true }
        return // Success, exit
      }
    } catch (error) {
      if (DEBUG_MODE) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        console.warn(`❌ Streaming model ${model} failed:`, errorMessage)
      }

      const errorMessage = error instanceof Error ? error.message : String(error)
      if (errorMessage.includes("quota") || errorMessage.includes("rate")) {
        const usage = modelUsageTracker.get(model) || { count: 0, lastReset: Date.now() }
        usage.count = 100
        modelUsageTracker.set(model, usage)
      }

      continue
    }
  }

  if (DEBUG_MODE) {
    console.log("❌ All streaming models failed")
  }
}

// Diagnosis data interfaces
interface DiagnosisResult {
  kode: string
  nama: string
  belief: number
  plausibility: number
  uncertainty: number
  solusi: string
  confidence_level: string
  contributing_symptoms: string[]
}

interface DiagnosisData {
  input: string[]
  result: DiagnosisResult[]
  analysis: {
    accuracy_percentage: number
    dominant_category: string
    severity_level: string
  }
  timestamp: string
}

interface GejalaDetail {
  kode: string
  nama: string
  kategori: string
  deskripsi: string
  gambar: string
  perangkat: string[]
}

// User-friendly mock response generator
const generateUserFriendlyMockResponse = (diagnosisData: DiagnosisData, gejalaDetails: GejalaDetail[]): string => {
  const topResult = diagnosisData.result.sort((a, b) => b.belief - a.belief)[0]
  const selectedSymptoms = diagnosisData.input.length
  const selectedCodes = diagnosisData.input

  // Detect contradictions
  const contradictionAnalysis = detectContradictions(selectedCodes)
  const alternativeSuggestions = suggestAlternativeDiagnosis(selectedCodes, contradictionAnalysis.contradictions)

  const beliefPercentage = topResult ? Math.round(topResult.belief * 100) : 0
  const gejalaList = gejalaDetails
    .map((g) => g.nama)
    .slice(0, 3)
    .join(", ")

  // If contradictions detected
  if (contradictionAnalysis.hasContradiction) {
    const mainContradiction = contradictionAnalysis.contradictions[0]
    const topAlternative = alternativeSuggestions[0] || "pemeriksaan yang lebih spesifik"

    return `Terima kasih telah menggunakan sistem pemeriksaan kami. Kami memperhatikan bahwa **beberapa masalah yang Anda pilih mungkin tidak bisa terjadi bersamaan**. ${mainContradiction.reason} Sebagai contoh, jika layar komputer tidak menampilkan apa-apa, maka Anda tidak akan bisa melihat pesan error atau layar biru di monitor tersebut.

Berdasarkan pengalaman kami, kemungkinan yang **lebih masuk akal** adalah ${topAlternative} daripada hasil sistem (${topResult?.nama || "hasil yang ditampilkan"} dengan kemungkinan ${beliefPercentage}%). Kami menyarankan untuk:
• **Periksa kembali** masalah yang benar-benar Anda alami
• **Fokus pada satu masalah** yang paling mengganggu terlebih dahulu
• **Konsultasi dengan teknisi** jika masalah berlanjut

*Catatan: Hasil ini adalah prediksi berdasarkan gejala, bukan diagnosa pasti.*`
  }

  // If no contradictions but low correlation
  const categories = [...new Set(gejalaDetails.map((g) => g.kategori))]
  const isLowCorrelation = categories.length > 3

  if (isLowCorrelation) {
    return `Terima kasih telah menggunakan sistem pemeriksaan kami. Berdasarkan ${selectedSymptoms} masalah yang Anda pilih (${gejalaList}), sistem menunjukkan kemungkinan **${topResult?.nama || "masalah umum"}** dengan tingkat kemungkinan ${beliefPercentage}%. Namun, kami memperhatikan bahwa masalah-masalah ini tersebar di beberapa area yang berbeda.

Hal ini menunjukkan kemungkinan ada **beberapa masalah terpisah** atau masalah yang dipilih belum mewakili satu penyebab utama. Kami menyarankan untuk:
• **Pilih masalah yang paling mengganggu** terlebih dahulu
• **Lakukan pemeriksaan bertahap** dimulai dari masalah yang paling jelas
• **Konsultasi dengan teknisi** untuk pemeriksaan menyeluruh jika diperlukan

*Catatan: Hasil ini adalah prediksi berdasarkan gejala, bukan diagnosa pasti.*`
  }

  // If good correlation
  const confidenceLevel = beliefPercentage >= 70 ? "tinggi" : beliefPercentage >= 40 ? "sedang" : "rendah"
  const confidenceExplanation =
    beliefPercentage >= 70
      ? "menunjukkan kemungkinan besar ini adalah penyebab masalah"
      : beliefPercentage >= 40
        ? "menunjukkan kemungkinan yang cukup, namun perlu pemeriksaan lebih lanjut"
        : "menunjukkan kemungkinan yang rendah, mungkin diperlukan pemeriksaan tambahan"

  return `Terima kasih telah menggunakan sistem pemeriksaan kami. Berdasarkan ${selectedSymptoms} masalah yang Anda pilih (${gejalaList}), sistem mengidentifikasi kemungkinan **${topResult?.nama || "masalah spesifik"}** dengan tingkat kemungkinan ${beliefPercentage}%. Masalah-masalah yang Anda pilih menunjukkan pola yang **saling berkaitan** dan dapat terjadi bersamaan.

Tingkat kemungkinan ${beliefPercentage}% tergolong **${confidenceLevel}** dan ${confidenceExplanation}. Kami menyarankan untuk:
• **Ikuti solusi yang diberikan** secara bertahap
• **Mulai dari langkah yang paling mudah** dan aman
• **Backup data penting** sebelum melakukan perbaikan
• **Konsultasi dengan teknisi** jika Anda merasa kurang yakin

*Catatan: Hasil ini adalah prediksi berdasarkan gejala, bukan diagnosa pasti.*`
}

// Generate user-friendly diagnosis explanation with multi-model fallback - GEMINI PRO FIRST
export async function generateDiagnosisExplanation(
  diagnosisData: DiagnosisData,
): Promise<{ content: string; model?: AIModelType }> {
  try {
    // Get detailed symptom information
    const gejalaDetails: GejalaDetail[] = diagnosisData.input.map((kode: string) => {
      const gejala = gejalaData.find((g) => g.kode === kode)
      return (
        gejala || {
          kode,
          nama: kode,
          kategori: "Tidak diketahui",
          deskripsi: "Masalah tidak ditemukan dalam database",
          gambar: "",
          perangkat: [],
        }
      )
    })

    // If no results, return user-friendly no results response
    if (!diagnosisData.result || diagnosisData.result.length === 0) {
      return { content: diagnosisExplainerRole.fallbackResponses.noResults }
    }

    // Check for contradictions first
    const contradictionAnalysis = detectContradictions(diagnosisData.input)
    if (contradictionAnalysis.hasContradiction && contradictionAnalysis.severity === "high") {
      return { content: generateUserFriendlyMockResponse(diagnosisData, gejalaDetails) }
    }

    // Try to generate with AI models - GEMINI PRO FIRST!
    const prompt = diagnosisExplainerRole.promptTemplate(diagnosisData, gejalaDetails)
    const fullPrompt = `${diagnosisExplainerRole.role}\n\n${prompt}`

    if (DEBUG_MODE) {
      console.log("🧠 Generating diagnosis explanation with GEMINI PRO priority...")
    }

    const result = await generateWithFallback(fullPrompt, MODEL_STRATEGIES.DIAGNOSIS_EXPLANATION, {
      temperature: diagnosisExplainerRole.temperature,
      maxOutputTokens: diagnosisExplainerRole.maxResponseTokens,
    })

    if (result && result.content.length >= 100) {
      if (DEBUG_MODE) {
        console.log(`✅ Diagnosis explanation generated using: ${result.model}`)
      }
      return { content: result.content, model: result.model }
    }

    // Fallback to mock response
    if (DEBUG_MODE) {
      console.log("⚠️ Falling back to mock response")
    }
    return { content: generateUserFriendlyMockResponse(diagnosisData, gejalaDetails) }
  } catch (error) {
    console.error("Error in generateDiagnosisExplanation:", error)

    // Get symptom details for fallback
    const gejalaDetails: GejalaDetail[] = diagnosisData.input.map((kode: string) => {
      const gejala = gejalaData.find((g) => g.kode === kode)
      return gejala || { kode, nama: kode, kategori: "Tidak diketahui", deskripsi: "", gambar: "", perangkat: [] }
    })

    // Use user-friendly mock response as final fallback
    return { content: generateUserFriendlyMockResponse(diagnosisData, gejalaDetails) }
  }
}

// Symptom correlation analysis result interface
interface SymptomCorrelationAnalysis {
  isCorrelated: boolean
  categories: string[]
  correlationScore: number
  analysis: string
  contradictions: ReturnType<typeof detectContradictions>
  hasLogicalIssues: boolean
  userFriendlyAnalysis: string
}

// Enhanced symptom correlation analysis with user-friendly language
export function analyzeSymptomCorrelation(selectedSymptoms: string[]): SymptomCorrelationAnalysis {
  const gejalaDetails = selectedSymptoms
    .map((kode) => {
      return gejalaData.find((g) => g.kode === kode)
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item))

  const categories = [...new Set(gejalaDetails.map((g) => g.kategori).filter(Boolean))]
  const categoryCount = categories.length
  const symptomCount = selectedSymptoms.length

  // Detect logical contradictions
  const contradictions = detectContradictions(selectedSymptoms)

  // Calculate correlation score
  let correlationScore = symptomCount > 0 ? 1 - (categoryCount - 1) / symptomCount : 0

  // Reduce score if contradictions exist
  if (contradictions.hasContradiction) {
    correlationScore *= 0.3
  }

  const isCorrelated =
    categoryCount >= 1 &&
    categoryCount <= 3 &&
    symptomCount >= 2 &&
    (!contradictions.hasContradiction || contradictions.severity !== "high")

  const hasLogicalIssues = contradictions.hasContradiction

  // Technical analysis (for internal use)
  let analysis = ""
  if (contradictions.hasContradiction) {
    analysis = `Terdeteksi kontradiksi logis (${contradictions.severity}): ${contradictions.contradictions[0]?.reason || "Gejala tidak dapat terjadi bersamaan"}`
  } else if (symptomCount === 1) {
    analysis = "Hanya satu gejala dipilih, perlu gejala tambahan untuk diagnosa yang akurat"
  } else if (categoryCount === 1) {
    analysis = "Semua gejala dari kategori yang sama, menunjukkan fokus masalah yang spesifik"
  } else if (categoryCount <= 3) {
    analysis = "Gejala dari beberapa kategori terkait, menunjukkan pola kerusakan yang konsisten"
  } else {
    analysis = "Gejala tersebar di banyak kategori, mungkin ada beberapa masalah terpisah"
  }

  // User-friendly analysis
  let userFriendlyAnalysis = ""
  if (contradictions.hasContradiction) {
    userFriendlyAnalysis = "Beberapa masalah yang dipilih mungkin tidak bisa terjadi bersamaan"
  } else if (symptomCount === 1) {
    userFriendlyAnalysis = "Hanya satu masalah dipilih, mungkin perlu informasi tambahan"
  } else if (categoryCount === 1) {
    userFriendlyAnalysis = "Semua masalah berkaitan dengan area yang sama"
  } else if (categoryCount <= 3) {
    userFriendlyAnalysis = "Masalah-masalah yang dipilih saling berkaitan"
  } else {
    userFriendlyAnalysis = "Masalah tersebar di beberapa area berbeda"
  }

  return {
    isCorrelated,
    categories,
    correlationScore,
    analysis,
    contradictions,
    hasLogicalIssues,
    userFriendlyAnalysis,
  }
}

// Test AI connection result interface
interface AIConnectionTestResult {
  success: boolean
  message: string
  availableModels: AIModelType[]
}

// Test AI connection with multi-model support
export async function testAIConnection(): Promise<AIConnectionTestResult> {
  try {
    const ai = getAIService()

    if (!ai) {
      return { success: false, message: "Kunci API tidak tersedia", availableModels: [] }
    }

    const availableModels: AIModelType[] = []

    // Test each model
    for (const model of Object.values(AI_MODELS)) {
      try {
        const aiModel = ai.getGenerativeModel({ model })
        const result = await Promise.race([
          aiModel.generateContent("Test koneksi. Balas dengan 'OK'."),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Timeout")), 5000)),
        ])
        const text = result.response.text()

        if (text && text.trim()) {
          availableModels.push(model)
        }
      } catch (error) {
        console.error(error)
        // Model not available or rate limited
        continue
      }
    }

    return {
      success: availableModels.length > 0,
      message: `${availableModels.length} model tersedia: ${availableModels.map((m) => MODEL_DISPLAY_NAMES[m]).join(", ")}`,
      availableModels,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    return {
      success: false,
      message: `Koneksi gagal: ${errorMessage}`,
      availableModels: [],
    }
  }
}

// Model status interface
interface ModelStatus {
  usage: number
  rateLimited: boolean
}

// Get model status for debugging
export function getModelStatus(): Record<AIModelType, ModelStatus> {
  const status: Record<string, ModelStatus> = {}

  for (const model of Object.values(AI_MODELS)) {
    const usage = modelUsageTracker.get(model)
    status[model] = {
      usage: usage?.count || 0,
      rateLimited: isModelRateLimited(model),
    }
  }

  return status as Record<AIModelType, ModelStatus>
}

// Get model configuration for debugging
export function getModelConfiguration(): typeof MODEL_CONFIG {
  return MODEL_CONFIG
}

// Get model priorities for a specific context
export function getModelPriorities(context: ModelContext): ModelConfig[] {
  return [...MODEL_CONFIG[context]].sort((a, b) => a.priority - b.priority)
}

// Reset model usage tracking (for testing purposes)
export function resetModelUsageTracking(): void {
  modelUsageTracker.clear()
  if (DEBUG_MODE) {
    console.log("Model usage tracking reset")
  }
}
