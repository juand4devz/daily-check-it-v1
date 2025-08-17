// components/forum/ForumPostForm.tsx
"use client";

import type React from "react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Plus, Eye, Send, Loader2, AlertCircle, PencilRuler, X, Edit, Link, Copy, Upload, Image as ImageIcon, Video } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import { ThumbnailUpload } from "@/components/forum/thumbnail-upload";
import { MediaViewer } from "@/components/forum/media-viewer";

import {
    FORUM_TYPES,
    FORUM_CATEGORIES,
    typeIconsMap,
    categoryIconsMap,
    ForumType,
    ForumCategory,
    ForumPost,
    ForumMedia,
    MAX_IMAGE_SIZE,
    getTypeIcon,
    getRandomGradient,
} from "@/lib/utils/forum-utils";
import { cn } from "@/lib/utils";

interface MediaFileTemp {
    id: string;
    file?: File; // Original file object (only for new uploads)
    preview: string; // Blob URL for client-side preview OR existing URL for uploaded files
    type: "image" | "video";
    markdownPlaceholder: string; // Markdown placeholder for new uploads in content (e.g. `![temp](uploading:id)`)
    uploading: boolean; // Indicates if this specific file is uploading
    progress: number; // Upload progress for this file
    uploadedUrl: string | undefined; // Final ImageKit URL after upload, or undefined if not uploaded/failed
    isNew: boolean; // Flag to indicate if this is a newly added file vs. existing
    filename?: string; // Add this for consistency in previews
}

interface DiagnosisData {
    symptoms: string;
    diagnosis: string;
    timestamp: string;
}

