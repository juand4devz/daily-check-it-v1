"use client"
import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Save, Plus, X } from "lucide-react"
import { toast } from "sonner"
import gejalaData from "@/data/gejala.json"
import type { Gejala, MassFunctionEntry } from "@/types"

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

const devices = ["computer", "laptop"]
const kerusakanOptions = Array.from({ length: 23 }, (_, i) => `KK${i + 1}`)

interface ExistingGejala extends Record<string, unknown> {
  kode: string
  nama?: string
  deskripsi?: string
  kategori?: string
  perangkat?: string[]
  mass_function?: Record<string, number>
  gambar?: string
}

export default function EditGejalaPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<Gejala>({
    kode: "",
    nama: "",
    deskripsi: "",
    kategori: "Power",
    perangkat: [],
    mass_function: { uncertainty: 0.1 },
    gambar: "",
  })
  const [massFunctions, setMassFunctions] = useState<MassFunctionEntry[]>([{ kerusakan: "KK1", value: 0.1 }])

  useEffect(() => {
    const gejalaId = params.id as string
    const gejala = (gejalaData as ExistingGejala[]).find((g) => g.kode === gejalaId)

    if (gejala) {
      setFormData({
        kode: gejala.kode,
        nama: gejala.nama || "",
        deskripsi: gejala.deskripsi || "",
        kategori: gejala.kategori || "Power",
        perangkat: Array.isArray(gejala.perangkat) ? gejala.perangkat : [],
        mass_function: gejala.mass_function || { uncertainty: 0.1 },
        gambar: gejala.gambar || "",
      })

      // Convert mass_function to MassFunctionEntry array
      const entries = Object.entries(gejala.mass_function || {})
        .filter(([key]) => key !== "uncertainty")
        .map(([kerusakan, value]) => ({ kerusakan, value: value as number }))

      setMassFunctions(entries.length > 0 ? entries : [{ kerusakan: "KK1", value: 0.1 }])
    } else {
      toast.error("Data gejala tidak ditemukan")
      router.push("/admin/gejala")
    }
  }, [params.id, router])

  const addMassFunction = (): void => {
    const usedKerusakan = massFunctions.map((mf) => mf.kerusakan)
    const availableKerusakan = kerusakanOptions.filter((kk) => !usedKerusakan.includes(kk))

    if (availableKerusakan.length === 0) {
      toast.error("Semua kerusakan sudah digunakan")
      return
    }

    setMassFunctions((prev) => [...prev, { kerusakan: availableKerusakan[0], value: 0.1 }])
  }

  const removeMassFunction = (index: number): void => {
    if (massFunctions.length <= 1) {
      toast.error("Minimal harus ada satu mass function")
      return
    }
    setMassFunctions((prev) => prev.filter((_, i) => i !== index))
  }

  const updateMassFunction = (index: number, field: keyof MassFunctionEntry, value: string | number): void => {
    setMassFunctions((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const validateForm = (): boolean => {
    if (!formData.kode || !formData.nama || formData.perangkat.length === 0) {
      toast.error("Mohon lengkapi semua field yang wajib diisi")
      return false
    }

    const totalMass = massFunctions.reduce((sum, entry) => sum + entry.value, 0)
    if (totalMass > 1.0) {
      toast.error("Total mass function tidak boleh melebihi 1.0")
      return false
    }

    const kerusakanCodes = massFunctions.map((mf) => mf.kerusakan)
    const uniqueKerusakan = new Set(kerusakanCodes)
    if (kerusakanCodes.length !== uniqueKerusakan.size) {
      toast.error("Tidak boleh ada kerusakan yang duplikat dalam mass function")
      return false
    }

    return true
  }

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return

    toast("Konfirmasi Perubahan", {
      description: "Simpan perubahan data gejala?",
      action: {
        label: "Simpan",
        onClick: async () => {
          setIsLoading(true)
          try {
            // Build mass function from entries
            const massFunction: Record<string, number> = {}
            const totalMass = massFunctions.reduce((sum, entry) => sum + entry.value, 0)

            massFunctions.forEach((entry) => {
              if (entry.value > 0) {
                massFunction[entry.kerusakan] = entry.value
              }
            })

            massFunction["uncertainty"] = Math.max(0.05, 1 - totalMass)

            const updatedGejala: Gejala = {
              ...formData,
              mass_function: massFunction,
            }

            // Simulate API call - replace with actual implementation
            await new Promise((resolve) => setTimeout(resolve, 1000))

            toast.success("Gejala berhasil diupdate")
            router.push("/admin/gejala")
          } catch (error) {
            toast.error("Terjadi kesalahan saat menyimpan data")
          } finally {
            setIsLoading(false)
          }
        },
      },
      cancel: {
        label: "Batal",
        onClick: () => toast.dismiss(),
      },
    })
  }

  const handleInputChange = <K extends keyof Gejala>(field: K, value: Gejala[K]): void => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const toggleDevice = (device: string): void => {
    setFormData((prev) => ({
      ...prev,
      perangkat: prev.perangkat.includes(device)
        ? prev.perangkat.filter((d) => d !== device)
        : [...prev.perangkat, device],
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <h1 className="text-3xl font-bold">Edit Gejala</h1>
        <p className="text-gray-600">Ubah informasi gejala dan atur nilai kepercayaan</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
            <CardDescription>Data utama gejala</CardDescription>
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
              <Select value={formData.kategori} onValueChange={(value) => handleInputChange("kategori", value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
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
                {devices.map((device) => (
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
            <CardDescription>Atur tingkat kepercayaan untuk setiap kerusakan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <Label>Mass Function Entries</Label>
              <Button variant="outline" size="sm" onClick={addMassFunction}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto">
              {massFunctions.map((entry, index) => (
                <Card key={index} className="p-3">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm">Kerusakan #{index + 1}</Label>
                      {massFunctions.length > 1 && (
                        <Button variant="ghost" size="sm" onClick={() => removeMassFunction(index)}>
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <Select
                      value={entry.kerusakan}
                      onValueChange={(value) => updateMassFunction(index, "kerusakan", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {kerusakanOptions
                          .filter((kk) => kk === entry.kerusakan || !massFunctions.some((mf) => mf.kerusakan === kk))
                          .map((kk) => (
                            <SelectItem key={kk} value={kk}>
                              {kk}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <Label className="text-sm">Nilai: {entry.value.toFixed(2)}</Label>
                        <Badge variant="outline">{(entry.value * 100).toFixed(0)}%</Badge>
                      </div>
                      <Slider
                        value={[entry.value]}
                        onValueChange={([value]) => updateMassFunction(index, "value", value)}
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
                Uncertainty: {Math.max(0.05, 1 - massFunctions.reduce((sum, mf) => sum + mf.value, 0)).toFixed(2)}(
                {(Math.max(0.05, 1 - massFunctions.reduce((sum, mf) => sum + mf.value, 0)) * 100).toFixed(0)}%)
              </Label>
              <p className="text-xs text-gray-600 mt-1">Nilai uncertainty otomatis dihitung dari sisa mass function</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end gap-4">
        <Button variant="outline" onClick={() => router.back()} disabled={isLoading}>
          Batal
        </Button>
        <Button onClick={handleSave} disabled={isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Menyimpan..." : "Update Gejala"}
        </Button>
      </div>
    </div>
  )
}
