// /admin/damages/add/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Kerusakan, Gejala, ApiResponse } from "@/types/diagnose";
import { DamageForm } from "@/components/admin/DamageForm";
import { AlertTriangle, ArrowLeft } from "lucide-react";

export default function AddKerusakanPage() {
    const router = useRouter();
    const [isLoadingGejala, setIsLoadingGejala] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
    const [existingKerusakanCodes, setExistingKerusakanCodes] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const generateNextCode = useCallback(async () => {
        // Logika generate kode sudah ada di sini, tapi untuk menyederhanakan, kita bisa membuatnya di backend atau di client.
        // Untuk sekarang, kita bisa mengandalkan backend untuk validasi kode.
    }, []);

    const loadGejalaData = useCallback(async () => {
        setIsLoadingGejala(true);
        setError(null);
        try {
            const [gejalaResponse, kerusakanResponse] = await Promise.all([
                fetch("/api/diagnose/symptoms"),
                fetch("/api/diagnose/damages")
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
            setExistingKerusakanCodes((kerusakanData.data || []).map(k => k.kode));
        } catch (caughtError: unknown) {
            console.error("Error loading gejala data:", caughtError);
            let errorMessage = "Gagal memuat data gejala terkait.";
            if (caughtError instanceof Error) {
                errorMessage = caughtError.message;
            }
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setIsLoadingGejala(false);
        }
    }, []);

    useEffect(() => {
        loadGejalaData();
    }, [loadGejalaData]);

    const handleSave = async (data: Omit<Kerusakan, 'id'>, id?: string): Promise<void> => {
        setIsSubmitting(true);
        try {
            const response = await fetch("/api/diagnose/damages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            const responseData: ApiResponse<Kerusakan> = await response.json();
            if (!response.ok || !responseData.status) {
                throw new Error(responseData.message || `Gagal menyimpan kerusakan: ${response.status}`);
            }

            toast.success("Kerusakan berhasil ditambahkan.");
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

    // Logika untuk menampilkan loading state
    if (isLoadingGejala) {
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
            gejalaList={gejalaList}
            isSubmitting={isSubmitting}
            onSave={handleSave}
            pageTitle="Tambah Kerusakan Baru"
            pageDescription="Isi informasi kerusakan dan atur probabilitas prior untuk sistem diagnosa"
            submitButtonText="Simpan Kerusakan"
        />
    );
}
