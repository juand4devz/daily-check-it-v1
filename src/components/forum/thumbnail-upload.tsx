// /components/forum/thumbnail-upload.tsx
"use client";

import type React from "react";
import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ImageIcon, Loader2, Check, Camera, FileImage, X, LucideIcon, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ThumbnailUploadProps {
    value?: string | null;
    onChange: (url: string | null | undefined) => void;
    disabled?: boolean;
    onUploadFile: (file: File) => Promise<string | null>;
    isLoading?: boolean;
    placeholderIcon?: LucideIcon;
    placeholderGradient?: string;
}

export function ThumbnailUpload({
    value,
    onChange,
    disabled = false,
    onUploadFile,
    isLoading = false,
    placeholderIcon: PlaceholderIcon = HelpCircle,
    placeholderGradient = "bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500",
}: ThumbnailUploadProps) {
    const [internalProgress, setInternalProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const cameraInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(
        async (file: File) => {
            if (!file.type.startsWith("image/")) {
                toast.error("File tidak valid", {
                    description: "Hanya file gambar yang diperbolehkan",
                });
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                toast.error("File terlalu besar", {
                    description: "Ukuran file maksimal 5MB",
                });
                return;
            }

            setInternalProgress(0);

            const animateProgress = () => {
                let p = 0;
                const interval = setInterval(() => {
                    p += 10;
                    if (p > 100) {
                        clearInterval(interval);
                        setInternalProgress(0);
                        return;
                    }
                    setInternalProgress(p);
                }, 100);
            };

            if (!isLoading) {
                animateProgress();
            }

            try {
                const url = await onUploadFile(file);
                if (url) {
                    onChange(url);
                    toast.success("Upload berhasil", {
                        description: "Thumbnail berhasil diupload",
                    });
                } else {
                    onChange(null);
                    toast.error("Upload gagal", {
                        description: "Terjadi kesalahan saat mengunggah thumbnail",
                    });
                }
            } catch (error) {
                console.error("Error during thumbnail upload process:", error);
                onChange(null);
                toast.error("Upload gagal", {
                    description: "Terjadi kesalahan saat mengunggah thumbnail",
                });
            } finally {
                setInternalProgress(0);
            }
        },
        [onChange, onUploadFile, isLoading],
    );


    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setDragActive(false);

            if (disabled || isLoading) return;

            const files = e.dataTransfer.files;
            if (files.length > 0) {
                handleFile(files[0]);
            }
        },
        [disabled, isLoading, handleFile],
    );

    const handleDragOver = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            if (!disabled && !isLoading) {
                setDragActive(true);
            }
        },
        [disabled, isLoading],
    );

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
    }, []);

    const handleFileInput = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = e.target.files;
            if (files && files.length > 0) {
                handleFile(files[0]);
            }
            e.target.value = "";
        },
        [handleFile],
    );

    const isCurrentlyUploading = isLoading || internalProgress > 0;

    return (
        <div className="space-y-3">
            <Label>Thumbnail (Opsional)</Label>

            {(value !== null && value !== undefined) ? (
                <Card className="overflow-hidden">
                    <div className="relative">
                        <Image height="500" width="500" src={value} alt="Thumbnail preview" className="w-full h-48 object-cover" />

                        {isCurrentlyUploading && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                <div className="text-center text-white">
                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                                    <div className="text-sm">{internalProgress > 0 ? `${Math.round(internalProgress)}%` : "Uploading..."}</div>
                                    {internalProgress > 0 && <Progress value={internalProgress} className="w-32 mt-2" />}
                                </div>
                            </div>
                        )}

                        {!isCurrentlyUploading && (
                            <div className="absolute top-2 left-2">
                                <div className="bg-green-500 text-white rounded-full p-1">
                                    <Check className="h-4 w-4" />
                                </div>
                            </div>
                        )}
                        <Button
                            type="button" // Pastikan type="button"
                            variant="destructive"
                            size="icon"
                            className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-80 hover:opacity-100 z-10"
                            onClick={(e) => { e.stopPropagation(); onChange(null); }}
                            disabled={disabled || isCurrentlyUploading}
                            title="Hapus Thumbnail"
                        >
                            <X className="h-3 w-3" />
                        </Button>
                    </div>

                    <CardContent className="p-3">
                        <p className="text-sm text-gray-600">Thumbnail akan ditampilkan sebagai gambar utama post</p>
                    </CardContent>
                </Card>
            ) : (
                <div
                    className={cn(`
                        border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200
                        ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"}
                        ${disabled || isCurrentlyUploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                    `, {
                        'relative overflow-hidden': true,
                    })}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !disabled && !isCurrentlyUploading && fileInputRef.current?.click()}
                >
                    {/* Dynamic Placeholder Icon and Gradient */}
                    <div className={cn("absolute inset-0 flex items-center justify-center", placeholderGradient)}>
                        <PlaceholderIcon className="h-16 w-16 text-white/80 opacity-60" />
                    </div>
                    {/* Content on top of the placeholder */}
                    <div className="relative z-10 space-y-3">
                        <div className="flex justify-center">
                            <div className="p-3 bg-gray-100 rounded-full">
                                <ImageIcon className="h-6 w-6 text-gray-600" />
                            </div>
                        </div>

                        <div>
                            <p className="font-medium text-gray-700">Upload Thumbnail</p>
                            <p className="text-sm text-gray-500 mt-1">Drag & drop atau klik untuk memilih gambar</p>
                            <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG, GIF, WebP (Maks. 5MB)</p>
                        </div>

                        <div className="flex justify-center gap-2">
                            <Button
                                type="button" // Pastikan type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                                disabled={disabled || isCurrentlyUploading}
                            >
                                <FileImage className="h-4 w-4 mr-2" />
                                Pilih File
                            </Button>

                            <Button
                                type="button" // Pastikan type="button"
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    cameraInputRef.current?.click();
                                }}
                                disabled={disabled || isCurrentlyUploading}
                            >
                                <Camera className="h-4 w-4 mr-2" />
                                Kamera
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
            <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileInput}
                className="hidden"
            />
        </div>
    );
}