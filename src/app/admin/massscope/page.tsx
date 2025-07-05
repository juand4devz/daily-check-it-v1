"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Download, Filter, RefreshCw, Grid3X3, List, Search, Eye, EyeOff, Maximize2, Minimize2 } from "lucide-react"
import gejalaData from "@/data/gejala.json"
import kerusakanData from "@/data/kerusakan.json"
import { toast } from "sonner"

interface MassFunction {
    gejala: string
    namaGejala: string
    kategori: string
    kerusakan: string
    namaKerusakan: string
    value: number
    uncertainty: number
}

interface MatrixData {
    gejalaList: string[]
    kerusakanListFiltered: string[]
    matrix: Record<string, Record<string, number>>
}

interface GejalaWithMassFunction {
    kode: string
    nama: string
    kategori: string
    mass_function?: Record<string, number>
}

interface KerusakanWithInfo {
    kode: string
    nama: string
}

export default function MassFunctionPage() {
    const [massFunctionData, setMassFunctionData] = useState<MassFunction[]>([])
    const [filteredData, setFilteredData] = useState<MassFunction[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedKategori, setSelectedKategori] = useState("all")
    const [selectedKerusakan, setSelectedKerusakan] = useState("all")
    const [isLoading, setIsLoading] = useState(true)
    const [viewMode, setViewMode] = useState<"matrix" | "list">("matrix")
    const [showZeroValues, setShowZeroValues] = useState(false)
    const [isFullscreen, setIsFullscreen] = useState(false)

    // Get unique categories and kerusakan for filters
    const categories = Array.from(
        new Set(
            (gejalaData as GejalaWithMassFunction[])
                .map((g) => g.kategori)
                .filter((cat): cat is string => typeof cat === "string"),
        ),
    )

    const kerusakanList = (kerusakanData as KerusakanWithInfo[])
        .map((k) => ({ kode: k.kode, nama: k.nama }))
        .filter((k): k is { kode: string; nama: string } => typeof k.kode === "string" && typeof k.nama === "string")

    useEffect(() => {
        loadMassFunctionData()
    }, [])

    useEffect(() => {
        filterData()
    }, [massFunctionData, searchQuery, selectedKategori, selectedKerusakan])

    const loadMassFunctionData = (): void => {
        setIsLoading(true)
        try {
            const data: MassFunction[] = []

            const typedGejalaData = gejalaData as GejalaWithMassFunction[]
            const typedKerusakanData = kerusakanData as KerusakanWithInfo[]

            typedGejalaData.forEach((gejala) => {
                const massFunction = gejala.mass_function || {}
                const uncertainty = typeof massFunction.uncertainty === "number" ? massFunction.uncertainty : 0

                Object.entries(massFunction).forEach(([kerusakanKode, value]) => {
                    if (kerusakanKode !== "uncertainty" && typeof value === "number") {
                        const kerusakan = typedKerusakanData.find((k) => k.kode === kerusakanKode)

                        data.push({
                            gejala: gejala.kode,
                            namaGejala: gejala.nama,
                            kategori: gejala.kategori,
                            kerusakan: kerusakanKode,
                            namaKerusakan: typeof kerusakan?.nama === "string" ? kerusakan.nama : kerusakanKode,
                            value: value,
                            uncertainty: uncertainty,
                        })
                    }
                })
            })

            setMassFunctionData(data)
        } catch (error) {
            console.error("Error loading mass function data:", error)
            toast.error("Gagal memuat data mass function")
        } finally {
            setIsLoading(false)
        }
    }

    const filterData = (): void => {
        let filtered = massFunctionData

        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (item) =>
                    item.namaGejala.toLowerCase().includes(query) ||
                    item.gejala.toLowerCase().includes(query) ||
                    item.namaKerusakan.toLowerCase().includes(query) ||
                    item.kerusakan.toLowerCase().includes(query),
            )
        }

        if (selectedKategori !== "all") {
            filtered = filtered.filter((item) => item.kategori === selectedKategori)
        }

        if (selectedKerusakan !== "all") {
            filtered = filtered.filter((item) => item.kerusakan === selectedKerusakan)
        }

        setFilteredData(filtered)
    }

    const exportData = (): void => {
        const csvContent = [
            ["Gejala", "Nama Gejala", "Kategori", "Kerusakan", "Nama Kerusakan", "Mass Value", "Uncertainty"],
            ...filteredData.map((item) => [
                item.gejala,
                item.namaGejala,
                item.kategori,
                item.kerusakan,
                item.namaKerusakan,
                item.value.toFixed(3),
                item.uncertainty.toFixed(3),
            ]),
        ]
            .map((row) => row.join(","))
            .join("\n")

        const blob = new Blob([csvContent], { type: "text/csv" })
        const url = URL.createObjectURL(blob)
        const link = document.createElement("a")
        link.href = url
        link.download = "mass-function-data.csv"
        link.click()
        URL.revokeObjectURL(url)
        toast.success("Data berhasil diekspor")
    }

    const getValueColor = (value: number): string => {
        if (value >= 0.7) return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
        if (value >= 0.4) return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300"
        if (value >= 0.2) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
    }

    const getValueIntensity = (value: number): number => {
        return Math.min(100, Math.max(10, value * 100))
    }

    const getCellBackgroundColor = (value: number, isDark = false): string => {
        const intensity = getValueIntensity(value)
        if (isDark) {
            return `rgba(59, 130, 246, ${(intensity / 100) * 0.6})`
        }
        return `rgba(59, 130, 246, ${intensity / 100})`
    }

    // Create matrix view data
    const createMatrixData = (): MatrixData => {
        const gejalaList = Array.from(new Set(filteredData.map((item) => item.gejala)))
        const kerusakanListFiltered = Array.from(new Set(filteredData.map((item) => item.kerusakan)))

        const matrix: Record<string, Record<string, number>> = {}

        gejalaList.forEach((gejala) => {
            matrix[gejala] = {}
            kerusakanListFiltered.forEach((kerusakan) => {
                const item = filteredData.find((d) => d.gejala === gejala && d.kerusakan === kerusakan)
                matrix[gejala][kerusakan] = item?.value || 0
            })
        })

        return { gejalaList, kerusakanListFiltered, matrix }
    }

    const { gejalaList, kerusakanListFiltered, matrix } = createMatrixData()

    const calculateAverageMass = (): string => {
        if (filteredData.length === 0) return "0.000"
        const total = filteredData.reduce((sum, item) => sum + item.value, 0)
        return (total / filteredData.length).toFixed(3)
    }

    const FilterSheet = () => (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="lg:hidden bg-transparent">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
                <SheetHeader>
                    <SheetTitle>Filter Data</SheetTitle>
                    <SheetDescription>Gunakan filter untuk menyaring data mass function</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                    <div>
                        <label className="text-sm font-medium mb-2 block">Cari</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Cari gejala atau kerusakan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Kategori</label>
                        <Select value={selectedKategori} onValueChange={setSelectedKategori}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Kerusakan</label>
                        <Select value={selectedKerusakan} onValueChange={setSelectedKerusakan}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kerusakan</SelectItem>
                                {kerusakanList.map((k) => (
                                    <SelectItem key={k.kode} value={k.kode}>
                                        {k.kode} - {k.nama}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium">Tampilkan nilai 0</label>
                        <Button variant="ghost" size="sm" onClick={() => setShowZeroValues(!showZeroValues)}>
                            {showZeroValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    )

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
                    <p>Memuat data mass function...</p>
                </div>
            </div>
        )
    }

    return (
        <div
            className={`container mx-auto px-2 sm:px-4 py-4 sm:py-8 ${isFullscreen ? "fixed inset-0 z-50 bg-background overflow-auto" : ""}`}
        >
            {/* Header */}
            <div className="mb-4 sm:mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Mass Function Matrix</h1>
                        <p className="text-sm sm:text-base text-muted-foreground">
                            Visualisasi nilai kepercayaan (mass function) dalam bentuk tabel matrix
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => setIsFullscreen(!isFullscreen)}>
                            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        </Button>
                        <FilterSheet />
                    </div>
                </div>
            </div>

            {/* Desktop Filters */}
            <Card className="mb-4 sm:mb-6 hidden lg:block">
                <CardHeader className="pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Filter className="h-5 w-5" />
                        Filter & Export
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Cari</label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Cari gejala atau kerusakan..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Kategori</label>
                            <Select value={selectedKategori} onValueChange={setSelectedKategori}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kategori</SelectItem>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Kerusakan</label>
                            <Select value={selectedKerusakan} onValueChange={setSelectedKerusakan}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Semua Kerusakan</SelectItem>
                                    {kerusakanList.map((k) => (
                                        <SelectItem key={k.kode} value={k.kode}>
                                            {k.kode} - {k.nama}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium">Opsi</label>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant={showZeroValues ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setShowZeroValues(!showZeroValues)}
                                >
                                    {showZeroValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                </Button>
                                <Button onClick={exportData} size="sm">
                                    <Download className="mr-2 h-4 w-4" />
                                    Export
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4 sm:mb-6">
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="text-lg sm:text-2xl font-bold text-blue-600">{gejalaList.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Total Gejala</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="text-lg sm:text-2xl font-bold text-green-600">{kerusakanListFiltered.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Total Kerusakan</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="text-lg sm:text-2xl font-bold text-orange-600">{filteredData.length}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Total Relasi</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-3 sm:p-4">
                        <div className="text-lg sm:text-2xl font-bold text-purple-600">{calculateAverageMass()}</div>
                        <div className="text-xs sm:text-sm text-muted-foreground">Rata-rata Mass</div>
                    </CardContent>
                </Card>
            </div>

            {/* View Mode Tabs */}
            <Tabs
                value={viewMode}
                onValueChange={(value) => setViewMode(value as "matrix" | "list")}
                className="mb-4 sm:mb-6"
            >
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="matrix" className="flex items-center gap-2">
                        <Grid3X3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Matrix View</span>
                        <span className="sm:hidden">Matrix</span>
                    </TabsTrigger>
                    <TabsTrigger value="list" className="flex items-center gap-2">
                        <List className="h-4 w-4" />
                        <span className="hidden sm:inline">List View</span>
                        <span className="sm:hidden">List</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="matrix" className="mt-4">
                    {/* Matrix View */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg sm:text-xl">Matrix Mass Function</CardTitle>
                            <CardDescription className="text-sm">
                                Tabel matrix menunjukkan nilai kepercayaan setiap gejala terhadap kerusakan. Scroll horizontal dan
                                vertikal untuk melihat semua data.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="relative">
                                <ScrollArea className="w-full">
                                    <div className="min-w-full">
                                        <Table>
                                            <TableHeader className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                                                <TableRow>
                                                    <TableHead className="sticky left-0 z-30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 w-32 sm:w-40 border-r">
                                                        <div className="font-semibold">Gejala</div>
                                                    </TableHead>
                                                    {kerusakanListFiltered.map((kerusakan) => (
                                                        <TableHead key={kerusakan} className="text-center min-w-16 sm:min-w-20 p-1 sm:p-2">
                                                            <div className="transform -rotate-45 origin-center whitespace-nowrap text-xs sm:text-sm font-medium">
                                                                {kerusakan}
                                                            </div>
                                                        </TableHead>
                                                    ))}
                                                </TableRow>
                                            </TableHeader>
                                        </Table>
                                        <ScrollArea className="h-[60vh] sm:h-[70vh]">
                                            <Table>
                                                <TableBody>
                                                    {gejalaList.map((gejala) => {
                                                        const gejalaInfo = (gejalaData as GejalaWithMassFunction[]).find((g) => g.kode === gejala)
                                                        return (
                                                            <TableRow key={gejala} className="hover:bg-muted/50">
                                                                <TableCell className="sticky left-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 font-medium border-r w-32 sm:w-40 p-2 sm:p-4">
                                                                    <div className="space-y-1">
                                                                        <Badge variant="outline" className="text-xs">
                                                                            {gejala}
                                                                        </Badge>
                                                                        <div
                                                                            className="text-xs text-muted-foreground max-w-28 sm:max-w-32 truncate"
                                                                            title={gejalaInfo?.nama || "Unknown"}
                                                                        >
                                                                            {gejalaInfo?.nama || "Unknown"}
                                                                        </div>
                                                                        <Badge variant="secondary" className="text-xs">
                                                                            {gejalaInfo?.kategori || "Unknown"}
                                                                        </Badge>
                                                                    </div>
                                                                </TableCell>
                                                                {kerusakanListFiltered.map((kerusakan) => {
                                                                    const value = matrix[gejala]?.[kerusakan] || 0
                                                                    const intensity = getValueIntensity(value)
                                                                    const shouldShow = showZeroValues || value > 0

                                                                    return (
                                                                        <TableCell
                                                                            key={`${gejala}-${kerusakan}`}
                                                                            className="text-center p-1 sm:p-2 min-w-16 sm:min-w-20"
                                                                        >
                                                                            {shouldShow && value > 0 ? (
                                                                                <div
                                                                                    className="w-full h-8 sm:h-12 flex items-center justify-center rounded text-xs font-mono font-bold transition-all hover:scale-105 cursor-pointer"
                                                                                    style={{
                                                                                        backgroundColor: getCellBackgroundColor(value),
                                                                                        color: intensity > 50 ? "white" : "black",
                                                                                    }}
                                                                                    title={`${gejala} → ${kerusakan}: ${value.toFixed(3)}`}
                                                                                >
                                                                                    {value.toFixed(2)}
                                                                                </div>
                                                                            ) : (
                                                                                <div className="w-full h-8 sm:h-12 flex items-center justify-center bg-muted/30 rounded text-muted-foreground text-xs">
                                                                                    {showZeroValues ? "0.00" : "-"}
                                                                                </div>
                                                                            )}
                                                                        </TableCell>
                                                                    )
                                                                })}
                                                            </TableRow>
                                                        )
                                                    })}
                                                </TableBody>
                                            </Table>
                                            <ScrollBar orientation="vertical" />
                                        </ScrollArea>
                                    </div>
                                    <ScrollBar orientation="horizontal" />
                                </ScrollArea>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="list" className="mt-4">
                    {/* List View */}
                    <Card>
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg sm:text-xl">Detail Mass Function</CardTitle>
                            <CardDescription className="text-sm">
                                Daftar detail semua nilai mass function yang tersedia
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[60vh] sm:h-[70vh]">
                                <Table>
                                    <TableHeader className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                                        <TableRow>
                                            <TableHead className="w-20 sm:w-24">Gejala</TableHead>
                                            <TableHead className="hidden sm:table-cell">Nama Gejala</TableHead>
                                            <TableHead className="w-20 sm:w-24">Kategori</TableHead>
                                            <TableHead className="w-20 sm:w-24">Kerusakan</TableHead>
                                            <TableHead className="hidden sm:table-cell">Nama Kerusakan</TableHead>
                                            <TableHead className="w-20 sm:w-24">Mass Value</TableHead>
                                            <TableHead className="hidden lg:table-cell w-20">Uncertainty</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredData.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                                    Tidak ada data yang sesuai dengan filter
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredData
                                                .sort((a, b) => b.value - a.value)
                                                .map((item, index) => (
                                                    <TableRow key={`${item.gejala}-${item.kerusakan}-${index}`} className="hover:bg-muted/50">
                                                        <TableCell className="p-2 sm:p-4">
                                                            <Badge variant="outline" className="text-xs">
                                                                {item.gejala}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell max-w-xs p-2 sm:p-4">
                                                            <div className="truncate text-sm" title={item.namaGejala}>
                                                                {item.namaGejala}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="p-2 sm:p-4">
                                                            <Badge variant="secondary" className="text-xs">
                                                                {item.kategori}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="p-2 sm:p-4">
                                                            <Badge variant="outline" className="text-xs">
                                                                {item.kerusakan}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden sm:table-cell max-w-xs p-2 sm:p-4">
                                                            <div className="truncate text-sm" title={item.namaKerusakan}>
                                                                {item.namaKerusakan}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="p-2 sm:p-4">
                                                            <Badge className={getValueColor(item.value)}>{item.value.toFixed(3)}</Badge>
                                                        </TableCell>
                                                        <TableCell className="hidden lg:table-cell p-2 sm:p-4">
                                                            <span className="font-mono text-sm text-muted-foreground">
                                                                {item.uncertainty.toFixed(3)}
                                                            </span>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                        )}
                                    </TableBody>
                                </Table>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Legend */}
            <Card className="mt-4 sm:mt-6">
                <CardHeader className="pb-4">
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
                                <li>• Gunakan scroll horizontal dan vertikal untuk navigasi</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
