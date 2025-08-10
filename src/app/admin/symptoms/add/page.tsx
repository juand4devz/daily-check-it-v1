// /admin/symptoms/add/page.tsx
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gejala, Kerusakan, ApiResponse } from "@/types/diagnose";
import { SymptomForm } from "@/components/admin/SymptomForm.tsx";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function AddGejalaPage() {
  const router = useRouter();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [kerusakanList, setKerusakanList] = useState<Kerusakan[]>([]);
  const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const gejalaResponse = await fetch("/api/diagnose/symptoms");
      const kerusakanResponse = await fetch("/api/diagnose/damages");

      const gejalaData: ApiResponse<Gejala[]> = await gejalaResponse.json();
      const kerusakanData: ApiResponse<Kerusakan[]> = await kerusakanResponse.json();

      if (!gejalaResponse.ok || !gejalaData.status) {
        throw new Error(gejalaData.message || "Gagal memuat data gejala.");
      }
      if (!kerusakanResponse.ok || !kerusakanData.status) {
        throw new Error(kerusakanData.message || "Gagal memuat data kerusakan.");
      }

      setGejalaList(gejalaData.data || []);
      const sortedKerusakan = (kerusakanData.data || []).sort((a, b) => {
        const numA = parseInt(a.kode.replace('KK', '')) || 0;
        const numB = parseInt(b.kode.replace('KK', '')) || 0;
        return numA - numB;
      });
      setKerusakanList(sortedKerusakan);
    } catch (caughtError: unknown) {
      console.error("Error loading data:", caughtError);
      let errorMessage = "Gagal memuat data gejala dan kerusakan.";
      if (caughtError instanceof Error) {
        errorMessage = caughtError.message;
      }
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsLoadingData(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (data: Omit<Gejala, 'id'>): Promise<void> => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/diagnose/symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData: ApiResponse<Gejala> = await response.json();
      if (!response.ok || !responseData.status) {
        throw new Error(responseData.message || `Gagal menyimpan gejala: ${response.status}`);
      }

      toast.success("Gejala berhasil ditambahkan.");
      router.push("/admin/symptoms");
    } catch (caughtError: unknown) {
      console.error("Error saving:", caughtError);
      let errorMessage = "Terjadi kesalahan saat menyimpan data.";
      if (caughtError instanceof Error) {
        errorMessage = caughtError.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextCode = useMemo(() => {
    const existingCodes = gejalaList.map(g => g.kode);
    const sortedCodes = existingCodes
      .map(code => parseInt(code.replace('G', '')))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);
    let nextNumber = 1;
    for (const codeNumber of sortedCodes) {
      if (codeNumber === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }
    return `G${nextNumber}`;
  }, [gejalaList]);

  const initialDataWithCode: Gejala = {
    kode: nextCode,
    nama: "",
    deskripsi: "",
    kategori: "System",
    perangkat: [],
    mass_function: {},
    gambar: "",
  };

  if (isLoadingData) {
    return (
      <div className="w-full px-4 py-8">
        <div className="animate-pulse space-y-6">
          <Skeleton className="h-8 rounded w-1/4 mb-4"></Skeleton>
          <Skeleton className="h-10 rounded w-1/2"></Skeleton>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded"></Skeleton>
            <Skeleton className="h-96 rounded"></Skeleton>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center p-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-2 text-lg font-semibold">Gagal Memuat Data Gejala</h2>
          <p className="mt-1 text-sm text-muted-foreground">{error}</p>
          <Button className="mt-4" onClick={() => router.push("/admin/symptoms")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali ke Daftar Gejala
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SymptomForm
      initialData={initialDataWithCode}
      kerusakanList={kerusakanList}
      isSubmitting={isSubmitting}
      onSave={handleSave}
      pageTitle="Tambah Gejala Baru"
      pageDescription="Isi informasi gejala dan atur nilai kepercayaan untuk setiap kemungkinan kerusakan."
      submitButtonText="Simpan Gejala"
      existingGejalaCodes={gejalaList.map(g => g.kode)}
    />
  );
}