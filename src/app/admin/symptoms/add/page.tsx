// /admin/symptoms/add/page.tsx
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Gejala, Kerusakan, ApiResponse } from "@/types/diagnose";
import { SymptomForm } from "@/components/admin/SymptomForm.tsx";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AddGejalaPage() {
  const router = useRouter();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
  const [kerusakanList, setKerusakanList] = useState<Kerusakan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoadingData(true);
    setError(null);
    try {
      const [gejalaResponse, kerusakanResponse] = await Promise.all([
        fetch("/api/diagnose/symptoms"),
        fetch("/api/diagnose/damages"),
      ]);

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

  // --- Logika untuk Generate Kode Otomatis ---
  const getNextAvailableCode = useCallback((existingCodes: string[]): string => {
    const sortedCodes = existingCodes
      .map(code => parseInt(code.replace('G', '')))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);

    let nextNumber = 1;
    // Cari celah di antara kode yang ada
    for (const codeNumber of sortedCodes) {
      if (codeNumber === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }
    return `G${nextNumber}`;
  }, []);

  const defaultFormData = useMemo(() => {
    if (gejalaList.length === 0) {
      return {
        kode: "G1",
        nama: "",
        deskripsi: "",
        kategori: "System",
        perangkat: [],
        mass_function: {},
        gambar: "",
      };
    }

    const existingCodes = gejalaList.map(g => g.kode);
    const nextCode = getNextAvailableCode(existingCodes);

    return {
      kode: nextCode,
      nama: "",
      deskripsi: "",
      kategori: "System",
      perangkat: [],
      mass_function: {},
      gambar: "",
    };
  }, [gejalaList, getNextAvailableCode]);

  if (isLoadingData) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded w-1/4 mb-4"></div>
          <div className="h-10 bg-gray-200 dark:bg-zinc-800 rounded w-1/2"></div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-96 bg-gray-200 dark:bg-zinc-800 rounded"></div>
            <div className="h-96 bg-gray-200 dark:bg-zinc-800 rounded"></div>
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
      initialData={defaultFormData} // Gunakan data form yang digenerate otomatis
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