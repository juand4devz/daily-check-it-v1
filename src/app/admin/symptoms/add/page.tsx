// /admin/symptoms/add/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Save, Plus, X, RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { Gejala, MassFunctionEntry, Kerusakan } from "@/types";
import { Combobox } from "@/components/ui/combobox";

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

const devices = ["computer", "laptop"];

export default function AddGejalaPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [formData, setFormData] = useState<Omit<Gejala, 'id'>>({
    kode: "",
    nama: "",
    deskripsi: "",
    kategori: "System",
    perangkat: [],
    mass_function: { uncertainty: 0.1 },
    gambar: "",
  });
  const [massFunctions, setMassFunctions] = useState<MassFunctionEntry[]>([
    { kerusakan: "", value: 0.1 },
  ]);
  const [existingGejalaCodes, setExistingGejalaCodes] = useState<string[]>([]);
  const [kerusakanData, setKerusakanData] = useState<Kerusakan[]>([]);
  const [isKerusakanLoading, setIsKerusakanLoading] = useState(true);

  useEffect(() => {
    const fetchExistingGejalaCodes = async () => {
      try {
        const response = await fetch("/api/gejala");
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gagal mengambil kode gejala yang ada: ${response.status} ${errorText}`);
        }
        const gejalaList: Gejala[] = await response.json();
        setExistingGejalaCodes(gejalaList.map(g => g.kode));
      } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat mengambil kode gejala:", caughtError);
        let errorMessage = "Gagal memuat kode gejala yang ada.";
        if (caughtError instanceof Error) {
          errorMessage = caughtError.message;
        }
        toast.error(errorMessage);
      }
    };

    fetchExistingGejalaCodes();
  }, []);

  useEffect(() => {
    const fetchKerusakanData = async () => {
      setIsKerusakanLoading(true);
      try {
        const response = await fetch("/api/damages");
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Gagal memuat data kerusakan: ${response.status} ${errorText}`);
        }
        const fetchedData: Kerusakan[] = await response.json();

        // --- NEW: Filter for unique codes before sorting ---
        const uniqueKerusakanMap = new Map<string, Kerusakan>();
        fetchedData.forEach(k => {
          if (!uniqueKerusakanMap.has(k.kode)) {
            uniqueKerusakanMap.set(k.kode, k);
          }
        });
        const uniqueKerusakan = Array.from(uniqueKerusakanMap.values());
        // --- END NEW ---

        const sortedData = uniqueKerusakan.sort((a, b) => { // Use uniqueKerusakan here
          const numA = parseInt(a.kode.replace('KK', '')) || 0;
          const numB = parseInt(b.kode.replace('KK', '')) || 0;
          return numA - numB;
        });
        setKerusakanData(sortedData);

        // If there are no mass functions, and kerusakan data is available,
        // initialize the first mass function with the first available kerusakan code.
        if (massFunctions.length === 1 && massFunctions[0].kerusakan === "" && sortedData.length > 0) {
          setMassFunctions([{ kerusakan: sortedData[0].kode, value: 0.1 }]);
        }

      } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat memuat data kerusakan:", caughtError);
        let errorMessage = "Gagal memuat daftar kerusakan untuk mass function.";
        if (caughtError instanceof Error) {
          errorMessage = caughtError.message;
        }
        toast.error(errorMessage);
        setKerusakanData([]);
      } finally {
        setIsKerusakanLoading(false);
      }
    };

    fetchKerusakanData();
  }, []); // massFunctions added to dep array to conditionally set initial massFunction

  const generateNextCode = useCallback(async (): Promise<void> => {
    setIsGeneratingCode(true);
    try {
      let nextNumber = 1;
      let nextCode = `G${nextNumber}`;

      while (existingGejalaCodes.includes(nextCode)) {
        nextNumber++;
        nextCode = `G${nextNumber}`;
      }

      setFormData((prev) => ({ ...prev, kode: nextCode }));
      toast.success(`Kode otomatis: ${nextCode}`);
    } catch (caughtError: unknown) {
      console.error("Terjadi kesalahan saat membuat kode:", caughtError);
      let errorMessage = "Gagal membuat kode otomatis.";
      if (caughtError instanceof Error) {
        errorMessage = caughtError.message;
      }
      toast.error(errorMessage);
    } finally {
      setIsGeneratingCode(false);
    }
  }, [existingGejalaCodes]);

  useEffect(() => {
    if (existingGejalaCodes.length > 0 && formData.kode === "" && !isGeneratingCode) {
      generateNextCode();
    }
  }, [existingGejalaCodes, formData.kode, generateNextCode, isGeneratingCode]);

  const addMassFunction = useCallback((): void => {
    if (kerusakanData.length === 0) {
      toast.error("Data kerusakan belum dimuat atau tidak tersedia.");
      return;
    }

    const usedKerusakanCodes = massFunctions.map((mf) => mf.kerusakan);
    const availableKerusakan = kerusakanData.filter(
      (kerusakan) => !usedKerusakanCodes.includes(kerusakan.kode)
    );

    if (availableKerusakan.length === 0) {
      toast.error("Semua kerusakan sudah digunakan dalam mass function.");
      return;
    }

    setMassFunctions((prev) => [
      ...prev,
      { kerusakan: availableKerusakan[0].kode, value: 0.1 },
    ]);
    toast.success("Mass function baru ditambahkan.");
  }, [massFunctions, kerusakanData]);

  const removeMassFunction = useCallback((index: number): void => {
    if (massFunctions.length <= 1) {
      toast.error("Minimal harus ada satu mass function.");
      return;
    }
    setMassFunctions((prev) => prev.filter((_, i) => i !== index));
    toast.success("Mass function dihapus.");
  }, [massFunctions]);

  const updateMassFunction = useCallback(
    (index: number, field: keyof MassFunctionEntry, value: string | number): void => {
      setMassFunctions((prev) =>
        prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
      );
    },
    []
  );

  const getKerusakanComboboxOptions = useCallback(() => {
    return kerusakanData.map(k => ({
      value: k.kode,
      label: `${k.kode} - ${k.nama}`
    }));
  }, [kerusakanData]);

  const validateForm = useCallback((): boolean => {
    if (!formData.kode.trim()) {
      toast.error("Kode gejala harus diisi.");
      return false;
    }

    if (!formData.nama.trim()) {
      toast.error("Nama gejala harus diisi.");
      return false;
    }

    if (formData.perangkat.length === 0) {
      toast.error("Minimal pilih satu perangkat.");
      return false;
    }

    const massFunctionKerusakanCodes = massFunctions.map((mf) => mf.kerusakan);
    const uniqueMassFunctionKerusakan = new Set(massFunctionKerusakanCodes);
    if (massFunctionKerusakanCodes.length !== uniqueMassFunctionKerusakan.size) {
      toast.error("Tidak boleh ada kerusakan yang duplikat dalam mass function.");
      return false;
    }

    if (existingGejalaCodes.includes(formData.kode) && !isGeneratingCode) {
      toast.error(`Kode gejala '${formData.kode}' sudah digunakan. Gunakan kode lain.`);
      return false;
    }

    if (massFunctions.some(mf => !kerusakanData.some(ko => ko.kode === mf.kerusakan))) {
      toast.error("Terdapat kerusakan yang tidak valid dalam mass function.");
      return false;
    }

    if (massFunctions.some(mf => !mf.kerusakan)) {
      toast.error("Semua entri mass function harus memiliki kerusakan yang dipilih.");
      return false;
    }

    return true;
  }, [formData, massFunctions, existingGejalaCodes, isGeneratingCode, kerusakanData]);

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    toast("Konfirmasi Simpan", {
      description: "Simpan gejala baru ke dalam sistem?",
      action: {
        label: "Simpan",
        onClick: async () => {
          setIsLoading(true);
          try {
            const massFunction: Record<string, number> = {};
            massFunctions.forEach((entry) => {
              if (entry.value > 0) {
                massFunction[entry.kerusakan] = entry.value;
              }
            });

            const gejalaToSave: Omit<Gejala, 'id'> = {
              ...formData,
              mass_function: massFunction,
            };

            const response = await fetch("/api/gejala", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(gejalaToSave),
            });

            if (!response.ok) {
              const errorData: { error?: string } = await response.json();
              throw new Error(errorData.error || `Gagal menyimpan gejala: ${response.status}`);
            }

            toast.success("Gejala berhasil ditambahkan.");
            router.push("/admin/symptoms");
          } catch (caughtError: unknown) {
            console.error("Terjadi kesalahan saat menyimpan:", caughtError);
            let errorMessage = "Terjadi kesalahan saat menyimpan data.";
            if (caughtError instanceof Error) {
              errorMessage = caughtError.message;
            }
            toast.error(errorMessage);
          } finally {
            setIsLoading(false);
          }
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => toast.dismiss(),
      },
    });
  };

  const handleInputChange = useCallback(
    <K extends keyof Omit<Gejala, 'id'>>(field: K, value: Omit<Gejala, 'id'>[K]): void => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  const toggleDevice = useCallback(
    (device: string): void => {
      setFormData((prev) => ({
        ...prev,
        perangkat: prev.perangkat.includes(device)
          ? prev.perangkat.filter((d) => d !== device)
          : [...prev.perangkat, device],
      }));
    },
    []
  );

  const currentTotalMass = massFunctions.reduce((sum, mf) => sum + mf.value, 0);
  const currentUncertainty = Math.max(0.05, 1 - currentTotalMass);

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <h1 className="text-3xl font-bold">Tambah Gejala Baru</h1>
        <p className="text-muted-foreground mt-1">
          Isi informasi gejala dan atur nilai kepercayaan untuk setiap
          kemungkinan kerusakan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
              <CardDescription>Data utama gejala.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="kode">Kode Gejala *</Label>
                <div className="flex gap-2">
                  <Input
                    id="kode"
                    value={formData.kode}
                    onChange={(e) => handleInputChange("kode", e.target.value)}
                    placeholder="G1, G2, dst..."
                    className="font-mono"
                    disabled={isGeneratingCode}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateNextCode}
                    disabled={isGeneratingCode}
                    className="shrink-0 bg-transparent"
                  >
                    {isGeneratingCode ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Kode akan di-generate otomatis atau Anda bisa mengubahnya.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nama">Nama Gejala *</Label>
                <Input
                  id="nama"
                  value={formData.nama}
                  onChange={(e) => handleInputChange("nama", e.target.value)}
                  placeholder="Nama gejala yang mudah dipahami"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deskripsi">Deskripsi</Label>
                <Textarea
                  id="deskripsi"
                  value={formData.deskripsi}
                  onChange={(e) => handleInputChange("deskripsi", e.target.value)}
                  placeholder="Penjelasan detail tentang gejala"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="kategori">Kategori</Label>
                <Select
                  value={formData.kategori}
                  onValueChange={(value) => handleInputChange("kategori", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat: string) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Perangkat yang Berlaku *</Label>
                <div className="flex gap-2">
                  {devices.map((device: string) => (
                    <Button
                      key={device}
                      type="button"
                      variant={formData.perangkat.includes(device) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDevice(device)}
                    >
                      {device === "computer" ? "Komputer" : "Laptop"}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Pilih perangkat yang berlaku untuk gejala ini.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="gambar">URL Gambar (Opsional)</Label>
                <Input
                  id="gambar"
                  value={formData.gambar}
                  onChange={(e) => handleInputChange("gambar", e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mass Function Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Nilai Kepercayaan (Mass Function)</CardTitle>
            <CardDescription>
              Atur tingkat kepercayaan untuk setiap kerusakan. Total nilai boleh melebihi 1.0, akan dinormalisasi di backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <Label>Mass Function Entries</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMassFunction}
                disabled={isKerusakanLoading || massFunctions.length >= kerusakanData.length}
              >
                {isKerusakanLoading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4 mr-1" />
                )}
                Tambah
              </Button>
            </div>

            {isKerusakanLoading && (
              <div className="flex items-center justify-center h-20 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat data kerusakan...
              </div>
            )}

            {!isKerusakanLoading && kerusakanData.length === 0 && (
              <p className="text-red-500 text-sm">Tidak ada data kerusakan yang tersedia. Silakan tambahkan kerusakan terlebih dahulu.</p>
            )}

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {massFunctions.map((entry: MassFunctionEntry, index: number) => (
                <Card key={index} className="p-3 border-2">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">
                        Kerusakan #{index + 1}
                      </Label>
                      {massFunctions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMassFunction(index)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <Combobox
                      options={getKerusakanComboboxOptions().filter(option =>
                        option.value === entry.kerusakan ||
                        !massFunctions.some(mf => mf.kerusakan === option.value)
                      )}
                      value={entry.kerusakan}
                      onValueChange={(value) => updateMassFunction(index, "kerusakan", value)}
                      placeholder="Pilih Kerusakan..."
                      searchPlaceholder="Cari kerusakan..."
                      emptyMessage="Kerusakan tidak ditemukan."
                      disabled={isKerusakanLoading}
                    />

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm">
                          Nilai: {entry.value.toFixed(3)}
                        </Label>
                        <Badge variant="outline">
                          {(entry.value * 100).toFixed(1)}%
                        </Badge>
                      </div>
                      <Slider
                        value={[entry.value]}
                        onValueChange={([value]: number[]) =>
                          updateMassFunction(index, "value", value)
                        }
                        min={0.01}
                        max={0.95}
                        step={0.001}
                        className="w-full"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex justify-between items-center mb-2">
                <Label className="text-sm font-medium text-blue-800">
                  Uncertainty (Ketidakpastian)
                </Label>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {(currentUncertainty * 100).toFixed(1)}%
                </Badge>
              </div>
              <p className="text-xs text-blue-700">
                Nilai: {currentUncertainty.toFixed(3)}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Nilai uncertainty ini dihitung otomatis dan merupakan sisa dari total mass function.
              </p>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                • Total mass function yang dimasukkan:{" "}
                {currentTotalMass.toFixed(3)}
              </p>
              <p>
                • Nilai ini akan dinormalisasi di backend untuk perhitungan Dempster-Shafer.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tombol Aksi */}
      <div className="mt-8 flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Simpan Gejala
            </>
          )}
        </Button>
      </div>
    </div>
  );
}