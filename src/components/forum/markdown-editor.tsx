// /components/forum/markdown-editor.tsx
"use client";

import type React from "react";
import { useState, useCallback, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { X, Loader2, Link as LinkIcon, Upload, Image as ImageIcon, Video, Copy } from "lucide-react"; // Import Video icon
import { toast } from "sonner";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

// Mendefinisikan ulang MediaPreviewProps untuk mencerminkan data dari InlineMediaFile
interface MediaPreviewProps {
    id: string; // ID diperlukan
    url: string; // Bisa blob URL (preview) atau URL ImageKit (uploaded)
    filename: string;
    uploading?: boolean;
    progress?: number;
    uploadedUrl?: string; // URL ImageKit final
    type?: "image" | "video"; // Tambahkan tipe untuk icon
}

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    onMediaFilesChange?: (files: File[]) => void; // Menerima File[] mentah
    onRemoveMedia?: (id: string) => void; // Menerima ID untuk dihapus
    placeholder?: string;
    rows?: number;
    disabled?: boolean;
    isUploadingMedia?: boolean; // Indikator jika ada upload yang sedang berlangsung (dari parent)
    mediaPreviews?: MediaPreviewProps[]; // Menggunakan interface yang diperbarui
    className?: string;
    textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
    onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
    onDrop?: (e: React.DragEvent<HTMLTextAreaElement>) => void;
    onDragOver?: (e: React.DragEvent<HTMLTextAreaElement>) => void;
    onDragLeave?: (e: React.DragEvent<HTMLTextAreaElement>) => void;
    isDragOver?: boolean;
    showMediaInput?: boolean;
    allAvailableMentions?: { id: string; username: string }[]; // Tambahkan prop ini
}

