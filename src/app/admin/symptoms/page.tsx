// /admin/symptoms/page.tsx
"use client";
import { useState, useEffect, useRef } from "react";
import type React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Download, Upload, Search, RefreshCw, Loader2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { Gejala } from "@/types"; // Make sure your types.ts is accurate and includes 'id'
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// --- Constants ---
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
];

// --- Interfaces ---
interface GejalaStatistics {
  total: number;
  byCategory: Record<string, number>;
  byDevice: Record<string, number>;
  totalMassFunctions: number;
}

// --- Main Component ---
export default function GejalaPage() {
  const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
  const [filteredData, setFilteredData] = useState<Gejala[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDevice, setFilterDevice] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [errorFetching, setErrorFetching] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterData();
  }, [gejalaList, searchQuery, filterCategory, filterDevice]);

  // --- Data Loading from API ---
  const loadData = async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorFetching(null);

      const response = await fetch("/api/gejala");
      if (!response.ok) {
        const errorDetail = await response.text();
        throw new Error(`Gagal memuat data gejala: ${response.status} ${errorDetail}`);
      }
      const fetchedData: Gejala[] = await response.json();

      const sortedData = fetchedData.sort((a, b) => {
        const numA = parseInt(a.kode.replace('G', '')) || 0;
        const numB = parseInt(b.kode.replace('G', '')) || 0;
        return numA - numB;
      });

      setGejalaList(sortedData);
      toast.success("Data gejala berhasil dimuat.");
    } catch (caughtError: unknown) {
      console.error("Terjadi kesalahan saat memuat data:", caughtError);
      let errorMessage = "Gagal memuat data gejala.";
      if (caughtError instanceof Error) {
        errorMessage = caughtError.message;
      }
      toast.error(errorMessage);
      setErrorFetching(errorMessage);
      setGejalaList([]);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Filtering Logic ---
  const filterData = (): void => {
    let filtered = gejalaList;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.nama.toLowerCase().includes(query) ||
          item.kode.toLowerCase().includes(query) ||
          item.kategori.toLowerCase().includes(query) ||
          item.deskripsi.toLowerCase().includes(query)
      );
    }

    if (filterCategory !== "all") {
      filtered = filtered.filter((item) => item.kategori === filterCategory);
    }

    if (filterDevice !== "all") {
      filtered = filtered.filter((item) => item.perangkat.includes(filterDevice));
    }

    setFilteredData(filtered);
  };

  // --- Action Handlers ---
  const handleEdit = (gejala: Gejala): void => {
    router.push(`/admin/symptoms/edit/${gejala.id}`); // Correctly uses gejala.id
  };

  const handleDelete = async (id: string, namaGejala: string): Promise<void> => {
    toast("Konfirmasi Hapus", {
      description: `Apakah Anda yakin ingin menghapus gejala "${namaGejala}"? Tindakan ini tidak dapat dibatalkan.`,
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            const response = await fetch(`/api/gejala/${id}`, {
              method: "DELETE",
            });

            if (!response.ok) {
              const errorDetail = await response.text();
              throw new Error(`Gagal menghapus gejala: ${response.status} ${errorDetail}`);
            }

            await loadData();
            toast.success("Gejala berhasil dihapus.");
          } catch (caughtError: unknown) {
            console.error("Terjadi kesalahan saat menghapus:", caughtError);
            let errorMessage = "Gagal menghapus gejala.";
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
      const dataStr = JSON.stringify(gejalaList, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `gejala-data-${new Date().toISOString().split("T")[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Data berhasil diekspor.");
    } catch (caughtError: unknown) {
      console.error("Terjadi kesalahan ekspor:", caughtError);
      let errorMessage = "Gagal mengekspor data.";
      if (caughtError instanceof Error) {
        errorMessage = caughtError.message;
      }
      toast.error(errorMessage);
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

      // Pre-validation of imported data structure (optional but good practice)
      const validatedData: Gejala[] = importedData.map((item: any, index: number) => {
        // Basic type checking for required fields
        if (typeof item.id !== 'string' || !item.id.trim()) {
          throw new Error(`Data tidak valid pada baris ${index + 1}: 'id' tidak valid atau kosong.`);
        }
        if (typeof item.kode !== 'string' || !item.kode.trim()) {
          throw new Error(`Data tidak valid pada baris ${index + 1}: 'kode' tidak valid atau kosong.`);
        }
        if (typeof item.nama !== 'string' || !item.nama.trim()) {
          throw new Error(`Data tidak valid pada baris ${index + 1}: 'nama' tidak valid atau kosong.`);
        }
        // Add more specific validations as needed
        return {
          id: item.id, // Ensure ID is present if expecting updates
          kode: item.kode,
          nama: item.nama,
          deskripsi: item.deskripsi || "",
          kategori: item.kategori || "System",
          perangkat: Array.isArray(item.perangkat) ? item.perangkat.map(String) : [],
          mass_function: typeof item.mass_function === 'object' && item.mass_function !== null
            ? (item.mass_function as Record<string, number>)
            : { uncertainty: 0.1 },
          gambar: item.gambar || "",
          createdAt: item.createdAt || undefined,
          updatedAt: item.updatedAt || undefined,
        } as Gejala; // Explicit cast after validation
      });

      // Show toast for replacement confirmation
      toast("Konfirmasi Impor Data", {
        description: `Ditemukan ${validatedData.length} entri gejala dalam file. Pilih tindakan:`,
        action: {
          label: "Tambah Baru Saja",
          onClick: async () => {
            await sendImportData(validatedData, false); // No replace
          },
        },
        cancel: {
          label: "Ganti yang Ada", // If user clicks 'Ganti yang Ada', send with replace=true
          onClick: async () => {
            await sendImportData(validatedData, true); // Replace existing
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
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Clear file input
      }
    }
  };

  // New function to send data to the import API
  const sendImportData = async (data: Gejala[], replaceExisting: boolean): Promise<void> => {
    setIsLoading(true); // Use a loading state for the actual API call
    try {
      const response = await fetch("/api/import-data/gejala", { // Use the new dedicated import API
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dataType: "gejala", // Specify data type for the generic import API
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
      setIsLoading(false);
    }
  };


  const getStatistics = (): GejalaStatistics => {
    const total = gejalaList.length;
    const byCategory = gejalaList.reduce(
      (acc: Record<string, number>, item: Gejala) => {
        acc[item.kategori] = (acc[item.kategori] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const byDevice = gejalaList.reduce(
      (acc: Record<string, number>, item: Gejala) => {
        item.perangkat.forEach((device: string) => {
          acc[device] = (acc[device] || 0) + 1;
        });
        return acc;
      },
      {} as Record<string, number>
    );

    const totalMassFunctions = gejalaList.reduce((sum: number, item: Gejala) => {
      return sum + Object.keys(item.mass_function).filter((key: string) => key !== "uncertainty").length;
    }, 0);

    return { total, byCategory, byDevice, totalMassFunctions };
  };

  const stats = getStatistics();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Kelola Gejala</h1>
          <p className="text-muted-foreground mt-1">
            Manajemen data gejala dan nilai kepercayaan (mass function) untuk
            sistem diagnosa.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleImport} disabled={isImporting || isLoading}>
            {isImporting || isLoading ? ( // Use isLoading here too
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
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
          <CardContent className="px-6 py-4">
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
        </Card>

        <Card>
          <CardContent className="px-6 py-4">
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
          <CardContent className="px-6 py-4">
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
          <CardContent className="px-6 py-4">
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
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
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
                {categories.map((category: string) => (
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
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Daftar Gejala ({filteredData.length})</CardTitle>
          <CardDescription>
            Kelola data gejala dan nilai kepercayaan untuk sistem diagnosa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            </div>
          ) : errorFetching ? (
            <Alert variant="destructive" className="mb-4">
              <WifiOff className="h-4 w-4" />
              <AlertTitle>Kesalahan Data!</AlertTitle>
              <AlertDescription>{errorFetching}</AlertDescription>
            </Alert>
          ) : (
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
                        {searchQuery ||
                          filterCategory !== "all" ||
                          filterDevice !== "all"
                          ? "Tidak ada gejala yang sesuai dengan filter."
                          : "Belum ada data gejala."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredData.map((gejala: Gejala) => (
                      <TableRow key={gejala.id} className="hover:bg-muted/50">
                        <TableCell>
                          <Badge variant="outline" className="font-mono">
                            {gejala.kode}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs">
                          <div>
                            <p className="font-medium line-clamp-1">{gejala.nama}</p>
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                              {gejala.deskripsi}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{gejala.kategori}</Badge>
                        </TableCell>
                        <TableCell>
                          {gejala.perangkat && gejala.perangkat.length > 0 ? (
                            <div className="flex gap-1">
                              {gejala.perangkat.map((device: string) => (
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
                              .filter(([key]: [string, number]) => key !== "uncertainty")
                              .slice(0, 2)
                              .map(([key, value]: [string, number]) => (
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
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(gejala)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(gejala.id, gejala.nama)}
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

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}