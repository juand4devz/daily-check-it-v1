"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare,
  ArrowLeft,
  TrendingUp,
  ChevronDown,
  Clock,
  AlertCircle,
  Loader2,
  ScanText,
  LucideAlertTriangle,
  BowArrow,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExplanationCard } from "@/components/diagnosis/explanation-card";
import { ModernLoading } from "@/components/diagnosis/modern-loading";
import Image from "next/image";
import { StoredDiagnosisResult, Gejala } from "@/types/diagnose";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export default function HasilDiagnosaPage() {
  const router = useRouter();

  const [diagnosisData, setDiagnosisData] = useState<StoredDiagnosisResult | null>(null);
  const [openSolutions, setOpenSolutions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingForum, setIsLoadingForum] = useState(false); // State baru untuk tombol forum

  // Mengelola durasi loading yang ditangkap dari API
  const [loadingDuration, setLoadingDuration] = useState<number | null>(null);

  // --- Mengelola Durasi Loading Modern ---
  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  // --- Mengambil Data dari Session Storage ---
  useEffect(() => {
    const storedData = sessionStorage.getItem("diagnosisResult");
    if (!storedData) {
      router.push("/diagnose");
      return;
    }

    try {
      const parsedData: StoredDiagnosisResult = JSON.parse(storedData);
      setDiagnosisData(parsedData);
      setLoadingDuration(parsedData.loading_duration || 1000); // Gunakan durasi dari API, fallback ke 1.5s

      // Catatan: Komponen ModernLoading sekarang mengelola sendiri timer,
      // sehingga kita tidak perlu lagi setTimeout di sini.
      // Kita hanya perlu mengatur `isLoading` menjadi `false`
      // setelah `ModernLoading` memanggil `onComplete`.

    } catch (caughtError: unknown) {
      console.error("Gagal memparsing data dari sessionStorage:", caughtError);
      let errorMessage = "Terjadi kesalahan saat memuat hasil diagnosa.";
      if (caughtError instanceof Error) {
        errorMessage = caughtError.message;
      }
      toast.error(errorMessage);
      router.push("/diagnose");
    }
  }, [router]);

  // --- Mengelola Solusi yang Dibuka/Ditutup ---
  const toggleSolution = useCallback((kode: string) => {
    setOpenSolutions((prevOpenSolutions) =>
      prevOpenSolutions.includes(kode)
        ? prevOpenSolutions.filter((k) => k !== kode)
        : [...prevOpenSolutions, kode]
    );
  }, []);

  // --- Penangan Diskusi di Forum ---
  const handleDiscussInForum = useCallback(() => {
    if (!diagnosisData) return;
    setIsLoadingForum(true);

    const timer = setTimeout(() => {
      // Mengambil detail gejala yang dipilih dari data yang diterima
      const selectedSymptomsForForum = diagnosisData.selectedGejalaDetails
        .map((gejala: Gejala) => `${gejala.kode}: ${gejala.nama}`)
        .join(", ");

      const topDiagnosisForForum = diagnosisData.result
        .sort((a, b) => b.belief - a.belief)
        .slice(0, 3)
        .map((r) => `${r.nama} (${(r.belief * 100).toFixed(1)}%)`)
        .join(", ");

      const forumPostData = {
        symptoms: selectedSymptomsForForum,
        diagnosis: topDiagnosisForForum,
        timestamp: diagnosisData.timestamp,
      };

      sessionStorage.setItem("forumPostData", JSON.stringify(forumPostData));
      router.push("/forum/new");

      // setIsLoadingForum(false);
    }, 100); // Durasi 0.1 detik untuk loading tombol

    return () => clearTimeout(timer);
  }, [diagnosisData, router]);

  // --- Fungsi Pembantu untuk Gaya UI ---
  const getBeliefColor = useCallback((belief: number): string => {
    const validBelief = Math.min(1, Math.max(0, belief || 0));
    if (validBelief >= 0.7) return "text-red-600";
    if (validBelief >= 0.4) return "text-orange-600";
    return "text-yellow-600";
  }, []);

  const getBeliefBadge = useCallback((belief: number) => {
    const validBelief = Math.min(1, Math.max(0, belief || 0));
    if (validBelief >= 0.7) return { variant: "destructive" as const, text: "Tinggi" };
    if (validBelief >= 0.4) return { variant: "default" as const, text: "Sedang" };
    return { variant: "secondary" as const, text: "Rendah" };
  }, []);

  const getDifficultyColor = useCallback((tingkat: string): string => {
    switch (tingkat) {
      case "Ringan":
        return "bg-green-100 text-green-800";
      case "Sedang":
        return "bg-yellow-100 text-yellow-800";
      case "Berat":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }, []);

  if (isLoading || !diagnosisData) {
    return <ModernLoading duration={loadingDuration || 1000} onComplete={handleLoadingComplete} />;
  }

  const topResults = diagnosisData.result.sort((a, b) => b.belief - a.belief).slice(0, 3);
  const selectedGejalaDetailsToDisplay = diagnosisData.selectedGejalaDetails;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.push("/diagnose")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Diagnosa
        </Button>

        <h1 className="text-lg md:text-3xl font-bold mb-2 flex items-center gap-2">
          <ScanText className="h-14 w-14" />
          Hasil Diagnosa Kerusakan
        </h1>
        <p className="text-gray-600">
          Berikut adalah hasil analisis berdasarkan gejala yang Anda pilih.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 lg:grid-cols-3 gap-6">
        <div className="xl:col-span-3 lg:col-span-2 space-y-6 order-2 lg:order-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Kemungkinan Kerusakan Terdeteksi
              </CardTitle>
              <CardDescription>
                Diurutkan berdasarkan tingkat kepercayaan (belief value).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topResults.length > 0 ? (
                topResults.map((result, index) => {
                  const kerusakanDetail = result;

                  return (
                    <Card key={kerusakanDetail.kode} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex flex-col md:flex-row justify-between items-start">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs">
                                #{index + 1}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {kerusakanDetail.kode}
                              </Badge>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    {...getBeliefBadge(kerusakanDetail.belief)}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium cursor-pointer ${getBeliefBadge(kerusakanDetail.belief)
                                      }`}
                                  >
                                    <BowArrow className="w-3 h-3" />
                                    {getBeliefBadge(kerusakanDetail.belief).text}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Tingkat Kepercayaan</p>
                                </TooltipContent>
                              </Tooltip>

                              {kerusakanDetail.tingkat_kerusakan && (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge
                                      className={`flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-medium cursor-pointer ${getDifficultyColor(kerusakanDetail.tingkat_kerusakan)
                                        }`}
                                    >
                                      <LucideAlertTriangle className="w-3 h-3" />
                                      {kerusakanDetail.tingkat_kerusakan}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Tingkat Kerusakan</p>
                                  </TooltipContent>
                                </Tooltip>
                              )}
                            </div>
                            <div className="text-left md:text-right">
                              <div className={`text-4xl font-bold ${getBeliefColor(kerusakanDetail.belief)}`}>
                                {(kerusakanDetail.belief * 100).toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">Kepercayaan</div>
                            </div>
                          </div>

                          <h3 className="font-semibold text-lg mb-2">{kerusakanDetail.nama}</h3>

                          {/* Deskripsi sudah dihandle oleh ReactMarkdown */}
                          {kerusakanDetail.deskripsi && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{kerusakanDetail.deskripsi}</p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            {kerusakanDetail.estimasi_biaya && (
                              <div className="flex items-center gap-1">
                                {kerusakanDetail.estimasi_biaya}
                              </div>
                            )}
                            {kerusakanDetail.waktu_perbaikan && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {kerusakanDetail.waktu_perbaikan}
                              </div>
                            )}
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-xs">
                            <div className="bg-blue-50 dark:bg-blue-100/75 font-bold p-2 rounded">
                              <div className="font-medium text-gray-800">Belief</div>
                              <div className="text-blue-600 dark:text-blue-900">{(kerusakanDetail.belief * 100).toFixed(1)}%</div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-100/75 font-bold p-2 rounded">
                              <div className="font-medium text-gray-800">Plausibility</div>
                              <div className="text-green-600 dark:text-green-900">{(kerusakanDetail.plausibility * 100).toFixed(1)}%</div>
                            </div>
                            <div className="bg-orange-50 dark:bg-orange-100/75 font-bold p-2 rounded">
                              <div className="font-medium text-gray-800">Uncertainty</div>
                              <div className="text-orange-600 dark:text-orange-900">{(kerusakanDetail.uncertainty * 100).toFixed(1)}%</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Progress value={kerusakanDetail.belief * 100} />

                      <div className="">
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-transparent"
                          onClick={() => toggleSolution(kerusakanDetail.kode)}
                        >
                          <span>Lihat Solusi Detail</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${openSolutions.includes(kerusakanDetail.kode) ? "rotate-180" : ""}`}
                          />
                        </Button>
                        {openSolutions.includes(kerusakanDetail.kode) && (
                          <div className="mt-3 rounded-lg p-4">
                            {kerusakanDetail.solusi ? (
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {kerusakanDetail.solusi}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="flex items-center gap-2 text-amber-600">
                                  <AlertCircle className="h-4 w-4" />
                                  <span>Solusi detail sedang dalam pengembangan.</span>
                                </div>
                                <div className="bg-white rounded-lg p-3 border">
                                  <h4 className="font-medium mb-2">Langkah Umum Perbaikan</h4>
                                  <ul className="text-sm space-y-1 text-gray-600">
                                    <li>• Cadangkan data penting sebelum melakukan perbaikan.</li>
                                    <li>• Matikan perangkat dan cabut kabel daya.</li>
                                    <li>• Periksa koneksi perangkat keras yang longgar.</li>
                                    <li>• Konsultasikan dengan teknisi jika diperlukan.</li>
                                    <li>• Gunakan alat diagnostik untuk konfirmasi.</li>
                                  </ul>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Tidak ada kerusakan yang terdeteksi berdasarkan gejala yang dipilih.
                  </p>
                  <Button variant="outline" onClick={() => router.push("/diagnose")} className="mt-4">
                    Coba Diagnosa Lagi
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <ExplanationCard diagnosisData={diagnosisData} />
        </div>

        <div className="xl:col-span-1 lg:col-span-1 space-y-6 order-1 lg:order-2">
          {topResults.length > 0 && (
            <div className="space-y-3">
              <Button onClick={handleDiscussInForum} disabled={isLoadingForum} className="w-full cursor-pointer">
                {isLoadingForum ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Memuat...
                  </>
                ) : (
                  <>
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Diskusikan di Forum
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={() => router.push("/diagnose")} className="w-full cursor-pointer">
                Diagnosa Ulang
              </Button>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Gejala yang Dipilih</CardTitle>
              <CardDescription>Total {diagnosisData.input.length} gejala terdeteksi.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {selectedGejalaDetailsToDisplay.length > 0 ? (
                  selectedGejalaDetailsToDisplay.map((gejala) => (
                    <Card key={gejala.kode} className="flex flex-col items-start gap-2 p-3 rounded-lg">
                      {gejala.gambar && gejala.gambar !== "" ? (
                        <Image
                          height={500}
                          width={500}
                          src={gejala.gambar}
                          alt={gejala.nama || gejala.kode}
                          className="h-42 w-full object-cover rounded-md"
                        />
                      ) : (
                        <div className="h-20 w-full bg-gray-200 dark:bg-gray-700 rounded-md flex items-center justify-center text-xs text-gray-500">
                          Tidak ada gambar
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <Badge variant="outline" className="text-xs">
                            {gejala.kode}
                          </Badge>
                          {gejala.kategori && gejala.kategori !== "Unknown" && (
                            <Badge variant="secondary" className="text-xs">
                              {gejala.kategori}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm leading-tight">{gejala.nama || "Nama tidak tersedia"}</p>
                        {gejala.deskripsi && gejala.deskripsi !== "Detail gejala tidak tersedia." ? (
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{gejala.deskripsi}</p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">Detail gejala tidak tersedia.</p>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center">Tidak ada detail gejala yang tersedia.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tingkat Kepercayaan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span>Belief Score</span>
                <span className={`font-bold text-lg ${getBeliefColor(topResults[0]?.belief || 0)}`}>
                  {(topResults[0]?.belief || 0).toFixed(3)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>Confidence Level</span>
                <span className="font-semibold">{diagnosisData.analysis.confidence_level}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}