export function MarkdownEditor({
    value,
    onChange,
    onMediaFilesChange,
    onRemoveMedia,
    placeholder = "Tulis di sini...",
    rows = 4,
    disabled = false,
    isUploadingMedia = false,
    mediaPreviews = [],
    className,
    textareaRef,
    onPaste,
    onDrop,
    onDragOver,
    onDragLeave,
    isDragOver = false,
    showMediaInput = true,
    // allAvailableMentions, // Destructure prop
}: MarkdownEditorProps) {
    const [activeTab, setActiveTab] = useState("write");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleInternalPaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (onPaste) onPaste(event);
    }, [onPaste]);

    const handleInternalDrop = useCallback((event: React.DragEvent<HTMLTextAreaElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (onDrop) onDrop(event);
    }, [onDrop]);

    const handleInternalDragOver = useCallback((event: React.DragEvent<HTMLTextAreaElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (onDragOver) onDragOver(event);
    }, [onDragOver]);

    const handleInternalDragLeave = useCallback((event: React.DragEvent<HTMLTextAreaElement>) => {
        event.preventDefault();
        event.stopPropagation();
        if (onDragLeave) onDragLeave(event);
    }, [onDragLeave]);

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;
        if (files && files.length > 0 && onMediaFilesChange) {
            onMediaFilesChange(Array.from(files));
        }
        event.target.value = '';
    }, [onMediaFilesChange]);


    const handleInternalRemoveMedia = useCallback(
        (mediaId: string) => {
            if (onRemoveMedia) {
                onRemoveMedia(mediaId);
            }
        },
        [onRemoveMedia],
    );

    const handleInsertImageLink = useCallback(() => {
        const markdownLink = `![Deskripsi Gambar](URL_Gambar_Anda_Di_Sini)\n`;
        const currentCursorPosition = textareaRef?.current?.selectionStart || value.length;
        const newValue = value.substring(0, currentCursorPosition) + markdownLink + value.substring(currentCursorPosition);
        onChange(newValue);

        setTimeout(() => {
            if (textareaRef?.current) {
                const newCaretPosition = currentCursorPosition + markdownLink.length - 1;
                textareaRef.current.focus();
                textareaRef.current.setSelectionRange(newCaretPosition - 20, newCaretPosition);
            }
        }, 0);

        toast.info("Markdown link gambar ditambahkan.");
    }, [value, onChange, textareaRef]);

    return (
        <div
            className={cn(
                "relative border rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-900 flex flex-col",
                className,
                {
                    'cursor-wait': isUploadingMedia
                }
            )}
        >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">
                <div className="flex items-center justify-between border-b p-2 flex-shrink-0">
                    <TabsList className="grid w-fit grid-cols-2 h-8">
                        <TabsTrigger value="write" className="h-6 text-xs">
                            Tulis
                        </TabsTrigger>
                        <TabsTrigger value="preview" className="h-6 text-xs">
                            Review
                        </TabsTrigger>
                    </TabsList>
                    <div className="flex items-center gap-2">
                        {showMediaInput && (
                            <>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={handleInsertImageLink}
                                    disabled={disabled || isUploadingMedia}
                                    className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                    title="Masukkan link gambar Markdown"
                                >
                                    <LinkIcon className="h-4 w-4" />
                                    <span className="sr-only">Masukkan link gambar Markdown</span>
                                </Button>
                                {/* Tombol untuk memicu input file tersembunyi */}
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={disabled || isUploadingMedia || mediaPreviews.length >= 1}
                                    className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                    title="Upload Gambar/Video" // Perbarui tooltip
                                >
                                    {isUploadingMedia ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                    <span className="sr-only">Upload Gambar/Video</span>
                                </Button>
                                {/* Input file tersembunyi */}
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                    accept="image/*,video/*" // Izinkan gambar dan video
                                    multiple={false}
                                    className="hidden"
                                    disabled={disabled || isUploadingMedia || mediaPreviews.length >= 1}
                                />
                            </>
                        )}
                    </div>
                </div>

                <TabsContent value="write" className="p-4 mt-0 border-none flex-grow">
                    <Textarea
                        ref={textareaRef}
                        placeholder={placeholder}
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        rows={rows}
                        className={cn(
                            "resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm h-full min-h-[100px]",
                            isDragOver ? 'border-2 border-blue-500 bg-blue-50' : '',
                            {
                                'cursor-wait': isUploadingMedia
                            }
                        )}
                        disabled={disabled || isUploadingMedia}
                        onPaste={handleInternalPaste}
                        onDrop={handleInternalDrop}
                        onDragOver={handleInternalDragOver}
                        onDragLeave={handleInternalDragLeave}
                    />
                </TabsContent>

                <TabsContent value="preview" className="p-4 mt-0 border-none flex-grow">
                    <div className="prose prose-sm max-w-none dark:prose-invert overflow-y-auto max-h-[400px]">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{value || "_Tidak ada konten untuk direview_"}</ReactMarkdown>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Media previews section disesuaikan untuk key dan progress bar */}
            {mediaPreviews && mediaPreviews.length > 0 && (
                <div className="border-t p-4 flex-shrink-0">
                    <p className="text-sm font-medium mb-2">Media Terlampir:</p>
                    <div className="grid grid-cols-1 gap-4"> {/* Mengubah layout menjadi 1 kolom dengan gap lebih besar */}
                        {mediaPreviews.map((media) => (
                            <div key={media.id} className="relative group w-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm bg-gray-50 dark:bg-zinc-800">
                                {/* Visual Preview */}
                                <div className="relative w-full h-[180px] bg-gray-200 dark:bg-zinc-700 flex items-center justify-center">
                                    {media.type === "image" ? (
                                        <Image
                                            src={media.url || "/placeholder.svg"}
                                            alt={`Pratinjau ${media.filename}`}
                                            layout="fill"
                                            objectFit="contain" // Menggunakan contain agar gambar tidak terpotong
                                            className="transition-all duration-300 group-hover:scale-105"
                                        />
                                    ) : media.type === "video" ? (
                                        <video
                                            src={media.url}
                                            controls={false} // Tidak menampilkan kontrol di preview
                                            muted
                                            loop
                                            className="w-full h-full object-contain"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                                            <Upload className="h-12 w-12" />
                                            <span className="text-sm">Tipe media tidak dikenal</span>
                                        </div>
                                    )}
                                </div>

                                {/* Status Overlay (Uploading/Failed) */}
                                {media.uploading && (
                                    <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-white p-4">
                                        <Loader2 className="h-10 w-10 animate-spin mb-3 text-blue-400" />
                                        <p className="text-lg font-semibold mb-2">Mengunggah...</p>
                                        <span className="text-sm">{Math.round(media.progress || 0)}%</span>
                                        <Progress value={media.progress} className="w-4/5 mt-3 h-2 bg-blue-300" />
                                        <p className="text-xs text-gray-300 mt-2 truncate max-w-full">{media.filename}</p>
                                    </div>
                                )}
                                {!media.uploading && media.uploadedUrl === undefined && media.progress !== 100 && ( // Jika upload gagal
                                    <div className="absolute inset-0 bg-red-600/80 flex flex-col items-center justify-center text-white p-4">
                                        <X className="h-10 w-10 mb-3" />
                                        <p className="text-lg font-semibold mb-2">Unggah Gagal</p>
                                        <p className="text-sm text-center">Silakan coba lagi atau hapus.</p>
                                        <p className="text-xs text-gray-200 mt-2 truncate max-w-full">{media.filename}</p>
                                    </div>
                                )}

                                {/* Aksi Setelah Unggah (Overlay) */}
                                {!media.uploading && media.uploadedUrl && (
                                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                                        <h3 className="text-white text-md font-semibold mb-3 text-center truncate w-full">{media.filename}</h3>
                                        <div className="flex flex-col gap-2 w-full max-w-[200px]">
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="w-full h-9 px-3 text-sm bg-white/80 text-gray-900 hover:bg-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Logika untuk menyisipkan URL ke editor (opsional, tergantung implementasi parent)
                                                    // Misalnya: onChange(value + `\n![${media.filename}](${media.uploadedUrl})`);
                                                    toast.info("Fitur 'Sisipkan URL' dapat diimplementasikan di parent.");
                                                }}
                                            >
                                                <LinkIcon className="h-4 w-4 mr-2" /> Sisipkan URL
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="sm"
                                                className="w-full h-9 px-3 text-sm bg-white/80 text-gray-900 hover:bg-white"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigator.clipboard.writeText(media.uploadedUrl!);
                                                    toast.success("URL media disalin ke clipboard!");
                                                }}
                                            >
                                                <Copy className="h-4 w-4 mr-2" /> Salin URL
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Tombol Hapus (selalu terlihat jika tidak disabled) */}
                                {!disabled && (
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-7 w-7 rounded-full opacity-80 hover:opacity-100 z-20 flex items-center justify-center"
                                        onClick={(e) => {
                                            e.stopPropagation(); // Mencegah event bubbling ke elemen lain
                                            handleInternalRemoveMedia(media.id);
                                        }}
                                        disabled={disabled}
                                    >
                                        <X className="h-4 w-4" />
                                        <span className="sr-only">Hapus media</span>
                                    </Button>
                                )}
                                {/* Label nama file di bawah preview */}
                                <div className="p-2 text-sm text-center text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1">
                                    {media.type === "image" ? <ImageIcon className="h-4 w-4 text-primary" /> : <Video className="h-4 w-4 text-primary" />}
                                    <span className="truncate">{media.filename}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}