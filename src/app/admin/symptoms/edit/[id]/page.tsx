// /admin/symptoms/edit/[id]/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Gejala, Kerusakan, ApiResponse } from "@/types/diagnose";
import { SymptomForm } from "@/components/admin/SymptomForm.tsx";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditGejalaPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gejalaData, setGejalaData] = useState<Gejala | null>(null);
  const [kerusakanList, setKerusakanList] = useState<Kerusakan[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const gejalaId = params.id as string;
    if (!gejalaId) {
      router.push("/admin/symptoms");
      return;
    }

    setIsLoadingData(true);
    setError(null);
    try {
      const [gejalaResponse, kerusakanResponse] = await Promise.all([
        fetch(`/api/diagnose/symptoms/${gejalaId}`),
        fetch("/api/diagnose/damages"),
      ]);

      const gejalaData: ApiResponse<Gejala> = await gejalaResponse.json();
      const kerusakanData: ApiResponse<Kerusakan[]> = await kerusakanResponse.json();

      if (!gejalaResponse.ok || !gejalaData.status) {
        throw new Error(gejalaData.message || `Gagal memuat gejala: ${gejalaResponse.status}`);
      }
      if (!kerusakanResponse.ok || !kerusakanData.status) {
        throw new Error(kerusakanData.message || `Gagal memuat daftar kerusakan: ${kerusakanResponse.status}`);
      }

      setGejalaData(gejalaData.data || null);
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
  }, [params.id, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (data: Omit<Gejala, 'id'>, id?: string): Promise<void> => {
    if (!id) {
      toast.error("ID gejala tidak valid.");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/diagnose/symptoms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const responseData: ApiResponse<any> = await response.json();
      if (!response.ok || !responseData.status) {
        throw new Error(responseData.message || `Gagal menyimpan gejala: ${response.status}`);
      }

      toast.success("Gejala berhasil diupdate.");
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

  if (isLoadingData) {
    return (
      <div className="px-4 py-8 w-full">
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

  if (error || !gejalaData) {
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
      initialData={gejalaData}
      kerusakanList={kerusakanList}
      isSubmitting={isSubmitting}
      onSave={handleSave}
      pageTitle={`Edit Gejala: ${gejalaData.nama}`}
      pageDescription="Ubah informasi gejala dan atur nilai kepercayaan."
      submitButtonText="Update Gejala"
      existingGejalaCodes={[]}
    />
  );
}