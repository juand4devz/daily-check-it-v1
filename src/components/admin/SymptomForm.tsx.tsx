// /components/admin/SymptomForm.tsx
"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, X, Eye, Loader2, RefreshCw, Upload, Image as ImageIcon, Video, Link, Copy, Plus, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Gejala, Kerusakan, MassFunctionEntry, KerusakanOption } from "@/types/diagnose";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { useSession } from "next-auth/react";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import Fuse from "fuse.js";
import { upload } from "@imagekit/next";

const categories = [
    "Power", "Display", "Hardware", "System", "Performance", "Cooling",
    "Storage", "BIOS", "Port", "Network", "Audio", "Input",
    "Camera", "Battery", "Graphics", "Software", "OS", "Security", "Peripheral",
];
// PERBAIKAN: Gunakan nama perangkat dalam bahasa Inggris yang konsisten
const devices = ["computer", "laptop"];

interface SymptomFormProps {
    initialData?: Gejala | null;
    kerusakanList: Kerusakan[];
    isSubmitting: boolean;
    onSave: (data: Omit<Gejala, 'id'>, id?: string) => Promise<void>;
    pageTitle: string;
    pageDescription: string;
    submitButtonText: string;
    existingGejalaCodes: string[];
}

// Tipe untuk media file sementara yang akan di-upload
interface MediaFileTemp {
    id: string;
    file: File | null;
    preview: string;
    type: "image" | "video";
    uploading: boolean;
    progress: number;
    uploadedUrl: string | null;
}

