// /components/admin/DamageForm.tsx
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
import { ArrowLeft, Save, X, Eye, Loader2, RefreshCw, Upload, Link, Copy, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Kerusakan, Gejala } from "@/types/diagnose";
import { cn } from "@/lib/utils";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useSession } from "next-auth/react";
import { ScrollArea, ScrollBar } from "../ui/scroll-area";

const tingkatKerusakanOptions = ["Ringan", "Sedang", "Berat"];
const MAX_MEDIA_FILES = 5;

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

interface DamageFormProps {
    initialData?: Kerusakan | null;
    gejalaList: Gejala[]; // Menerima daftar gejala dari parent
    isSubmitting: boolean;
    onSave: (data: Omit<Kerusakan, 'id'>, id?: string) => Promise<void>;
    pageTitle: string;
    pageDescription: string;
    submitButtonText: string;
}

export function DamageForm({
    initialData,
    gejalaList,
    isSubmitting,
    onSave,
    pageTitle,
    pageDescription,
    submitButtonText,
}: DamageFormProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const [formData, setFormData] = useState<Omit<Kerusakan, 'id'>>({
        kode: "",
        nama: "",
        deskripsi: "",
        tingkat_kerusakan: "Ringan",
        estimasi_biaya: "",
        waktu_perbaikan: "",
        prior_probability: 0.1,
        solusi: "",
        gejala_terkait: [],
    });
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    // const [activeTab, setActiveTab] = useState("write");
    const [isDragOver, setIsDragOver] = useState(false);
    const [mediaFiles, setMediaFiles] = useState<MediaFileTemp[]>([]);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isEditMode = useMemo(() => !!initialData?.id, [initialData]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                kode: initialData.kode,
                nama: initialData.nama || "",
                deskripsi: initialData.deskripsi || "",
                tingkat_kerusakan: initialData.tingkat_kerusakan || "Ringan",
                estimasi_biaya: initialData.estimasi_biaya || "",
                waktu_perbaikan: initialData.waktu_perbaikan || "",
                prior_probability: initialData.prior_probability || 0.1,
                solusi: initialData.solusi || "",
                gejala_terkait: Array.isArray(initialData.gejala_terkait) ? initialData.gejala_terkait : [],
            });
        }
    }, [initialData]);

    const handleInputChange = useCallback(<K extends keyof Omit<Kerusakan, 'id'>>(field: K, value: Omit<Kerusakan, 'id'>[K]): void => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const toggleGejala = useCallback((gejalaKode: string): void => {
        setFormData((prev) => {
            const isSelected = prev.gejala_terkait.includes(gejalaKode);
            if (isSelected) {
                return {
                    ...prev,
                    gejala_terkait: prev.gejala_terkait.filter((g) => g !== gejalaKode),
                };
            } else {
                return {
                    ...prev,
                    gejala_terkait: [...prev.gejala_terkait, gejalaKode],
                };
            }
        });
    }, []);

    const validateForm = useCallback((): boolean => {
        if (!formData.kode.trim() || !formData.nama.trim() || !formData.deskripsi.trim()) {
            toast.error("Mohon lengkapi semua field yang wajib diisi.");
            return false;
        }

        if (formData.prior_probability <= 0 || formData.prior_probability > 0.5) {
            toast.error("Prior probability harus antara 0.01 dan 0.50.");
            return false;
        }
        return true;
    }, [formData]);

    const handleSave = async (): Promise<void> => {
        if (!validateForm()) return;
        await onSave(formData, initialData?.id);
    };

    const uploadFileToImageKit = useCallback(async (file: File, onProgressCallback: (progress: number) => void): Promise<string | null> => {
        if (!userId) {
            toast.error("Anda harus login untuk mengunggah media.");
            return null;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', `solusi-media-${userId}-${Date.now()}-${file.name}`);
        formData.append('folder', "solusi-media");

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
        const tempId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            toast.error("Format file tidak didukung.", { description: "Hanya gambar atau video yang diizinkan." });
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        const newMedia: MediaFileTemp = {
            id: tempId,
            file,
            preview: objectUrl,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            uploading: true,
            progress: 0,
            uploadedUrl: null,
        };

        setMediaFiles(prev => [...prev, newMedia]);
        toast.info("Mengunggah media...");

        try {
            const uploadedUrl = await uploadFileToImageKit(file, (p) => {
                setMediaFiles(prev => prev.map(m => m.id === tempId ? { ...m, progress: p } : m));
            });

            if (uploadedUrl) {
                setMediaFiles(prev => prev.map(m => m.id === tempId ? { ...m, uploading: false, progress: 100, uploadedUrl: uploadedUrl } : m));
                toast.success("Media berhasil diunggah.");
            } else {
                setMediaFiles(prev => prev.filter(m => m.id !== tempId));
                URL.revokeObjectURL(objectUrl);
            }
        } catch (error) {
            setMediaFiles(prev => prev.filter(m => m.id !== tempId));
            URL.revokeObjectURL(objectUrl);
        }
    }, [uploadFileToImageKit]);

    const handleDrop = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (isSubmitting) return;

        const file = e.dataTransfer.files?.[0];
        if (file) {
            handleFileProcessing(file);
        }
    }, [isSubmitting, handleFileProcessing]);

    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (isSubmitting) return;

        const items = e.clipboardData?.items;
        if (items) {
            const file = items[0]?.getAsFile();
            if (file && file.type.startsWith('image/')) {
                e.preventDefault();
                handleFileProcessing(file);
            }
        }
    }, [isSubmitting, handleFileProcessing]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmitting) {
            e.dataTransfer.dropEffect = "none";
        } else {
            e.dataTransfer.dropEffect = "copy";
            setIsDragOver(true);
        }
    }, [isSubmitting]);

    const handleDragLeave = useCallback(() => {
        setIsDragOver(false);
    }, []);

    const handleInsertMedia = useCallback((url: string | null) => {
        if (!url || !textareaRef.current) return;

        const markdownLink = `\n![image](${url})\n`;
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newText = formData.solusi.substring(0, start) + markdownLink + formData.solusi.substring(end);

        setFormData(prev => ({ ...prev, solusi: newText }));
        textareaRef.current.focus();
    }, [formData.solusi]);

    const handleRemoveMedia = useCallback((id: string) => {
        setMediaFiles(prev => prev.filter(m => m.id !== id));
        toast.info("Media dihapus dari daftar terlampir.");
    }, []);

    const getGejalaNama = (kode: string) => {
        const gejala = gejalaList.find(g => g.kode === kode);
        return gejala ? gejala.nama : kode;
    };

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-6">
                <Button variant="outline" onClick={() => router.back()} className="mb-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Kembali
                </Button>
                <h1 className="text-3xl font-bold">{pageTitle}</h1>
                <p className="text-muted-foreground mt-1">{pageDescription}</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Basic Information */}
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
                                    disabled={isSubmitting || isEditMode}
                                />
                                {!isEditMode && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => console.log("Generate code")} // Placeholder for generate code logic
                                        disabled={isSubmitting || isGeneratingCode}
                                        className="shrink-0 bg-transparent"
                                    >
                                        <RefreshCw className={cn("h-4 w-4", isGeneratingCode && "animate-spin")} />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nama">Nama Kerusakan *</Label>
                            <Input
                                id="nama"
                                value={formData.nama}
                                onChange={(e) => handleInputChange("nama", e.target.value)}
                                placeholder="Nama kerusakan yang mudah dipahami"
                                disabled={isSubmitting}
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
                                disabled={isSubmitting}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="tingkat">Tingkat Kerusakan</Label>
                            <Select
                                value={formData.tingkat_kerusakan}
                                onValueChange={(value: Kerusakan["tingkat_kerusakan"]) => handleInputChange("tingkat_kerusakan", value)}
                                disabled={isSubmitting}
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
                                    disabled={isSubmitting}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="waktu">Waktu Perbaikan</Label>
                                <Input
                                    id="waktu"
                                    value={formData.waktu_perbaikan}
                                    onChange={(e) => handleInputChange("waktu_perbaikan", e.target.value)}
                                    placeholder="1-3 hari"
                                    disabled={isSubmitting}
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
                                disabled={isSubmitting}
                            />
                            <p className="text-xs text-muted-foreground">Probabilitas awal kerusakan ini terjadi (0.01 - 0.50)</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Advanced Configuration */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Gejala Terkait</CardTitle>
                            <CardDescription>Pilih gejala yang berkaitan dengan kerusakan ini</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="w-full justify-between"
                                        disabled={isSubmitting || gejalaList.length === 0}
                                    >
                                        Pilih Gejala...
                                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0">
                                    <Command>
                                        <CommandInput placeholder="Cari gejala..." />
                                        <CommandList>
                                            <CommandEmpty>Tidak ada gejala ditemukan.</CommandEmpty>
                                            <CommandGroup>
                                                {gejalaList.map((gejala) => (
                                                    <CommandItem
                                                        key={gejala.id}
                                                        value={gejala.nama}
                                                        onSelect={() => toggleGejala(gejala.kode)}
                                                        className={cn(
                                                            "aria-selected:bg-accent aria-selected:text-accent-foreground"
                                                        )}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                formData.gejala_terkait.includes(gejala.kode)
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        <div className="flex flex-col">
                                                            <span>{gejala.kode} - {gejala.nama}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                            <div className="mt-4">
                                <p className="text-sm text-muted-foreground mb-2">
                                    Gejala terpilih ({formData.gejala_terkait.length}):
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {formData.gejala_terkait.map((gejalaKode) => {
                                        const gejalaNama = getGejalaNama(gejalaKode);
                                        return (
                                            <Badge key={gejalaKode} variant="secondary" className="text-xs">
                                                {gejalaKode} - {gejalaNama}
                                                <button
                                                    type="button"
                                                    onClick={() => toggleGejala(gejalaKode)}
                                                    className="ml-1 hover:text-destructive"
                                                    disabled={isSubmitting}
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="h-fit">
                        <CardHeader>
                            <CardTitle>Solusi Perbaikan</CardTitle>
                            <CardDescription>Tulis solusi dalam format Markdown dan lampirkan media</CardDescription>
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
                                    <div className="relative border rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-900 flex flex-col">
                                        <div className="flex items-center justify-end border-b p-2 flex-shrink-0">
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        const markdownLink = `![Deskripsi Gambar](URL_Gambar_Anda_Di_Sini)\n`;
                                                        const currentContent = formData.solusi;
                                                        const cursorPosition = textareaRef.current?.selectionStart || currentContent.length;
                                                        const newContent = currentContent.substring(0, cursorPosition) + markdownLink + currentContent.substring(cursorPosition);
                                                        handleInputChange("solusi", newContent);
                                                        setTimeout(() => textareaRef.current?.focus(), 0);
                                                        toast.info("Markdown link gambar ditambahkan.");
                                                    }}
                                                    disabled={isSubmitting}
                                                    className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                                    title="Masukkan link gambar Markdown"
                                                >
                                                    <Link className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isSubmitting || mediaFiles.length >= MAX_MEDIA_FILES || mediaFiles.some(m => m.uploading)}
                                                    className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                                    title="Upload Gambar/Video"
                                                >
                                                    {mediaFiles.some(m => m.uploading) ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                </Button>
                                            </div>
                                        </div>
                                        <Textarea
                                            ref={textareaRef}
                                            value={formData.solusi}
                                            onChange={(e) => handleInputChange("solusi", e.target.value)}
                                            onPaste={handlePaste}
                                            onDrop={handleDrop}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            placeholder="Tulis solusi dalam format Markdown...
"
                                            rows={20}
                                            className={cn(
                                                "min-h-[400px] resize-none font-mono text-sm border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4",
                                                isDragOver && "border-2 border-blue-500 bg-blue-50",
                                                mediaFiles.some(m => m.uploading) && "cursor-wait"
                                            )}
                                            disabled={isSubmitting}
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        Mendukung Markdown: **bold**, *italic*, `code`, ## heading, - list, dll.
                                    </p>

                                    {/* Area Preview Gambar Drop */}
                                    {mediaFiles.length > 0 && (
                                        <div className="mt-4 border-t pt-4">
                                            <h4 className="font-medium mb-3">Media Terlampir:</h4>
                                            <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                                                <div className="flex w-max space-x-4 p-4">
                                                    {mediaFiles.map((media) => (
                                                        <div key={media.id} className="relative group w-[150px] h-[150px] flex-shrink-0">
                                                            <div className="relative w-full h-full overflow-hidden rounded-md border border-gray-200">
                                                                {media.type === "image" ? (
                                                                    <Image
                                                                        src={media.preview}
                                                                        alt={media.file?.name || 'media'}
                                                                        layout="fill"
                                                                        objectFit="cover"
                                                                    />
                                                                ) : (
                                                                    <video src={media.preview} className="w-full h-full object-cover" muted loop />
                                                                )}
                                                                {media.uploading && (
                                                                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                                                        <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                                        <span className="text-sm">{Math.round(media.progress || 0)}%</span>
                                                                        <Progress value={media.progress} className="w-3/4 mt-2 h-1" />
                                                                    </div>
                                                                )}
                                                                {media.uploadedUrl && !media.uploading && (
                                                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                                                        <h3 className="text-white text-md font-semibold mb-3 text-center truncate w-full">{media.file?.name || 'media'}</h3>
                                                                        <div className="flex flex-col gap-2 w-full max-w-[200px]">
                                                                            <Button variant="secondary" size="sm" className="w-full h-9 px-3 text-sm bg-white/70" onClick={() => handleInsertMedia(media.uploadedUrl)}>
                                                                                <Link className="h-4 w-4 mr-2" /> Sisipkan
                                                                            </Button>
                                                                            <Button variant="secondary" size="sm" className="w-full h-9 px-3 text-sm bg-white/70" onClick={() => navigator.clipboard.writeText(media.uploadedUrl!)}>
                                                                                <Copy className="h-4 w-4 mr-2" /> Salin URL
                                                                            </Button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-80 hover:opacity-100 z-10" onClick={() => handleRemoveMedia(media.id)} disabled={isSubmitting || media.uploading}>
                                                                <X className="h-3 w-3" />
                                                            </Button>
                                                        </div>
                                                    ))}
                                                </div>
                                                <ScrollBar orientation="horizontal" />
                                            </ScrollArea>
                                        </div>
                                    )}
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

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                multiple
                className="hidden"
                onChange={(e) => {
                    if (e.target.files) {
                        Array.from(e.target.files).forEach(handleFileProcessing);
                    }
                    e.target.value = '';
                }}
            />
        </div>
    );
}