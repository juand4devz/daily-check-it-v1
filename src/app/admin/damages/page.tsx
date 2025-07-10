// /admin/kerusakan/page.tsx
"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, DollarSign, Clock, AlertTriangle, Download, Upload, Search, RefreshCw, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { Kerusakan } from "@/types" // Use the updated Kerusakan type from types.ts

const tingkatKerusakanOptions: Array<Kerusakan["tingkat_kerusakan"]> = ["Ringan", "Sedang", "Berat"]

interface KerusakanStatistics {
    total: number
    byTingkat: Record<string, number>
    avgProbability: number
}

export default function KerusakanPage() {
    const [kerusakanList, setKerusakanList] = useState<Kerusakan[]>([])
    const [filteredData, setFilteredData] = useState<Kerusakan[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [filterTingkat, setFilterTingkat] = useState<string>("all")
    const [isLoading, setIsLoading] = useState(true)
    const [isImporting, setIsImporting] = useState(false) // For file processing
    const [isSendingImport, setIsSendingImport] = useState(false) // For API call
    const fileInputRef = useRef<HTMLInputElement>(null)
    const router = useRouter()

    useEffect(() => {
        loadData()
    }, [])

    useEffect(() => {
        filterData()
    }, [kerusakanList, searchQuery, filterTingkat])

    const loadData = async (): Promise<void> => {
        try {
            setIsLoading(true)
            const response = await fetch("/api/damages") // Fetch from new API
            if (!response.ok) {
                const errorDetail = await response.text()
                throw new Error(`Gagal memuat data kerusakan: ${response.status} ${errorDetail}`)
            }
            const fetchedData: Kerusakan[] = await response.json()

            // Sort data by 'kode' (KK1, KK2, etc.)
            const sortedData = fetchedData.sort((a, b) => {
                const numA = parseInt(a.kode.replace('KK', '')) || 0;
                const numB = parseInt(b.kode.replace('KK', '')) || 0;
                return numA - numB;
            });

            setKerusakanList(sortedData)
            toast.success("Data kerusakan berhasil dimuat.")
        } catch (error) {
            console.error("Error loading data:", error)
            toast.error(error instanceof Error ? error.message : "Gagal memuat data kerusakan")
            setKerusakanList([]) // Clear list on error
        } finally {
            setIsLoading(false)
        }
    }

    const filterData = (): void => {
        let filtered = kerusakanList

        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (item) =>
                    item.nama.toLowerCase().includes(query) ||
                    item.kode.toLowerCase().includes(query) ||
                    item.deskripsi.toLowerCase().includes(query),
            )
        }

        if (filterTingkat !== "all") {
            filtered = filtered.filter((item) => item.tingkat_kerusakan === filterTingkat)
        }

        setFilteredData(filtered)
    }

    const handleEdit = (kerusakan: Kerusakan): void => {
        // Use kerusakan.id for navigation, assuming your edit page route is /admin/damages/edit/[id]
        router.push(`/admin/damages/edit/${kerusakan.id}`)
    }

    const handleDelete = async (id: string, namaKerusakan: string): Promise<void> => {
        toast("Konfirmasi Hapus", {
            description: `Apakah Anda yakin ingin menghapus kerusakan "${namaKerusakan}"? Tindakan ini tidak dapat dibatalkan.`,
            action: {
                label: "Hapus",
                onClick: async () => {
                    try {
                        const response = await fetch(`/api/kerusakan/${id}`, { // Use the ID-based API route
                            method: "DELETE",
                        });

                        if (!response.ok) {
                            const errorDetail = await response.text();
                            throw new Error(`Gagal menghapus kerusakan: ${response.status} ${errorDetail}`);
                        }

                        await loadData(); // Reload data after successful deletion
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
        })
    }

    const handleExport = (): void => {
        try {
            const dataStr = JSON.stringify(kerusakanList, null, 2)
            const dataBlob = new Blob([dataStr], { type: "application/json" })
            const url = URL.createObjectURL(dataBlob)
            const link = document.createElement("a")
            link.href = url
            link.download = `kerusakan-data-${new Date().toISOString().split("T")[0]}.json`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            toast.success("Data berhasil diekspor")
        } catch (error) {
            console.error("Export error:", error)
            toast.error("Gagal mengekspor data")
        }
    }

    const handleImport = (): void => {
        fileInputRef.current?.click()
    }

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
        const file = event.target.files?.[0]
        if (!file) {
            toast.error("Tidak ada file yang dipilih.")
            return
        }

        if (file.type !== "application/json") {
            toast.error("File harus berformat JSON.")
            return
        }

        try {
            setIsImporting(true) // Indicate file processing
            const text = await file.text()
            const importedData: unknown = JSON.parse(text)

            if (!Array.isArray(importedData)) {
                toast.error("Format data tidak valid: Harap impor array JSON.")
                return
            }

            // Validate data structure and cast to Kerusakan[]
            const validatedData: Kerusakan[] = importedData.map((item: any, index: number) => {
                // Basic type checking for required fields and default values
                if (typeof item.id !== 'string' || !item.id.trim()) {
                    throw new Error(`Data tidak valid pada baris ${index + 1}: 'id' tidak valid atau kosong.`);
                }
                if (typeof item.kode !== 'string' || !item.kode.trim()) {
                    throw new Error(`Data tidak valid pada baris ${index + 1}: 'kode' tidak valid atau kosong.`);
                }
                if (typeof item.nama !== 'string' || !item.nama.trim()) {
                    throw new Error(`Data tidak valid pada baris ${index + 1}: 'nama' tidak valid atau kosong.`);
                }

                // Ensure 'tingkat_kerusakan' is one of the valid options, default to "Ringan"
                const tingkat: Kerusakan["tingkat_kerusakan"] = tingkatKerusakanOptions.includes(item.tingkat_kerusakan as any)
                    ? item.tingkat_kerusakan
                    : "Ringan";

                // Ensure prior_probability is a valid number
                const priorProb: number = typeof item.prior_probability === 'number' && item.prior_probability > 0 && item.prior_probability <= 0.5
                    ? item.prior_probability
                    : 0.1; // Default or fallback

                return {
                    id: item.id,
                    kode: item.kode,
                    nama: item.nama,
                    deskripsi: item.deskripsi || "",
                    tingkat_kerusakan: tingkat,
                    estimasi_biaya: item.estimasi_biaya || "",
                    waktu_perbaikan: item.waktu_perbaikan || "",
                    prior_probability: priorProb,
                    solusi: item.solusi || "",
                    gejala_terkait: Array.isArray(item.gejala_terkait) ? item.gejala_terkait.map(String) : [],
                    createdAt: item.createdAt || undefined, // Keep existing timestamps if available
                    updatedAt: item.updatedAt || undefined,
                } as Kerusakan;
            });

            // Show toast for replacement confirmation
            toast("Konfirmasi Impor Data", {
                description: `Ditemukan ${validatedData.length} entri kerusakan dalam file. Pilih tindakan:`,
                action: {
                    label: "Tambah Baru Saja",
                    onClick: async () => {
                        toast.dismiss(); // Dismiss the confirmation toast
                        await sendImportData("kerusakan", validatedData, false); // No replace
                    },
                },
                cancel: {
                    label: "Ganti yang Ada",
                    onClick: async () => {
                        toast.dismiss(); // Dismiss the confirmation toast
                        await sendImportData("kerusakan", validatedData, true); // Replace existing
                    },
                },
                duration: Infinity, // Keep toast open until action is taken
            });

        } catch (caughtError: unknown) {
            console.error("Terjadi kesalahan saat memproses file impor:", caughtError);
            let errorMessage = "Gagal membaca atau memproses file JSON.";
            if (caughtError instanceof Error) {
                errorMessage = caughtError.message;
            }
            toast.error(errorMessage);
        } finally {
            setIsImporting(false); // File processing finished
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Clear file input
            }
        }
    };

    // Generic function to send data to the import API
    const sendImportData = async (
        dataType: "gejala" | "kerusakan", // Explicitly define accepted types
        data: any[], // Use any[] as it could be Gejala[] or Kerusakan[]
        replaceExisting: boolean
    ): Promise<void> => {
        setIsSendingImport(true); // Indicate API call is in progress
        try {
            const response = await fetch("/api/import-data", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    dataType,
                    data,
                    replaceExisting,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || `Gagal melakukan import: ${response.status}`);
            }

            toast.success(result.message || "Data berhasil diimpor.");
            if (result.importedCount > 0) {
                toast.info(`${result.importedCount} data baru ditambahkan.`);
            }
            if (result.replacedCount > 0) {
                toast.info(`${result.replacedCount} data diganti.`);
            }
            if (result.skippedCount > 0) {
                toast.info(`${result.skippedCount} data dilewati (ID sudah ada).`);
            }
            await loadData(); // Reload data after successful import
        } catch (caughtError: unknown) {
            console.error("Terjadi kesalahan saat mengirim data impor:", caughtError);
            let errorMessage = "Gagal mengimpor data ke database.";
            if (caughtError instanceof Error) {
                errorMessage = caughtError.message;
            }
            toast.error(errorMessage);
        } finally {
            setIsSendingImport(false); // API call finished
        }
    };


    const getTingkatColor = (tingkat: string): string => {
        switch (tingkat) {
            case "Ringan":
                return "bg-green-100 text-green-800 border-green-200"
            case "Sedang":
                return "bg-yellow-100 text-yellow-800 border-yellow-200"
            case "Berat":
                return "bg-red-100 text-red-800 border-red-200"
            default:
                return "bg-gray-100 text-gray-800 border-gray-200"
        }
    }

    const getStatistics = (): KerusakanStatistics => {
        const total = kerusakanList.length
        const byTingkat = kerusakanList.reduce(
            (acc, item) => {
                acc[item.tingkat_kerusakan] = (acc[item.tingkat_kerusakan] || 0) + 1
                return acc
            },
            {} as Record<string, number>,
        )

        const avgProbability = total > 0 ? kerusakanList.reduce((sum, item) => sum + item.prior_probability, 0) / total : 0

        return { total, byTingkat, avgProbability }
    }

    const stats = getStatistics()

    if (isLoading || isSendingImport) { // Show loading for initial fetch or import operation
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
        )
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
                                            // Ensure no whitespace immediately after <TableRow key={item.id} ...>
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
                                                            onClick={() => handleDelete(item.id, item.nama)}
                                                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                            // Ensure no whitespace immediately before </TableRow>
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
    )
}