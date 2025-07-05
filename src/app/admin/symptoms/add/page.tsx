"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { ArrowLeft, Save, Plus, X, RefreshCw } from "lucide-react"
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

interface ExistingGejala {
  kode: string
  [key: string]: unknown
}

export default function AddGejalaPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isGeneratingCode, setIsGeneratingCode] = useState(false)
  const [formData, setFormData] = useState<Gejala>({
    kode: "",
    nama: "",
    deskripsi: "",
    kategori: "System",
    perangkat: [],
    mass_function: { uncertainty: 0.1 },
    gambar: "",
  })
  const [massFunctions, setMassFunctions] = useState<MassFunctionEntry[]>([{ kerusakan: "KK1", value: 0.1 }])

  useEffect(() => {
    generateNextCode()
  }, [])

  const generateNextCode = async (): Promise<void> => {
    try {
      setIsGeneratingCode(true)

      // Get existing codes
      const existingCodes = (gejalaData as ExistingGejala[])
        .map((item) => item.kode)
        .filter((code): code is string => Boolean(code))

      // Find the next available code
      let nextNumber = 1
      let nextCode = `G${nextNumber}`

      while (existingCodes.includes(nextCode)) {
        nextNumber++
        nextCode = `G${nextNumber}`
      }

      setFormData((prev) => ({ ...prev, kode: nextCode }))
      toast.success(`Kode otomatis: ${nextCode}`)
    } catch (error) {
      console.error("Error generating code:", error)
      toast.error("Gagal generate kode otomatis")
    } finally {
      setIsGeneratingCode(false)
    }
  }

  const addMassFunction = (): void => {
    const usedKerusakan = massFunctions.map((mf) => mf.kerusakan)
    const availableKerusakan = kerusakanOptions.filter((kk) => !usedKerusakan.includes(kk))

    if (availableKerusakan.length === 0) {
      toast.error("Semua kerusakan sudah digunakan")
      return
    }

    setMassFunctions((prev) => [...prev, { kerusakan: availableKerusakan[0], value: 0.1 }])
    toast.success("Mass function baru ditambahkan")
  }

  const removeMassFunction = (index: number): void => {
    if (massFunctions.length <= 1) {
      toast.error("Minimal harus ada satu mass function")
      return
    }
    setMassFunctions((prev) => prev.filter((_, i) => i !== index))
    toast.success("Mass function dihapus")
  }

  const updateMassFunction = (index: number, field: keyof MassFunctionEntry, value: string | number): void => {
    setMassFunctions((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)))
  }

  const validateForm = (): boolean => {
    if (!formData.kode.trim()) {
      toast.error("Kode gejala harus diisi")
      return false
    }

    if (!formData.nama.trim()) {
      toast.error("Nama gejala harus diisi")
      return false
    }

    if (formData.perangkat.length === 0) {
      toast.error("Minimal pilih satu perangkat")
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

    // Check if code already exists
    const existingCodes = (gejalaData as ExistingGejala[]).map((item) => item.kode)
    if (existingCodes.includes(formData.kode)) {
      toast.error("Kode gejala sudah digunakan")
      return false
    }

    return true
  }

  const handleSave = async (): Promise<void> => {
    if (!validateForm()) return

    toast("Konfirmasi Simpan", {
      description: "Simpan gejala baru ke dalam sistem?",
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

            // Simulate API call
            await new Promise((resolve) => setTimeout(resolve, 1500))

            toast.success("Gejala berhasil ditambahkan")
            router.push("/admin/gejala")
          } catch (error) {
            console.error("Error saving:", error)
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
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="outline" onClick={() => router.back()} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
        <h1 className="text-3xl font-bold">Tambah Gejala Baru</h1>
        <p className="text-muted-foreground mt-1">
          Isi informasi gejala dan atur nilai kepercayaan untuk setiap kemungkinan kerusakan
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Basic Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informasi Dasar</CardTitle>
              <CardDescription>Data utama gejala</CardDescription>
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
                  Kode akan di-generate otomatis atau Anda bisa mengubahnya
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

              <div className="space-y-3">
                <Label>Perangkat yang Berlaku *</Label>
                <div className="flex gap-2">
                  {devices.map((device) => (
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
                <p className="text-xs text-muted-foreground">Pilih perangkat yang berlaku untuk gejala ini</p>
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
            <CardDescription>Atur tingkat kepercayaan untuk setiap kerusakan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center">
              <Label>Mass Function Entries</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addMassFunction}
                disabled={massFunctions.length >= kerusakanOptions.length}
              >
                <Plus className="h-4 w-4 mr-1" />
                Tambah
              </Button>
            </div>

            <div className="space-y-4 max-h-80 overflow-y-auto">
              {massFunctions.map((entry, index) => (
                <Card key={index} className="p-4 border-2">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-medium">Kerusakan #{index + 1}</Label>
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
                        <Label className="text-sm">Nilai: {entry.value.toFixed(3)}</Label>
                        <Badge variant="outline">{(entry.value * 100).toFixed(1)}%</Badge>
                      </div>
                      <Slider
                        value={[entry.value]}
                        onValueChange={([value]) => updateMassFunction(index, "value", value)}
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
                <Label className="text-sm font-medium text-blue-800">Uncertainty (Ketidakpastian)</Label>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                  {(Math.max(0.05, 1 - massFunctions.reduce((sum, mf) => sum + mf.value, 0)) * 100).toFixed(1)}%
                </Badge>
              </div>
              <p className="text-xs text-blue-700">
                Nilai: {Math.max(0.05, 1 - massFunctions.reduce((sum, mf) => sum + mf.value, 0)).toFixed(3)}
              </p>
              <p className="text-xs text-blue-600 mt-1">Nilai uncertainty otomatis dihitung dari sisa mass function</p>
            </div>

            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Total mass function: {massFunctions.reduce((sum, mf) => sum + mf.value, 0).toFixed(3)}</p>
              <p>• Maksimal total: 1.000</p>
              <p>• Sisa untuk uncertainty: {(1 - massFunctions.reduce((sum, mf) => sum + mf.value, 0)).toFixed(3)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isLoading}>
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
  )
}
