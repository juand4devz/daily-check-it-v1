// /admin/damages/edit/[id]/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Kerusakan, Gejala, ApiResponse } from "@/types/diagnose";
import { DamageForm } from "@/components/admin/DamageForm";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditKerusakanPage() {
    const router = useRouter();
    const params = useParams();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [kerusakanData, setKerusakanData] = useState<Kerusakan | null>(null);
    const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
    const [error, setError] = useState<string | null>(null);

    const loadInitialData = useCallback(async () => {
        const kerusakanId = params.id as string;
        if (!kerusakanId) {
            router.push("/admin/damages");
            return;
        }

        setIsLoading(true);
        setError(null);
        try {
            const [kerusakanResponse, gejalaResponse] = await Promise.all([
                fetch(`/api/diagnose/damages/${kerusakanId}`),
                fetch("/api/diagnose/symptoms"),
            ]);

            const kerusakanData: ApiResponse<Kerusakan> = await kerusakanResponse.json();
            const gejalaData: ApiResponse<Gejala[]> = await gejalaResponse.json();

            if (!kerusakanResponse.ok || !kerusakanData.status) {
                throw new Error(kerusakanData.message || `Gagal memuat kerusakan: ${kerusakanResponse.status}`);
            }
            if (!gejalaResponse.ok || !gejalaData.status) {
                throw new Error(gejalaData.message || `Gagal memuat daftar gejala: ${gejalaResponse.status}`);
            }

            setKerusakanData(kerusakanData.data || null);
            setGejalaList(gejalaData.data || []);
            toast.success("Data kerusakan berhasil dimuat.");
        } catch (caughtError: unknown) {
            console.error("Error loading data:", caughtError);
            let errorMessage = "Gagal memuat data kerusakan.";
            if (caughtError instanceof Error) {
                errorMessage = caughtError.message;
            }
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, [params.id, router]);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handleSave = async (data: Omit<Kerusakan, 'id'>, id?: string): Promise<void> => {
        if (!id) {
            toast.error("ID kerusakan tidak valid.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/diagnose/damages/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const responseData: ApiResponse<any> = await response.json();
            if (!response.ok || !responseData.status) {
                throw new Error(responseData.message || `Gagal mengupdate kerusakan: ${response.status}`);
            }

            toast.success("Kerusakan berhasil diupdate.");
            router.push("/admin/damages");
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

    if (isLoading) {
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

    if (error || !kerusakanData) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <div className="text-center p-8">
                    <AlertTriangle className="mx-auto h-12 w-12 text-destructive" />
                    <h2 className="mt-2 text-lg font-semibold">Gagal Memuat Data Kerusakan</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{error}</p>
                    <Button className="mt-4" onClick={() => router.push("/admin/damages")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali ke Daftar Kerusakan
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <DamageForm
            initialData={kerusakanData}
            gejalaList={gejalaList}
            isSubmitting={isSubmitting}
            onSave={handleSave}
            pageTitle={`Edit Kerusakan: ${kerusakanData.nama}`}
            pageDescription="Ubah informasi kerusakan dan atur probabilitas prior"
            submitButtonText="Update Kerusakan"
        />
    );
}