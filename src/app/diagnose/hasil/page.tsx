"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  CheckCircle,
  MessageSquare,
  ArrowLeft,
  TrendingUp,
  ChevronDown,
  Clock,
  DollarSign,
  AlertCircle,
} from "lucide-react"
import gejalaData from "@/data/gejala.json"
import kerusakanData from "@/data/kerusakan.json"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ExplanationCard } from "@/components/diagnosis/explanation-card"
import { ModernLoading } from "@/components/diagnosis/modern-loading"
import Image from "next/image"

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

interface StoredResult {
  input: string[]
  result: DiagnosisResult[]
  analysis: {
    accuracy_percentage: number
    dominant_category: string
    severity_level: string
  }
  timestamp: string
}

const getKerusakanDetail = (kode: string) => {
  return kerusakanData.find((k) => k.kode === kode)
}

export default function HasilDiagnosaPage() {
  const [diagnosisData, setDiagnosisData] = useState<StoredResult | null>(null)
  const [openSolutions, setOpenSolutions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedData = sessionStorage.getItem("diagnosisResult")
    if (!storedData) {
      router.push("/diagnosa")
      return
    }

    // Parse data immediately but show loading
    const parsedData = JSON.parse(storedData)

    // Simulate API processing with modern loading
    setTimeout(() => {
      setDiagnosisData(parsedData)
    }, 100) // Small delay to ensure loading shows
  }, [router])

  const handleLoadingComplete = () => {
    setIsLoading(false)
  }

  const toggleSolution = (kode: string) => {
    setOpenSolutions((prev) => (prev.includes(kode) ? prev.filter((k) => k !== kode) : [...prev, kode]))
  }

  const handleDiscussInForum = () => {
    if (!diagnosisData) return

    // Get selected symptoms details
    const selectedSymptoms = diagnosisData.input
      .map((kode) => {
        const gejala = gejalaData.find((g) => g.kode === kode)
        return gejala ? `${gejala.kode}: ${gejala.nama}` : kode
      })
      .join(", ")

    // Get top diagnosis
    const topDiagnosis = diagnosisData.result
      .sort((a, b) => b.belief - a.belief)
      .slice(0, 3)
      .map((r) => `${r.nama} (${(r.belief * 100).toFixed(1)}%)`)
      .join(", ")

    // Create forum post data
    const forumData = {
      symptoms: selectedSymptoms,
      diagnosis: topDiagnosis,
      timestamp: diagnosisData.timestamp,
    }

    // Store in sessionStorage and navigate
    sessionStorage.setItem("forumPostData", JSON.stringify(forumData))
    router.push("/forum/new")
  }

  // Show loading screen
  if (isLoading || !diagnosisData) {
    return <ModernLoading onComplete={handleLoadingComplete} duration={2000} />
  }

  const selectedGejalaDetails = diagnosisData.input.map((kode) => {
    const gejala = gejalaData.find((g) => g.kode === kode)
    return gejala || { kode, nama: kode, kategori: "Unknown", deskripsi: "", gambar: "", perangkat: [] }
  })

  const topResults = diagnosisData.result.sort((a, b) => b.belief - a.belief).slice(0, 3)

  const getBeliefColor = (belief: number) => {
    // Ensure belief is within valid range
    const validBelief = Math.min(1, Math.max(0, belief || 0))
    if (validBelief >= 0.7) return "text-red-600"
    if (validBelief >= 0.4) return "text-orange-600"
    return "text-yellow-600"
  }

  const getBeliefBadge = (belief: number) => {
    const validBelief = Math.min(1, Math.max(0, belief || 0))
    if (validBelief >= 0.7) return { variant: "destructive" as const, text: "Tinggi" }
    if (validBelief >= 0.4) return { variant: "default" as const, text: "Sedang" }
    return { variant: "secondary" as const, text: "Rendah" }
  }

  const getDifficultyColor = (tingkat: string) => {
    switch (tingkat) {
      case "Ringan":
        return "bg-green-100 text-green-800"
      case "Sedang":
        return "bg-yellow-100 text-yellow-800"
      case "Berat":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/diagnosa")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Diagnosa
        </Button>

        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <CheckCircle className="h-8 w-8 text-green-600" />
          Hasil Diagnosa Kerusakan
        </h1>
        <p className="text-gray-600">Berikut adalah hasil analisis berdasarkan gejala yang Anda pilih</p>
      </div>

      {/* Responsive Grid Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6">
        {/* Main Content - Left Side (75% on desktop) */}
        <div className="xl:col-span-3 lg:col-span-2 space-y-6 order-2 lg:order-1">
          {/* Hasil Diagnosa */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Kemungkinan Kerusakan Terdeteksi
              </CardTitle>
              <CardDescription>Diurutkan berdasarkan tingkat kepercayaan (belief value)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topResults.length > 0 ? (
                topResults.map((result, index) => {
                  const kerusakanDetail = getKerusakanDetail(result.kode)

                  return (
                    <Card key={result.kode} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {result.kode}
                            </Badge>
                            <Badge {...getBeliefBadge(result.belief)}>{getBeliefBadge(result.belief).text}</Badge>
                            {kerusakanDetail?.tingkat_kerusakan && (
                              <Badge className={getDifficultyColor(kerusakanDetail.tingkat_kerusakan)}>
                                {kerusakanDetail.tingkat_kerusakan}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{result.nama}</h3>

                          {/* Deskripsi kerusakan */}
                          {kerusakanDetail?.deskripsi && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{kerusakanDetail.deskripsi}</p>
                          )}

                          {/* Additional Info */}
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            {kerusakanDetail?.estimasi_biaya && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
                                {kerusakanDetail.estimasi_biaya}
                              </div>
                            )}
                            {kerusakanDetail?.waktu_perbaikan && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {kerusakanDetail.waktu_perbaikan}
                              </div>
                            )}
                          </div>

                          {/* Dempster-Shafer Values */}
                          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
                            <div className="bg-blue-50 dark:bg-blue-100/75 font-bold p-2 rounded">
                              <div className="font-medium text-gray-800">Belief</div>
                              <div className="text-blue-600 dark:text-blue-900">{(result.belief * 100).toFixed(1)}%</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-100/75 font-bold  p-2 rounded">
                              <div className="font-medium text-gray-800">Plausibility</div>
                              <div className="text-green-600 dark:text-green-900">{(result.plausibility * 100).toFixed(1)}%</div>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-100/75 font-bold  p-2 rounded">
                              <div className="font-medium text-gray-800">Uncertainty</div>
                              <div className="text-orange-600 dark:text-orange-900">{(result.uncertainty * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getBeliefColor(result.belief)}`}>
                            {(result.belief * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">Kepercayaan</div>
                        </div>
                      </div>

                      <Progress value={result.belief * 100} className="mb-3" />

                      {/* Collapsible Solution */}
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-transparent"
                          onClick={() => toggleSolution(result.kode)}
                        >
                          <span>Lihat Solusi Detail</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${openSolutions.includes(result.kode) ? "rotate-180" : ""
                              }`}
                          />
                        </Button>
                        {openSolutions.includes(result.kode) && (
                          <div className="mt-3 rounded-lg p-4">
                            {kerusakanDetail?.solusi || result.solusi ? (
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {kerusakanDetail?.solusi || result.solusi || "Solusi tidak tersedia"}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-amber-600">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>Solusi detail sedang dalam pengembangan</span>
                                </div>
                                <div className="bg-white rounded-lg p-3 border">
                                  <h4 className="font-medium mb-2">Langkah Umum Perbaikan</h4>
                                  <ul className="text-sm space-y-1 text-gray-600">
                                    <li>• Backup data penting sebelum melakukan perbaikan</li>
                                    <li>• Matikan perangkat dan lepas kabel power</li>
                                    <li>• Periksa koneksi hardware yang longgar</li>
                                    <li>• Konsultasikan dengan teknisi jika diperlukan</li>
                                    <li>• Gunakan tools diagnostic untuk konfirmasi</li>
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Tidak ada kerusakan yang terdeteksi berdasarkan gejala yang dipilih.</p>
                  <Button variant="outline" onClick={() => router.push("/diagnosa")} className="mt-4">
                    Coba Diagnosa Lagi
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Penjelasan AI - Moved below diagnosis results */}
          <ExplanationCard diagnosisData={diagnosisData} />
        </div>

        {/* Sidebar - Right Side (25% on desktop) */}
        <div className="xl:col-span-1 lg:col-span-1 space-y-6 order-1 lg:order-2">
          {/* Action Buttons */}
          {topResults.length > 0 && (
            <div className="space-y-3">
              <Button onClick={handleDiscussInForum} className="w-full cursor-pointer">
                <MessageSquare className="mr-2 h-4 w-4" />
                Diskusikan di Forum
              </Button>
              <Button variant="outline" onClick={() => router.push("/diagnosa")} className="w-full cursor-pointer">
                Diagnosa Ulang
              </Button>
            </div>
          )}

          {/* Ringkasan Gejala */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gejala yang Dipilih</CardTitle>
              <CardDescription>Total {diagnosisData.input.length} gejala terdeteksi</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedGejalaDetails.map((gejala) => (
                  <div key={gejala.kode} className="flex flex-row sm:flex-col items-center gap-3 p-3 bg-blue-50 dark:bg-background rounded-lg">
                    {gejala.gambar && (
                      <Image
                        height="500"
                        width="500"
                        src={gejala.gambar || "/placeholder.svg"}
                        alt={gejala.nama}
                        className="h-10 w-10 md:h-26 md:w-full object-cover rounded-lg flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-1">
                        <Badge variant="outline" className="text-xs">
                          {gejala.kode}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {gejala.kategori}
                        </Badge>
                      </div>
                      <p className="font-medium text-sm leading-tight">{gejala.nama}</p>
                      {gejala.deskripsi && (
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{gejala.deskripsi}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ringkasan Diagnosa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-200 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">{diagnosisData.input.length}</div>
                  <div className="text-xs text-gray-600">Gejala</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-200 rounded-lg">
                  <div className="text-lg font-bold text-green-600">{topResults.length}</div>
                  <div className="text-xs text-gray-600">Kemungkinan</div>
                </div>
              </div>

              {diagnosisData.analysis && (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Akurasi</span>
                    <span className="font-semibold">{diagnosisData.analysis.accuracy_percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kategori Dominan</span>
                    <span className="font-semibold text-xs">{diagnosisData.analysis.dominant_category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tingkat Keparahan</span>
                    <span className="font-semibold">{diagnosisData.analysis.severity_level}</span>
                  </div>
                </div>
              )}

              <div className="text-sm">
                <p className="font-medium mb-1">💡 Tips Penting</p>
                <ul className="text-gray-600 dark:text-gray-400 space-y-1 text-xs">
                  <li>• Backup data sebelum perbaikan</li>
                  <li>• Konsultasi teknisi untuk kerusakan serius</li>
                  <li>• Gunakan tools diagnostic untuk konfirmasi</li>
                  <li>• Periksa garansi sebelum membongkar</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
