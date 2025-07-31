// /components/forum/thumbnail-upload.tsx
"use client";

import React, { useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2, Loader2, Upload, Image as ImageIcon, Video, X } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ThumbnailUploadProps {
    value: string | null;
    onChange: (url: string | null | undefined) => void;
    disabled?: boolean;
    onUploadFile: (file: File, onProgressCallback: (progress: number) => void) => Promise<string | null>;
    isLoading: boolean;
    placeholderIcon: React.ElementType;
    placeholderGradient: string;
}

export function ThumbnailUpload({
    value,
    onChange,
    disabled,
    onUploadFile,
    isLoading,
    placeholderIcon: PlaceholderIcon,
    placeholderGradient,
}: ThumbnailUploadProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(value);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploadingInternal, setIsUploadingInternal] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [fileType, setFileType] = useState<"image" | "video" | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);

    // PERBAIKAN: Pindahkan definisi displayIsLoading ke atas,
    // sebelum digunakan dalam useCallback.
    const displayIsLoading = isLoading || isUploadingInternal;

    // Sync previewUrl with value from parent if value changes (e.g., initialData load)
    React.useEffect(() => {
        setPreviewUrl(value);
        if (value) {
            if (value.match(/\.(mp4|mov|webm|ogg)$/i)) {
                setFileType('video');
            } else if (value.match(/\.(jpe?g|png|gif|webp|svg)$/i)) {
                setFileType('image');
            } else {
                setFileType(null);
            }
        } else {
            setFileType(null);
        }
    }, [value]);

    const handleFileProcessing = useCallback(async (file: File) => {
        // Reset previous states
        setUploadError(null);
        setUploadProgress(0);

        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
            toast.error("Format file tidak didukung.", { description: "Hanya gambar atau video yang diizinkan." });
            return;
        }

        // Create local preview URL immediately
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
        setFileType(file.type.startsWith('image/') ? 'image' : 'video');
        setIsUploadingInternal(true); // Start internal loading indicator

        try {
            // PENTING: Teruskan setUploadProgress sebagai callback ke onUploadFile
            const uploadedUrl = await onUploadFile(file, (p) => setUploadProgress(p));
            if (uploadedUrl) {
                onChange(uploadedUrl); // Update parent's form value
                toast.success("Thumbnail berhasil diunggah.");
                setUploadProgress(100);
            } else {
                setUploadError("Gagal mengunggah thumbnail.");
                toast.error("Gagal mengunggah thumbnail.", { description: "Silakan coba lagi." });
                // Clean up local preview if upload failed
                URL.revokeObjectURL(objectUrl);
                setPreviewUrl(null);
                setFileType(null);
            }
        } catch (error) {
            console.error("Error during thumbnail upload:", error);
            setUploadError("Gagal mengunggah thumbnail.");
            toast.error("Gagal mengunggah thumbnail.", { description: "Terjadi kesalahan tak terduga." });
            // Clean up local preview if upload failed
            URL.revokeObjectURL(objectUrl);
            setPreviewUrl(null);
            setFileType(null);
        } finally {
            setIsUploadingInternal(false); // End internal loading
            if (fileInputRef.current) {
                fileInputRef.current.value = ''; // Reset input to allow re-uploading the same file
            }
        }
    }, [onChange, onUploadFile]);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            handleFileProcessing(file);
        }
    }, [handleFileProcessing]);

    const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
        // Pastikan displayIsLoading dapat diakses di sini
        if (disabled || displayIsLoading) return;

        const file = event.dataTransfer.files?.[0];
        if (file) {
            handleFileProcessing(file);
        }
    }, [disabled, displayIsLoading, handleFileProcessing]); // Tambahkan displayIsLoading sebagai dependensi

    const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        // Pastikan displayIsLoading dapat diakses di sini
        if (disabled || displayIsLoading) {
            event.dataTransfer.dropEffect = "none";
        } else {
            event.dataTransfer.dropEffect = "copy";
            setIsDragOver(true);
        }
    }, [disabled, displayIsLoading]); // Tambahkan displayIsLoading sebagai dependensi

    const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        event.stopPropagation();
        setIsDragOver(false);
    }, []);


    const handleRemoveThumbnail = useCallback(() => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl); // Clean up blob URL
        }
        onChange(null); // Clear thumbnail in parent form
        setPreviewUrl(null);
        setFileType(null);
        setUploadProgress(0);
        setUploadError(null);
        setIsUploadingInternal(false);
        toast.info("Thumbnail dihapus.");
    }, [onChange, previewUrl]);


    return (
        <div className="space-y-2">
            <div
                className={cn(
                    "relative w-full h-48 border rounded-lg overflow-hidden group flex items-center justify-center",
                    "cursor-pointer transition-colors duration-200",
                    isDragOver ? "border-blue-500 bg-blue-50 dark:bg-blue-950" : "border-gray-200 dark:border-gray-700",
                    displayIsLoading ? "cursor-wait" : ""
                )}
                onClick={() => !displayIsLoading && fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
            >
                {/* Konten Pratinjau */}
                {previewUrl ? (
                    fileType === "image" ? (
                        <Image
                            src={previewUrl}
                            alt="Thumbnail Preview"
                            layout="fill"
                            objectFit="cover"
                            className="transition-transform duration-300 group-hover:scale-105"
                        />
                    ) : (
                        <video
                            src={previewUrl}
                            className="w-full h-full object-cover"
                            poster={value && fileType === 'video' ? `${value}?tr=f-jpg` : undefined}
                            muted
                            loop
                            playsInline
                            autoPlay
                        />
                    )
                ) : (
                    <div className={cn("w-full h-full flex flex-col items-center justify-center relative p-4 text-center", placeholderGradient)}>
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                        <PlaceholderIcon className="h-16 w-16 text-white/80 mb-2" />
                        <p className="text-white text-sm font-medium">Drag & Drop atau Klik untuk Upload</p>
                        <p className="text-white text-xs opacity-80 mt-1">Gambar atau Video (Max 5MB)</p>
                    </div>
                )}

                {/* Overlay for uploading status */}
                {displayIsLoading && (
                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4 z-10">
                        <Loader2 className="h-10 w-10 animate-spin mb-3 text-blue-400" />
                        <p className="text-lg font-semibold mb-2">Mengunggah...</p>
                        <span className="text-sm">{Math.round(uploadProgress)}%</span>
                        <Progress value={uploadProgress} className="w-4/5 mt-3 h-2 bg-blue-300" />
                    </div>
                )}

                {/* Overlay for upload error */}
                {!displayIsLoading && uploadError && (
                    <div className="absolute inset-0 bg-red-600/80 flex flex-col items-center justify-center text-white p-4 z-10">
                        <X className="h-10 w-10 mb-3" />
                        <p className="text-lg font-semibold mb-2">Unggah Gagal</p>
                        <p className="text-sm text-center">{uploadError}</p>
                        <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="mt-3 bg-white/20 hover:bg-white/30 text-white"
                            onClick={handleRemoveThumbnail} // Allows user to remove failed upload
                        >
                            <Trash2 className="h-4 w-4 mr-2" /> Hapus
                        </Button>
                    </div>
                )}

                {/* Tombol Hapus (selalu muncul di atas overlay jika ada preview dan tidak loading) */}
                {previewUrl && !displayIsLoading && (
                    <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full opacity-80 hover:opacity-100 z-20 flex items-center justify-center"
                        onClick={handleRemoveThumbnail}
                        disabled={disabled}
                        aria-label="Hapus thumbnail"
                    >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Hapus Thumbnail</span>
                    </Button>
                )}
            </div>

            {/* Input file tersembunyi (dulu tombol upload) */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,video/*"
                className="hidden"
                disabled={disabled || displayIsLoading}
            />
            {/* Tombol "Upload/Ganti Thumbnail" ini opsional, karena area drop sudah ada. Bisa dihapus jika diinginkan. */}
            <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={disabled || displayIsLoading}
            >
                <Upload className="h-4 w-4 mr-2" />
                {previewUrl ? "Ganti Thumbnail" : "Upload Thumbnail"}
            </Button>
            <p className="text-xs text-gray-500 mt-1">Format: JPG, PNG, GIF, WEBP, MP4. Max 5MB. Gunakan rasio 16:9 untuk tampilan terbaik.</p>

            <style jsx>{`
                @keyframes shimmer {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(100%);
                    }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </div>
    );
}