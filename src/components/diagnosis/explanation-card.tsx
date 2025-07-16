// /component/diagnosis/explanation-card.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Brain, Loader2, AlertCircle, Sparkles, Zap, Crown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";
import { useSession } from "next-auth/react"; // Import useSession

interface DiagnosisResult {
  kode: string;
  nama: string;
  belief: number;
  plausibility: number;
  uncertainty: number;
  solusi: string;
  confidence_level: string;
  contributing_symptoms: string[];
}

interface StoredResult {
  input: string[];
  result: DiagnosisResult[];
  analysis: {
    accuracy_percentage: number;
    dominant_category: string;
    severity_level: string;
  };
  timestamp: string;
  selectedGejalaDetails?: { kode: string; nama: string }[];
}

interface ExplanationCardProps {
  diagnosisData: StoredResult;
}

// UserTokenData diimpor dari types/types.ts
import type { UserTokenData } from "@/types/types";

export function ExplanationCard({ diagnosisData }: ExplanationCardProps) {
  const { data: session, status } = useSession(); // Ambil sesi pengguna
  const [explanation, setExplanation] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasExplanation, setHasExplanation] = useState(false);
  const [usedModel, setUsedModel] = useState<string>("");
  // const [modelId, setModelId] = useState<string>(""); // Tidak digunakan
  const [userTokenData, setUserTokenData] = useState<UserTokenData | null>(null); // State bisa null saat awal
  const [error, setError] = useState<string>("");
  const [isFetchingTokens, setIsFetchingTokens] = useState(true); // Status loading token

  // --- Load dan manage token data dari API ---
  const fetchUserTokens = useCallback(async () => {
    if (status === "loading" || !session?.user?.id) {
      setIsFetchingTokens(true);
      return;
    }
    setIsFetchingTokens(true);
    try {
      const response = await fetch("/api/user-tokens");
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Gagal memuat data token.");
      }
      const fetchedTokenData: UserTokenData = await response.json();
      setUserTokenData(fetchedTokenData);
    } catch (err) {
      console.error("Error fetching user tokens:", err);
      setError("Gagal memuat data token. Silakan coba lagi nanti.");
      setUserTokenData(null); // Set ke null jika gagal
    } finally {
      setIsFetchingTokens(false);
    }
  }, [session?.user?.id, status]);

  useEffect(() => {
    fetchUserTokens();
  }, [fetchUserTokens]);


  const generateExplanation = async () => {
    if (!session?.user?.id) {
      setError("Anda harus login untuk menggunakan fitur AI ini.");
      toast.error("Silakan login!");
      return;
    }
    if (!userTokenData || userTokenData.dailyTokens <= 0) {
      setError("Token harian Anda sudah habis! Token akan direset jam 7 pagi WIB.");
      toast.error("Token habis!");
      return;
    }

    setIsLoading(true);
    setError("");
    setExplanation("");
    setUsedModel("");
    // setModelId(""); // Tidak digunakan

    try {
      // --- Kurangi token melalui API ---
      const decrementResponse = await fetch("/api/user-tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "decrement", tokensUsed: 1 }),
      });

      if (!decrementResponse.ok) {
        const errorData = await decrementResponse.json();
        throw new Error(errorData.message || "Gagal mengurangi token.");
      }
      const updatedTokenResult = await decrementResponse.json();
      // Perbarui state token dengan respons dari API
      setUserTokenData(prev => prev ? {
        ...prev,
        dailyTokens: updatedTokenResult.dailyTokens,
        totalUsage: updatedTokenResult.totalUsage,
        lastResetDate: updatedTokenResult.lastResetDate,
      } : null);

      // Prepare diagnosis context
      const topResult = diagnosisData.result.sort((a, b) => b.belief - a.belief)[0];
      const context = {
        symptoms: diagnosisData.input,
        topDiagnosis: topResult,
        analysis: diagnosisData.analysis,
        timestamp: diagnosisData.timestamp,
        selectedSymptomsFormatted: (diagnosisData.selectedGejalaDetails || [])
          .map((gejala, i) => `${i + 1}. ${gejala.kode} - ${gejala.nama}`)
          .join("\n"),
      };

      const prompt = `Jelaskan hasil diagnosa berikut dengan SINGKAT dan MUDAH DIPAHAMI (maksimal 3000 karakter):
      
      Gejala yang dipilih:
      ${context.selectedSymptomsFormatted}
      
      Diagnosa utama: ${diagnosisData.result?.[0]
          ? `${diagnosisData.result[0].nama} (${(
            diagnosisData.result[0].belief * 100
          ).toFixed(1)}%)`
          : "Tidak tersedia"
        }
      
      Berikan penjelasan SINGKAT yang mencakup:
      1. Apakah gejala yang dipilih saling berkaitan secara logis? Jika tidak, nyatakan dengan jujur bahwa gejala tampak tidak konsisten atau acak.
      2. Mengapa diagnosa ini muncul berdasarkan gejala yang dipilih? (1-2 kalimat)
      3. Apa arti tingkat kepercayaan (misalnya: “belief 40.5%”) dari diagnosa utama? (1 kalimat)
      4. Langkah praktis yang disarankan untuk pengguna (maksimal 3 poin)
      
      CATATAN PENTING:
      - Jika nama gejala tidak jelas, berikan peringatan eksplisit agar pengguna memeriksa kembali input-nya.
      - Jika hasil diagnosa tidak relevan dengan gejala, sampaikan secara jujur bahwa sistem belum mampu menarik kesimpulan yang tepat.
      - Gunakan bahasa Indonesia yang sederhana, tidak bertele-tele, dan langsung ke inti.
      - Maksimal 3000 karakter, fokus pada hal penting dan mudah dipahami.`;


      console.log("🧠 Sending diagnosis explanation request with context: diagnosis (Gemini Pro Priority)");

      const response = await fetch("/api/ai-assistance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: prompt,
          history: [],
          context: "diagnosis", // IMPORTANT: This triggers Gemini Pro priority (diagnosis config)
        }),
      });

      if (!response.ok) {
        throw new Error("Gagal mendapatkan penjelasan AI");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let done = false;
      let fullExplanation = "";
      let currentModel = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;

        if (value) {
          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                done = true;
                break;
              }

              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  fullExplanation += parsed.content;
                  setExplanation(fullExplanation);
                }
                if (parsed.model && parsed.model !== "connecting") {
                  currentModel = parsed.model;
                  setUsedModel(parsed.model);
                  console.log(`🤖 Using model: ${parsed.model}`);
                }
                if (parsed.strategy) {
                  console.log(`📋 Strategy: ${parsed.strategy}`);
                }
                if (parsed.error) {
                  throw new Error(parsed.error);
                }
              } catch (e) {
                console.error(e);
                // Ignore parsing errors for partial chunks
              }
            }
          }
        }
      }

      setHasExplanation(true);

      if (currentModel && currentModel !== "offline") {
        const isGeminiPro = currentModel.includes("gemini-2.5-pro");
        if (isGeminiPro) {
          toast.success(`✨ Penjelasan AI berhasil dimuat menggunakan Gemini Pro 2.5 (Model Utama)`);
        } else {
          toast.success(`Penjelasan AI berhasil dimuat menggunakan ${currentModel} (Fallback)`);
        }
      } else if (currentModel === "offline") {
        toast.success("Penjelasan berhasil dimuat (Mode Offline)");
      } else {
        toast.success("Penjelasan AI berhasil dimuat");
      }
    } catch (error) {
      console.error("Error generating explanation:", error);
      setError("Gagal mendapatkan penjelasan AI. Silakan coba lagi.");
      toast.error("Gagal mendapatkan penjelasan AI");

      // --- Kembalikan token jika error ---
      // Ini dilakukan di sisi klien untuk feedback cepat,
      // tapi server harus menjadi sumber kebenaran utama.
      setUserTokenData(prev => prev ? {
        ...prev,
        dailyTokens: prev.dailyTokens + 1,
        totalUsage: Math.max(0, prev.totalUsage - 1),
      } : null);

      // Fallback explanation for offline/error mode
      const fallbackExplanation = `**Penjelasan Diagnosa (Mode Offline)**

Berdasarkan gejala yang Anda pilih, sistem mengidentifikasi kemungkinan **${diagnosisData.result[0]?.nama}** dengan tingkat kepercayaan **${((diagnosisData.result[0]?.belief || 0) * 100).toFixed(1)}%**.

**Mengapa hasil ini muncul?**
Gejala yang dipilih menunjukkan pola yang konsisten dengan kerusakan ini berdasarkan database sistem menggunakan metode Dempster-Shafer.

**Interpretasi Tingkat Kepercayaan:**
Nilai ${((diagnosisData.result[0]?.belief || 0) * 100).toFixed(1)}% menunjukkan tingkat keyakinan sistem terhadap diagnosa ini berdasarkan evidence yang ada.

**Langkah yang disarankan:**
• **Backup data penting** sebelum melakukan perbaikan
• **Ikuti solusi yang diberikan** secara bertahap mulai dari yang paling mudah
• **Konsultasi dengan teknisi** jika tingkat kepercayaan tinggi atau masalah kompleks

*Catatan: Hasil ini adalah prediksi berdasarkan gejala, bukan diagnosa pasti. Mode offline - penjelasan terbatas.*`;

      setExplanation(fallbackExplanation);
      setUsedModel("Offline Mode");
      setHasExplanation(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get model badge variant and icon
  const getModelBadgeInfo = (model: string) => {
    if (model.includes("gemini-2.5-pro")) {
      return { variant: "default" as const, icon: Crown, color: "text-yellow-600" };
    } else if (model.includes("gemini")) {
      return { variant: "secondary" as const, icon: Sparkles, color: "text-blue-600" };
    } else if (model.includes("Offline")) {
      return { variant: "outline" as const, icon: AlertCircle, color: "text-gray-600" };
    } else {
      return { variant: "outline" as const, icon: Zap, color: "text-green-600" };
    }
  };

  const modelBadgeInfo = usedModel ? getModelBadgeInfo(usedModel) : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-600" />
          Penjelasan AI
          {usedModel && modelBadgeInfo && (
            <Badge variant={modelBadgeInfo.variant} className={`text-xs gap-1 ${modelBadgeInfo.color}`}>
              <modelBadgeInfo.icon className="h-3 w-3" />
              {usedModel}
              {usedModel.includes("gemini-2.5-pro") && <span className="text-xs">(Utama)</span>}
            </Badge>
          )}
          {isLoading && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                <div className="flex items-center gap-1">
                  <Crown className="h-4 w-4 text-yellow-600" />
                  AI sedang menganalisis hasil diagnosa (Prioritas: Gemini Pro 2.5)...
                </div>
              </div>
            </div>
          )}
        </CardTitle>
        <CardDescription>
          Penjelasan singkat dan mudah dipahami tentang hasil diagnosa menggunakan Gemini Pro
        </CardDescription>

        {/* Token Display */}
        {isFetchingTokens ? (
          <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-gray-700 p-2 rounded animate-pulse">
            <Loader2 className="h-4 w-4 animate-spin mr-2" /> <span>Memuat token...</span>
          </div>
        ) : (
          <div className="flex items-center justify-between text-xs bg-blue-50 dark:bg-gray-700 p-2 rounded">
            <span>
              Token tersisa: <strong>{userTokenData?.dailyTokens ?? 'N/A'}</strong>/{userTokenData?.maxDailyTokens ?? 'N/A'}
            </span>
            <span className="text-gray-500 dark:text-gray-300">Reset jam 7 pagi WIB</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {!hasExplanation && !isLoading && !isFetchingTokens && (
          <div className="text-center py-6">
            <Brain className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-sm text-gray-600 dark:text-gray-500 mb-4">
              Dapatkan penjelasan singkat dan mudah dipahami tentang hasil diagnosa
            </p>
            <Button
              onClick={generateExplanation}
              className="w-full gap-2 cursor-pointer"
              disabled={!session?.user?.id || (userTokenData?.dailyTokens ?? 0) <= 0} // Disable jika tidak login atau token habis
            >
              <Brain className="h-4 w-4" />
              Minta Penjelasan AI
            </Button>
            {(!session?.user?.id) && (
              <p className="text-red-500 text-xs mt-2">Silakan login untuk menggunakan fitur ini.</p>
            )}
            {session?.user?.id && (userTokenData?.dailyTokens ?? 0) <= 0 && (
              <p className="text-red-500 text-xs mt-2">Token habis! Reset otomatis jam 7 pagi WIB</p>
            )}
          </div>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">{error}</AlertDescription>
          </Alert>
        )}

        {explanation && (
          <div>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>
            </div>

            {usedModel.includes("gemini-2.5-pro") && (
              <Alert className="border-yellow-50 bg-yellow-50 mt-6">
                <Crown className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  ✨ Penjelasan ini dihasilkan menggunakan <strong>Gemini Pro 2.5</strong> - model AI terbaik untuk
                  analisis diagnosa yang akurat dan mendalam.
                </AlertDescription>
              </Alert>
            )}

            {userTokenData && userTokenData.dailyTokens <= 5 && userTokenData.dailyTokens > 0 && (
              <Alert className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  Token Anda hampir habis! Sisa {userTokenData.dailyTokens} token.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {!hasExplanation && !isLoading && !isFetchingTokens && (
          <div className="text-xs text-gray-500 bg-blue-50 dark:bg-blue-100 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 mb-1">Tentang Penjelasan AI</p>
                <p className="text-blue-700 mb-2">
                  AI akan memberikan penjelasan singkat dan mudah dipahami tentang hasil diagnosa, termasuk langkah
                  praktis yang bisa langsung diterapkan.
                </p>
                <div className="flex items-center gap-1 text-blue-600 text-xs">
                  <Crown className="h-3 w-3 text-yellow-600" />
                  <span className="font-medium">Gemini Pro 2.5</span> sebagai model utama dengan fallback otomatis ke
                  model lain jika diperlukan.
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}