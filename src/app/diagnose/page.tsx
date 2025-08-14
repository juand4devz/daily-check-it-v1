"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  Search,
  Filter,
  AlertTriangle,
  Info,
  Check,
  SearchCheckIcon,
  WifiOff,
  ScanSearch,
} from "lucide-react";
import { Image } from '@imagekit/next';
import Fuse from "fuse.js";
import { Gejala, Kerusakan, StoredDiagnosisResult } from "@/types/diagnose";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { Skeleton } from "@/components/ui/skeleton";

// --- Konstanta ---
const MAX_GEJALA_DEFAULT = 5;
const MIN_GEJALA = 1;

// --- Komponen Skeleton Loader ---
const GejalaCardSkeleton = () => (
  <Card className="group animate-pulse transition-all duration-200 border-2 p-0 overflow-hidden">
    <div className="relative">
      <Skeleton className="aspect-video relative overflow-hidden rounded-t-lg"></Skeleton>
      <CardContent className="p-4">
        <div className="space-y-2">
          <Skeleton className="h-4 rounded w-3/4"></Skeleton>
          <Skeleton className="h-3 rounded w-1/3"></Skeleton>
          <Skeleton className="h-3 rounded w-full"></Skeleton>
          <Skeleton className="h-3 rounded w-2/3"></Skeleton>
        </div>
      </CardContent>
    </div>
  </Card>
);

