// components/imagekit/image-uploader.tsx
"use client";

import * as React from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, Save, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils"; // Pastikan Anda memiliki utility cn
import {
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload,
} from "@imagekit/next";

// Props untuk komponen ImageUploader
interface ImageUploaderProps {
    userId: string; // ID pengguna yang terkait dengan gambar ini (penting untuk nama file dan validasi)
    currentImageUrl: string | null | undefined; // URL gambar saat ini (dari DB). Bisa null/undefined
    onImageUrlChange: (newUrl: string | null) => Promise<void>; // Callback saat URL gambar berubah (null untuk hapus)
    folderPath: string; // Path folder di ImageKit (misal: "user-avatars", "user-banners", "forum-thumbnails")
    fileNamePrefix: string; // Prefix nama file (misal: "avatar", "banner", "forum-thumb")
    imageAlt: string; // Alt text untuk gambar
    disabled?: boolean; // Menonaktifkan semua interaksi jika true
    type: "avatar" | "banner" | "general"; // Tipe uploader untuk styling & ukuran

    // Props opsional untuk dimensi gambar (jika Anda ingin menggunakannya untuk ImageKit.Image)
    width?: number;
    height?: number;
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
    // width,
    // height,
}: ImageUploaderProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // URL preview lokal (blob URL atau URL dari IK)
    const [fileToUpload, setFileToUpload] = useState<File | null>(null); // File yang akan diunggah
    const [isUploading, setIsUploading] = useState(false); // Status upload API
    const [progress, setProgress] = useState(0); // Progress upload

    // Sinkronkan previewUrl dengan currentImageUrl saat komponen dimuat atau currentImageUrl berubah,
    // hanya jika tidak ada file yang sedang di-preview/upload secara lokal.
    useEffect(() => {
        if (!fileToUpload && currentImageUrl !== previewUrl) {
            setPreviewUrl(currentImageUrl || null);
        }
    }, [currentImageUrl, fileToUpload, previewUrl]);

    // Fungsi untuk mendapatkan parameter otentikasi dari API Route
    const authenticator = useCallback(async () => {
        try {
            const response = await fetch("/api/upload-auth"); // Memanggil API auth ImageKit
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

    // Handler saat file dipilih dari input
    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validasi tipe file
            if (!file.type.startsWith("image/")) {
                toast.error("File tidak valid", { description: "Hanya gambar yang diperbolehkan." });
                event.target.value = ''; // Clear the input so same file can be selected again
                return;
            }
            // Validasi ukuran file (maksimal 5MB)
            const MAX_FILE_SIZE_MB = 5;
            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
                toast.error("Ukuran file terlalu besar", { description: `Maksimal ukuran file adalah ${MAX_FILE_SIZE_MB}MB.` });
                event.target.value = ''; // Clear the input so same file can be selected again
                return;
            }

            setFileToUpload(file);
            setPreviewUrl(URL.createObjectURL(file)); // Buat URL lokal untuk preview langsung
            setProgress(0); // Reset progress
        }
    }, []);

    // Memicu klik pada input file tersembunyi
    const handleUploadButtonClick = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    // Handler saat tombol "Simpan" ditekan untuk mengunggah gambar
    const handleSave = useCallback(async () => {
        if (!fileToUpload) return; // Tidak ada file untuk diunggah

        setIsUploading(true);
        try {
            const authParams = await authenticator(); // Dapatkan parameter otentikasi

            // Buat nama file unik dan terstruktur
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            const randomString = Math.random().toString(36).substring(2, 8); // String acak pendek

            // const originalFileNameWithoutExt = fileToUpload.name.split('.').slice(0, -1).join('.');
            const fileExtension = fileToUpload.name.split('.').pop();

            // Format nama file: {prefix}-{userId}-{tahun}{bulan}{hari}-{jam}{menit}{detik}-{random}.{ext}
            const uniqueFileName = `${fileNamePrefix}-${userId}-${year}${month}${day}-${hours}${minutes}${seconds}-${randomString}.${fileExtension}`;


            const uploadResponse = await upload({
                publicKey: authParams.publicKey,
                fileName: uniqueFileName,
                file: fileToUpload,
                folder: folderPath, // Gunakan folderPath prop
                signature: authParams.signature,
                token: authParams.token,
                expire: authParams.expire,
                onProgress: (event) => {
                    setProgress((event.loaded / event.total) * 100);
                },
                useUniqueFileName: false, // Kita buat nama file unik sendiri
                overwriteFile: true, // Timpa jika ada file dengan nama yang sama di folder
            });

            if (uploadResponse.url) {
                await onImageUrlChange(uploadResponse.url); // Kirim URL baru ke parent component

                setFileToUpload(null); // Bersihkan file yang menunggu upload
                // setPreviewUrl(uploadResponse.url); // Preview akan disinkronkan oleh useEffect dari currentImageUrl
                toast.success("Gambar berhasil diunggah dan disimpan!");
            } else {
                throw new Error("URL gambar tidak ditemukan dari respons upload.");
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
                fileInputRef.current.value = ""; // Bersihkan nilai input file
            }
        }
    }, [fileToUpload, authenticator, onImageUrlChange, folderPath, fileNamePrefix, userId]);


    // Handler saat tombol "Batal" ditekan (mengembalikan ke gambar asli)
    const handleCancel = useCallback(() => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl); // Bersihkan URL objek lokal
        }
        setFileToUpload(null);
        setPreviewUrl(currentImageUrl || null); // Kembali ke URL gambar asli
        setProgress(0);
    }, [previewUrl, currentImageUrl]);

    // Handler saat tombol "Hapus" ditekan
    const handleDelete = useCallback(async () => {
        // Panggil callback ke parent dengan null untuk menghapus gambar dari DB
        await onImageUrlChange(null);
        setPreviewUrl(null); // Bersihkan preview lokal
        setFileToUpload(null); // Bersihkan file yang menunggu upload
        setProgress(0);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        toast.success("Gambar berhasil dihapus!");
    }, [onImageUrlChange]);

    // Render komponen gambar berdasarkan tipe (avatar, banner, general)
    const renderImage = () => {
        const srcToDisplay = previewUrl || currentImageUrl || ""; // Fallback placeholder

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
                    {(!srcToDisplay || srcToDisplay === "") && (
                        <span className="text-sm">No Banner Image</span>
                    )}
                </div>
            );
        } else { // general type or others
            return (
                <div
                    className={cn(
                        "relative w-full h-48 bg-muted flex items-center justify-center overflow-hidden rounded-md",
                    )}
                >
                    {srcToDisplay && srcToDisplay !== "" ? (
                        <img src={srcToDisplay} alt={imageAlt} className="object-cover w-full h-full" />
                    ) : (
                        <span className="text-sm text-muted-foreground">No Image</span>
                    )}
                </div>
            );
        }
    };

    // Tentukan apakah tombol Camera, Simpan, dan Batal harus ditampilkan
    const showSaveCancelButtons = fileToUpload !== null;
    const showUploadButton = !showSaveCancelButtons;
    const showDeleteButton = (currentImageUrl || previewUrl) && !isUploading; // Tampilkan tombol hapus jika ada gambar


    return (
        <div className="relative group w-full">
            {/* Input file tersembunyi */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*"
                className="hidden"
                disabled={disabled || isUploading}
            />

            {/* Tampilan gambar (Avatar/Banner/General) */}
            {renderImage()}

            {/* Overlay untuk tombol Simpan/Batal/Hapus */}
            <div className={cn(
                "absolute flex gap-2 z-10 transition-opacity",
                // Posisi default untuk banner dan general
                type === "banner" || type === "general" ? "top-4 right-4 opacity-0 group-hover:opacity-100" : "",
                // Posisi spesifik untuk avatar (bottom-right dari avatar itu sendiri)
                type === "avatar" ? "bottom-0 right-0 top-auto left-auto translate-x-1/4 translate-y-1/4 opacity-0 group-hover:opacity-100" : "",
                { "opacity-100": showSaveCancelButtons } // Selalu tampilkan jika ada file untuk disimpan
            )}>
                {showSaveCancelButtons ? (
                    <>
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={handleSave}
                            disabled={isUploading || disabled}
                            className="flex items-center gap-1"
                        >
                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            {isUploading ? `${Math.round(progress)}%` : "Simpan"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            disabled={isUploading || disabled}
                        >
                            <X className="h-4 w-4" /> Batal
                        </Button>
                    </>
                ) : showDeleteButton && !disabled ? ( // Tampilkan Hapus jika ada gambar & tidak disable & tidak ada fileToUpload
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={disabled}
                        className={cn(
                            "flex items-center gap-1",
                            type === "avatar" ? "rounded-full h-8 w-8 p-0" : "" // Bentuk bulat untuk avatar
                        )}
                    >
                        <Trash2 className={cn("h-4 w-4", type === "avatar" ? "" : "mr-2")} /> {type === "avatar" ? "" : "Hapus"}
                    </Button>
                ) : null}
            </div>

            {/* Tombol Kamera (untuk memicu pemilihan file) - hanya muncul jika tidak ada file yang menunggu disimpan */}
            {showUploadButton && !disabled && (
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleUploadButtonClick}
                    disabled={disabled || isUploading}
                    className={cn(
                        "absolute flex items-center justify-center gap-1 z-10 transition-opacity",
                        type === "banner" || type === "general" ? "top-4 right-4 opacity-0 group-hover:opacity-100" : "", // Posisi default untuk banner dan general
                        type === "avatar" ? "bottom-0 right-0 top-auto left-auto rounded-full h-8 w-8 p-0 opacity-0 group-hover:opacity-100" : "", // Posisi spesifik untuk avatar
                    )}
                >
                    <Camera className={cn("h-4 w-4", type === "avatar" ? "" : "mr-2")} />
                    {type !== "avatar" && "Ubah Gambar"}
                </Button>
            )}
        </div>
    );
}