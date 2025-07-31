// /admin/damages/page.tsx
"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, DollarSign, Clock, AlertTriangle, Download, Upload, Search, RefreshCw, Loader2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import type { Kerusakan, ApiResponse } from "@/types/diagnose";

const tingkatKerusakanOptions: Array<Kerusakan["tingkat_kerusakan"]> = ["Ringan", "Sedang", "Berat"];

interface KerusakanStatistics {
    total: number;
    byTingkat: Record<string, number>;
    avgProbability: number;
}

interface ImportKerusakanItemClient {
    id?: string;
    kode: string;
    nama: string;
    deskripsi?: string;
    tingkat_kerusakan?: "Ringan" | "Sedang" | "Berat";
    estimasi_biaya?: string;
    waktu_perbaikan?: string;
    prior_probability?: number;
    solusi?: string;
    gejala_terkait?: string[];
}

export default function KerusakanPage() {
    const [kerusakanList, setKerusakanList] = useState<Kerusakan[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterTingkat, setFilterTingkat] = useState<string>("all");
    const [isLoading, setIsLoading] = useState(true);
    const [isImporting, setIsImporting] = useState(false);
    const [isSendingImport, setIsSendingImport] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const loadData = useCallback(async (): Promise<void> => {
        try {
            setIsLoading(true);
            const response = await fetch("/api/diagnose/damages");
            const responseData: ApiResponse<Kerusakan[]> = await response.json();

            if (!response.ok || !responseData.status) {
                throw new Error(responseData.message || `Gagal memuat data kerusakan: ${response.status}`);
            }

            const fetchedData = responseData.data || [];
            const sortedData = fetchedData.sort((a, b) => {
                const numA = parseInt(a.kode.replace('KK', '')) || 0;
                const numB = parseInt(b.kode.replace('KK', '')) || 0;
                return numA - numB;
            });
            setKerusakanList(sortedData);
            toast.success("Data kerusakan berhasil dimuat.");
        } catch (error) {
            console.error("Error loading data:", error);
            toast.error(error instanceof Error ? error.message : "Gagal memuat data kerusakan");
            setKerusakanList([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Menggunakan Fuse.js untuk pencarian
    const fuse = useMemo(() => {
        const options = {
            keys: ['kode', 'nama', 'deskripsi', 'tingkat_kerusakan'],
            threshold: 0.3,
        };
        return new Fuse(kerusakanList, options);
    }, [kerusakanList]);

    const filteredData = useMemo(() => {
        const searchResults = searchQuery.trim() ? fuse.search(searchQuery).map(result => result.item) : kerusakanList;

        if (filterTingkat !== "all") {
            return searchResults.filter(item => item.tingkat_kerusakan === filterTingkat);
        }
        return searchResults;
    }, [kerusakanList, searchQuery, filterTingkat, fuse]);

    const handleEdit = useCallback((kerusakan: Kerusakan): void => {
        router.push(`/admin/damages/edit/${kerusakan.id}`);
    }, [router]);

    const handleDelete = async (id: string, namaKerusakan: string): Promise<void> => {
        toast("Konfirmasi Hapus", {
            description: `Apakah Anda yakin ingin menghapus kerusakan "${namaKerusakan}"? Tindakan ini tidak dapat dibatalkan.`,
            action: {
                label: "Hapus",
                onClick: async () => {
                    try {
                        const response = await fetch(`/api/diagnose/damages/${id}`, {
                            method: "DELETE",
                        });

                        const responseData: ApiResponse<any> = await response.json();
                        if (!response.ok || !responseData.status) {
                            throw new Error(responseData.message || `Gagal menghapus kerusakan: ${response.status}`);
                        }

                        await loadData();
                        toast.success("Kerusakan berhasil dihapus.");
                    } catch (caughtError: unknown) {
                        console.error("Error deleting:", caughtError);
                        let errorMessage = "Gagal menghapus kerusakan.";
                        if (caughtError instanceof Error) {
                            errorMessage = caughtError.message;
                        }
                        toast.error(errorMessage);
                    }
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        });
    };

    const handleExport = (): void => {
        try {
            const dataStr = JSON.stringify(kerusakanList, null, 2);
            const dataBlob = new Blob([dataStr], { type: "application/json" });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `kerusakan-data-${new Date().toISOString().split("T")[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            toast.success("Data berhasil diekspor");
        } catch (error) {
            console.error("Export error:", error);
            toast.error("Gagal mengekspor data");
        }
    };

    const handleImport = (): void => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.target.files?.[0];
        if (!file) {
            toast.error("Tidak ada file yang dipilih.");
            return;
        }

        if (file.type !== "application/json") {
            toast.error("File harus berformat JSON.");
            return;
        }

        try {
            setIsImporting(true);
            const text = await file.text();
            const importedData: unknown = JSON.parse(text);

            if (!Array.isArray(importedData)) {
                toast.error("Format data tidak valid: Harap impor array JSON.");
                return;
            }

            const preparedData: ImportKerusakanItemClient[] = [];
            const validationErrors: string[] = [];

            importedData.forEach((item: unknown, index: number) => {
                if (typeof item !== 'object' || item === null) {
                    validationErrors.push(`Baris ${index + 1}: bukan objek yang valid.`);
                    return;
                }

                const kerusakanItem = item as Partial<Kerusakan>;

                if (typeof kerusakanItem.kode !== 'string' || !kerusakanItem.kode.trim()) {
                    validationErrors.push(`Baris ${index + 1} (ID: ${kerusakanItem.id || 'N/A'}): 'kode' tidak valid atau kosong.`);
                    return;
                }
                if (typeof kerusakanItem.nama !== 'string' || !kerusakanItem.nama.trim()) {
                    validationErrors.push(`Baris ${index + 1} (Kode: ${kerusakanItem.kode}): 'nama' tidak valid atau kosong.`);
                    return;
                }

                const tingkat: Kerusakan["tingkat_kerusakan"] =
                    (typeof kerusakanItem.tingkat_kerusakan === 'string' &&
                        tingkatKerusakanOptions.includes(kerusakanItem.tingkat_kerusakan as Kerusakan["tingkat_kerusakan"]))
                        ? (kerusakanItem.tingkat_kerusakan as Kerusakan["tingkat_kerusakan"])
                        : "Ringan";

                const priorProb: number =
                    (typeof kerusakanItem.prior_probability === 'number' &&
                        kerusakanItem.prior_probability >= 0 &&
                        kerusakanItem.prior_probability <= 1)
                        ? kerusakanItem.prior_probability
                        : 0.1;

                preparedData.push({
                    id: kerusakanItem.id,
                    kode: kerusakanItem.kode,
                    nama: kerusakanItem.nama,
                    deskripsi: typeof kerusakanItem.deskripsi === 'string' ? kerusakanItem.deskripsi : "",
                    tingkat_kerusakan: tingkat,
                    estimasi_biaya: typeof kerusakanItem.estimasi_biaya === 'string' ? kerusakanItem.estimasi_biaya : "",
                    waktu_perbaikan: typeof kerusakanItem.waktu_perbaikan === 'string' ? kerusakanItem.waktu_perbaikan : "",
                    prior_probability: priorProb,
                    solusi: typeof kerusakanItem.solusi === 'string' ? kerusakanItem.solusi : "",
                    gejala_terkait: Array.isArray(kerusakanItem.gejala_terkait) ? kerusakanItem.gejala_terkait.filter(g => typeof g === 'string').map(String) : [],
                });
            });

            if (validationErrors.length > 0) {
                toast.error(`Ditemukan ${validationErrors.length} kesalahan validasi dalam file JSON. Lihat konsol untuk detail.`);
                console.error("Kesalahan validasi impor Kerusakan:", validationErrors);
                return;
            }
            if (preparedData.length === 0) {
                toast.info("Tidak ada data kerusakan yang valid untuk diimpor dari file.");
                return;
            }

            toast("Konfirmasi Impor Data", {
                description: `Ditemukan ${preparedData.length} entri kerusakan valid dalam file. Pilih tindakan:`,
                action: {
                    label: "Hanya Tambah Baru",
                    onClick: async () => {
                        toast.dismiss();
                        await sendImportData(preparedData, false);
                    },
                },
                cancel: {
                    label: "Ganti & Tambah",
                    onClick: async () => {
                        toast.dismiss();
                        await sendImportData(preparedData, true);
                    },
                },
                duration: Infinity,
            });

        } catch (caughtError: unknown) {
            console.error("Terjadi kesalahan saat memproses file impor:", caughtError);
            let errorMessage = "Gagal membaca atau memproses file JSON.";
            if (caughtError instanceof Error) {
                errorMessage = caughtError.message;
            }
            toast.error(errorMessage);
        } finally {
            setIsImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const sendImportData = async (
        data: ImportKerusakanItemClient[],
        replaceExisting: boolean
    ): Promise<void> => {
        setIsSendingImport(true);
        try {
            const response = await fetch("/api/import-data/damages", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data, replaceExisting }),
            });

            const result: ApiResponse<{
                importedCount: number;
                replacedCount: number;
                skippedCount: number;
                warnings: string[];
                errors: string[];
            }> = await response.json();

            if (!response.ok) {
                if (response.status === 202) {
                    toast.warning(result.message || "Import selesai dengan peringatan.");
                    if (result.errors && result.errors.length > 0) {
                        console.error("Import Errors:", result.errors);
                    }
                    if (result.warnings && result.warnings.length > 0) {
                        console.warn("Import Warnings:", result.warnings);
                    }
                } else {
                    throw new Error(result.message || `Gagal melakukan import: ${response.status}`);
                }
            } else {
                toast.success(result.message || "Data berhasil diimpor.");
            }

            if (result.data) {
                toast.info(`${result.data.importedCount} data baru, ${result.data.replacedCount} diganti, ${result.data.skippedCount} dilewati.`);
            }

            await loadData();
        } catch (caughtError: unknown) {
            console.error("Terjadi kesalahan saat mengirim data impor:", caughtError);
            let errorMessage = "Gagal mengimpor data ke database.";
            if (caughtError instanceof Error) {
                errorMessage = caughtError.message;
            }
            toast.error(errorMessage);
        } finally {
            setIsSendingImport(false);
        }
    };

    const getTingkatColor = (tingkat: string): string => {
        switch (tingkat) {
            case "Ringan":
                return "bg-green-100 text-green-800 border-green-200";
            case "Sedang":
                return "bg-yellow-100 text-yellow-800 border-yellow-200";
            case "Berat":
                return "bg-red-100 text-red-800 border-red-200";
            default:
                return "bg-gray-100 text-gray-800 border-gray-200";
        }
    };

    const getStatistics = (): KerusakanStatistics => {
        const total = kerusakanList.length;
        const byTingkat = kerusakanList.reduce(
            (acc, item) => {
                acc[item.tingkat_kerusakan] = (acc[item.tingkat_kerusakan] || 0) + 1;
                return acc;
            },
            {} as Record<string, number>
        );

        const avgProbability = total > 0 ? kerusakanList.reduce((sum, item) => sum + item.prior_probability, 0) / total : 0;

        return { total, byTingkat, avgProbability };
    };

    const stats = getStatistics();

    if (isLoading || isSendingImport) {
        return (
            <div className="container mx-auto px-4 py-8 ">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 dark:bg-zinc-800 rounded w-1/3"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 dark:bg-zinc-800 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Kelola Kerusakan</h1>
                    <p className="text-muted-foreground mt-1">
                        Manajemen data kerusakan dan probabilitas prior untuk sistem diagnosa
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleImport} disabled={isImporting || isSendingImport}>
                        {isImporting || isSendingImport ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                        Import
                    </Button>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                    <Button onClick={() => router.push("/admin/damages/add")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Kerusakan
                    </Button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Total Kerusakan</p>
                                <p className="text-2xl font-bold">{stats.total}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Kerusakan Ringan</p>
                                <p className="text-2xl font-bold text-green-600">{stats.byTingkat.Ringan || 0}</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                <div className="h-4 w-4 rounded-full bg-green-600"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Kerusakan Berat</p>
                                <p className="text-2xl font-bold text-red-600">{stats.byTingkat.Berat || 0}</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                                <div className="h-4 w-4 rounded-full bg-red-600"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Rata-rata Probabilitas</p>
                                <p className="text-2xl font-bold">{stats.avgProbability.toFixed(3)}</p>
                            </div>
                            <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                                <div className="h-4 w-4 rounded-full bg-purple-600"></div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                            <Input
                                placeholder="Cari kerusakan berdasarkan kode, nama, atau deskripsi..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={filterTingkat} onValueChange={setFilterTingkat}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Filter tingkat" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tingkat</SelectItem>
                                {tingkatKerusakanOptions.map((tingkat) => (
                                    <SelectItem key={tingkat} value={tingkat}>
                                        {tingkat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Data Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Kerusakan ({filteredData.length})</CardTitle>
                    <CardDescription>Kelola data kerusakan yang digunakan dalam sistem diagnosa</CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading || isSendingImport ? (
                        <div className="flex justify-center items-center h-48">
                            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Kode</TableHead>
                                        <TableHead>Nama & Deskripsi</TableHead>
                                        <TableHead>Tingkat</TableHead>
                                        <TableHead>Probabilitas</TableHead>
                                        <TableHead>Info Perbaikan</TableHead>
                                        <TableHead>Gejala Terkait</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                {searchQuery || filterTingkat !== "all"
                                                    ? "Tidak ada kerusakan yang sesuai dengan filter"
                                                    : "Belum ada data kerusakan"}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        filteredData.map((item) => (
                                            <TableRow key={item.id} className="hover:bg-muted/50">
                                                <TableCell>
                                                    <Badge variant="outline" className="font-mono">
                                                        {item.kode}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="max-w-xs">
                                                    <div>
                                                        <p className="font-medium line-clamp-1">{item.nama}</p>
                                                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.deskripsi}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getTingkatColor(item.tingkat_kerusakan)}>
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        {item.tingkat_kerusakan}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-center">
                                                        <div className="font-mono text-sm font-medium">{item.prior_probability.toFixed(3)}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {(item.prior_probability * 100).toFixed(1)}%
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1 text-xs">
                                                        {item.estimasi_biaya && (
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <DollarSign className="h-3 w-3" />
                                                                <span className="truncate max-w-24" title={item.estimasi_biaya}>
                                                                    {item.estimasi_biaya}
                                                                </span>
                                                            </div>
                                                        )}
                                                        {item.waktu_perbaikan && (
                                                            <div className="flex items-center gap-1 text-muted-foreground">
                                                                <Clock className="h-3 w-3" />
                                                                <span>{item.waktu_perbaikan}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {item.gejala_terkait.slice(0, 3).map((gejala) => (
                                                            <Badge key={gejala} variant="secondary" className="text-xs">
                                                                {gejala}
                                                            </Badge>
                                                        ))}
                                                        {item.gejala_terkait.length > 3 && (
                                                            <Badge variant="secondary" className="text-xs">
                                                                +{item.gejala_terkait.length - 3}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex gap-1">
                                                        <Button variant="ghost" size="sm" onClick={() => handleEdit(item)} className="h-8 w-8 p-0">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => item.id && handleDelete(item.id, item.nama)}
                                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Hidden file input */}
            <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
        </div>
    );
}