// --- Komponen Utama ---
export default function DiagnosaPage() {
  const router = useRouter();
  const { status } = useSession();

  const [selectedGejala, setSelectedGejala] = useState<Gejala[]>([]);
  const [isLoadingDiagnose, setIsLoadingDiagnose] = useState(false);
  const [filterCategory, setFilterCategory] = useState("Semua");
  const [filterPerangkat, setFilterPerangkat] = useState("Semua");
  const [searchTerm, setSearchTerm] = useState("");
  const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
  const [kerusakanList, setKerusakanList] = useState<Kerusakan[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [errorData, setErrorData] = useState<string | null>(null);
  const [apiMaxGejala, setApiMaxGejala] = useState<number>(MAX_GEJALA_DEFAULT);
  const [apiAvailableDevices, setApiAvailableDevices] = useState<string[]>([]);

  // --- Ambil Data Awal (Daftar Gejala dan Kerusakan) ---
  const fetchInitialData = useCallback(async () => {
    setLoadingData(true);
    setErrorData(null);
    try {
      if (status === 'loading') return;
      if (status === 'unauthenticated') {
        toast.error("Anda harus login untuk menggunakan fitur diagnosa.");
        router.push("/login");
        return;
      }

      const [gejalaResponse, kerusakanResponse] = await Promise.all([
        fetch("/api/diagnose/symptoms"), // Perbarui nama route
        fetch("/api/diagnose/damages"), // Perbarui nama route
      ]);

      const [gejalaData, kerusakanData] = await Promise.all([
        gejalaResponse.json(),
        kerusakanResponse.json(),
      ]);

      if (!gejalaResponse.ok) {
        throw new Error(gejalaData.message || `Kesalahan HTTP pada gejala: ${gejalaResponse.status}`);
      }
      if (!kerusakanResponse.ok) {
        throw new Error(kerusakanData.message || `Kesalahan HTTP pada kerusakan: ${kerusakanResponse.status}`);
      }

      const sortedGejalaList = (gejalaData.data as Gejala[]).sort((a, b) => {
        const numA = parseInt(a.kode.replace("G", "")) || 0;
        const numB = parseInt(b.kode.replace("G", "")) || 0;
        return numA - numB;
      });

      setGejalaList(sortedGejalaList);
      setKerusakanList(kerusakanData.data as Kerusakan[]);
      setApiAvailableDevices([...new Set((gejalaData.data as Gejala[]).flatMap(g => g.perangkat))]);

    } catch (caughtError: unknown) {
      console.error("Terjadi kesalahan saat mengambil data awal:", caughtError);
      let errorMessage = "Terjadi kesalahan yang tidak diketahui.";
      if (caughtError instanceof Error) {
        errorMessage = caughtError.message;
      }
      setErrorData(errorMessage);
    } finally {
      setLoadingData(false);
    }
  }, [status, router]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  // --- Penangan Event ---
  const handleGejalaChange = useCallback(
    (gejala: Gejala, checked: boolean) => {
      setSelectedGejala((prevSelected) => {
        const isSelected = prevSelected.some(g => g.kode === gejala.kode);
        if (checked && !isSelected) {
          if (prevSelected.length >= apiMaxGejala) {
            toast.error(`Maksimal ${apiMaxGejala} gejala dapat dipilih.`);
            return prevSelected;
          }
          return [...prevSelected, gejala];
        } else if (!checked && isSelected) {
          return prevSelected.filter((g) => g.kode !== gejala.kode);
        }
        return prevSelected;
      });
    },
    [apiMaxGejala]
  );

  const handleSubmit = async () => {
    if (selectedGejala.length < MIN_GEJALA) {
      toast.error(`Pilih minimal ${MIN_GEJALA} gejala untuk melakukan diagnosa.`);
      return;
    }

    setIsLoadingDiagnose(true);

    try {
      // Kirim data yang diperlukan ke API
      const response = await fetch("/api/diagnose", { // Route diagnosa utama
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gejala: selectedGejala.map(g => g.kode),
          perangkat: filterPerangkat !== "Semua" ? filterPerangkat.toLowerCase() : undefined,
          gejalaList: gejalaList,
          kerusakanList: kerusakanList,
        }),
      });

      if (!response.ok) {
        const errorData: { error?: string } = await response.json();
        throw new Error(errorData.error || `Kesalahan HTTP! status: ${response.status}`);
      }

      const result: StoredDiagnosisResult = await response.json();

      sessionStorage.setItem("diagnosisResult", JSON.stringify(result));

      router.push("/diagnose/hasil");
    } catch (caughtError: unknown) {
      console.error("Terjadi kesalahan:", caughtError);
      let errorMessage = "Terjadi kesalahan saat memproses diagnosa. Silakan coba lagi.";
      if (caughtError instanceof Error) {
        errorMessage = `Terjadi kesalahan saat memproses diagnosa: ${caughtError.message}.`;
      }
      toast.error(errorMessage);
    }  // finally {
    // setIsLoadingDiagnose(false);
    // }
  };

  // --- Logika Pencarian dan Penyaringan dengan Fuse.js ---
  const fuse = useMemo(() => {
    const options = {
      keys: ['nama', 'deskripsi', 'kode'],
      threshold: 0.3,
    };
    return new Fuse(gejalaList, options);
  }, [gejalaList]);

  const filteredGejala = useMemo(() => {
    const searchResult = searchTerm
      ? fuse.search(searchTerm).map(result => result.item)
      : gejalaList;

    return searchResult.filter((gejala) => {
      const categoryMatch = filterCategory === "Semua" || gejala.kategori === filterCategory;
      const deviceMatch = filterPerangkat === "Semua" || gejala.perangkat.includes(filterPerangkat.toLowerCase());
      return categoryMatch && deviceMatch;
    });
  }, [searchTerm, gejalaList, filterCategory, filterPerangkat, fuse]);

  // Dapatkan kategori unik dan jenis perangkat yang tersedia untuk filter
  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(gejalaList.map((g) => g.kategori))];
    return uniqueCategories.sort();
  }, [gejalaList]);

  const perangkatTypes = useMemo(() => {
    const uniqueDevices = [...new Set(gejalaList.flatMap(g => g.perangkat))];
    return uniqueDevices.map(d => d.charAt(0).toUpperCase() + d.slice(1)).sort();
  }, [gejalaList]);

  const isMaxReached = selectedGejala.length >= apiMaxGejala;

  // --- Render Komponen ---
  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
          <ScanSearch className="h-18 md:h-10 w-18 md:w-10" />
          <span className="text-2xl">Sistem Diagnosa Kerusakan Komputer</span>
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
              <span className="text-sm">
                Maksimal pemilihan <strong>{apiMaxGejala}</strong>  gejala:
              </span>
              <span
                className={`font-semibold ml-1 ${selectedGejala.length >= apiMaxGejala
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
                <SelectValue placeholder="Semua Perangkat" />
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
                <SelectValue placeholder="Semua Kategori" />
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
      {loadingData ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {[...Array(10)].map((_, index) => (
            <GejalaCardSkeleton key={index} />
          ))}
        </div>
      ) : errorData ? (
        <Alert variant="destructive" className="mb-6">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Gagal Memuat Gejala!</AlertTitle>
          <AlertDescription>
            Terjadi kesalahan: {errorData}. Pastikan server API berjalan dan
            Firestore dapat diakses.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 mb-8">
          {filteredGejala.map((gejala) => {
            const isSelected = selectedGejala.some(g => g.kode === gejala.kode);
            const isDisabled = !isSelected && isMaxReached;

            return (
              <Card
                key={gejala.kode}
                className={`group cursor-pointer transition-all duration-200 hover:shadow-md border p-0 overflow-hidden rounded-lg
    ${isSelected
                    ? "border-transparent ring-2 ring-offset-2 ring-indigo-500 dark:ring-indigo-400 shadow-xl scale-100"
                    : "border-gray-300 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-400 scale-95"}
    ${isDisabled ? "opacity-50 cursor-not-allowed bg-background" : ""}`}
                onClick={() => !isDisabled && handleGejalaChange(gejala, !isSelected)}
              >
                <div className="relative">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <Image
                      height={300}
                      width={300}
                      src={gejala.gambar || "/placeholder.svg"}
                      alt={gejala.nama}
                      loading="lazy"
                      className={`w-full h-full object-cover transition-all duration-200 ${isDisabled ? "grayscale" : "group-hover:scale-105"}`}
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
                      <Badge className="w-5 h-5" variant={isSelected ? "default" : "secondary"}>
                        {gejala.kode}
                      </Badge>
                    </div>

                    {/* Badge Perangkat */}
                    {gejala.perangkat && (
                      <div className="absolute top-2 right-2">
                        <div className="flex flex-wrap gap-1">
                          {gejala.perangkat.map((device) => (
                            <Badge key={device} variant="outline" className="h-5 backdrop-blur-sm text-white border-none">
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
                          className={`font-semibold text-sm leading-tight line-clamp-2 ${isDisabled ? "text-gray-500" : "text-gray-900 dark:text-gray-200"}`}
                        >
                          {gejala.nama}
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs ${isSelected ? "border-slate-700 dark:border-slate-500 text-slate-800 dark:text-slate-400" : "border-slate-700 dark:border-slate-300 text-slate-800 dark:text-slate-300"}`}
                      >
                        {gejala.kategori}
                      </Badge>
                      <p
                        className={`text-xs leading-relaxed line-clamp-3 ${isDisabled ? "text-gray-400" : "text-gray-600 dark:text-gray-400"}`}
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

      {filteredGejala.length === 0 && !loadingData && !errorData && (
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
      <div className="sticky bottom-4 border-1 border-gray-500 dark:border-gray-600 rounded-lg shadow-lg p-2 bg-gray-200 dark:bg-zinc-950 md:w-full mx-auto">
        <div className="flex items-center w-full justify-between">
          <div className="text-sm text-gray-600 flex flex-col items-start justify-center">
            {selectedGejala.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {selectedGejala.slice(0, 5).map((gejala) => (
                  <Badge key={gejala.kode} variant="secondary" className="text-xs">
                    {gejala.kode}
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