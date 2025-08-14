// /admin/massscope/page.tsx
"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Filter, Grid3X3, List, Search, Eye, EyeOff, WifiOff } from "lucide-react";
import { toast } from "sonner";
import Fuse from "fuse.js";
import { Gejala, Kerusakan, ApiResponse } from "@/types/diagnose";
import Loading from "./loading";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Interfaces ---
interface CombinedMassFunctionData {
    gejalaId?: string;
    gejalaKode: string;
    gejalaNama: string;
    kategori: string;
    kerusakanKode: string;
    kerusakanNama: string;
    value: number;
    uncertainty: number;
}

interface MatrixData {
    gejalaList: string[]; // List of gejala codes
    kerusakanListFiltered: string[]; // List of kerusakan codes
    matrix: Record<string, Record<string, number>>; // matrix[gejalaKode][kerusakanKode] = value
}

interface MassScopeStatistics {
    totalGejala: number;
    totalKerusakan: number;
    totalRelations: number;
    averageMass: number;
}

export default function MassScopePage() {
    const [allGejala, setAllGejala] = useState<Gejala[]>([]);
    const [allKerusakan, setAllKerusakan] = useState<Kerusakan[]>([]);
    const [massFunctionData, setMassFunctionData] = useState<CombinedMassFunctionData[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedKategori, setSelectedKategori] = useState("all");
    const [selectedKerusakan, setSelectedKerusakan] = useState("all");
    const [isLoading, setIsLoading] = useState(true);
    const [errorFetching, setErrorFetching] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix");
    const [showZeroValues, setShowZeroValues] = useState(false);

    // --- Data Fetching from API ---
    const fetchAllData = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        setErrorFetching(null);
        try {
            const [gejalaRes, kerusakanRes] = await Promise.all([
                fetch("/api/diagnose/symptoms"),
                fetch("/api/diagnose/damages"),
            ]);

            const gejalaData: ApiResponse<Gejala[]> = await gejalaRes.json();
            const kerusakanData: ApiResponse<Kerusakan[]> = await kerusakanRes.json();

            if (!gejalaRes.ok || !gejalaData.status) {
                throw new Error(gejalaData.message || `Gagal memuat data gejala: ${gejalaRes.status}`);
            }
            if (!kerusakanRes.ok || !kerusakanData.status) {
                throw new Error(kerusakanData.message || `Gagal memuat data kerusakan: ${kerusakanRes.status}`);
            }

            // Ensure fetched data is unique by kode before setting state
            const uniqueFetchedGejala = Array.from(new Map((gejalaData.data || []).map(g => [g.kode, g])).values());
            const uniqueFetchedKerusakan = Array.from(new Map((kerusakanData.data || []).map(k => [k.kode, k])).values());

            setAllGejala(uniqueFetchedGejala);
            setAllKerusakan(uniqueFetchedKerusakan);
            toast.success("Data gejala dan kerusakan berhasil dimuat.");
        } catch (error) {
            console.error("Error fetching all data:", error);
            const errorMessage = error instanceof Error ? error.message : "Gagal memuat data utama.";
            toast.error(errorMessage);
            setErrorFetching(errorMessage);
            setAllGejala([]);
            setAllKerusakan([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    // --- Data Preparation (Combines Gejala & Kerusakan for Mass Function Display) ---
    const prepareMassFunctionData = useCallback((gejalaData: Gejala[], kerusakanData: Kerusakan[]): void => {
        const preparedData: CombinedMassFunctionData[] = [];

        gejalaData.forEach((gejala) => {
            const massFunction = gejala.mass_function || {};
            const uncertainty = typeof massFunction.uncertainty === "number" ? massFunction.uncertainty : 0;

            Object.entries(massFunction).forEach(([kerusakanKode, value]) => {
                if (kerusakanKode !== "uncertainty" && typeof value === "number") {
                    const kerusakan = kerusakanData.find((k) => k.kode === kerusakanKode);

                    preparedData.push({
                        gejalaId: gejala.id,
                        gejalaKode: gejala.kode,
                        gejalaNama: gejala.nama,
                        kategori: gejala.kategori,
                        kerusakanKode: kerusakanKode,
                        kerusakanNama: kerusakan?.nama || `Unknown Kerusakan (${kerusakanKode})`,
                        value: value,
                        uncertainty: uncertainty,
                    });
                }
            });
        });
        setMassFunctionData(preparedData);
    }, []);

    useEffect(() => {
        prepareMassFunctionData(allGejala, allKerusakan);
    }, [allGejala, allKerusakan, prepareMassFunctionData]);

    // --- Filtering Logic with Fuse.js ---
    const fuse = useMemo(() => {
        const options = {
            keys: ['gejalaKode', 'gejalaNama', 'kerusakanKode', 'kerusakanNama'],
            threshold: 0.3,
        };
        return new Fuse(massFunctionData, options);
    }, [massFunctionData]);

    const filteredData = useMemo(() => {
        const searchResults = searchQuery.trim() ? fuse.search(searchQuery).map(result => result.item) : massFunctionData;

        let filtered = searchResults.filter((item) => {
            const kategoriMatch = selectedKategori === "all" || item.kategori === selectedKategori;
            const kerusakanMatch = selectedKerusakan === "all" || item.kerusakanKode === selectedKerusakan;
            return kategoriMatch && kerusakanMatch;
        });

        if (!showZeroValues) {
            filtered = filtered.filter((item) => item.value > 0);
        }

        return filtered;
    }, [massFunctionData, searchQuery, selectedKategori, selectedKerusakan, showZeroValues, fuse]);

    // --- Derived values for filters (dynamic) ---
    const categoriesOptions = useMemo(() => {
        return Array.from(new Set(allGejala.map((g) => g.kategori))).filter((cat): cat is string => typeof cat === "string").sort();
    }, [allGejala]);

    const kerusakanFilterOptions = useMemo(() => {
        return allKerusakan
            .map((k) => ({ kode: k.kode, nama: k.nama }))
            .sort((a, b) => {
                const numA = parseInt(a.kode.replace("KK", "")) || 0;
                const numB = parseInt(b.kode.replace("KK", "")) || 0;
                return numA - numB;
            });
    }, [allKerusakan]);

    // --- Calculate Mass Scope Statistics ---
    const calculateStatistics = useCallback((): MassScopeStatistics => {
        const totalGejala = new Set(filteredData.map((item) => item.gejalaKode)).size;
        const totalKerusakan = new Set(filteredData.map((item) => item.kerusakanKode)).size;
        const totalRelations = filteredData.length;

        let sumOfMassValues = 0;
        let countOfMassValues = 0;

        filteredData.forEach((item) => {
            if (showZeroValues || item.value > 0) {
                sumOfMassValues += item.value;
                countOfMassValues++;
            }
        });

        const averageMass = countOfMassValues > 0 ? sumOfMassValues / countOfMassValues : 0;

        return {
            totalGejala,
            totalKerusakan,
            totalRelations,
            averageMass,
        };
    }, [filteredData, showZeroValues]);

    const stats = calculateStatistics();

    // --- Export Data to CSV ---
    const exportData = (): void => {
        if (filteredData.length === 0) {
            toast.info("Tidak ada data untuk diekspor.");
            return;
        }
        const csvContent = [
            ["Gejala Kode", "Nama Gejala", "Kategori", "Kerusakan Kode", "Nama Kerusakan", "Mass Value", "Uncertainty"],
            ...filteredData.map((item) => [
                item.gejalaKode,
                item.gejalaNama,
                item.kategori,
                item.kerusakanKode,
                item.kerusakanNama,
                item.value.toFixed(3),
                item.uncertainty.toFixed(3),
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "mass-function-data.csv";
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
        toast.success("Data berhasil diekspor.");
    };

    const getValueColor = (value: number): string => {
        if (value >= 0.7) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
        if (value >= 0.4) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300";
        if (value >= 0.2) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    };

    const getValueIntensity = (value: number): number => {
        return Math.min(100, Math.max(10, value * 100));
    };

    const getCellBackgroundColor = (value: number): string => {
        const intensity = getValueIntensity(value);
        return `rgba(59, 130, 246, ${intensity / 100})`;
    };

    // --- Create Matrix Data ---
    const createMatrixData = useMemo((): MatrixData => {
        const uniqueGejalaCodes = Array.from(new Set(filteredData.map((item) => item.gejalaKode))).sort((a, b) => {
            const numA = parseInt(a.replace("G", "")) || 0;
            const numB = parseInt(b.replace("G", "")) || 0;
            return numA - numB;
        });

        const uniqueKerusakanCodes = Array.from(new Set(filteredData.map((item) => item.kerusakanKode))).sort((a, b) => {
            const numA = parseInt(a.replace("KK", "")) || 0;
            const numB = parseInt(b.replace("KK", "")) || 0;
            return numA - numB;
        });

        const matrix: Record<string, Record<string, number>> = {};

        uniqueGejalaCodes.forEach((gejalaKode) => {
            matrix[gejalaKode] = {};
            uniqueKerusakanCodes.forEach((kerusakanKode) => {
                const item = filteredData.find((d) => d.gejalaKode === gejalaKode && d.kerusakanKode === kerusakanKode);
                matrix[gejalaKode][kerusakanKode] = item?.value || 0;
            });
        });

        return { gejalaList: uniqueGejalaCodes, kerusakanListFiltered: uniqueKerusakanCodes, matrix };
    }, [filteredData]);

    const { gejalaList: matrixGejalaList, kerusakanListFiltered, matrix } = createMatrixData;


    if (isLoading) {
        return <Loading />;
    }

    if (errorFetching) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Alert variant="destructive" className="mb-4">
                    <WifiOff className="h-4 w-4" />
                    <AlertTitle>Kesalahan Data!</AlertTitle>
                    <AlertDescription>{errorFetching}</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Mass Function Matrix</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Visualisasi nilai kepercayaan (mass function) dalam bentuk tabel matrix
                        </p>
                    </div>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{stats.totalGejala}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Total Gejala</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">{stats.totalKerusakan}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Total Kerusakan</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="text-lg sm:text-2xl font-bold text-orange-600">{stats.totalRelations}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Total Relasi (non-nol)</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="text-lg sm:text-2xl font-bold text-purple-600">{stats.averageMass.toFixed(3)}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Rata-rata Mass</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters & Export */}
            <Card className="mb-2 sm:mb-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Filter className="h-5 w-5" />
                        Filter & Export
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="md:col-span-2 lg:col-span-2">
                            <label htmlFor="searchQuery" className="text-sm font-medium mb-2 block">Cari</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="searchQuery"
                                    placeholder="Cari gejala atau kerusakan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 w-full"
                                />
                            </div>
                        </div>
                        <div>
                            <label htmlFor="categoryFilter" className="text-sm font-medium mb-2 block">Kategori Gejala</label>
                            <Select value={selectedKategori} onValueChange={setSelectedKategori}>
                                <SelectTrigger id="categoryFilter" className="w-full">
                                    <SelectValue placeholder="Semua Kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {categoriesOptions.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label htmlFor="kerusakanFilter" className="text-sm font-medium mb-2 block">Kerusakan</label>
                            <Select value={selectedKerusakan} onValueChange={setSelectedKerusakan}>
                                <SelectTrigger id="kerusakanFilter" className="w-full">
                                    <SelectValue placeholder="Semua Kerusakan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kerusakan</SelectItem>
                                    {kerusakanFilterOptions.map((k) => (
                                        <SelectItem key={k.kode} value={k.kode}>
                                            {k.kode} - {k.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-full flex flex-col sm:flex-row items-start sm:items-center gap-2 mt-2 justify-between">
                            <div className="flex items-center gap-2">
                                <label className="text-sm font-medium whitespace-nowrap">Tampilkan Nilai Nol</label>
                                <Button variant="ghost" size="sm" onClick={() => setShowZeroValues(!showZeroValues)}>
                                    {showZeroValues ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </Button>
                            </div>
                            <Button onClick={exportData} size="sm" className="w-full sm:w-auto">
                                <Download className="mr-2 h-4 w-4" />
                                Export Data
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* View Mode Tabs */}
            <div className="w-full flex items-center justify-center">
                <Tabs
                    value={viewMode}
                    onValueChange={(value) => setViewMode(value as "matrix" | "list")}
                    className="mb-4 sm:mb-6 w-full md:max-w-4xl relative"
                >
                    <TabsList className="mx-auto absolute top-2 right-0">
                        <TabsTrigger value="matrix" className="flex items-center justify-center gap-2">
                            <Grid3X3 className="h-4 w-4" />
                            <span>Matrix</span>
                        </TabsTrigger>
                        <TabsTrigger value="list" className="flex items-center justify-center gap-2">
                            <List className="h-4 w-4" />
                            <span>List</span>
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="matrix" className="mt-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl">Matrix Mass Function</CardTitle>
                                <CardDescription className="text-sm">
                                    Tabel matrix menunjukkan nilai kepercayaan setiap gejala terhadap kerusakan. Gulir horizontal dan
                                    vertikal untuk melihat semua data.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="relative overflow-auto" style={{ maxHeight: '60vh' }}>
                                    <table className="w-full caption-bottom text-sm border-collapse">
                                        <thead>
                                            {/* Header row with sticky top and background */}
                                            <tr className="[&_th]:sticky [&_th]:top-0 [&_th]:z-20 [&_th]:bg-background/95 [&_th]:backdrop-blur [&_th]:supports-[backdrop-filter]:bg-background/60">
                                                {/* Gejala header - sticky left */}
                                                <th className="sticky left-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-28 sm:w-32 md:w-40 border-r p-2 sm:p-3 text-left align-bottom text-xs sm:text-sm">
                                                    <div className="font-semibold whitespace-nowrap">Gejala</div>
                                                </th>
                                                {/* Kerusakan headers - rotate and adapt width */}
                                                {kerusakanListFiltered.map((kerusakanKode) => {
                                                    const kerusakan = allKerusakan.find((k) => k.kode === kerusakanKode);
                                                    return (
                                                        <th key={kerusakanKode} className="text-center min-w-[70px] sm:min-w-[80px] md:min-w-[100px] p-1 sm:p-2 align-bottom">
                                                            <div
                                                                className="transform -rotate-45 origin-center whitespace-nowrap text-[0.6rem] sm:text-xs font-medium"
                                                                title={kerusakan?.nama || kerusakanKode}
                                                            >
                                                                {kerusakanKode}
                                                            </div>
                                                        </th>
                                                    );
                                                })}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matrixGejalaList.length === 0 ? (
                                                <tr>
                                                    <td colSpan={kerusakanListFiltered.length + 1} className="text-center py-8 text-muted-foreground text-sm">
                                                        Tidak ada data mass function yang sesuai dengan filter.
                                                    </td>
                                                </tr>
                                            ) : (
                                                matrixGejalaList.map((gejalaKode) => {
                                                    const gejalaInfo = allGejala.find((g) => g.kode === gejalaKode);
                                                    return (
                                                        <tr key={gejalaKode} className="hover:bg-muted/50">
                                                            {/* Gejala info column - sticky left */}
                                                            <td className="sticky left-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 font-medium border-r w-28 sm:w-32 md:w-40 p-2 sm:p-3 align-top">
                                                                <div className="space-y-1">
                                                                    <Badge variant="outline" className="text-[0.6rem] sm:text-xs">
                                                                        {gejalaKode}
                                                                    </Badge>
                                                                    <div
                                                                        className="text-[0.6rem] sm:text-xs text-muted-foreground max-w-24 sm:max-w-28 md:max-w-32 truncate"
                                                                        title={gejalaInfo?.nama || "Unknown"}
                                                                    >
                                                                        {gejalaInfo?.nama || "Unknown"}
                                                                    </div>
                                                                    <Badge variant="secondary" className="text-[0.6rem] sm:text-xs">
                                                                        {gejalaInfo?.kategori || "Unknown"}
                                                                    </Badge>
                                                                </div>
                                                            </td>
                                                            {/* Mass value cells */}
                                                            {kerusakanListFiltered.map((kerusakanKodeCol) => {
                                                                const value = matrix[gejalaKode]?.[kerusakanKodeCol] || 0;
                                                                const shouldShow = showZeroValues || value > 0;
                                                                const kerusakanNama = allKerusakan.find((k) => k.kode === kerusakanKodeCol)?.nama || kerusakanKodeCol;

                                                                return (
                                                                    <td key={`${gejalaKode}-${kerusakanKodeCol}`} className="text-center p-1 sm:p-2 min-w-[70px] sm:min-w-[80px] md:min-w-[100px] align-middle">
                                                                        {shouldShow ? (
                                                                            <div
                                                                                className="w-full h-7 sm:h-8 md:h-10 flex items-center justify-center rounded text-[0.6rem] sm:text-xs font-mono font-bold transition-all hover:scale-105 cursor-pointer"
                                                                                style={{
                                                                                    backgroundColor: getCellBackgroundColor(value),
                                                                                    color: value > 0.5 ? "white" : "black",
                                                                                }}
                                                                                title={`${gejalaInfo?.nama || gejalaKode} → ${kerusakanNama}: ${value.toFixed(3)}`}
                                                                            >
                                                                                {value.toFixed(2)}
                                                                            </div>
                                                                        ) : (
                                                                            <div className="w-full h-7 sm:h-8 md:h-10 flex items-center justify-center bg-muted/30 rounded text-[0.6rem] sm:text-xs">
                                                                                -
                                                                            </div>
                                                                        )}
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="list" className="mt-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg sm:text-xl">Detail Mass Function</CardTitle>
                                <CardDescription className="text-sm">
                                    Daftar detail semua nilai mass function yang tersedia
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <ScrollArea className="h-[60vh] sm:h-[70vh]">
                                    <table className="w-full caption-bottom text-sm relative min-w-[700px] md:min-w-full">
                                        <thead className="[&_th]:sticky [&_th]:top-0 [&_th]:z-10 [&_th]:bg-background/95 [&_th]:backdrop-blur [&_th]:supports-[backdrop-filter]:bg-background/60">
                                            <tr>
                                                <th className="w-20 sm:w-24 text-left p-2 sm:p-4">Gejala Kode</th>
                                                <th className="hidden sm:table-cell w-32 sm:w-40 text-left p-2 sm:p-4">Nama Gejala</th>
                                                <th className="w-20 sm:w-24 text-left p-2 sm:p-4">Kategori</th>
                                                <th className="w-20 sm:w-24 text-left p-2 sm:p-4">Kerusakan Kode</th>
                                                <th className="hidden sm:table-cell w-32 sm:w-40 text-left p-2 sm:p-4">Nama Kerusakan</th>
                                                <th className="w-20 sm:w-24 text-left p-2 sm:p-4">Mass Value</th>
                                                <th className="hidden lg:table-cell w-20 text-left p-2 sm:p-4">Uncertainty</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData.length === 0 ? (
                                                <tr>
                                                    <td colSpan={7} className="text-center py-8 text-muted-foreground text-sm">
                                                        Tidak ada data yang sesuai dengan filter
                                                    </td>
                                                </tr>
                                            ) : (
                                                filteredData
                                                    .sort((a, b) => b.value - a.value)
                                                    .map((item, index) => (
                                                        <tr key={`${item.gejalaId}-${item.kerusakanKode}-${index}`} className="hover:bg-muted/50">
                                                            <td className="p-2 sm:p-4">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {item.gejalaKode}
                                                                </Badge>
                                                            </td>
                                                            <td className="hidden sm:table-cell max-w-xs p-2 sm:p-4">
                                                                <div className="truncate text-sm" title={item.gejalaNama}>
                                                                    {item.gejalaNama}
                                                                </div>
                                                            </td>
                                                            <td className="p-2 sm:p-4">
                                                                <Badge variant="secondary" className="text-xs">{item.kategori}</Badge>
                                                            </td>
                                                            <td className="p-2 sm:p-4">
                                                                <Badge variant="outline" className="text-xs">
                                                                    {item.kerusakanKode}
                                                                </Badge>
                                                            </td>
                                                            <td className="hidden sm:table-cell max-w-xs p-2 sm:p-4">
                                                                <div className="truncate text-sm" title={item.kerusakanNama}>
                                                                    {item.kerusakanNama}
                                                                </div>
                                                            </td>
                                                            <td className="p-2 sm:p-4">
                                                                <Badge className={getValueColor(item.value)}>{item.value.toFixed(3)}</Badge>
                                                            </td>
                                                            <td className="hidden lg:table-cell p-2 sm:p-4">
                                                                <span className="font-mono text-sm text-muted-foreground">
                                                                    {item.uncertainty.toFixed(3)}
                                                                </span>
                                                            </td>
                                                        </tr>
                                                    ))
                                            )}
                                        </tbody>
                                    </table>
                                    <ScrollBar orientation="vertical" />
                                </ScrollArea>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Legend */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">Keterangan</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                        <div>
                            <h4 className="font-medium mb-3">Intensitas Warna Matrix:</h4>
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/30 rounded"></div>
                                    <span className="text-sm">0.00 - 0.20 (Rendah)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 bg-blue-300 dark:bg-blue-700/50 rounded"></div>
                                    <span className="text-sm">0.20 - 0.40 (Sedang)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 bg-blue-500 dark:bg-blue-600/70 rounded"></div>
                                    <span className="text-sm">0.40 - 0.70 (Tinggi)</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 bg-blue-700 dark:bg-blue-500/80 rounded"></div>
                                    <span className="text-sm">0.70 - 1.00 (Sangat Tinggi)</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-medium mb-3">Informasi:</h4>
                            <ul className="text-sm space-y-1 text-muted-foreground">
                                <li>• Mass Function menunjukkan tingkat kepercayaan gejala terhadap kerusakan</li>
                                <li>• Nilai berkisar antara 0.00 hingga 1.00</li>
                                <li>• Uncertainty adalah nilai ketidakpastian yang tersisa</li>
                                <li>• Matrix memudahkan analisis pola hubungan gejala-kerusakan</li>
                                <li>• Gunakan gulir horizontal dan vertikal untuk navigasi</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}