export function SymptomForm({
    initialData,
    kerusakanList,
    isSubmitting,
    onSave,
    pageTitle,
    pageDescription,
    submitButtonText,
    existingGejalaCodes,
}: SymptomFormProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const [formData, setFormData] = useState<Omit<Gejala, 'id'>>({
        kode: "",
        nama: "",
        deskripsi: "",
        kategori: "System",
        perangkat: [],
        mass_function: {},
        gambar: "",
    });
    const [massFunctions, setMassFunctions] = useState<MassFunctionEntry[]>([]);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [mediaFile, setMediaFile] = useState<MediaFileTemp | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    const isEditMode = useMemo(() => !!initialData?.id, [initialData]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                kode: initialData.kode,
                nama: initialData.nama || "",
                deskripsi: initialData.deskripsi || "",
                kategori: initialData.kategori || "System",
                perangkat: Array.isArray(initialData.perangkat) ? initialData.perangkat : [],
                mass_function: initialData.mass_function || {},
                gambar: initialData.gambar || "",
            });
            const entries = Object.entries(initialData.mass_function || {})
                .filter(([key]) => key !== "uncertainty")
                .map(([kerusakan, value]) => ({
                    kerusakan,
                    value: Number(value),
                }));
            setMassFunctions(entries.length > 0 ? entries : [{ kerusakan: "", value: 0.1 }]);

            if (initialData.gambar) {
                setMediaFile({
                    id: 'existing-thumbnail',
                    file: null,
                    preview: initialData.gambar,
                    type: initialData.gambar.match(/\.(mp4|mov|webm|ogg)$/i) ? 'video' : 'image',
                    uploading: false,
                    progress: 100,
                    uploadedUrl: initialData.gambar,
                });
            } else {
                setMediaFile(null);
            }
        } else {
            setMassFunctions([{ kerusakan: "", value: 0.1 }]);
        }
    }, [initialData]);

    const handleInputChange = useCallback(<K extends keyof Omit<Gejala, 'id'>>(field: K, value: Omit<Gejala, 'id'>[K]): void => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const toggleDevice = useCallback((device: string): void => {
        setFormData((prev) => ({
            ...prev,
            perangkat: prev.perangkat.includes(device)
                ? prev.perangkat.filter((d) => d !== device)
                : [...prev.perangkat, device],
        }));
    }, []);

    const uploadFileToImageKit = useCallback(async (file: File, onProgressCallback: (progress: number) => void): Promise<string | null> => {
        if (!userId) {
            toast.error("Anda harus login untuk mengunggah media.");
            return null;
        }

        if (!file) {
            toast.error("Tidak ada file untuk diunggah.");
            return null;
        }

        if (file.size > 5 * 1024 * 1024) { // Max 5MB
            toast.error("Ukuran file terlalu besar. Maksimal 5MB.");
            return null;
        }

        const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
        if (!fileType) {
            toast.error("Format file tidak didukung.", { description: "Hanya gambar atau video yang diizinkan." });
            return null;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', `gejala-media-${userId}-${Date.now()}-${file.name}`);
        formData.append('folder', "gejala-media");

        try {
            const authRes = await fetch("/api/upload-auth");
            if (!authRes.ok) {
                const errorText = await authRes.text();
                throw new Error(`Failed to get ImageKit authentication: ${authRes.status} ${errorText}`);
            }
            const authData = await authRes.json();

            formData.append('token', authData.token);
            formData.append('expire', authData.expire);
            formData.append('signature', authData.signature);
            formData.append('publicKey', authData.publicKey);

            return await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const result = JSON.parse(xhr.responseText);
                        resolve(result.url);
                    } else {
                        reject(new Error(`ImageKit upload failed: ${xhr.status} ${xhr.statusText}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Network error during ImageKit upload.'));
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        onProgressCallback((event.loaded / event.total) * 100);
                    }
                };
                xhr.send(formData);
            });
        } catch (error) {
            console.error("Error uploading file to ImageKit:", error);
            toast.error("Gagal mengunggah file", { description: (error instanceof Error ? error.message : String(error)) });
            return null;
        }
    }, [userId]);

    const handleFileProcessing = useCallback(async (file: File) => {
        if (!userId) {
            toast.error("Anda harus login untuk mengunggah media.");
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // Max 5MB
            toast.error("Ukuran file terlalu besar. Maksimal 5MB.");
            return;
        }

        const fileType = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : null;
        if (!fileType) {
            toast.error("Format file tidak didukung.", { description: "Hanya gambar atau video yang diizinkan." });
            return;
        }

        const tempId = `temp-${Date.now()}`;
        const objectUrl = URL.createObjectURL(file);
        const newMedia: MediaFileTemp = {
            id: tempId,
            file,
            preview: objectUrl,
            type: fileType,
            uploading: true,
            progress: 0,
            uploadedUrl: null,
        };

        setMediaFile(newMedia);
        toast.info("Mengunggah gambar...");

        try {
            const uploadedUrl = await uploadFileToImageKit(file, (p) => {
                setMediaFile(prev => prev ? { ...prev, progress: p } : null);
            });

            if (uploadedUrl) {
                setMediaFile(prev => prev ? { ...prev, uploading: false, progress: 100, uploadedUrl } : null);
                setFormData(prev => ({ ...prev, gambar: uploadedUrl }));
                toast.success("Gambar berhasil diunggah.");
            } else {
                setMediaFile(null);
                setFormData(prev => ({ ...prev, gambar: "" }));
                URL.revokeObjectURL(objectUrl);
            }
        } catch (error) {
            setMediaFile(null);
            setFormData(prev => ({ ...prev, gambar: "" }));
            URL.revokeObjectURL(objectUrl);
            toast.error("Gagal mengunggah gambar.");
        }
    }, [userId, uploadFileToImageKit]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (isSubmitting || (mediaFile && mediaFile.uploading)) return;
        const file = e.dataTransfer.files?.[0];
        if (file) handleFileProcessing(file);
    }, [isSubmitting, mediaFile, handleFileProcessing]);

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
        if (isSubmitting || (mediaFile && mediaFile.uploading)) return;
        const file = e.clipboardData.files?.[0];
        if (file) handleFileProcessing(file);
    }, [isSubmitting, mediaFile, handleFileProcessing]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmitting || (mediaFile && mediaFile.uploading)) {
            e.dataTransfer.dropEffect = "none";
        } else {
            e.dataTransfer.dropEffect = "copy";
            setIsDragOver(true);
        }
    }, [isSubmitting, mediaFile]);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const handleRemoveImage = useCallback(() => {
        if (mediaFile?.preview) URL.revokeObjectURL(mediaFile.preview);
        setMediaFile(null);
        setFormData(prev => ({ ...prev, gambar: "" }));
        toast.info("Gambar dihapus.");
    }, [mediaFile]);

    const addMassFunction = useCallback((): void => {
        if (kerusakanList.length === 0) {
            toast.error("Data kerusakan belum dimuat atau tidak tersedia.");
            return;
        }

        const usedKerusakanCodes = massFunctions.map((mf) => mf.kerusakan);
        const availableKerusakan = kerusakanList.filter(
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
    }, [massFunctions, kerusakanList]);

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

    const getKerusakanComboboxOptions = useMemo(() => {
        return kerusakanList.map(k => ({
            value: k.kode,
            label: `${k.kode} - ${k.nama}`
        }));
    }, [kerusakanList]);

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

        if (massFunctions.some(mf => !kerusakanList.some(ko => ko.kode === mf.kerusakan))) {
            toast.error("Terdapat kerusakan yang tidak valid dalam mass function.");
            return false;
        }

        if (massFunctions.some(mf => !mf.kerusakan)) {
            toast.error("Semua entri mass function harus memiliki kerusakan yang dipilih.");
            return false;
        }
        return true;
    }, [formData, massFunctions, kerusakanList]);

    const handleSave = async (): Promise<void> => {
        if (!validateForm()) return;
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
        await onSave(gejalaToSave, initialData?.id);
    };

    const getMassTotal = useMemo(() => {
        return massFunctions.reduce((sum, mf) => sum + mf.value, 0);
    }, [massFunctions]);
    const getUncertainty = useMemo(() => {
        return Math.max(0, 1 - getMassTotal);
    }, [getMassTotal]);

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-6">
                <Button variant="outline" onClick={() => router.back()} className="mb-4" disabled={isSubmitting}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                </Button>
                <h1 className="text-3xl font-bold">{pageTitle}</h1>
                <p className="text-muted-foreground mt-1">{pageDescription}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Dasar</CardTitle>
                        <CardDescription>Data utama gejala.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="kode">Kode Gejala *</Label>
                            <Input
                                id="kode"
                                value={formData.kode}
                                onChange={(e) => handleInputChange("kode", e.target.value)}
                                placeholder="G1, G2, dst..."
                                className="font-mono"
                                disabled={isSubmitting || isEditMode}
                            />
                            {!isEditMode && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => console.log("Generate code")} // Placeholder
                                    disabled={isSubmitting || isGeneratingCode}
                                    className="shrink-0 bg-transparent mt-2"
                                >
                                    <RefreshCw className={cn("h-4 w-4", isGeneratingCode && "animate-spin")} />
                                </Button>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nama">Nama Gejala *</Label>
                            <Input
                                id="nama"
                                value={formData.nama}
                                onChange={(e) => handleInputChange("nama", e.target.value)}
                                placeholder="Nama gejala yang mudah dipahami"
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="kategori">Kategori</Label>
                            <Select
                                value={formData.kategori}
                                onValueChange={(value: string) => handleInputChange("kategori", value)}
                                disabled={isSubmitting}
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
                            <div className="flex gap-2 mt-2">
                                {devices.map((device: string) => (
                                    <Button
                                        key={device}
                                        type="button"
                                        variant={formData.perangkat.includes(device) ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleDevice(device)}
                                        disabled={isSubmitting}
                                    >
                                        {device === "computer" ? "Komputer" : "Laptop"}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Gambar Gejala</Label>
                            <div
                                className={cn(
                                    "relative w-full h-48 border rounded-lg overflow-hidden group flex items-center justify-center",
                                    "cursor-pointer transition-colors duration-200",
                                    mediaFile ? "" : (isDragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-200 dark:border-gray-700 hover:border-gray-400"),
                                    (isSubmitting || (mediaFile && mediaFile.uploading)) && "cursor-wait"
                                )}
                                onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
                                onPaste={handlePaste} onClick={() => !mediaFile?.uploading && fileInputRef.current?.click()}
                            >
                                {mediaFile?.preview ? (
                                    mediaFile.type === "image" ? (
                                        <Image src={mediaFile.preview} alt="Gambar Pratinjau" layout="fill" objectFit="cover" />
                                    ) : (
                                        <video src={mediaFile.preview} className="w-full h-full object-cover" autoPlay muted loop />
                                    )
                                ) : (
                                    <div className="text-muted-foreground text-center p-4">
                                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                                        <p>Seret & lepas gambar di sini, atau klik untuk memilih.</p>
                                    </div>
                                )}
                                {(mediaFile?.uploading || isSubmitting) && (
                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white p-4 z-10">
                                        <Loader2 className="h-10 w-10 animate-spin mb-3 text-blue-400" />
                                        <span className="text-sm">{Math.round(mediaFile?.progress || 0)}%</span>
                                        <Progress value={mediaFile?.progress || 0} className="w-4/5 mt-2 h-1" />
                                    </div>
                                )}
                                {mediaFile && !mediaFile.uploading && (
                                    <Button
                                        variant="destructive" size="icon" onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 h-8 w-8 rounded-full z-20"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                            <input
                                ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden"
                                onChange={(e) => {
                                    if (e.target.files?.[0]) handleFileProcessing(e.target.files[0]);
                                }}
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
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addMassFunction}
                                disabled={isSubmitting || kerusakanList.length === 0 || massFunctions.length >= kerusakanList.length}
                            >
                                <Plus className="h-4 w-4 mr-1" />
                                Tambah
                            </Button>
                        </div>
                        {isSubmitting && (
                            <div className="flex items-center justify-center h-20 text-muted-foreground">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" /> Memuat data kerusakan...
                            </div>
                        )}
                        {kerusakanList.length === 0 && (
                            <p className="text-red-500 text-sm">Tidak ada data kerusakan yang tersedia. Silakan tambahkan kerusakan terlebih dahulu.</p>
                        )}
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                            {massFunctions.map((entry: MassFunctionEntry, index: number) => (
                                <Card key={index} className="p-3 border-2">
                                    <div className="space-y-3">
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
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    className="w-full justify-between"
                                                    disabled={isSubmitting || kerusakanList.length === 0}
                                                >
                                                    {entry.kerusakan
                                                        ? getKerusakanComboboxOptions.find(opt => opt.value === entry.kerusakan)?.label
                                                        : "Pilih Kerusakan..."}
                                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[300px] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Cari kerusakan..." />
                                                    <CommandList>
                                                        <CommandEmpty>Tidak ada kerusakan ditemukan.</CommandEmpty>
                                                        <CommandGroup>
                                                            {getKerusakanComboboxOptions.map((kerusakan) => (
                                                                <CommandItem
                                                                    key={kerusakan.value}
                                                                    value={kerusakan.label}
                                                                    onSelect={() => updateMassFunction(index, "kerusakan", kerusakan.value)}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            entry.kerusakan === kerusakan.value ? "opacity-100" : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {kerusakan.label}
                                                                </CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>

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
                                                onValueChange={([value]: number[]) => updateMassFunction(index, "value", value)}
                                                min={0.01}
                                                max={0.95}
                                                step={0.001}
                                                className="w-full"
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex justify-between items-center mb-2">
                                <Label className="text-sm font-medium text-blue-800">
                                    Uncertainty (Ketidakpastian)
                                </Label>
                                <Badge variant="outline" className="bg-blue-100 text-blue-800">
                                    {(getUncertainty * 100).toFixed(1)}%
                                </Badge>
                            </div>
                            <p className="text-xs text-blue-700">
                                Nilai: {getUncertainty.toFixed(3)}
                            </p>
                            <p className="text-xs text-blue-600 mt-1">
                                Nilai uncertainty ini dihitung otomatis dan merupakan sisa dari total mass function.
                            </p>
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                            <p>
                                • Total mass function yang dimasukkan:{" "}
                                {getMassTotal.toFixed(3)}
                            </p>
                            <p>
                                • Nilai ini akan dinormalisasi di backend untuk perhitungan Dempster-Shafer.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-8 flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.back()} disabled={isSubmitting}>
                    Batal
                </Button>
                <Button onClick={handleSave} disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Menyimpan...
                        </>
                    ) : (
                        <>
                            <Save className="mr-2 h-4 w-4" />
                            {submitButtonText}
                        </>
                    )}
                </Button>
            </div>
        </div>
    );
}