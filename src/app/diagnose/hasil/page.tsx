// /diagnose/hasil/page.tsx
"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  MessageSquare,
  ArrowLeft,
  TrendingUp,
  ChevronDown,
  Clock,
  DollarSign,
  AlertCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ExplanationCard } from "@/components/diagnosis/explanation-card";
import { ModernLoading } from "@/components/diagnosis/modern-loading";
import Image from "next/image";

// --- Interfaces ---
interface DiagnosisResult {
  kode: string;
  nama: string;
  deskripsi: string;
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

// Interface untuk Gejala lengkap yang diterima dari backend
interface GejalaFromBackend {
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

// Interface untuk data yang disimpan di sessionStorage
interface StoredResult {
  input: string[]; // Ini adalah array kode gejala yang dipilih (string[])
  perangkat?: string;
  result: DiagnosisResult[];
  analysis: {
    accuracy_percentage: number;
    dominant_category: string;
    severity_level: string;
    total_symptoms: number; // Pastikan ini juga ada di analysis
  };
  timestamp: string;
  selectedGejalaDetails?: GejalaFromBackend[]; // Ini akan berisi detail lengkap gejala yang dipilih
}

export default function HasilDiagnosaPage() {
  const router = useRouter(); // Pastikan useRouter dipanggil di awal

  const [diagnosisData, setDiagnosisData] = useState<StoredResult | null>(null);
  const [openSolutions, setOpenSolutions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- Mengelola Durasi Loading Modern ---
  // Pastikan useCallback ini dideklarasikan di awal dan tidak bersyarat
  const handleLoadingComplete = useCallback(() => {
    setIsLoading(false);
  }, []);

  // --- Mengambil Data dari Session Storage ---
  // Pastikan useEffect ini dideklarasikan di awal dan tidak bersyarat
  useEffect(() => {
    const storedData = sessionStorage.getItem("diagnosisResult");
    if (!storedData) {
      router.push("/diagnose"); // Arahkan kembali jika tidak ada data
      return; // Penting: keluar dari efek setelah redirect
    }

    try {
      const parsedData: StoredResult = JSON.parse(storedData);

      // Mengatur diagnosisData setelah penundaan singkat untuk menampilkan ModernLoading
      setTimeout(() => {
        setDiagnosisData(parsedData);
      }, 100);

    } catch (caughtError: unknown) {
      console.error("Gagal memparsing data dari sessionStorage:", caughtError);
      // Tampilkan pesan error dan arahkan pengguna kembali
      let errorMessage = "Terjadi kesalahan saat memuat hasil diagnosa.";
      if (caughtError instanceof Error) {
        errorMessage = caughtError.message;
      }
      alert(errorMessage); // Menggunakan alert sebagai pengganti toast jika tidak ada sonner context
      router.push("/diagnose");
    }
  }, [router]); // Dependensi router memastikan efek berjalan saat router berubah (jika komponen dire-mount)

  // --- Mengelola Solusi yang Dibuka/Ditutup ---
  // Pastikan useCallback ini dideklarasikan di awal dan tidak bersyarat
  const toggleSolution = useCallback((kode: string) => {
    setOpenSolutions((prevOpenSolutions) =>
      prevOpenSolutions.includes(kode)
        ? prevOpenSolutions.filter((k) => k !== kode)
        : [...prevOpenSolutions, kode]
    );
  }, []); // Dependensi kosong karena tidak bergantung pada state/props lain

  // --- Penangan Diskusi di Forum ---
  // Pastikan useCallback ini dideklarasikan di awal dan tidak bersyarat
  const handleDiscussInForum = useCallback(() => {
    if (!diagnosisData) return; // Penting untuk cek null sebelum akses properti

    // Mengambil detail gejala yang dipilih dari data yang diterima
    const selectedSymptomsForForum = (diagnosisData.selectedGejalaDetails || [])
      .map((gejala: GejalaFromBackend) => `${gejala.kode}: ${gejala.nama}`)
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
  }, [diagnosisData, router]); // Dependensi diagnosisData dan router

  // --- Fungsi Pembantu untuk Gaya UI ---
  // Pastikan useCallback ini dideklarasikan di awal dan tidak bersyarat
  const getBeliefColor = useCallback((belief: number): string => {
    const validBelief = Math.min(1, Math.max(0, belief || 0));
    if (validBelief >= 0.7) return "text-red-600";
    if (validBelief >= 0.4) return "text-orange-600";
    return "text-yellow-600";
  }, []);

  // Pastikan useCallback ini dideklarasikan di awal dan tidak bersyarat
  const getBeliefBadge = useCallback((belief: number) => {
    const validBelief = Math.min(1, Math.max(0, belief || 0));
    if (validBelief >= 0.7) return { variant: "destructive" as const, text: "Tinggi" };
    if (validBelief >= 0.4) return { variant: "default" as const, text: "Sedang" };
    return { variant: "secondary" as const, text: "Rendah" };
  }, []);

  // Pastikan useCallback ini dideklarasikan di awal dan tidak bersyarat
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

  // --- Render Kondisional: Loading Modern ---
  if (isLoading || !diagnosisData) {
    return <ModernLoading onComplete={handleLoadingComplete} duration={2000} />;
  }

  // --- Data untuk Rendering ---
  // topResults sudah mengandung semua detail yang diperlukan untuk kerusakan
  const topResults = diagnosisData.result.sort((a, b) => b.belief - a.belief).slice(0, 3);

  // selectedGejalaDetails kini diambil dari diagnosisData yang sudah di-parse
  const selectedGejalaDetailsToDisplay = diagnosisData.selectedGejalaDetails || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.push("/diagnose")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Diagnosa
        </Button>

        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <CheckCircle className="h-8 w-8 text-green-600" />
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
                  // Detail kerusakan diambil langsung dari `result`
                  const kerusakanDetail = result; // result sudah memiliki semua field Kerusakan

                  return (
                    <Card key={kerusakanDetail.kode} className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              #{index + 1}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {kerusakanDetail.kode}
                            </Badge>
                            <Badge {...getBeliefBadge(kerusakanDetail.belief)}>
                              {getBeliefBadge(kerusakanDetail.belief).text}
                            </Badge>
                            {kerusakanDetail.tingkat_kerusakan && (
                              <Badge className={getDifficultyColor(kerusakanDetail.tingkat_kerusakan)}>
                                {kerusakanDetail.tingkat_kerusakan}
                              </Badge>
                            )}
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{kerusakanDetail.nama}</h3>

                          {kerusakanDetail.deskripsi && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{kerusakanDetail.deskripsi}</p>
                          )}

                          <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                            {kerusakanDetail.estimasi_biaya && (
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4" />
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

                          <div className="grid grid-cols-3 gap-2 text-xs mb-3">
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
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${getBeliefColor(kerusakanDetail.belief)}`}>
                            {(kerusakanDetail.belief * 100).toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-500">Kepercayaan</div>
                        </div>
                      </div>

                      <Progress value={kerusakanDetail.belief * 100} className="mb-3" />

                      <div className="mt-3">
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-transparent"
                          onClick={() => toggleSolution(kerusakanDetail.kode)}
                        >
                          <span>Lihat Solusi Detail</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${openSolutions.includes(kerusakanDetail.kode) ? "rotate-180" : ""
                              }`}
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
              <Button onClick={handleDiscussInForum} className="w-full cursor-pointer">
                <MessageSquare className="mr-2 h-4 w-4" />
                Diskusikan di Forum
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
                    <div key={gejala.kode} className="flex flex-col items-start gap-2 p-3 bg-blue-50 dark:bg-background rounded-lg">
                      {gejala.gambar && gejala.gambar !== "" ? ( // Pastikan gambar tidak kosong
                        <Image
                          height={500}
                          width={500}
                          src={gejala.gambar}
                          alt={gejala.nama || gejala.kode}
                          className="h-20 w-full object-cover rounded-md"
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
                          {gejala.kategori && gejala.kategori !== "Unknown" && ( // Pastikan kategori ada dan bukan "Unknown"
                            <Badge variant="secondary" className="text-xs">
                              {gejala.kategori}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-sm leading-tight">{gejala.nama || "Nama tidak tersedia"}</p>
                        {gejala.deskripsi && gejala.deskripsi !== "Detail gejala tidak tersedia." ? ( // Tampilkan deskripsi jika ada dan bukan placeholder
                          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{gejala.deskripsi}</p>
                        ) : (
                          <p className="text-xs text-gray-400 mt-1">Detail gejala tidak tersedia.</p> // Tampilkan placeholder jika deskripsi tidak ada atau placeholder
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 text-center">Tidak ada detail gejala yang tersedia.</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Ringkasan Diagnosa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-blue-50 dark:bg-blue-200 rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {diagnosisData.input.length}
                  </div>
                  <div className="text-xs text-gray-600">Gejala</div>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-200 rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {topResults.length}
                  </div>
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
                  <li>• Cadangkan data sebelum perbaikan.</li>
                  <li>• Konsultasi teknisi untuk kerusakan serius.</li>
                  <li>• Gunakan alat diagnostik untuk konfirmasi.</li>
                  <li>• Periksa garansi sebelum membongkar.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}