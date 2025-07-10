// /diagnose/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Loader2,
  Stethoscope,
  Search,
  Filter,
  AlertTriangle,
  Info,
  Check,
  SearchCheckIcon,
  WifiOff,
} from "lucide-react";
import Image from "next/image";

// --- Interfaces ---
interface Gejala {
  kode: string;
  nama: string;
  deskripsi: string;
  kategori: string;
  perangkat: string[];
  mass_function: Record<string, number>;
  gambar: string;
}

interface DiagnoseApiInfo {
  message: string;
  usage: string;
  algorithm: string;
  max_symptoms: number;
  available_devices: string[];
  available_symptoms: string[];
  available_damages: string[];
  total_symptoms: number;
  total_damages: number;
  improvements: string[];
  timestamp: string;
}

// --- Konstanta ---
const MAX_GEJALA_DEFAULT = 5; // Nilai default jika data API tidak tersedia
const MIN_GEJALA = 1;

// --- Komponen Skeleton Loader ---
const GejalaCardSkeleton = () => (
  <Card className="group animate-pulse transition-all duration-200 border-2 p-0 overflow-hidden">
    <div className="relative">
      <div className="aspect-video relative overflow-hidden rounded-t-lg bg-gray-200 dark:bg-gray-700"></div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
        </div>
      </CardContent>
    </div>
  </Card>
);

