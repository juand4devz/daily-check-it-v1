"use client"
import { useState, useEffect, useRef } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Download, Upload, Search, RefreshCw } from "lucide-react"
import gejalaData from "@/data/gejala.json"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import type { Gejala } from "@/types"

const categories = [
  "Power",
  "Display",
  "Hardware",
  "System",
  "Performance",
  "Cooling",
  "Storage",
  "BIOS",
  "Port",
  "Network",
  "Audio",
  "Input",
  "Camera",
  "Battery",
  "Graphics",
  "Software",
  "OS",
  "Security",
  "Peripheral",
]

interface GejalaStatistics {
  total: number
  byCategory: Record<string, number>
  byDevice: Record<string, number>
  totalMassFunctions: number
}

interface ExistingGejala extends Record<string, unknown> {
  kode: string
  nama?: string
  deskripsi?: string
  kategori?: string
  perangkat?: string[]
  mass_function?: Record<string, number>
  gambar?: string
}

export default function GejalaPage() {
  const [gejalaList, setGejalaList] = useState<Gejala[]>([])
  const [filteredData, setFilteredData] = useState<Gejala[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [filterDevice, setFilterDevice] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    filterData()
  }, [gejalaList, searchQuery, filterCategory, filterDevice])

  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true)
      await new Promise((resolve) => setTimeout(resolve, 500))

      const convertedData: Gejala[] = Array.isArray(gejalaData)
        ? gejalaData.map((item: ExistingGejala) => ({
          kode: item.kode,
          nama: item.nama || "",
          deskripsi: item.deskripsi || "",
          kategori: item.kategori || "System",
          perangkat: Array.isArray(item.perangkat) ? item.perangkat : [],
          mass_function: item.mass_function || { uncertainty: 0.1 },
          gambar: item.gambar || "",
        }))
        : []

      setGejalaList(convertedData)
      toast.success("Data gejala berhasil dimuat")
    } catch (error) {
      console.error("Error loading data:", error)
      toast.error("Gagal memuat data gejala")
      setGejalaList([])
    } finally {
      setIsLoading(false)
    }
  }

  const filterData = (): void => {
    let filtered = gejalaList

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (item) =>
          item.nama.toLowerCase().includes(query) ||
          item.kode.toLowerCase().includes(query) ||
          item.kategori.toLowerCase().includes(query) ||
          item.deskripsi.toLowerCase().includes(query),
      )
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((item) => item.kategori === filterCategory)
    }

    if (filterDevice !== "all") {
      filtered = filtered.filter((item) => item.perangkat.includes(filterDevice))
    }

    setFilteredData(filtered)
  }

  const handleEdit = (gejala: Gejala): void => {
    router.push(`/admin/symptoms/edit/${gejala.kode}`)
  }

  const handleDelete = async (kode: string): Promise<void> => {
    const gejala = gejalaList.find((g) => g.kode === kode)
    if (!gejala) return

    toast("Konfirmasi Hapus", {
      description: `Apakah Anda yakin ingin menghapus gejala "${gejala.nama}"?`,
      action: {
        label: "Hapus",
        onClick: () => {
          try {
            setGejalaList((prev) => prev.filter((g) => g.kode !== kode))
            toast.success("Gejala berhasil dihapus")
          } catch (error) {
            console.error("Error deleting:", error)
            toast.error("Gagal menghapus gejala")
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
      const dataStr = JSON.stringify(gejalaList, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `gejala-data-${new Date().toISOString().split("T")[0]}.json`
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
    if (!file) return

    if (file.type !== "application/json") {
      toast.error("File harus berformat JSON")
      return
    }

    try {
      setIsImporting(true)
      const text = await file.text()
      const importedData = JSON.parse(text) as Record<string, unknown>[]

      if (!Array.isArray(importedData)) {
        throw new Error("Format data tidak valid")
      }

      // Validate data structure
      const validatedData: Gejala[] = importedData.map((item, index) => {
        if (!item.kode || !item.nama) {
          throw new Error(`Data tidak valid pada baris ${index + 1}`)
        }
        return {
          kode: String(item.kode),
          nama: String(item.nama),
          deskripsi: String(item.deskripsi || ""),
          kategori: String(item.kategori || "System"),
          perangkat: Array.isArray(item.perangkat) ? (item.perangkat as string[]) : [],
          mass_function: (item.mass_function as Record<string, number>) || { uncertainty: 0.1 },
          gambar: String(item.gambar || ""),
        }
      })

      setGejalaList(validatedData)
      toast.success(`Berhasil mengimpor ${validatedData.length} data gejala`)
    } catch (error) {
      console.error("Import error:", error)
      toast.error(error instanceof Error ? error.message : "Gagal mengimpor data")
    } finally {
      setIsImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const getStatistics = (): GejalaStatistics => {
    const total = gejalaList.length
    const byCategory = gejalaList.reduce(
      (acc, item) => {
        acc[item.kategori] = (acc[item.kategori] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    const byDevice = gejalaList.reduce(
      (acc, item) => {
        item.perangkat.forEach((device) => {
          acc[device] = (acc[device] || 0) + 1
        })
        return acc
      },
      {} as Record<string, number>,
    )

    const totalMassFunctions = gejalaList.reduce((sum, item) => {
      return sum + Object.keys(item.mass_function).filter((key) => key !== "uncertainty").length
    }, 0)

    return { total, byCategory, byDevice, totalMassFunctions }
  }

  const stats = getStatistics()

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
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
          <h1 className="text-3xl font-bold">Kelola Gejala</h1>
          <p className="text-muted-foreground mt-1">
            Manajemen data gejala dan nilai kepercayaan (mass function) untuk sistem diagnosa
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport} disabled={isImporting}>
            {isImporting ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
            Import
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => router.push("/admin/symptoms/add")}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Gejala
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="px-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Gejala</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-blue-600"></div>
              </div>
            </div>
          </CardContent>
        </Card >

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kategori Terbanyak</p>
                <p className="text-2xl font-bold text-green-600">{Object.keys(stats.byCategory).length}</p>
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
                <p className="text-sm font-medium text-muted-foreground">Komputer</p>
                <p className="text-2xl font-bold text-purple-600">{stats.byDevice.computer || 0}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-purple-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Mass Functions</p>
                <p className="text-2xl font-bold text-orange-600">{stats.totalMassFunctions}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
                <div className="h-4 w-4 rounded-full bg-orange-600"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div >

      {/* Filters */}
      <Card className="mb-6" >
        <CardContent className="px-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Cari gejala berdasarkan kode, nama, kategori, atau deskripsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterDevice} onValueChange={setFilterDevice}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter perangkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Perangkat</SelectItem>
                <SelectItem value="computer">Komputer</SelectItem>
                <SelectItem value="laptop">Laptop</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card >

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Gejala ({filteredData.length})</CardTitle>
          <CardDescription>Kelola data gejala dan nilai kepercayaan untuk sistem diagnosa</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama Gejala</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead>Perangkat</TableHead>
                  <TableHead>Mass Function</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {searchQuery || filterCategory !== "all" || filterDevice !== "all"
                        ? "Tidak ada gejala yang sesuai dengan filter"
                        : "Belum ada data gejala"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((gejala) => (
                    <TableRow key={gejala.kode} className="hover:bg-muted/50">
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {gejala.kode}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div>
                          <p className="font-medium line-clamp-1">{gejala.nama}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{gejala.deskripsi}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{gejala.kategori}</Badge>
                      </TableCell>
                      <TableCell>
                        {gejala.perangkat && gejala.perangkat.length > 0 ? (
                          <div className="flex gap-1">
                            {gejala.perangkat.map((device) => (
                              <Badge key={device} variant="outline" className="text-xs">
                                {device === "computer" ? "PC" : "Laptop"}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {Object.entries(gejala.mass_function)
                            .filter(([key]) => key !== "uncertainty")
                            .slice(0, 2)
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between text-xs">
                                <span className="font-mono">{key}:</span>
                                <span className="font-mono font-medium">{Number(value).toFixed(2)}</span>
                              </div>
                            ))}
                          {Object.keys(gejala.mass_function).length > 3 && (
                            <p className="text-xs text-muted-foreground">
                              +{Object.keys(gejala.mass_function).length - 3} lainnya
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(gejala)} className="h-8 w-8 p-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(gejala.kode)}
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
        </CardContent>
      </Card >

      {/* Hidden file input */}
      < input ref={fileInputRef} type="file" accept=".json" onChange={handleFileChange} className="hidden" />
    </div >
  )
}
