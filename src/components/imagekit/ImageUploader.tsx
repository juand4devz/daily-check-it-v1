// components/imagekit/image-uploader.tsx
"use client";

import * as React from "react";
import { useRef, useState, useCallback, useEffect } from "react";
import { Camera, Save, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils"; // Import utilitas cn
import {
    ImageKitAbortError,
    ImageKitInvalidRequestError,
    ImageKitServerError,
    ImageKitUploadNetworkError,
    upload, // Import fungsi upload dari ImageKit SDK
} from "@imagekit/next";
import Image from "next/image"; // Import Image dari next/image

// Props untuk komponen ImageUploader
interface ImageUploaderProps {
    userId: string; // ID pengguna yang terkait dengan gambar ini (penting untuk nama file dan otorisasi)
    currentImageUrl: string | null | undefined; // URL gambar saat ini (dari DB). Bisa null, undefined, atau URL ImageKit.
    onImageUrlChange: (newUrl: string | null) => Promise<void>; // Callback saat URL gambar berubah (null untuk hapus)
    folderPath: string; // Path folder di ImageKit (misal: "user-avatars", "user-banners", "forum-thumbnails")
    fileNamePrefix: string; // Prefix nama file (misal: "avatar", "banner", "forum-thumb")
    imageAlt: string; // Alt text untuk gambar (penting untuk aksesibilitas)
    disabled?: boolean; // Boolean: Menonaktifkan semua interaksi jika true
    type: "avatar" | "banner" | "general"; // Tipe uploader untuk styling dan ukuran
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
    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // URL pratinjau lokal (blob URL atau URL dari IK)
    const [fileToUpload, setFileToUpload] = useState<File | null>(null); // File yang akan diunggah
    const [isUploading, setIsUploading] = useState(false); // Status upload API
    const [progress, setProgress] = useState(0); // Progress upload dalam persen

    // Sinkronkan previewUrl dengan currentImageUrl saat komponen dimuat atau currentImageUrl berubah.
    // Ini penting agar pratinjau selalu mencerminkan gambar yang disimpan,
    // kecuali ada file baru yang sedang disiapkan untuk diunggah.
    useEffect(() => {
        if (!fileToUpload && currentImageUrl !== previewUrl) {
            setPreviewUrl(currentImageUrl || null);
        }
    }, [currentImageUrl, fileToUpload, previewUrl]);

    /**
     * Fungsi untuk mendapatkan parameter otentikasi dari API Route (/api/upload-auth).
     * Ini memastikan proses upload ke ImageKit.io aman karena token dihasilkan di sisi server.
     */
    const authenticator = useCallback(async () => {
        try {
            const response = await fetch("/api/upload-auth"); // Memanggil API autentikasi ImageKit
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

    /**
     * Handler saat file dipilih dari input file tersembunyi.
     * Melakukan validasi dasar file dan menyiapkan file untuk diunggah.
     */
    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validasi tipe dan ukuran file
            if (!file.type.startsWith("image/")) {
                toast.error("File tidak valid", { description: "Hanya gambar yang diperbolehkan." });
                event.target.value = ''; // Bersihkan input file
                return;
            }
            if (file.size > 5 * 1024 * 1024) { // Maksimal 5MB
                toast.error("Ukuran file terlalu besar", { description: "Maksimal ukuran file adalah 5MB." });
                event.target.value = ''; // Bersihkan input file
                return;
            }
            setFileToUpload(file); // Simpan file untuk diunggah nanti
            setPreviewUrl(URL.createObjectURL(file)); // Buat URL lokal untuk pratinjau instan
            setProgress(0); // Reset progress upload
        }
    }, []);

    /**
     * Memicu klik pada input file tersembunyi.
     */
    const handleUploadButtonClick = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    /**
     * Handler saat tombol "Simpan" ditekan untuk mengunggah gambar ke ImageKit.io.
     */
    const handleSave = useCallback(async () => {
        if (!fileToUpload) return; // Tidak ada file yang dipilih untuk diunggah

        setIsUploading(true); // Mulai status upload
        try {
            const authParams = await authenticator(); // Dapatkan parameter otentikasi dari server

            // Buat nama file yang unik dan terstruktur
            const now = new Date();
            const year = now.getFullYear();
            const month = (now.getMonth() + 1).toString().padStart(2, '0');
            const day = now.getDate().toString().padStart(2, '0');
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            const seconds = now.getSeconds().toString().padStart(2, '0');
            const randomString = Math.random().toString(36).substring(2, 8); // String acak pendek

            const fileExtension = fileToUpload.name.split('.').pop();
            // Nama file yang dihasilkan: fileNamePrefix-userId-YYYYMMDD-HHMMSS-randomString.ext
            const uniqueFileName = `${fileNamePrefix}${userId}-${year}${month}${day}-${hours}${minutes}${seconds}-${randomString}.${fileExtension}`;

            // Lakukan upload file ke ImageKit.io
            const uploadResponse = await upload({
                publicKey: authParams.publicKey,
                fileName: uniqueFileName,
                file: fileToUpload,
                folder: folderPath, // Gunakan path folder yang ditentukan melalui props
                signature: authParams.signature,
                token: authParams.token,
                expire: authParams.expire,
                onProgress: (event) => {
                    setProgress((event.loaded / event.total) * 100); // Perbarui progress
                },
                useUniqueFileName: false, // Kita membuat nama file unik sendiri
                overwriteFile: true, // Timpa jika ada file dengan nama yang sama di folder
            });

            if (uploadResponse.url) {
                // Panggil callback ke parent dengan URL gambar yang baru diunggah
                await onImageUrlChange(uploadResponse.url);
                setFileToUpload(null); // Bersihkan file yang menunggu upload
                toast.success("Gambar berhasil diunggah dan disimpan!");
            } else {
                throw new Error("URL gambar tidak ditemukan dari respons upload ImageKit.");
            }
        } catch (error) {
            console.error("Upload failed:", error);
            // Memberikan pesan error yang spesifik dari ImageKit SDK
            if (error instanceof ImageKitAbortError) toast.error("Upload dibatalkan.");
            else if (error instanceof ImageKitInvalidRequestError) toast.error(`Permintaan upload tidak valid: ${error.message}`);
            else if (error instanceof ImageKitUploadNetworkError) toast.error(`Kesalahan jaringan saat upload: ${error.message}`);
            else if (error instanceof ImageKitServerError) toast.error(`Kesalahan server ImageKit: ${error.message}`);
            else toast.error(`Gagal mengunggah gambar: ${error instanceof Error ? error.message : String(error)}`);
        } finally {
            setIsUploading(false); // Selesai upload
            setProgress(0); // Reset progress
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Bersihkan nilai input file
            }
        }
    }, [fileToUpload, authenticator, onImageUrlChange, folderPath, fileNamePrefix, userId]);

    /**
     * Handler saat tombol "Batal" ditekan.
     * Mengembalikan pratinjau ke gambar asli (jika ada) dan membatalkan upload yang tertunda.
     */
    const handleCancel = useCallback(() => {
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl); // Bersihkan URL objek lokal
        }
        setFileToUpload(null); // Batalkan file yang akan diupload
        setPreviewUrl(currentImageUrl || null); // Kembali ke URL gambar asli dari props
        setProgress(0); // Reset progress
    }, [previewUrl, currentImageUrl]);

    /**
     * Handler saat tombol "Hapus" ditekan.
     * Memberi tahu parent untuk menghapus URL gambar.
     */
    const handleDelete = useCallback(async () => {
        // Panggil callback ke parent dengan null untuk menghapus gambar dari DB
        await onImageUrlChange(null);
        setPreviewUrl(null); // Bersihkan pratinjau lokal
        setFileToUpload(null); // Bersihkan file yang menunggu upload
        setProgress(0); // Reset progress
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
        toast.success("Gambar berhasil dihapus!");
    }, [onImageUrlChange]);

    /**
     * Merender komponen gambar berdasarkan tipe (avatar, banner, general).
     */
    const renderImage = () => {
        // URL gambar yang akan ditampilkan (prioritas: pratinjau lokal > URL saat ini > placeholder)
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
                    {/* Tampilkan pesan jika tidak ada gambar banner yang valid */}
                    {(!srcToDisplay || srcToDisplay === "/placeholder.svg") && (
                        <span className="text-sm">No Banner Image</span>
                    )}
                </div>
            );
        } else { // Tipe 'general' atau lainnya
            return (
                <div
                    className={cn(
                        "relative w-full h-48 bg-muted flex items-center justify-center overflow-hidden rounded-md",
                    )}
                >
                    {srcToDisplay && srcToDisplay !== "/placeholder.svg" ? (
                        // Menggunakan komponen Image dari next/image untuk gambar yang dihosting ImageKit
                        <Image src={srcToDisplay} alt={imageAlt} fill style={{ objectFit: "cover" }} sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                    ) : (
                        <span className="text-sm text-muted-foreground">No Image</span>
                    )}
                </div>
            );
        }
    };

    // Logika untuk menampilkan/menyembunyikan tombol
    const showSaveCancelButtons = fileToUpload !== null; // Tampilkan jika ada file yang siap diunggah
    const showUploadButton = !showSaveCancelButtons; // Tampilkan tombol upload jika tidak ada file yang tertunda
    const showDeleteButton = (currentImageUrl || previewUrl) && !isUploading; // Tampilkan tombol hapus jika ada gambar dan tidak sedang mengunggah

    return (
        <div className="relative group w-full">
            {/* Input file tersembunyi yang akan dipicu oleh tombol */}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/*" // Hanya menerima file gambar
                className="hidden"
                disabled={disabled || isUploading}
            />

            {/* Area tampilan gambar */}
            {renderImage()}

            {/* Overlay untuk tombol Simpan/Batal/Hapus */}
            <div className={cn(
                // Posisi overlay bervariasi berdasarkan tipe uploader
                type === "avatar" ? "absolute -bottom-7 right-1 translate-y-1/4 -translate-x-1/4" : "absolute top-4 right-4",
                "flex gap-2 z-10 transition-opacity",
                // Tombol-tombol ini biasanya muncul saat hover atau aktif, tapi di sini selalu tampak sebagian
                "opacity-90 group-hover:opacity-100" // Opasitas penuh saat hover
            )}>
                {showSaveCancelButtons ? (
                    // Tombol Simpan dan Batal saat ada file yang dipilih untuk diunggah
                    <>
                        <Button
                            type="button"
                            variant="default"
                            size="sm"
                            onClick={handleSave}
                            disabled={isUploading || disabled}
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
                            disabled={isUploading || disabled}
                        >
                            <X className="h-4 w-4" /> Batal
                        </Button>
                    </>
                ) : showDeleteButton && !disabled ? (
                    // Tombol Hapus (jika ada gambar dan tidak sedang upload)
                    <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        disabled={disabled}
                        className={cn(
                            "flex items-center gap-1",
                            type === "avatar" ? "rounded-full h-8 w-8 p-0" : "rounded-md" // Styling khusus untuk avatar
                        )}
                    // Jika tipe avatar, hapus tulisan "Hapus", hanya tampilkan ikon
                    >
                        <Trash2 className={cn("h-4 w-4", type === "avatar" ? "" : "mr-1")} /> {type === "avatar" ? "" : "Hapus"}
                    </Button>
                ) : null}
            </div>

            {/* Tombol Kamera/Upload Gambar (hanya muncul jika tidak ada file yang menunggu disimpan) */}
            {showUploadButton && !disabled && (
                <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={handleUploadButtonClick}
                    disabled={disabled || isUploading}
                    className={cn(
                        "z-10 cursor-pointer",
                        type === "avatar" ? "absolute bottom-2 right-1 top-auto rounded-full h-8 w-8 p-0" : "absolute top-4 right-4",
                        "opacity-90 group-hover:opacity-100 transition-opacity"
                    )}
                >
                    <Camera className={cn("h-4 w-4", type === "avatar" ? "" : "mr-2")} />
                    {type !== "avatar" && "Ubah Gambar"}
                </Button>
            )}
        </div>
    );
}