// --- Komponen Utama ---
export default function DiagnosaPage() {
  const router = useRouter(); // Pastikan useRouter dipanggil di awal

  const [selectedGejala, setSelectedGejala] = useState<string[]>([]);
  const [isLoadingDiagnose, setIsLoadingDiagnose] = useState(false);
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [filterPerangkat, setFilterPerangkat] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
  const [loadingGejala, setLoadingGejala] = useState(true);
  const [errorGejala, setErrorGejala] = useState<string | null>(null);
  const [apiMaxGejala, setApiMaxGejala] = useState<number>(MAX_GEJALA_DEFAULT);
  const [apiAvailableDevices, setApiAvailableDevices] = useState<string[]>([
    "Komputer",
    "Laptop",
  ]);

  // --- Ambil Data Awal (Daftar Gejala dan Info Diagnosa) ---
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoadingGejala(true);
      setErrorGejala(null);
      try {
        // Ambil Daftar Gejala dari rute API yang didedikasikan
        const gejalaResponse = await fetch("/api/gejala");
        if (!gejalaResponse.ok) {
          const errorText = await gejalaResponse.text();
          throw new Error(
            `Gagal mengambil data gejala: ${gejalaResponse.status} ${errorText}`
          );
        }
        const fetchedGejalaList: Gejala[] = await gejalaResponse.json();

        // Urutkan daftar gejala berdasarkan 'kode' (misalnya, G1, G2, ..., G10)
        const sortedGejalaList = fetchedGejalaList.sort((a, b) => {
          const numA = parseInt(a.kode.replace("G", "")) || 0;
          const numB = parseInt(b.kode.replace("G", "")) || 0;
          return numA - numB;
        });
        setGejalaList(sortedGejalaList);

        // Secara opsional, ambil info diagnosa untuk max_symptoms dan available_devices
        const diagnoseInfoResponse = await fetch("/api/diagnose");
        if (diagnoseInfoResponse.ok) {
          const diagnoseInfo: DiagnoseApiInfo =
            await diagnoseInfoResponse.json();
          setApiMaxGejala(diagnoseInfo.max_symptoms || MAX_GEJALA_DEFAULT);
          setApiAvailableDevices(diagnoseInfo.available_devices || ["Komputer", "Laptop"]);
        } else {
          console.warn(
            "Tidak dapat mengambil info diagnosa (max_symptoms, dll.). Menggunakan nilai default."
          );
        }
      } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat mengambil data awal:", caughtError);
        let errorMessage = "Terjadi kesalahan yang tidak diketahui.";
        if (caughtError instanceof Error) {
          errorMessage = caughtError.message;
        }
        setErrorGejala(errorMessage);
      } finally {
        setLoadingGejala(false);
      }
    };

    fetchInitialData();
  }, []);

  // --- Penangan Event ---
  const handleGejalaChange = useCallback(
    (kodeGejala: string, checked: boolean) => {
      setSelectedGejala((prevSelected) => {
        if (checked) {
          if (prevSelected.length >= apiMaxGejala) {
            return prevSelected;
          }
          return [...prevSelected, kodeGejala];
        } else {
          return prevSelected.filter((g) => g !== kodeGejala);
        }
      });
    },
    [apiMaxGejala]
  );

  const handleSubmit = async () => {
    if (selectedGejala.length < MIN_GEJALA) {
      alert(`Pilih minimal ${MIN_GEJALA} gejala untuk melakukan diagnosa.`);
      return;
    }

    setIsLoadingDiagnose(true);

    try {
      const response = await fetch("/api/diagnose", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gejala: selectedGejala,
          perangkat:
            filterPerangkat !== "Semua" ? filterPerangkat.toLowerCase() : undefined,
          gejalaList: gejalaList, // Kirim seluruh data gejala dari klien ke server
        }),
      });

      if (!response.ok) {
        const errorData: { error?: string } = await response.json();
        throw new Error(
          errorData.error || `Kesalahan HTTP! status: ${response.status}`
        );
      }

      const result = await response.json();

      // Simpan seluruh objek hasil (termasuk selectedGejalaDetails yang baru)
      sessionStorage.setItem(
        "diagnosisResult",
        JSON.stringify(result) // Simpan seluruh objek result
      );

      router.push("/diagnose/hasil");
    } catch (caughtError: unknown) {
      console.error("Terjadi kesalahan:", caughtError);
      let errorMessage = "Terjadi kesalahan saat memproses diagnosa. Silakan coba lagi.";
      if (caughtError instanceof Error) {
        errorMessage = `Terjadi kesalahan saat memproses diagnosa: ${caughtError.message}. Silakan coba lagi.`;
      }
      alert(errorMessage);
    } finally {
      setIsLoadingDiagnose(false);
    }
  };

  // --- Logika Penyaringan ---
  const filteredGejala = gejalaList.filter((gejala) => {
    const categoryMatch =
      filterCategory === "Semua" || gejala.kategori === filterCategory;

    const deviceMatch =
      filterPerangkat === "Semua" ||
      gejala.perangkat.includes(filterPerangkat.toLowerCase());

    const searchMatch =
      gejala.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gejala.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
      gejala.kode.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && deviceMatch && searchMatch;
  });

  // Dapatkan kategori unik dan jenis perangkat yang tersedia untuk filter
  const categories = [...new Set(gejalaList.map((g) => g.kategori))];
  const perangkatTypes = apiAvailableDevices;

  const isMaxReached = selectedGejala.length >= apiMaxGejala;

  // --- Render Komponen ---
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <Stethoscope className="h-8 w-8 text-blue-600" />
          Sistem Diagnosa Kerusakan Komputer
        </h1>
        <p className="text-gray-600">
          Pilih gejala yang dialami perangkat Anda untuk mendapatkan diagnosa
          kerusakan menggunakan metode Dempster-Shafer.
        </p>
      </div>

      {/* Informasi Batas Pemilihan */}
      <Card className="p-0 mb-4 border-0 gap-0">
        <Alert className="bg-background rounded-none border-none">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span>
                Maksimal pemilihan gejala:{" "}
                <strong>{apiMaxGejala}</strong> gejala
              </span>
              <span
                className={`font-semibold ${selectedGejala.length >= apiMaxGejala
                  ? "text-red-600"
                  : "text-blue-600"
                  }`}
              >
                {selectedGejala.length}/{apiMaxGejala} dipilih
              </span>
            </div>
          </AlertDescription>
        </Alert>
        {isMaxReached && (
          <Alert variant="destructive" className="animate-pulse transform-3d">
            <AlertTriangle className="w-36 min-h-full" />
            <span>
              Batas maksimal gejala telah tercapai. Hapus beberapa gejala untuk
              memilih yang lain.
            </span>
          </Alert>
        )}
      </Card>

      {/* Kontrol */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Cari gejala berdasarkan nama, kode, atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={filterPerangkat} onValueChange={setFilterPerangkat}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua Perangkat</SelectItem>
                {perangkatTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Semua">Semua Kategori</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-sm text-gray-600">
          <span>
            Menampilkan {filteredGejala.length} dari {gejalaList.length} gejala
            {filterPerangkat !== "Semua" && ` untuk ${filterPerangkat}`}
          </span>
          <span className="font-medium">
            Gejala dipilih: {selectedGejala.length}/{apiMaxGejala}
          </span>
        </div>
      </div>

      {/* Kartu Gejala */}
      {loadingGejala ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {[...Array(10)].map((_, index) => (
            <GejalaCardSkeleton key={index} />
          ))}
        </div>
      ) : errorGejala ? (
        <Alert variant="destructive" className="mb-6">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Gagal Memuat Gejala!</AlertTitle>
          <AlertDescription>
            Terjadi kesalahan: {errorGejala}. Pastikan server API berjalan dan
            Firestore dapat diakses.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {filteredGejala.map((gejala) => {
            const isSelected = selectedGejala.includes(gejala.kode);
            const isDisabled = !isSelected && isMaxReached;

            return (
              <Card
                key={gejala.kode}
                className={`group cursor-pointer transition-all duration-200 hover:shadow-lg border-2 p-0 overflow-hidden ${isSelected
                  ? "bg-background dark:bg-background border-1 border-gray-300 shadow-2xl ring-1 ring-gray-400 scale-105"
                  : "border-gray-200 border dark:border-gray-500 hover:border-gray-300"
                  } ${isDisabled ? "opacity-50 cursor-not-allowed bg-background" : ""}`}
                onClick={() => !isDisabled && handleGejalaChange(gejala.kode, !isSelected)}
              >
                <div className="relative">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <Image
                      height={500}
                      width={500}
                      src={gejala.gambar || "/placeholder.svg"}
                      alt={gejala.nama}
                      className={`w-full h-full object-cover transition-all duration-200 ${isDisabled ? "grayscale" : "group-hover:scale-105"
                        }`}
                    />

                    {/* Overlay untuk status terpilih */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-slate-800/10 flex items-center justify-center">
                        <div className="bg-slate-800 text-white rounded-full p-2">
                          <Check className="h-4 w-4" />
                        </div>
                      </div>
                    )}

                    {/* Badge Kode */}
                    <div className="absolute top-1 left-2">
                      <Badge
                        className="w-5 h-5"
                        variant={isSelected ? "default" : "secondary"}
                      >
                        {gejala.kode}
                      </Badge>
                    </div>

                    {/* Badge Perangkat */}
                    {gejala.perangkat && (
                      <div className="absolute top-2 right-2">
                        <div className="flex flex-wrap gap-1">
                          {gejala.perangkat.map((device) => (
                            <Badge
                              key={device}
                              variant="outline"
                              className="h-5 backdrop-blur-sm text-white border-none"
                            >
                              {device === "computer" ? "PC" : "Laptop"}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3
                          className={`font-semibold text-sm leading-tight line-clamp-2 ${isDisabled
                            ? "text-gray-500"
                            : "text-gray-900 dark:text-gray-200"
                            }`}
                        >
                          {gejala.nama}
                        </h3>
                      </div>

                      <Badge
                        variant="outline"
                        className={`text-xs ${isSelected
                          ? "border-slate-700 dark:border-slate-500 text-slate-800 dark:text-slate-400"
                          : "border-slate-700 dark:border-slate-300 text-slate-800 dark:text-slate-300"
                          }`}
                      >
                        {gejala.kategori}
                      </Badge>

                      <p
                        className={`text-xs leading-relaxed line-clamp-3 ${isDisabled
                          ? "text-gray-400"
                          : "text-gray-600 dark:text-gray-400"
                          }`}
                      >
                        {gejala.deskripsi}
                      </p>
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {filteredGejala.length === 0 && !loadingGejala && !errorGejala && (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold mb-2">
              Tidak Ada Gejala Ditemukan
            </h3>
            <p className="text-gray-600">
              Coba ubah kata kunci pencarian, filter perangkat, atau filter
              kategori.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Tombol Kirim */}
      <div className="sticky bottom-4 border-1 border-gray-500 dark:border-gray-600 rounded-lg shadow-lg p-2 bg-gray-200 dark:bg-zinc-950 md:w-full mx-auto"> {/* Changed md:w-xl to md:w-full */}
        <div className="flex items-center w-full justify-between">
          <div className="text-sm text-gray-600 flex flex-col items-start justify-center">
            {selectedGejala.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {selectedGejala.slice(0, 5).map((kode) => (
                  <Badge key={kode} variant="secondary" className="text-xs">
                    {kode}
                  </Badge>
                ))}
                {selectedGejala.length > 5 && (
                  <Badge variant="secondary" className="text-xs">
                    +{selectedGejala.length - 5} lainnya
                  </Badge>
                )}
              </div>
            )}
          </div>
          <Button
            onClick={handleSubmit}
            disabled={selectedGejala.length < MIN_GEJALA || isLoadingDiagnose}
            className=" "
            size="sm"
          >
            {isLoadingDiagnose ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              <>
                <SearchCheckIcon className="mr-2 h-4 w-4" />
                Periksa
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}