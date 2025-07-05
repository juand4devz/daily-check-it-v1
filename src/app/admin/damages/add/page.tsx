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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, X, RefreshCw, Eye } from "lucide-react"
import { toast } from "sonner"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import kerusakanData from "@/data/kerusakan.json"
import type { Kerusakan } from "@/types"

const tingkatKerusakanOptions: Array<Kerusakan["tingkat_kerusakan"]> = ["Ringan", "Sedang", "Berat"]
const gejalaOptions = Array.from({ length: 25 }, (_, i) => `G${i + 1}`)

interface ExistingKerusakan {
    kode: string
    [key: string]: unknown
}

export default function AddKerusakanPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [isGeneratingCode, setIsGeneratingCode] = useState(false)
    const [formData, setFormData] = useState<Kerusakan>({
        kode: "",
        nama: "",
        deskripsi: "",
        tingkat_kerusakan: "Ringan",
        estimasi_biaya: "",
        waktu_perbaikan: "",
        prior_probability: 0.1,
        solusi: "",
        gejala_terkait: [],
    })

    useEffect(() => {
        generateNextCode()
    }, [])

    const generateNextCode = async (): Promise<void> => {
        try {
            setIsGeneratingCode(true)

            // Get existing codes
            const existingCodes = (kerusakanData as ExistingKerusakan[])
                .map((item) => item.kode)
                .filter((code): code is string => Boolean(code))

            // Find the next available code
            let nextNumber = 1
            let nextCode = `KK${nextNumber}`

            while (existingCodes.includes(nextCode)) {
                nextNumber++
                nextCode = `KK${nextNumber}`
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

    const toggleGejala = (gejalaKode: string): void => {
        setFormData((prev) => ({
            ...prev,
            gejala_terkait: prev.gejala_terkait.includes(gejalaKode)
                ? prev.gejala_terkait.filter((g) => g !== gejalaKode)
                : [...prev.gejala_terkait, gejalaKode],
        }))
    }

    const validateForm = (): boolean => {
        if (!formData.kode.trim()) {
            toast.error("Kode kerusakan harus diisi")
            return false
        }

        if (!formData.nama.trim()) {
            toast.error("Nama kerusakan harus diisi")
            return false
        }

        if (!formData.deskripsi.trim()) {
            toast.error("Deskripsi kerusakan harus diisi")
            return false
        }

        if (formData.prior_probability <= 0 || formData.prior_probability > 0.5) {
            toast.error("Prior probability harus antara 0.01 dan 0.50")
            return false
        }

        // Check if code already exists
        const existingCodes = (kerusakanData as ExistingKerusakan[]).map((item) => item.kode)
        if (existingCodes.includes(formData.kode)) {
            toast.error("Kode kerusakan sudah digunakan")
            return false
        }

        return true
    }

    const handleSave = async (): Promise<void> => {
        if (!validateForm()) return

        toast("Konfirmasi Simpan", {
            description: "Simpan kerusakan baru ke dalam sistem?",
            action: {
                label: "Simpan",
                onClick: async () => {
                    setIsLoading(true)
                    try {
                        // Simulate API call
                        await new Promise((resolve) => setTimeout(resolve, 1500))

                        toast.success("Kerusakan berhasil ditambahkan")
                        router.push("/admin/kerusakan")
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

    const handleInputChange = <K extends keyof Kerusakan>(field: K, value: Kerusakan[K]): void => {
        setFormData((prev) => ({ ...prev, [field]: value }))
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Header */}
            <div className="mb-8">
                <Button variant="outline" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>
                <h1 className="text-3xl font-bold">Tambah Kerusakan Baru</h1>
                <p className="text-muted-foreground mt-1">
                    Isi informasi kerusakan dan atur probabilitas prior untuk sistem diagnosa
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Informasi Dasar</CardTitle>
                            <CardDescription>Data utama kerusakan</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="kode">Kode Kerusakan *</Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="kode"
                                        value={formData.kode}
                                        onChange={(e) => handleInputChange("kode", e.target.value)}
                                        placeholder="KK1, KK2, dst..."
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
                                <Label htmlFor="nama">Nama Kerusakan *</Label>
                                <Input
                                    id="nama"
                                    value={formData.nama}
                                    onChange={(e) => handleInputChange("nama", e.target.value)}
                                    placeholder="Nama kerusakan yang mudah dipahami"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="deskripsi">Deskripsi *</Label>
                                <Textarea
                                    id="deskripsi"
                                    value={formData.deskripsi}
                                    onChange={(e) => handleInputChange("deskripsi", e.target.value)}
                                    placeholder="Penjelasan detail tentang kerusakan"
                                    rows={4}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tingkat">Tingkat Kerusakan</Label>
                                <Select
                                    value={formData.tingkat_kerusakan}
                                    onValueChange={(value: Kerusakan["tingkat_kerusakan"]) =>
                                        handleInputChange("tingkat_kerusakan", value)
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {tingkatKerusakanOptions.map((tingkat) => (
                                            <SelectItem key={tingkat} value={tingkat}>
                                                {tingkat}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="biaya">Estimasi Biaya</Label>
                                    <Input
                                        id="biaya"
                                        value={formData.estimasi_biaya}
                                        onChange={(e) => handleInputChange("estimasi_biaya", e.target.value)}
                                        placeholder="Rp 100.000 - Rp 500.000"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="waktu">Waktu Perbaikan</Label>
                                    <Input
                                        id="waktu"
                                        value={formData.waktu_perbaikan}
                                        onChange={(e) => handleInputChange("waktu_perbaikan", e.target.value)}
                                        placeholder="1-3 hari"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <Label>Prior Probability: {formData.prior_probability.toFixed(3)}</Label>
                                    <Badge variant="outline">{(formData.prior_probability * 100).toFixed(1)}%</Badge>
                                </div>
                                <Slider
                                    value={[formData.prior_probability]}
                                    onValueChange={([value]) => handleInputChange("prior_probability", value)}
                                    min={0.01}
                                    max={0.5}
                                    step={0.001}
                                    className="w-full"
                                />
                                <p className="text-xs text-muted-foreground">Probabilitas awal kerusakan ini terjadi (0.01 - 0.50)</p>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Gejala Terkait */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Gejala Terkait</CardTitle>
                            <CardDescription>Pilih gejala yang berkaitan dengan kerusakan ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-5 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                                {gejalaOptions.map((gejala) => (
                                    <Button
                                        key={gejala}
                                        type="button"
                                        variant={formData.gejala_terkait.includes(gejala) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleGejala(gejala)}
                                        className="h-8"
                                    >
                                        {gejala}
                                    </Button>
                                ))}
                            </div>
                            <div className="mt-4">
                                <p className="text-sm text-muted-foreground mb-2">
                                    Gejala terpilih ({formData.gejala_terkait.length}):
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {formData.gejala_terkait.map((gejala) => (
                                        <Badge key={gejala} variant="secondary" className="text-xs">
                                            {gejala}
                                            <button
                                                type="button"
                                                onClick={() => toggleGejala(gejala)}
                                                className="ml-1 hover:text-destructive"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Solusi Perbaikan */}
                <Card className="h-fit">
                    <CardHeader>
                        <CardTitle>Solusi Perbaikan</CardTitle>
                        <CardDescription>Tulis solusi dalam format Markdown untuk formatting yang lebih baik</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="write" className="w-full">
                            <TabsList className="grid w-full grid-cols-2">
                                <TabsTrigger value="write">Tulis</TabsTrigger>
                                <TabsTrigger value="preview">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Preview
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="write" className="mt-4">
                                <Textarea
                                    value={formData.solusi}
                                    onChange={(e) => handleInputChange("solusi", e.target.value)}
                                    placeholder="Tulis solusi dalam format Markdown...

Contoh:
## Langkah Perbaikan
1. **Matikan komputer** dan cabut kabel power
2. Buka casing komputer dengan hati-hati
3. Periksa koneksi kabel...

### Peringatan
⚠️ Pastikan komputer dalam keadaan mati sebelum membuka casing"
                                    rows={20}
                                    className="min-h-[400px] resize-none font-mono text-sm"
                                />
                                <p className="text-xs text-muted-foreground mt-2">
                                    Mendukung Markdown: **bold**, *italic*, `code`, ## heading, - list, dll.
                                </p>
                            </TabsContent>

                            <TabsContent value="preview" className="mt-4">
                                <div className="min-h-[400px] p-4 border rounded-lg bg-muted/30">
                                    {formData.solusi.trim() ? (
                                        <div className="prose prose-sm max-w-none dark:prose-invert">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{formData.solusi}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <p className="text-muted-foreground italic">Tidak ada konten untuk di-preview</p>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
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
                            Simpan Kerusakan
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
