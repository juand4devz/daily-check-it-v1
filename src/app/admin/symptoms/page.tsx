// /admin/symptoms/page.tsx
"use client";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Fuse from "fuse.js";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Edit, Trash2, Download, Upload, Search, RefreshCw, Loader2, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import type { Gejala, ApiResponse } from "@/types/diagnose";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

// --- Constants ---
const categories = [
  "Power", "Display", "Hardware", "System", "Performance", "Cooling",
  "Storage", "BIOS", "Port", "Network", "Audio", "Input",
  "Camera", "Battery", "Graphics", "Software", "OS", "Security", "Peripheral",
];
const devices = ["komputer", "laptop"];

// --- Interfaces ---
interface GejalaStatistics {
  total: number;
  byCategory: Record<string, number>;
  byDevice: Record<string, number>;
  totalMassFunctions: number;
}

interface ImportGejalaItemClient {
  id?: string;
  kode: string;
  nama: string;
  deskripsi?: string;
  kategori?: string;
  perangkat?: string[];
  mass_function?: Record<string, number>;
  gambar?: string;
}

// --- Main Component ---
export default function GejalaPage() {
  const [gejalaList, setGejalaList] = useState<Gejala[]>([]);
  const [searchQuery, setSearchQuery] = useState(""); // State untuk input pencarian
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterDevice, setFilterDevice] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isImporting, setIsImporting] = useState(false);
  const [isSendingImport, setIsSendingImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [errorFetching, setErrorFetching] = useState<string | null>(null);

  const loadData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setErrorFetching(null);

      const response = await fetch("/api/diagnose/symptoms");
      const responseData: ApiResponse<Gejala[]> = await response.json();

      if (!response.ok || !responseData.status) {
        throw new Error(responseData.message || `Gagal memuat data gejala: ${response.status}`);
      }

      const fetchedData = responseData.data || [];
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
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const fuse = useMemo(() => {
    const options = {
      keys: ['kode', 'nama', 'deskripsi', 'kategori', 'perangkat'],
      threshold: 0.3,
    };
    return new Fuse(gejalaList, options);
  }, [gejalaList]);

  const filteredData = useMemo(() => {
    const searchResults = searchQuery.trim() ? fuse.search(searchQuery).map(result => result.item) : gejalaList;

    return searchResults.filter(item => {
      const categoryMatch = filterCategory === "all" || item.kategori === filterCategory;
      const deviceMatch = filterDevice === "all" || item.perangkat.includes(filterDevice);
      return categoryMatch && deviceMatch;
    });
  }, [gejalaList, searchQuery, filterCategory, filterDevice, fuse]);


  const handleEdit = useCallback((gejala: Gejala): void => {
    router.push(`/admin/symptoms/edit/${gejala.id}`);
  }, [router]);

  const handleDelete = async (id: string, namaGejala: string): Promise<void> => {
    toast("Konfirmasi Hapus", {
      description: `Apakah Anda yakin ingin menghapus gejala "${namaGejala}"? Tindakan ini tidak dapat dibatalkan.`,
      action: {
        label: "Hapus",
        onClick: async () => {
          try {
            const response = await fetch(`/api/diagnose/symptoms/${id}`, {
              method: "DELETE",
            });

            const responseData: ApiResponse<any> = await response.json();
            if (!response.ok || !responseData.status) {
              throw new Error(responseData.message || `Gagal menghapus gejala: ${response.status}`);
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

      const preparedData: ImportGejalaItemClient[] = [];
      const validationErrors: string[] = [];

      importedData.forEach((item: unknown, index: number) => {
        if (typeof item !== 'object' || item === null) {
          validationErrors.push(`Baris ${index + 1}: bukan objek yang valid.`);
          return;
        }

        const gejalaItem = item as Partial<Gejala>;

        if (typeof gejalaItem.kode !== 'string' || !gejalaItem.kode.trim()) {
          validationErrors.push(`Baris ${index + 1} (ID: ${gejalaItem.id || 'N/A'}): 'kode' tidak valid atau kosong.`);
          return;
        }
        if (typeof gejalaItem.nama !== 'string' || !gejalaItem.nama.trim()) {
          validationErrors.push(`Baris ${index + 1} (Kode: ${gejalaItem.kode}): 'nama' tidak valid atau kosong.`);
          return;
        }

        const massFunction: Record<string, number> = {};
        if (typeof gejalaItem.mass_function === 'object' && gejalaItem.mass_function !== null) {
          Object.entries(gejalaItem.mass_function).forEach(([key, value]) => {
            if (typeof value === 'number' && !isNaN(value)) {
              massFunction[key] = value;
            }
          });
        }
        if (Object.keys(massFunction).length === 0) {
          massFunction.uncertainty = 0.1;
        }

        preparedData.push({
          id: gejalaItem.id,
          kode: gejalaItem.kode,
          nama: gejalaItem.nama,
          deskripsi: typeof gejalaItem.deskripsi === 'string' ? gejalaItem.deskripsi : "",
          kategori: typeof gejalaItem.kategori === 'string' && categories.includes(gejalaItem.kategori) ? gejalaItem.kategori : "System",
          perangkat: Array.isArray(gejalaItem.perangkat) ? gejalaItem.perangkat.filter(p => typeof p === 'string').map(String) : [],
          mass_function: massFunction,
          gambar: typeof gejalaItem.gambar === 'string' ? gejalaItem.gambar : "",
        });
      });

      if (validationErrors.length > 0) {
        toast.error(`Ditemukan ${validationErrors.length} kesalahan validasi dalam file JSON. Lihat konsol untuk detail.`);
        console.error("Kesalahan validasi impor Gejala:", validationErrors);
        return;
      }
      if (preparedData.length === 0) {
        toast.info("Tidak ada data gejala yang valid untuk diimpor dari file.");
        return;
      }

      toast("Konfirmasi Impor Data", {
        description: `Ditemukan ${preparedData.length} entri gejala valid dalam file. Pilih tindakan:`,
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
    data: ImportGejalaItemClient[],
    replaceExisting: boolean
  ): Promise<void> => {
    setIsSendingImport(true);
    try {
      const response = await fetch("/api/import-data/symptoms", {
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
          <Button variant="outline" onClick={handleImport} disabled={isLoading || isImporting || isSendingImport}>
            {isImporting || isSendingImport ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Import
          </Button>
          <Button variant="outline" onClick={handleExport} disabled={isLoading}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => router.push("/admin/symptoms/add")} disabled={isLoading}>
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
                <p className="text-2xl font-bold text-purple-600">{stats.byDevice.komputer || 0}</p>
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
                {devices.map((device) => (
                  <SelectItem key={device} value={device}>
                    {device === 'komputer' ? 'Komputer' : 'Laptop'}
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
          <CardTitle>Daftar Gejala ({filteredData.length})</CardTitle>
          <CardDescription>
            Kelola data gejala dan nilai kepercayaan (mass function) untuk
            sistem diagnosa.
          </CardDescription>
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
                                  {device === 'komputer' ? 'PC' : 'Laptop'}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Accordion type="single" collapsible className="w-[180px]">
                            <AccordionItem value="mass-function">
                              <AccordionTrigger className="p-0">
                                <span className="text-xs font-mono">
                                  {Object.keys(gejala.mass_function).filter(k => k !== 'uncertainty').length} entri
                                </span>
                              </AccordionTrigger>
                              <AccordionContent>
                                {Object.entries(gejala.mass_function)
                                  .filter(([key]: [string, number]) => key !== "uncertainty")
                                  .map(([key, value]: [string, number]) => (
                                    <div key={key} className="flex justify-between text-xs mt-1">
                                      <span className="font-mono">{key}:</span>
                                      <span className="font-mono font-medium">{Number(value).toFixed(2)}</span>
                                    </div>
                                  ))}
                                <div className="flex justify-between text-xs mt-1">
                                  <span className="font-mono">uncertainty:</span>
                                  <span className="font-mono font-medium">{Number(gejala.mass_function.uncertainty || 0).toFixed(2)}</span>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(gejala)} className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => gejala.id && handleDelete(gejala.id, gejala.nama)}
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