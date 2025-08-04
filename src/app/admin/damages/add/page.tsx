// /admin/damages/add/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Kerusakan, Gejala, ApiResponse } from "@/types/diagnose";
import { DamageForm } from "@/components/admin/DamageForm";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function AddKerusakanPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [initialKerusakanData, setInitialKerusakanData] = useState<Kerusakan | null>(null);

    const generateNextCode = (existingCodes: string[]): string => {
        // Ambil angka dari setiap kode yang ada (contoh: KK1 -> 1)
        const numbers = existingCodes
            .map(code => parseInt(code.replace(/^KK/, ''), 10))
            .filter(num => !isNaN(num));

        // Cari angka tertinggi, atau default ke 0 jika tidak ada
        const highestNumber = numbers.length > 0 ? Math.max(...numbers) : 0;

        // Tambah 1 dan format menjadi kode baru (contoh: KK10)
        return `KK${highestNumber + 1}`;
    };

    const loadInitialData = useCallback(async () => {
        setIsLoading(true);
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

            const fetchedKerusakan = kerusakanData.data || [];
            const existingKerusakanCodes = fetchedKerusakan.map((k) => k.kode);
            const nextKode = generateNextCode(existingKerusakanCodes);

            setGejalaList(gejalaData.data || []);

            // Buat objek Kerusakan yang lengkap untuk menghindari error tipe
            setInitialKerusakanData({
                id: undefined, // Atau bisa null/undefined tergantung tipe data di backend
                kode: nextKode,
                nama: "",
                deskripsi: "",
                tingkat_kerusakan: "Ringan",
                estimasi_biaya: "",
                waktu_perbaikan: "",
                prior_probability: 0.1,
                solusi: "",
                gejala_terkait: [],
            });

        } catch (caughtError: unknown) {
            console.error("Error loading initial data:", caughtError);
            let errorMessage = "Gagal memuat data yang diperlukan.";
            if (caughtError instanceof Error) {
                errorMessage = caughtError.message;
            }
            toast.error(errorMessage);
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadInitialData();
    }, [loadInitialData]);

    const handleSave = async (data: Omit<Kerusakan, "id">, id?: string): Promise<void> => {
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

    if (isLoading || !initialKerusakanData) {
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
                    <h2 className="mt-2 text-lg font-semibold">Gagal Memuat Data</h2>
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
            initialData={initialKerusakanData}
            gejalaList={gejalaList}
            isSubmitting={isSubmitting}
            onSave={handleSave}
            pageTitle="Tambah Kerusakan Baru"
            pageDescription="Isi informasi kerusakan dan atur probabilitas prior untuk sistem diagnosa"
            submitButtonText="Simpan Kerusakan"
        />
    );
}