const formSchema = z.object({
    title: z.string().min(10, "Judul minimal 10 karakter").max(200, "Judul maksimal 200 karakter"),
    description: z.string().min(10, "Deskripsi minimal 10 karakter").max(300, "Deskripsi maksimal 300 karakter"),
    content: z.string().min(20, "Konten minimal 20 karakter").max(5000, "Konten maksimal 5000 karakter"),
    type: z.string().min(1, "Tipe diskusi harus dipilih"),
    category: z.string().min(1, "Kategori harus dipilih"),
    tags: z.array(z.string().max(50, "Setiap tag maksimal 50 karakter")).max(5, "Maksimal 5 tag dapat ditambahkan").optional(), // Updated max tag length
    thumbnail: z.string().nullable().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface ForumPostFormProps {
    initialData?: ForumPost | null;
    diagnosisData?: DiagnosisData | null;
    onSubmit: (data: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'replies' | 'views' | 'isResolved' | 'isPinned' | 'isArchived'>, postId?: string) => Promise<void>;
    isLoadingInitialData: boolean;
    isSubmitting: boolean;
    pageTitle: string;
    pageDescription: string;
    backUrl?: string; // Made optional for modal usage
    isModal?: boolean; // NEW PROP: true if used inside a modal (affects UI like sidebar, back button)
    onClose?: () => void; // NEW PROP: Callback to close modal when used in modal context
    showRightSidebar?: boolean; // <--- PASTIKAN PROP INI ADA
}

const MAX_MEDIA_FILES = 5;

export function ForumPostForm({
    initialData,
    diagnosisData,
    onSubmit: parentOnSubmit,
    isLoadingInitialData,
    isSubmitting,
    pageTitle,
    pageDescription,
    isModal = false,
    onClose,
    showRightSidebar = true,
}: ForumPostFormProps) {
    const { data: session, status } = useSession();
    const userId = session?.user?.id;
    const username = session?.user?.username;
    const avatar = session?.user?.avatar;

    const [mediaFiles, setMediaFiles] = useState<MediaFileTemp[]>([]);
    const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true);
    const [newTagInput, setNewTagInput] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("write");
    const [isDragOver, setIsDragOver] = useState(false);
    const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            description: "",
            content: "",
            type: "",
            category: "",
            tags: [],
            thumbnail: null,
        },
    });

    const router = useRouter();

    const watchType = form.watch("type");
    const selectedType = FORUM_TYPES.find((t) => t.id === watchType);
    const selectedCategory = FORUM_CATEGORIES.find((c) => c.id === form.watch("category"));

    const ThumbnailPlaceholderIcon = useMemo(() => {
        return getTypeIcon(watchType || "lainnya");
    }, [watchType]);

    const thumbnailPlaceholderGradient = useMemo(() => {
        return getRandomGradient("new-post-thumbnail-placeholder");
    }, []);

    useEffect(() => {
        if (isLoadingInitialData || status === "loading") return;

        if (initialData) {
            form.reset({
                title: initialData.title,
                description: initialData.description,
                content: initialData.content,
                type: initialData.type,
                category: initialData.category,
                tags: initialData.tags,
                thumbnail: initialData.thumbnail || null,
            });
            const existingMedia: MediaFileTemp[] = (initialData.media || []).map(m => ({
                id: m.id,
                preview: m.url,
                type: m.type,
                markdownPlaceholder: `![${m.filename || 'media'}](${m.url})`,
                uploading: false,
                progress: 100,
                uploadedUrl: m.url,
                isNew: false,
                filename: m.filename
            }));
            setMediaFiles(existingMedia);
            setIsLoadingPage(false);
            return;
        }

        if (diagnosisData) {
            try {
                form.setValue("title", `Bantuan Diagnosa: ${diagnosisData.diagnosis.split(",")[0].split("(")[0].trim()}`);
                form.setValue(
                    "description",
                    `Meminta bantuan terkait diagnosa sistem: ${diagnosisData.diagnosis.split(",")[0].split("(")[0].trim()}`,
                );
                form.setValue(
                    "content",
                    `Halo semuanya! 👋 \nSaya baru saja melakukan diagnosa sistem dan mendapatkan hasil berikut: \n\n**Gejala yang Dialami:** \n${diagnosisData.symptoms} \n\n**Hasil Diagnosa:** \n${diagnosisData.diagnosis} \n\n**Waktu Diagnosa:** ${new Date(diagnosisData.timestamp).toLocaleString("id-ID")} \n\nApakah ada yang pernah mengalami masalah serupa? Saya ingin meminta saran dan pengalaman dari teman-teman di sini. \nTerima kasih! 🙏`,
                );
                form.setValue("type", "pertanyaan");
                form.setValue("category", "diagnosa");
                form.setValue("tags", ["diagnosa", "bantuan", "troubleshooting"]);
                sessionStorage.removeItem("forumPostData");
            } catch (error) {
                console.error("Error parsing diagnosis data:", error);
                toast.error("Error", { description: "Gagal memuat data diagnosa otomatis." });
            }
        }
        setIsLoadingPage(false);
    }, [initialData, diagnosisData, isLoadingInitialData, form, status]);

    useEffect(() => {
        if (status === "loading") return;
        if (!userId) {
            toast.error("Anda harus login untuk mengakses halaman ini.", { duration: 3000 });
            router.push("/login");
            return;
        }
        if (!isLoadingInitialData) {
            setIsLoadingPage(false);
        }
    }, [userId, status, router, isLoadingInitialData]);

    const handleAddTag = useCallback(() => {
        const currentTags = form.getValues("tags") || [];
        if (newTagInput.trim() && !currentTags.includes(newTagInput.trim().toLowerCase()) && currentTags.length < 5) {
            form.setValue("tags", [...currentTags, newTagInput.trim().toLowerCase()], { shouldValidate: true });
            setNewTagInput("");
        } else if (currentTags.length >= 5) {
            toast.error("Batas tag tercapai", {
                description: "Maksimal 5 tag dapat ditambahkan.",
            });
        }
    }, [newTagInput, form]);

    const handleRemoveTag = useCallback(
        (tagToRemove: string) => {
            const currentTags = form.getValues("tags") || [];
            form.setValue(
                "tags",
                currentTags.filter((tag) => tag !== tagToRemove),
                { shouldValidate: true },
            );
        },
        [form],
    );

    const handleKeyPress = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
            }
        },
        [handleAddTag],
    );

    const createPreview = (file: File): Promise<string> => {
        return new Promise((resolve) => {
            if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            } else {
                resolve(""); // Fallback for unsupported types
            }
        });
    };

    const uploadFileToImageKit = useCallback(async (
        file: File,
        folder: string,
        filenamePrefix: string,
        onProgress: (progress: number) => void // Callback progress
    ): Promise<{ url: string, id: string, type: "image" | "video", filename: string, size: number } | null> => {
        if (!userId) {
            toast.error("Anda harus login untuk mengunggah media.");
            return null;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', `${filenamePrefix}-${userId}-${Date.now()}-${file.name}`);
        formData.append('folder', folder);

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
                        resolve({
                            url: result.url,
                            id: result.fileId,
                            type: file.type.startsWith('image/') ? 'image' : 'video',
                            filename: result.name,
                            size: result.size,
                        });
                    } else {
                        reject(new Error(`ImageKit upload failed: ${xhr.status} ${xhr.statusText} - ${xhr.responseText}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Network error during ImageKit upload.'));
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = (event.loaded / event.total) * 100;
                        onProgress(percent); // Panggil callback progress
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

    // Callback khusus untuk ThumbnailUpload
    const handleThumbnailUpload = useCallback(async (file: File, onProgressCallback: (p: number) => void): Promise<string | null> => {
        setIsThumbnailUploading(true);
        try {
            const uploadedResult = await uploadFileToImageKit(file, "forum-thumbnails", "thumbnail", onProgressCallback); // Teruskan onProgressCallback
            if (uploadedResult) {
                form.setValue("thumbnail", uploadedResult.url, { shouldValidate: true });
                return uploadedResult.url;
            } else {
                form.setValue("thumbnail", null, { shouldValidate: true });
            }
            return uploadedResult?.url || null;
        } finally {
            setIsThumbnailUploading(false);
        }
    }, [uploadFileToImageKit, form]);

    const processAndAddFiles = useCallback(async (files: FileList | File[]) => {
        if (!files || files.length === 0) return;

        const filesArray = Array.from(files);
        const filesToProcess: File[] = [];

        for (const file of filesArray) {
            if (mediaFiles.filter(mf => mf.uploadedUrl || mf.uploading).length + filesToProcess.length >= MAX_MEDIA_FILES) {
                toast.error(`Maksimal ${MAX_MEDIA_FILES} media dapat diunggah.`);
                break;
            }
            if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
                toast.error(`File "${file.name}" bukan format gambar/video yang didukung.`);
                continue;
            }
            if (file.size > MAX_IMAGE_SIZE) {
                toast.error(`Ukuran file "${file.name}" terlalu besar. Maksimal ${MAX_IMAGE_SIZE / 1024 / 1024}MB.`);
                continue;
            }
            filesToProcess.push(file);
        }

        if (filesToProcess.length === 0) return;

        const newMediaFilesTemp: MediaFileTemp[] = await Promise.all(
            filesToProcess.map(async (file) => {
                const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
                const preview = await createPreview(file);
                return {
                    id,
                    file,
                    preview,
                    type: file.type.startsWith('image/') ? 'image' : 'video',
                    markdownPlaceholder: `![${file.name}](uploading:${id})`,
                    uploading: true,
                    progress: 0,
                    isNew: true,
                    filename: file.name,
                };
            })
        );

        setMediaFiles((prev) => [...prev, ...newMediaFilesTemp]);
        toast.info(`${newMediaFilesTemp.length} media mulai diunggah.`);

        newMediaFilesTemp.forEach(async (tempFile) => {
            const uploadedResult = await uploadFileToImageKit(tempFile.file!, "forum-media", "post-media", (p) => {
                setMediaFiles(prev => prev.map(mf => mf.id === tempFile.id ? { ...mf, progress: p } : mf));
            });

            setMediaFiles(prev => prev.map(mf => {
                if (mf.id === tempFile.id) {
                    if (uploadedResult) {
                        toast.success(`Media "${tempFile.filename}" berhasil diunggah.`);
                        return { ...mf, uploading: false, progress: 100, uploadedUrl: uploadedResult.url, id: uploadedResult.id, type: uploadedResult.type };
                    } else {
                        toast.error(`Media "${tempFile.filename}" gagal diunggah.`);
                        return { ...mf, uploading: false, progress: 0, uploadedUrl: undefined };
                    }
                }
                return mf;
            }));
        });

    }, [mediaFiles, uploadFileToImageKit]);


    const handleRemoveMedia = useCallback((idToRemove: string) => {
        setMediaFiles((prev) => {
            const fileToRemove = prev.find(mf => mf.id === idToRemove);
            if (!fileToRemove) return prev;

            const updatedFiles = prev.filter(mf => mf.id !== idToRemove);
            const currentContent = form.getValues("content") || "";
            let newContent = currentContent;

            if (fileToRemove.markdownPlaceholder && newContent.includes(fileToRemove.markdownPlaceholder)) {
                newContent = newContent.replace(fileToRemove.markdownPlaceholder, '').trim();
            }
            if (fileToRemove.uploadedUrl) {
                const markdownUrl = `![${fileToRemove.filename || fileToRemove.file?.name || 'media'}](${fileToRemove.uploadedUrl})`;
                newContent = newContent.replace(markdownUrl, '').trim();
            }

            form.setValue("content", newContent, { shouldValidate: true });
            toast.info(`Media "${fileToRemove.filename || fileToRemove.file?.name || 'media'}" dihapus.`);
            return updatedFiles;
        });
    }, [form]);

    const handleInsertMediaToContent = useCallback((mediaId: string, event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const media = mediaFiles.find(mf => mf.id === mediaId);
        if (media && media.uploadedUrl) {
            const filename = media.filename || media.file?.name || 'image';
            const markdown = `![${filename}](${media.uploadedUrl})\n`;
            const currentContent = form.getValues("content") || "";
            const cursorPosition = textareaRef.current?.selectionStart || currentContent.length;

            const newContent =
                currentContent.substring(0, cursorPosition) +
                markdown +
                currentContent.substring(cursorPosition);

            form.setValue("content", newContent, { shouldValidate: true });

            if (media.isNew && media.markdownPlaceholder && (form.getValues("content") || '').includes(media.markdownPlaceholder)) {
                const updatedContentWithoutPlaceholder = (form.getValues("content") || '').replace(media.markdownPlaceholder, '').trim();
                form.setValue("content", updatedContentWithoutPlaceholder, { shouldValidate: true });
            }

            toast.success("Media berhasil disisipkan ke konten!");
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(cursorPosition + markdown.length, cursorPosition + markdown.length);
                }
            }, 0);
        } else {
            toast.error("Media belum selesai diunggah atau tidak ada URL.");
        }
    }, [mediaFiles, form]);

    const handleCopyMediaUrl = useCallback((mediaUrl: string, event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        navigator.clipboard.writeText(mediaUrl);
        toast.success("URL media disalin ke clipboard!");
    }, []);


    const handleDropOnTextarea = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (isSubmitting || mediaFiles.filter(mf => mf.uploadedUrl || mf.uploading).length >= MAX_MEDIA_FILES) return;
        processAndAddFiles(e.dataTransfer.files);
    }, [isSubmitting, mediaFiles, processAndAddFiles]);

    const handleDragOverOnTextarea = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (isSubmitting || mediaFiles.filter(mf => mf.uploadedUrl || mf.uploading).length >= MAX_MEDIA_FILES) {
            e.dataTransfer.dropEffect = "none";
        } else {
            e.dataTransfer.dropEffect = "copy";
            setIsDragOver(true);
        }
    }, [isSubmitting, mediaFiles]);

    const handleDragLeaveOnTextarea = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handlePasteOnTextarea = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (isSubmitting || mediaFiles.filter(mf => mf.uploadedUrl || mf.uploading).length >= MAX_MEDIA_FILES) return;

        const items = e.clipboardData?.items;
        if (items) {
            const mediaClipboardFiles: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.startsWith('image/') || items[i].type.startsWith('video/')) {
                    const file = items[i].getAsFile();
                    if (file) {
                        mediaClipboardFiles.push(file);
                    }
                }
            }
            if (mediaClipboardFiles.length > 0) {
                e.preventDefault();
                processAndAddFiles(mediaClipboardFiles);
            }
        }
    }, [isSubmitting, mediaFiles, processAndAddFiles]);


    const finalMediaPreviewsForTab = useMemo(() => {
        return mediaFiles.map(mf => ({
            id: mf.id,
            url: mf.preview,
            filename: mf.file?.name || mf.filename || 'media',
            uploading: mf.uploading,
            progress: mf.progress,
            uploadedUrl: mf.uploadedUrl,
            type: mf.type
        }));
    }, [mediaFiles]);


    const mediaForMediaViewer = useMemo(() => {
        return mediaFiles.filter(mf => mf.uploadedUrl).map(mf => ({
            id: mf.id,
            url: mf.uploadedUrl!,
            type: mf.type,
            filename: mf.filename!,
            thumbnailUrl: mf.type === 'video' ? `${mf.uploadedUrl!}?tr=f-jpg` : undefined
        }));
    }, [mediaFiles]);


    const handleSubmit = async (values: FormSchema) => {
        if (!userId || !username) {
            toast.error("Data pengguna tidak lengkap. Harap refresh atau login ulang.");
            if (isModal && onClose) {
                onClose();
            } else if (!isModal) {
                router.push("/login");
            }
            return;
        }

        if (mediaFiles.some(mf => mf.uploading)) {
            toast.error("Tunggu! Ada media yang masih diunggah. Harap tunggu hingga semua upload selesai.");
            return;
        }
        if (mediaFiles.some(mf => mf.uploadedUrl === undefined)) {
            toast.error("Ada media yang gagal diunggah. Harap hapus atau coba unggah ulang sebelum mengirim.");
            return;
        }

        const finalMediaForSubmission: ForumMedia[] = mediaFiles
            .filter(mf => mf.uploadedUrl)
            .map(mf => ({
                id: mf.id,
                type: mf.type,
                filename: mf.filename || mf.file?.name || 'unknown',
                size: mf.file?.size || 0,
                url: mf.uploadedUrl!,
                thumbnailUrl: mf.type === "video" ? `${mf.uploadedUrl!}?tr=f-jpg` : undefined,
            }));

        let finalContent = values.content;
        finalMediaForSubmission.forEach(mediaItem => {
            const tempMedia = mediaFiles.find(mft => mft.id === mediaItem.id);
            if (tempMedia && tempMedia.markdownPlaceholder && finalContent.includes(tempMedia.markdownPlaceholder)) {
                finalContent = finalContent.replace(tempMedia.markdownPlaceholder, `![${mediaItem.filename}](${mediaItem.url})`);
            }
        });
        finalContent = finalContent.replace(/!\[.*?\]\(uploading:.*?\)/g, '').trim();

        const postData: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'replies' | 'views' | 'isResolved' | 'isPinned' | 'isArchived'> = {
            title: values.title,
            description: values.description,
            content: finalContent,
            type: values.type,
            category: values.category,
            tags: values.tags || [],
            thumbnail: values.thumbnail || null,
            media: finalMediaForSubmission,
            authorId: userId!,
            authorUsername: username!,
            authorAvatar: avatar || "",
        };

        await parentOnSubmit(postData, initialData?.id);

        if (isModal && onClose) {
            onClose();
        }
    };

    const isAnyMediaUploading = mediaFiles.some(mf => mf.uploading);
    // const isUploadDisabled = isSubmitting || isThumbnailUploading || isAnyMediaUploading || mediaFiles.filter(mf => mf.uploadedUrl).length >= MAX_MEDIA_FILES;

    if (isLoadingPage || isLoadingInitialData) {
        return (
            <div className={cn("px-4 py-8", isModal ? "max-w-full" : "w-full")}>
                <div className="space-y-6">
                    <Skeleton className="h-8 w-64" />
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-6 w-48" />
                            <Skeleton className="h-4 w-96" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-10 w-full" />
                            <Skeleton className="h-32 w-full" />
                            <Skeleton className="h-10 w-48" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("px-4 py-8", isModal ? "px-0" : "")}>
            {!isModal && (
                <div className="flex-col items-center gap-4 mb-8">
                    <Button type="button" variant="ghost" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                    <div className="mt-4 flex items-center">
                        <PencilRuler className="h-14 w-14 mr-4" />
                        <div>
                            <h1 className="text-3xl font-bold">{pageTitle}</h1>
                            <p className="text-gray-600">{pageDescription}</p>
                        </div>
                    </div>
                </div>
            )}

            {diagnosisData && (
                <Alert variant="default" className={cn("mt-5 mb-8", isModal && "mx-4")}>
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Data Diagnosa Terdeteksi</AlertTitle>
                    <AlertDescription>
                        Form telah diisi otomatis berdasarkan hasil diagnosa Anda. Silakan edit sesuai kebutuhan.
                    </AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className={cn("space-y-6", isModal && "px-4")}>
                    <div className={cn("grid grid-cols-1 gap-6", showRightSidebar ? "md:grid-cols-4" : "md:grid-cols-1")}>
                        <div className={cn("space-y-6", showRightSidebar ? "md:col-span-3" : "md:col-span-1")}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informasi Dasar</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel htmlFor="title">Judul Diskusi *</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        id="title"
                                                        placeholder="Tulis judul yang jelas dan deskriptif..."
                                                        maxLength={200}
                                                        disabled={isSubmitting}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <div className="text-xs text-gray-500 mt-1">{field.value?.length || 0}/200 karakter</div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel htmlFor="description">Deskripsi Singkat *</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        id="description"
                                                        placeholder="Berikan deskripsi singkat tentang diskusi Anda (maks 300 karakter)..."
                                                        maxLength={300}
                                                        rows={3}
                                                        disabled={isSubmitting}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <div className="text-xs text-gray-500 mt-0">{field.value?.length || 0}/300 karakter</div>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <FormField
                                            control={form.control}
                                            name="type"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3 col-span-1">
                                                    <FormLabel htmlFor="type">Tipe Diskusi *</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting} className="truncate">
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Pilih tipe diskusi" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {FORUM_TYPES.map((forumType: ForumType) => {
                                                                const TypeIcon = typeIconsMap[forumType.icon] || Plus;
                                                                return (
                                                                    <SelectItem key={forumType.id} value={forumType.id}>
                                                                        <div className="flex items-center gap-2">
                                                                            <TypeIcon className="h-4 w-4" />
                                                                            <div className="text-left">
                                                                                <div className="font-medium">{forumType.name}</div>
                                                                                <div className="text-[8px] lg:text-xs text-gray-500">{forumType.description}</div>
                                                                            </div>
                                                                        </div>
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3 col-span-1">
                                                    <FormLabel htmlFor="category">Kategori *</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                                        <FormControl>
                                                            <SelectTrigger className="w-full">
                                                                <SelectValue placeholder="Pilih kategori" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {FORUM_CATEGORIES.map((cat: ForumCategory) => {
                                                                const CategoryIcon = categoryIconsMap[cat.icon] || Plus;
                                                                return (
                                                                    <SelectItem key={cat.id} value={cat.id}>
                                                                        <div className="flex items-center gap-2">
                                                                            <CategoryIcon className="h-4 w-4" />
                                                                            <span>{cat.name}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                );
                                                            })}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                    {selectedType?.allowTags && (
                                        <FormField
                                            control={form.control}
                                            name="tags"
                                            render={({ field }) => (
                                                <FormItem className="space-y-3">
                                                    <FormLabel>Tag (Opsional)</FormLabel>
                                                    <div className="space-y-2">
                                                        <div className="flex gap-2">
                                                            <Input
                                                                value={newTagInput}
                                                                onChange={(e) => setNewTagInput(e.target.value)}
                                                                onKeyPress={handleKeyPress}
                                                                placeholder="Tekan Enter untuk menambah tag..."
                                                                maxLength={20}
                                                                disabled={isSubmitting}
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={handleAddTag}
                                                                disabled={!newTagInput.trim() || (field.value?.length || 0) >= 5 || isSubmitting}
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        {field.value && field.value.length > 0 && (
                                                            <div className="flex flex-wrap gap-2">
                                                                {field.value.map((tag) => (
                                                                    <Badge key={tag} variant="secondary" className="gap-1">
                                                                        #{tag}
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="h-3 w-3 p-0 hover:bg-transparent"
                                                                            onClick={() => handleRemoveTag(tag)}
                                                                            disabled={isSubmitting}
                                                                        >
                                                                            <X className="h-2 w-2" />
                                                                        </Button>
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                        <div className="text-xs text-gray-500">
                                                            Maksimal 5 tag, gunakan tag yang relevan untuk memudahkan pencarian
                                                        </div>
                                                        <FormMessage />
                                                    </div>
                                                </FormItem>
                                            )}
                                        />
                                    )}
                                    <FormField
                                        control={form.control}
                                        name="thumbnail"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Thumbnail</FormLabel>
                                                <FormControl>
                                                    <ThumbnailUpload
                                                        value={field.value || null}
                                                        onChange={(url) => field.onChange(url === undefined ? null : url)}
                                                        disabled={isSubmitting}
                                                        onUploadFile={handleThumbnailUpload}
                                                        isLoading={isThumbnailUploading}
                                                        placeholderIcon={ThumbnailPlaceholderIcon}
                                                        placeholderGradient={thumbnailPlaceholderGradient}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </CardContent>
                            </Card>

                            <Card className="relative">
                                <CardHeader>
                                    <CardTitle>Konten Diskusi *</CardTitle>
                                </CardHeader>
                                <CardContent className="px-2">
                                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                                        <TabsList className="absolute top-0 right-0">
                                            <TabsTrigger value="write">
                                                <Edit className="h-4 w-4 mr-2" />
                                                Tulis</TabsTrigger>
                                            <TabsTrigger value="preview">
                                                <Eye className="h-4 w-4 mr-2" />
                                                Preview
                                            </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="write" className="space-y-4">
                                            <FormField
                                                control={form.control}
                                                name="content"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormControl>
                                                            <div className="relative border rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-900 flex flex-col">
                                                                <div className="flex items-center justify-end border-b p-2 flex-shrink-0">
                                                                    <div className="flex items-center gap-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => {
                                                                                const markdownLink = `![Deskripsi Gambar](URL_Gambar_Anda_Di_Sini)\n`;
                                                                                const currentContent = form.getValues("content") || "";
                                                                                const cursorPosition = textareaRef.current?.selectionStart || currentContent.length;
                                                                                const newContent =
                                                                                    currentContent.substring(0, cursorPosition) +
                                                                                    markdownLink +
                                                                                    currentContent.substring(cursorPosition);
                                                                                form.setValue("content", newContent, { shouldValidate: true });

                                                                                setTimeout(() => {
                                                                                    if (textareaRef.current) {
                                                                                        const newCaretPosition = cursorPosition + markdownLink.length - 1;
                                                                                        textareaRef.current.focus();
                                                                                        textareaRef.current.setSelectionRange(newCaretPosition - 20, newCaretPosition);
                                                                                    }
                                                                                }, 0);
                                                                                toast.info("Markdown link gambar ditambahkan.");
                                                                            }}
                                                                            disabled={isSubmitting || isAnyMediaUploading}
                                                                            className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                                                            title="Masukkan link gambar Markdown"
                                                                        >
                                                                            <Link className="h-4 w-4" />
                                                                            <span className="sr-only">Masukkan link gambar Markdown</span>
                                                                        </Button>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() => fileInputRef.current?.click()}
                                                                            disabled={isSubmitting || isAnyMediaUploading || mediaFiles.filter(mf => mf.uploadedUrl || mf.uploading).length >= MAX_MEDIA_FILES}
                                                                            className="h-8 w-8 text-gray-500 hover:text-gray-700"
                                                                            title="Upload Gambar/Video"
                                                                        >
                                                                            {isAnyMediaUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                                                            <span className="sr-only">Upload Gambar</span>
                                                                        </Button>
                                                                        <input
                                                                            type="file"
                                                                            ref={fileInputRef}
                                                                            onChange={(e) => processAndAddFiles(e.target.files)}
                                                                            accept="image/*"
                                                                            multiple={true}
                                                                            className="hidden"
                                                                            disabled={isSubmitting || isAnyMediaUploading || mediaFiles.filter(mf => mf.uploadedUrl || mf.uploading).length >= MAX_MEDIA_FILES}
                                                                        />
                                                                    </div>
                                                                </div>
                                                                <ScrollArea className={cn(
                                                                    "max-h-[300px] w-full",
                                                                    isDragOver ? 'border-2 border-blue-500' : ''
                                                                )}>
                                                                    <Textarea
                                                                        ref={textareaRef}
                                                                        placeholder="Tulis konten diskusi Anda di sini... Anda dapat menggunakan Markdown untuk formatting. Drop gambar di sini untuk mengunggah."
                                                                        value={field.value}
                                                                        onChange={field.onChange}
                                                                        // Menghapus 'rows' karena akan bertentangan dengan 'h-full'
                                                                        className={cn(
                                                                            // Menambahkan 'h-full' agar Textarea memenuhi tinggi ScrollArea
                                                                            // Menghapus 'resize-none' karena ScrollArea yang mengatur ukuran
                                                                            "h-full min-h-36 border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-4 text-sm resize-none",
                                                                            isDragOver ? 'border-none' : '',
                                                                            {
                                                                                'cursor-wait': isAnyMediaUploading
                                                                            }
                                                                        )}
                                                                        disabled={isSubmitting || isAnyMediaUploading}
                                                                        onPaste={handlePasteOnTextarea}
                                                                        onDrop={handleDropOnTextarea}
                                                                        onDragOver={handleDragOverOnTextarea}
                                                                        onDragLeave={handleDragLeaveOnTextarea}
                                                                    />
                                                                    <ScrollBar orientation="vertical" />
                                                                </ScrollArea>
                                                            </div>
                                                        </FormControl>
                                                        <div className="flex justify-between text-sm text-gray-500">
                                                            <span>Mendukung Markdown formatting</span>
                                                            <span>{field.value?.length || 0}/5000</span>
                                                        </div>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            {mediaFiles.length > 0 && (
                                                <div className="mt-4 border-t pt-4">
                                                    <h4 className="font-medium mb-3">Media Terlampir:</h4>
                                                    <div className="flex w-max space-x-4 p-4">
                                                        {finalMediaPreviewsForTab.map((media) => (
                                                            <div key={media.id} className="relative group w-[150px] h-[150px] flex-shrink-0">
                                                                <div className="relative w-full h-full overflow-hidden rounded-md border border-gray-200">
                                                                    {media.type === "image" ? (
                                                                        <Image
                                                                            src={media.url}
                                                                            alt={media.filename}
                                                                            layout="fill"
                                                                            objectFit="cover"
                                                                        />
                                                                    ) : (
                                                                        <video
                                                                            src={media.url}
                                                                            className="w-full h-full object-cover"
                                                                            poster={media.uploadedUrl ? `${media.uploadedUrl}?tr=f-jpg` : undefined}
                                                                            muted
                                                                            loop
                                                                        />
                                                                    )}
                                                                    {media.uploading && (
                                                                        <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                                                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                                            <span className="text-sm">{Math.round(media.progress || 0)}%</span>
                                                                            <Progress value={media.progress} className="w-3/4 mt-2 h-1" />
                                                                        </div>
                                                                    )}
                                                                    {!media.uploading && media.uploadedUrl === undefined && (
                                                                        <div className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center text-white">
                                                                            <X className="h-8 w-8 mb-2" />
                                                                            <span className="text-sm text-center">Upload Gagal</span>
                                                                        </div>
                                                                    )}
                                                                    {/* Tombol Sisipkan/Salin Link di sini */}
                                                                    {media.uploadedUrl && (
                                                                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4">
                                                                            <h3 className="text-white text-md font-semibold mb-3 text-center truncate w-full">{media.filename}</h3>
                                                                            <div className="flex flex-col gap-2 w-full max-w-[200px]">
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="secondary"
                                                                                    size="sm"
                                                                                    className="w-full h-9 px-3 text-sm bg-white/80 text-gray-900 hover:bg-white"
                                                                                    onClick={(e) => handleInsertMediaToContent(media.id, e)}
                                                                                >
                                                                                    <Link className="h-4 w-4 mr-2" /> Sisipkan
                                                                                </Button>
                                                                                <Button
                                                                                    type="button"
                                                                                    variant="secondary"
                                                                                    size="sm"
                                                                                    className="w-full h-9 px-3 text-sm bg-white/80 text-gray-900 hover:bg-white"
                                                                                    onClick={(e) => handleCopyMediaUrl(media.uploadedUrl!, e)}
                                                                                >
                                                                                    <Copy className="h-4 w-4 mr-2" /> Salin URL
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    variant="destructive"
                                                                    size="icon"
                                                                    className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-80 hover:opacity-100 z-10"
                                                                    onClick={() => handleRemoveMedia(media.id)}
                                                                    disabled={isSubmitting || media.uploading}
                                                                >
                                                                    <X className="h-3 w-3" />
                                                                    <span className="sr-only">Hapus media</span>
                                                                </Button>
                                                                <div className="p-2 text-sm text-center text-gray-600 dark:text-gray-300 flex items-center justify-center gap-1">
                                                                    {media.type === "image" ? <ImageIcon className="h-4 w-4 text-primary" /> : <Video className="h-4 w-4 text-primary" />}
                                                                    <span className="truncate">{media.filename}</span>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>
                                        <TabsContent value="preview">
                                            <div className="p-4 border rounded-lg bg-gray-50 dark:bg-neutral-800">
                                                {form.watch("content") ? (
                                                    <ScrollArea className="prose prose-sm max-w-none dark:prose-invert h-[350px]">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                            {form.watch("content")}
                                                        </ReactMarkdown>
                                                        <ScrollBar orientation="vertical" />
                                                    </ScrollArea>
                                                ) : (
                                                    <p className="text-gray-500 italic">Tidak ada konten untuk di-preview</p>
                                                )}
                                            </div>
                                            {/* Media terlampir untuk Forum Post Form (di tab 'preview') - Menggunakan MediaViewer */}
                                            {mediaForMediaViewer.length > 0 && (
                                                <div className="mt-4 border-t pt-4">
                                                    <h4 className="font-medium mb-3">Media Terlampir:</h4>
                                                    <MediaViewer media={mediaForMediaViewer} />
                                                </div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Right Sidebar */}
                        <div className={cn("space-y-6 lg:sticky lg:top-8 h-fit col-span-1", !showRightSidebar && "hidden")}>
                            {selectedType && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-x-2">
                                            {(() => {
                                                const TypeIcon = typeIconsMap[selectedType.icon] || Plus;
                                                return <TypeIcon className="h-5 w-5" />;
                                            })()}
                                            {selectedType.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="space-y-1 text-gray-600 dark:text-gray-400 text-sm mb-4">{selectedType.description}</p>
                                        <div className="space-y-2 text-xs">
                                            <div className="flex items-center justify-between">
                                                <span>Solusi dapat ditandai:</span>
                                                <Badge variant={selectedType.allowSolution ? "default" : "secondary"}>
                                                    {selectedType.allowSolution ? "Ya" : "Tidak"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Tag dapat digunakan:</span>
                                                <Badge variant={selectedType.allowTags ? "default" : "secondary"}>
                                                    {selectedType.allowTags ? "Ya" : "Tidak"}
                                                </Badge>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                            {selectedCategory && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {(() => {
                                                const CategoryIcon = categoryIconsMap[selectedCategory.icon] || Plus;
                                                return <CategoryIcon className="h-5 w-5" />;
                                            })()}
                                            {selectedCategory.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 ">{selectedCategory.description}</p>
                                    </CardContent>
                                </Card>
                            )}
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Panduan Posting</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="space-y-2">
                                        <h4 className="font-medium">Tips untuk diskusi yang baik:</h4>
                                        <div className="space-y-1 text-gray-600 dark:text-gray-400 list-disc list-inside">
                                            <li>Gunakan judul yang jelas dan deskriptif</li>
                                            <li>Berikan konteks yang cukup dalam konten</li>
                                            <li>Gunakan tag yang relevan</li>
                                            <li>Sertakan screenshot jika diperlukan</li>
                                            <li>Bersikap sopan dan konstruktif</li>
                                        </div>
                                    </div>

                                    {selectedType?.id === "pertanyaan" && (
                                        <div className="space-y-2">
                                            <h4 className="font-medium">Khusus untuk pertanyaan:</h4>
                                            <div className="space-y-1 text-gray-600 dark:text-gray-400 list-disc list-inside">
                                                <li>Jelaskan masalah dengan detail</li>
                                                <li>Sebutkan apa yang sudah dicoba</li>
                                                <li>Sertakan spesifikasi sistem jika relevan</li>
                                                <li>Tandai jawaban terbaik sebagai solusi</li>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent>
                                    <Button
                                        type="submit"
                                        size="sm"
                                        className="w-full"
                                        disabled={isSubmitting || isThumbnailUploading || isAnyMediaUploading}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Memposting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                {initialData ? "Simpan Perubahan" : "Publikasikan Diskusi"}
                                            </>
                                        )}
                                    </Button>
                                    <div className="text-xs text-gray-500 text-center mt-2">
                                        Dengan mempublikasikan, Anda menyetujui aturan komunitas
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>
        </div>
    );
}