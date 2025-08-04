"use client";

import * as React from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, Save, X, Loader2, Trash2, SquarePen } from "lucide-react"; // Menambahkan ikon SquarePen
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"; // Impor komponen dropdown menu
import { cn } from "@/lib/utils";
import {
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload,
} from "@imagekit/next";
import Image from "next/image";

// Props untuk komponen ImageUploader
interface ImageUploaderProps {
    userId: string;
    currentImageUrl: string | null | undefined;
    onImageUrlChange: (newUrl: string | null) => Promise<void>;
    folderPath: string;
    fileNamePrefix: string;
    imageAlt: string;
    disabled?: boolean;
    type: "avatar" | "banner" | "general";
}

export function ImageUploader({
    userId,
    currentImageUrl,
    onImageUrlChange,
    folderPath,
    fileNamePrefix,
    imageAlt,
    disabled = false,
    type,
}: ImageUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [fileToUpload, setFileToUpload] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    // Sinkronkan previewUrl dengan currentImageUrl saat komponen dimuat atau currentImageUrl berubah.
    useEffect(() => {
        if (!fileToUpload && currentImageUrl !== previewUrl) {
            setPreviewUrl(currentImageUrl || null);
        }
    }, [currentImageUrl, fileToUpload, previewUrl]);

    const authenticator = useCallback(async () => {
        try {
            const response = await fetch("/api/upload-auth");
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Authentication request failed: ${response.status} ${errorText}`);
            }
            const data = await response.json();
            return { signature: data.signature, expire: data.expire, token: data.token, publicKey: data.publicKey };
        } catch (error) {
            console.error("Authentication error for ImageKit:", error);
            toast.error("Gagal mendapatkan otentikasi upload.");
            throw error;
        }
    }, []);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith("image/")) {
                toast.error("File tidak valid", { description: "Hanya gambar yang diperbolehkan." });
                event.target.value = "";
                return;
            }
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Ukuran file terlalu besar", { description: "Maksimal ukuran file adalah 5MB." });
                event.target.value = "";
                return;
            }
            setFileToUpload(file);
            setPreviewUrl(URL.createObjectURL(file));
            setProgress(0);
        }
    }, []);

    const handleUploadButtonClick = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    const handleSave = useCallback(async () => {
        if (!fileToUpload) return;

        setIsUploading(true);
        try {
            const authParams = await authenticator();

            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, "0");
            const day = now.getDate().toString().padStart(2, "0");
            const hours = now.getHours().toString().padStart(2, "0");
            const minutes = now.getMinutes().toString().padStart(2, "0");
            const seconds = now.getSeconds().toString().padStart(2, "0");
            const randomString = Math.random().toString(36).substring(2, 8);

            const fileExtension = fileToUpload.name.split(".").pop();
            const uniqueFileName = `${fileNamePrefix}-${userId}-${year}${month}${day}-${hours}${minutes}${seconds}-${randomString}.${fileExtension}`;

            const uploadResponse = await upload({
                publicKey: authParams.publicKey,
                fileName: uniqueFileName,
                file: fileToUpload,
                folder: folderPath,
                signature: authParams.signature,
                token: authParams.token,
                expire: authParams.expire,
                onProgress: (event) => {
                    setProgress((event.loaded / event.total) * 100);
                },
                useUniqueFileName: false,
                overwriteFile: true,
            });

            if (uploadResponse.url) {
                await onImageUrlChange(uploadResponse.url);
                setFileToUpload(null);
                toast.success("Gambar berhasil diunggah dan disimpan!");
            } else {
                throw new Error("URL gambar tidak ditemukan dari respons upload ImageKit.");
            }
        } catch (error) {
            console.error("Upload failed:", error);
            if (error instanceof ImageKitAbortError) toast.error("Upload dibatalkan.");
            else if (error instanceof ImageKitInvalidRequestError) toast.error(`Permintaan upload tidak valid: ${error.message}`);
            else if (error instanceof ImageKitUploadNetworkError) toast.error(`Kesalahan jaringan saat upload: ${error.message}`);
            else if (error instanceof ImageKitServerError) toast.error(`Kesalahan server ImageKit: ${error.message}`);
            else toast.error(`Gagal mengunggah gambar: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsUploading(false);
            setProgress(0);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    }, [fileToUpload, authenticator, onImageUrlChange, folderPath, fileNamePrefix, userId]);

    const handleCancel = useCallback(() => {
        if (previewUrl && previewUrl.startsWith("blob:")) {
            URL.revokeObjectURL(previewUrl);
        }
        setFileToUpload(null);
        setPreviewUrl(currentImageUrl || null);
        setProgress(0);
    }, [previewUrl, currentImageUrl]);

    const handleDelete = useCallback(async () => {
        await onImageUrlChange(null);
        setPreviewUrl(null);
        setFileToUpload(null);
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        toast.success("Gambar berhasil dihapus!");
    }, [onImageUrlChange]);

    const renderImage = () => {
        const srcToDisplay = previewUrl || currentImageUrl || "/placeholder.svg";

        if (type === "avatar") {
            return (
                <Avatar className="h-32 w-32 border-4 border-background">
                    <AvatarImage src={srcToDisplay} alt={imageAlt} className="object-cover" />
                    <AvatarFallback className="text-2xl">{imageAlt.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
            );
        } else if (type === "banner") {
            return (
                <div
                    className="h-48 w-full rounded-t-lg bg-gray-200 dark:bg-gray-700 bg-cover bg-center flex items-center justify-center text-muted-foreground"
                    style={{ backgroundImage: `url(${srcToDisplay})` }}
                >
                    {(!srcToDisplay || srcToDisplay === "/placeholder.svg") && (
                        <span className="text-sm">No Banner Image</span>
                    )}
                </div>
            );
        } else {
            return (
                <div
                    className={cn(
                        "relative w-full h-48 bg-muted flex items-center justify-center overflow-hidden rounded-md"
                    )}
                >
                    {srcToDisplay && srcToDisplay !== "/placeholder.svg" ? (
                        <Image src={srcToDisplay} alt={imageAlt} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                    ) : (
                        <span className="text-sm text-muted-foreground">No Image</span>
                    )}
                </div>
            );
        }
    };

    const isExistingImage = !!currentImageUrl;

    return (
        <div className="relative group w-full">
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
                disabled={disabled || isUploading}
            />

            {renderImage()}

            {/* Tombol menu dropdown */}
            {!disabled && (
                <div className={cn(
                    "absolute z-10 transition-opacity",
                    type === "avatar" ? "right-2 -bottom-2" : "top-2 right-2",
                    "group-hover:opacity-100 opacity-0" // Menyembunyikan tombol secara default, tampil saat hover
                )}>
                    {fileToUpload ? (
                        // Opsi saat file baru dipilih
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="default"
                                size="sm"
                                onClick={handleSave}
                                disabled={isUploading}
                                className="flex items-center gap-1 cursor-pointer"
                            >
                                {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                {isUploading ? `${Math.round(progress)}%` : "Simpan"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="cursor-pointer"
                                onClick={handleCancel}
                                disabled={isUploading}
                            >
                                <X className="h-4 w-4" /> Batal
                            </Button>
                        </div>
                    ) : (
                        // Opsi default: tombol dropdown
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className={cn("h-8 w-8", type === "avatar" && "rounded-full")}
                                >
                                    <SquarePen className="h-4 w-4" />
                                    <span className="sr-only">Edit gambar</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={handleUploadButtonClick}>
                                    <Camera className="mr-2 h-4 w-4" /> Unggah Gambar Baru
                                </DropdownMenuItem>
                                {isExistingImage && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onSelect={handleDelete} className="text-red-600">
                                            <Trash2 className="mr-2 h-4 w-4" /> Hapus Gambar
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            )}
        </div>
    );
}