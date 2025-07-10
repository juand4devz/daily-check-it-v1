// /admin/symptoms/edit/[id]/page.tsx
"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Save, Plus, X, Loader2 } from "lucide-react";
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

export default function EditGejalaPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState<Gejala>({
    id: "",
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
  const [kerusakanData, setKerusakanData] = useState<Kerusakan[]>([]);
  const [isKerusakanLoading, setIsKerusakanLoading] = useState(true);

  // --- Fetch Gejala Data for Editing & Kerusakan Options ---
  useEffect(() => {
    const fetchData = async () => {
      const gejalaId = params.id as string;
      if (!gejalaId) {
        toast.error("ID gejala tidak valid.");
        router.push("/admin/symptoms");
        return;
      }

      setIsLoading(true);
      setIsKerusakanLoading(true);

      try {
        // Fetch gejala data
        const gejalaResponse = await fetch(`/api/gejala/${gejalaId}`);
        if (!gejalaResponse.ok) {
          const errorText = await gejalaResponse.text();
          throw new Error(`Gagal memuat gejala: ${gejalaResponse.status} ${errorText}`);
        }
        const fetchedGejala: Gejala = await gejalaResponse.json();

        // Fetch kerusakan data
        const kerusakanResponse = await fetch("/api/damages");
        if (!kerusakanResponse.ok) {
          const errorText = await kerusakanResponse.text();
          throw new Error(`Gagal memuat data kerusakan: ${kerusakanResponse.status} ${errorText}`);
        }
        const fetchedData: Kerusakan[] = await kerusakanResponse.json();

        // --- NEW: Filter for unique codes before sorting ---
        const uniqueKerusakanMap = new Map<string, Kerusakan>();
        fetchedData.forEach(k => {
          if (!uniqueKerusakanMap.has(k.kode)) {
            uniqueKerusakanMap.set(k.kode, k);
          }
        });
        const sortedKerusakan = Array.from(uniqueKerusakanMap.values()).sort((a, b) => {
          const numA = parseInt(a.kode.replace('KK', '')) || 0;
          const numB = parseInt(b.kode.replace('KK', '')) || 0;
          return numA - numB;
        });
        setKerusakanData(sortedKerusakan);
        // --- END NEW ---

        setFormData({
          id: fetchedGejala.id,
          kode: fetchedGejala.kode,
          nama: fetchedGejala.nama || "",
          deskripsi: fetchedGejala.deskripsi || "",
          kategori: fetchedGejala.kategori || "System",
          perangkat: Array.isArray(fetchedGejala.perangkat) ? fetchedGejala.perangkat : [],
          mass_function: fetchedGejala.mass_function || { uncertainty: 0.1 },
          gambar: fetchedGejala.gambar || "",
        });

        const entries = Object.entries(fetchedGejala.mass_function || {})
          .filter(([key]) => key !== "uncertainty")
          .map(([kerusakan, value]) => ({
            kerusakan,
            value: Number(value),
          }));

        // Set massFunctions ensuring a default if none exist, or using existing entries
        // If there are no mass functions, add one with the first available kerusakan code
        if (entries.length === 0 && sortedKerusakan.length > 0) {
          setMassFunctions([{ kerusakan: sortedKerusakan[0].kode, value: 0.1 }]);
        } else if (entries.length === 0) {
          setMassFunctions([{ kerusakan: "", value: 0.1 }]);
        } else {
          setMassFunctions(entries);
        }

        toast.success(`Data gejala '${fetchedGejala.kode}' berhasil dimuat.`);
      } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat memuat data:", caughtError);
        let errorMessage = "Gagal memuat data gejala atau kerusakan.";
        if (caughtError instanceof Error) {
          errorMessage = caughtError.message;
        }
        toast.error(errorMessage);
        router.push("/admin/symptoms");
      } finally {
        setIsLoading(false);
        setIsKerusakanLoading(false);
      }
    };

    fetchData();
  }, [params.id, router]);

  // --- Mass Function Management ---
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

  // --- Form Validation ---
  const validateForm = useCallback((): boolean => {
    if (!formData.kode.trim() || !formData.nama.trim() || formData.perangkat.length === 0) {
      toast.error("Mohon lengkapi semua field yang wajib diisi.");
      return false;
    }

    const massFunctionKerusakanCodes = massFunctions.map((mf) => mf.kerusakan);
    const uniqueMassFunctionKerusakan = new Set(massFunctionKerusakanCodes);
    if (massFunctionKerusakanCodes.length !== uniqueMassFunctionKerusakan.size) {
      toast.error("Tidak boleh ada kerusakan yang duplikat dalam mass function.");
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
  }, [formData, massFunctions, kerusakanData]);

  // --- Save Handler ---
  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return;

    toast("Konfirmasi Perubahan", {
      description: "Simpan perubahan data gejala?",
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

            const updatedGejala: Omit<Gejala, 'id'> = {
              kode: formData.kode,
              nama: formData.nama,
              deskripsi: formData.deskripsi,
              kategori: formData.kategori,
              perangkat: formData.perangkat,
              mass_function: massFunction,
              gambar: formData.gambar,
            };

            const response = await fetch(`/api/gejala/${formData.id}`, {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(updatedGejala),
            });

            if (!response.ok) {
              const errorData: { error?: string } = await response.json();
              throw new Error(errorData.error || `Gagal mengupdate gejala: ${response.status}`);
            }

            toast.success("Gejala berhasil diupdate.");
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

  // --- Input Change Handlers ---
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
        <h1 className="text-3xl font-bold">Edit Gejala</h1>
        <p className="text-gray-600">
          Ubah informasi gejala dan atur nilai kepercayaan.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>Data utama gejala.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="kode">Kode Gejala *</Label>
              <Input
                id="kode"
                value={formData.kode}
                onChange={(e) => handleInputChange("kode", e.target.value)}
                placeholder="G1, G2, dst..."
                disabled
              />
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
                onValueChange={(value: string) => handleInputChange("kategori", value)}
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

            <div className="space-y-2">
              <Label>Perangkat yang Berlaku *</Label>
              <div className="flex gap-2 mt-2">
                {devices.map((device: string) => (
                  <Button
                    key={device}
                    variant={formData.perangkat.includes(device) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleDevice(device)}
                  >
                    {device === "computer" ? "Komputer" : "Laptop"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="gambar">URL Gambar</Label>
              <Input
                id="gambar"
                value={formData.gambar}
                onChange={(e) => handleInputChange("gambar", e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mass Function Configuration */}
        <Card>
          <CardHeader>
            <CardTitle>Nilai Kepercayaan (Mass Function)</CardTitle>
            <CardDescription>
              Atur tingkat kepercayaan untuk setiap kerusakan. Total nilai boleh melebihi 1.0, akan dinormalisasi di backend.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Mass Function Entries</Label>
              <Button
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
                <Card key={index} className="p-3">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Kerusakan #{index + 1}</Label>
                      {massFunctions.length > 1 && (
                        <Button
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
                          Nilai: {entry.value.toFixed(2)}
                        </Label>
                        <Badge variant="outline">
                          {(entry.value * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <Slider
                        value={[entry.value]}
                        onValueChange={([value]: number[]) =>
                          updateMassFunction(index, "value", value)
                        }
                        min={0.01}
                        max={0.95}
                        step={0.01}
                        className="w-full"
                      />
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="p-3 bg-blue-50 rounded-lg">
              <Label className="text-sm font-medium">
                Uncertainty:{" "}
                {currentUncertainty.toFixed(2)}(
                {(currentUncertainty * 100).toFixed(0)}
                %)
              </Label>
              <p className="text-xs text-gray-600 mt-1">
                Nilai uncertainty ini dihitung otomatis dan merupakan sisa dari total mass function.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Update Gejala
            </>
          )}
        </Button>
      </div>
    </div>
  );
}