// /components/forum/ForumPostForm.tsx
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
import { ArrowLeft, Plus, Eye, Send, Loader2, AlertCircle, PencilRuler, X, Edit, Link, Copy } from "lucide-react";
import { toast } from "sonner";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton for loading state

import { ThumbnailUpload } from "@/components/forum/thumbnail-upload";
import { MarkdownEditor } from "@/components/forum/markdown-editor";

import {
    FORUM_TYPES,
    FORUM_CATEGORIES,
    typeIconsMap,
    categoryIconsMap,
    ForumType,
    ForumCategory,
    ForumPost, // Import ForumPost
    ForumMedia, // Import ForumMedia
    MAX_IMAGE_SIZE,
    getTypeIcon,
    getRandomGradient,
} from "@/lib/utils/forum-utils";

// Reusable interface for temporary media files in state
interface MediaFileTemp {
    id: string; // Temporary ID for internal tracking, or fileId from ImageKit
    file?: File; // Original file object (only for new uploads)
    preview: string; // Blob URL for client-side preview OR existing URL for uploaded files
    type: "image" | "video";
    markdownPlaceholder: string; // Markdown placeholder for new uploads in content (e.g. `![temp](uploading:id)`)
    uploading: boolean; // Indicates if this specific file is uploading
    progress: number; // Upload progress for this file
    uploadedUrl: string | undefined; // Final ImageKit URL after upload, or undefined if not uploaded/failed
    isNew: boolean; // Flag to indicate if this is a newly added file vs. existing
}

// Reusable interface for diagnosis data
interface DiagnosisData {
    symptoms: string;
    diagnosis: string;
    timestamp: string;
}


// Define the Zod schema for form validation
const formSchema = z.object({
    title: z.string().min(10, "Judul minimal 10 karakter").max(200, "Judul maksimal 200 karakter"),
    description: z.string().min(10, "Deskripsi minimal 10 karakter").max(300, "Deskripsi maksimal 300 karakter"),
    content: z.string().min(20, "Konten minimal 20 karakter").max(5000, "Konten maksimal 5000 karakter"),
    type: z.string().min(1, "Tipe diskusi harus dipilih"),
    category: z.string().min(1, "Kategori harus dipilih"),
    tags: z.array(z.string().max(20, "Setiap tag maksimal 20 karakter")).max(5, "Maksimal 5 tag dapat ditambahkan").optional(),
    thumbnail: z.string().nullable().optional(),
});

type FormSchema = z.infer<typeof formSchema>;

interface ForumPostFormProps {
    initialData?: ForumPost | null; // Optional: for editing existing posts. Allow null
    diagnosisData?: DiagnosisData | null; // Optional: pre-fill from diagnosis
    onSubmit: (data: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'replies' | 'views' | 'isResolved' | 'isPinned' | 'isArchived'>, postId?: string) => Promise<void>; // Callback for parent to handle submission
    isLoadingInitialData: boolean; // For parent to signal initial data loading
    isSubmitting: boolean; // For parent to signal submission status
    pageTitle: string; // e.g., "Buat Diskusi Baru" or "Edit Diskusi"
    pageDescription: string; // e.g., "Bagikan pertanyaan..." or "Perbarui postingan..."
    backUrl: string; // URL to go back to, e.g., "/forum" or "/forum/[id]"
}

const MAX_MEDIA_FILES = 5;

export function ForumPostForm({
    initialData,
    diagnosisData,
    onSubmit: parentOnSubmit, // Rename to avoid conflict with form.handleSubmit
    isLoadingInitialData,
    isSubmitting,
    pageTitle,
    pageDescription,
    backUrl,
}: ForumPostFormProps) {
    const { data: session, status } = useSession();
    const userId = session?.user?.id;
    const username = session?.user?.username;
    const avatar = session?.user?.avatar;

    const [mediaFiles, setMediaFiles] = useState<MediaFileTemp[]>([]);
    const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true); // Internal page loading state (auth check)
    const [newTagInput, setNewTagInput] = useState<string>("");
    const [activeTab, setActiveTab] = useState<string>("write");
    const [isDragOver, setIsDragOver] = useState(false);
    const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    // --- EFFECT: Handle initial data (for edit mode) or diagnosis data ---
    useEffect(() => {
        if (isLoadingInitialData || status === "loading") return; // Wait until parent finishes loading and session is ready

        // If initialData is provided (edit mode), populate the form
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
            // Hydrate mediaFiles for existing media
            const existingMedia: MediaFileTemp[] = (initialData.media || []).map(m => ({
                id: m.id,
                file: undefined, // No original file object for existing media
                preview: m.url, // Use existing URL as preview
                type: m.type,
                markdownPlaceholder: `![${m.filename || 'media'}](${m.url})`, // Use existing URL as "placeholder" for existing media
                uploading: false,
                progress: 100,
                uploadedUrl: m.url, // Already uploaded
                isNew: false, // Flag as existing media
            }));
            setMediaFiles(existingMedia);
            setIsLoadingPage(false); // Done loading page content
            return; // Exit as initialData takes precedence
        }

        // If diagnosisData is provided (new post from diagnosis)
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
                sessionStorage.removeItem("forumPostData"); // Clear after use
            } catch (error) {
                console.error("Error parsing diagnosis data:", error);
                toast.error("Error", { description: "Gagal memuat data diagnosa otomatis." });
            }
        }
        setIsLoadingPage(false); // Done loading page content (even if no diagnosis data)
    }, [initialData, diagnosisData, isLoadingInitialData, form, status]);


    // --- EFFECT: Auth check ---
    useEffect(() => {
        if (status === "loading") return;
        if (!userId) {
            toast.error("Anda harus login untuk mengakses halaman ini.", { duration: 3000 });
            router.push("/login");
            return;
        }
        // If initialData is being loaded by parent, keep internal loading true
        // Else, set false (for new post mode)
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
                resolve("/placeholder.svg");
            }
        });
    };

    const uploadFileToImageKit = useCallback(async (
        file: File,
        folder: string,
        filenamePrefix: string,
        onProgress: (progress: number) => void
    ): Promise<string | null> => {
        if (!userId) {
            toast.error("Anda harus login untuk mengunggah media.");
            return null;
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileName', `${filenamePrefix}-${userId}-${Date.now()}`);
        formData.append('folder', folder);

        try {
            const authRes = await fetch("/api/upload-auth");
            if (!authRes.ok) {
                throw new Error("Failed to get ImageKit authentication.");
            }
            const authData = await authRes.json();

            formData.append('token', authData.token);
            formData.append('expire', authData.expire);
            formData.append('signature', authData.signature);
            formData.append('publicKey', authData.publicKey);

            return await new Promise<string>((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', 'https://upload.imagekit.io/api/v1/files/upload');
                xhr.onload = () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        const result = JSON.parse(xhr.responseText);
                        resolve(result.url);
                    } else {
                        reject(new Error(`ImageKit upload failed: ${xhr.status} ${xhr.statusText} - ${xhr.responseText}`));
                    }
                };
                xhr.onerror = () => reject(new Error('Network error during ImageKit upload.'));
                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = (event.loaded / event.total) * 100;
                        onProgress(percent);
                    }
                };
                xhr.send(formData);
            });

        } catch (error) {
            console.error("Error uploading file to ImageKit:", error);
            toast.error("Gagal mengunggah file", { description: (error as Error).message });
            return null;
        }
    }, [userId]);

    const handleThumbnailUpload = useCallback(async (file: File): Promise<string | null> => {
        setIsThumbnailUploading(true);
        try {
            const url = await uploadFileToImageKit(file, "forum-thumbnails", "thumbnail", (p) => { });
            if (url) {
                form.setValue("thumbnail", url, { shouldValidate: true });
            } else {
                form.setValue("thumbnail", null, { shouldValidate: true });
            }
            return url;
        } finally {
            setIsThumbnailUploading(false);
        }
    }, [uploadFileToImageKit, form]);

    const processAndAddFiles = useCallback(async (files: FileList | File[]) => {
        if (!files || files.length === 0) return;

        const filesArray = Array.from(files);
        const filesToProcess: File[] = [];

        for (const file of filesArray) {
            // Check against already uploaded files + files currently being processed
            if (mediaFiles.filter(mf => mf.uploadedUrl || mf.uploading).length + filesToProcess.length >= MAX_MEDIA_FILES) {
                toast.error(`Maksimal ${MAX_MEDIA_FILES} gambar dapat diunggah.`);
                break;
            }
            if (!file.type.startsWith("image/")) {
                toast.error(`File "${file.name}" bukan format gambar yang didukung.`);
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
                    isNew: true, // Mark as new file
                };
            })
        );

        setMediaFiles((prev) => [...prev, ...newMediaFilesTemp]);
        toast.info(`${newMediaFilesTemp.length} gambar mulai diunggah.`);

        newMediaFilesTemp.forEach(async (tempFile) => {
            const url = await uploadFileToImageKit(tempFile.file!, "forum-media", "post-media", (p) => {
                setMediaFiles(prev => prev.map(mf => mf.id === tempFile.id ? { ...mf, progress: p } : mf));
            });

            setMediaFiles(prev => prev.map(mf => {
                if (mf.id === tempFile.id) {
                    if (url) {
                        toast.success(`Gambar "${tempFile.file.name}" berhasil diunggah.`);
                        return { ...mf, uploading: false, progress: 100, uploadedUrl: url };
                    } else {
                        toast.error(`Gambar "${tempFile.file.name}" gagal diunggah.`);
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
            toast.info(`Gambar "${fileToRemove.filename || fileToRemove.file?.name || 'media'}" dihapus.`);
            return updatedFiles;
        });
    }, [form]);

    const handleInsertMediaToContent = useCallback((mediaId: string, event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();

        const media = mediaFiles.find(mf => mf.id === mediaId);
        if (media && media.uploadedUrl) {
            // Use existing filename if available, otherwise original file name
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

            toast.success("Gambar berhasil disisipkan ke konten!");
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(cursorPosition + markdown.length, cursorPosition + markdown.length);
                }
            }, 0);
        } else {
            toast.error("Gambar belum selesai diunggah atau tidak ada URL.");
        }
    }, [mediaFiles, form]);

    const handleCopyMediaUrl = useCallback((mediaUrl: string, event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        event.stopPropagation();
        navigator.clipboard.writeText(mediaUrl);
        toast.success("URL gambar disalin ke clipboard!");
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
            const imageFiles: File[] = [];
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) {
                        imageFiles.push(file);
                    }
                }
            }
            if (imageFiles.length > 0) {
                e.preventDefault();
                processAndAddFiles(imageFiles);
            }
        }
    }, [isSubmitting, mediaFiles, processAndAddFiles]);


    const markdownEditorMediaPreviews = useMemo(() => {
        return mediaFiles.map(mf => ({
            id: mf.id,
            url: mf.preview,
            filename: mf.file?.name || mf.filename || 'media', // Fallback filename for existing media
            uploading: mf.uploading,
            progress: mf.progress,
            uploadedUrl: mf.uploadedUrl,
        }));
    }, [mediaFiles]);


    const handleSubmit = async (values: FormSchema) => {
        if (!userId) { // Check for userId outside of this function, as it's a prop for parentOnSubmit
            toast.error("Anda harus login untuk membuat postingan.");
            router.push("/login");
            return;
        }

        if (mediaFiles.some(mf => mf.uploading)) {
            toast.error("Tunggu! Ada gambar yang masih diunggah. Harap tunggu hingga semua upload selesai.");
            return;
        }
        if (mediaFiles.some(mf => mf.uploadedUrl === undefined)) {
            toast.error("Ada gambar yang gagal diunggah. Harap hapus atau coba unggah ulang sebelum mengirim.");
            return;
        }

        // Collect final uploaded media (both new and existing)
        const finalMediaForSubmission: ForumMedia[] = mediaFiles
            .filter(mf => mf.uploadedUrl) // Only include successfully uploaded media
            .map(mf => ({
                id: mf.id,
                type: mf.type,
                filename: mf.file?.name || mf.filename || 'unknown', // Use original filename from existing media if available
                size: mf.file?.size || 0, // Use original size if available
                url: mf.uploadedUrl!,
                thumbnailUrl: mf.type === "video" ? `${mf.uploadedUrl!}?tr=f-jpg` : undefined,
            }));

        let finalContent = values.content;
        // Replace temporary markdown placeholders with actual URLs
        finalMediaForSubmission.forEach(mediaItem => {
            const tempMedia = mediaFiles.find(mft => mft.id === mediaItem.id);
            if (tempMedia && tempMedia.markdownPlaceholder && finalContent.includes(tempMedia.markdownPlaceholder)) {
                finalContent = finalContent.replace(tempMedia.markdownPlaceholder, `![${mediaItem.filename}](${mediaItem.url})`);
            }
        });
        // Remove any remaining temporary placeholders (e.g., if user deleted them from content)
        finalContent = finalContent.replace(/!\[.*?\]\(uploading:.*?\)/g, '').trim();

        const postData: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'replies' | 'views' | 'isResolved' | 'isPinned' | 'isArchived'> = {
            title: values.title,
            description: values.description,
            content: finalContent,
            type: values.type,
            category: values.category,
            tags: values.tags || [],
            thumbnail: values.thumbnail || null,
            media: finalMediaForSubmission, // Use the collected final media
            authorId: userId!,
            authorUsername: username!,
            authorAvatar: avatar || "/placeholder.svg",
        };

        // Pass data and optional postId to the parent's onSubmit handler
        await parentOnSubmit(postData, initialData?.id);
    };

    const isAnyMediaUploading = mediaFiles.some(mf => mf.uploading);
    const isUploadDisabled = isSubmitting || isThumbnailUploading || isAnyMediaUploading || mediaFiles.filter(mf => mf.uploadedUrl).length >= MAX_MEDIA_FILES;

    if (isLoadingPage || isLoadingInitialData) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
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
        <div className="p-4 mw-full">
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

            {diagnosisData && (
                <Alert variant="default" className="mt-5 mb-8">
                    <AlertCircle className="h-5 w-5" />
                    <AlertTitle>Data Diagnosa Terdeteksi</AlertTitle>
                    <AlertDescription>
                        Form telah diisi otomatis berdasarkan hasil diagnosa Anda. Silakan edit sesuai kebutuhan.
                    </AlertDescription>
                </Alert>
            )}

            <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
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
                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
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
                                                                                <div className="text-[10px] text-gray-500">{forumType.description}</div>
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
                                <CardContent>
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
                                                            <MarkdownEditor
                                                                textareaRef={textareaRef}
                                                                value={field.value}
                                                                onChange={field.onChange}
                                                                onMediaFilesChange={(files) => processAndAddFiles(files)}
                                                                mediaPreviews={markdownEditorMediaPreviews}
                                                                placeholder="Tulis konten diskusi Anda di sini... Anda dapat menggunakan Markdown untuk formatting. Drop gambar di sini untuk mengunggah."
                                                                className={isDragOver ? 'border-2 border-blue-500 bg-blue-50' : ''}
                                                                rows={10}
                                                                disabled={isSubmitting || isAnyMediaUploading}
                                                                onDrop={handleDropOnTextarea}
                                                                onDragOver={handleDragOverOnTextarea}
                                                                onDragLeave={handleDragLeaveOnTextarea}
                                                                onPaste={handlePasteOnTextarea}
                                                                isDragOver={isDragOver}
                                                                isUploadingMedia={isAnyMediaUploading}
                                                                onRemoveMedia={(id) => handleRemoveMedia(id)}
                                                            />
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
                                                <>
                                                    <h4 className="font-medium mb-3 mt-6">Media Terlampir:</h4>
                                                    <ScrollArea className="w-full whitespace-nowrap rounded-md border">
                                                        <div className="flex w-max space-x-4 p-4">
                                                            {markdownEditorMediaPreviews.map((media) => (
                                                                <div key={media.id} className="relative group w-[150px] h-[150px] flex-shrink-0">
                                                                    <div className="relative w-full h-full overflow-hidden rounded-md border border-gray-200">
                                                                        <Image
                                                                            src={media.url}
                                                                            alt={media.filename}
                                                                            layout="fill"
                                                                            objectFit="cover"
                                                                        />
                                                                        {media.uploading && (
                                                                            <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                                                                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                                                <span className="text-sm">{Math.round(media.progress)}%</span>
                                                                                <Progress value={media.progress} className="w-3/4 mt-2 h-1" />
                                                                            </div>
                                                                        )}
                                                                        {!media.uploading && media.uploadedUrl && (
                                                                            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                                                                                <div className="flex flex-col gap-2 w-full">
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="secondary"
                                                                                        size="sm"
                                                                                        className="w-full h-8 px-2 text-xs bg-white/70 text-gray-900 hover:bg-white/90"
                                                                                        onClick={(e) => handleInsertMediaToContent(media.id, e)}
                                                                                    >
                                                                                        <Link className="h-4 w-4 mr-1" /> Sisipkan
                                                                                    </Button>
                                                                                    <Button
                                                                                        type="button"
                                                                                        variant="secondary"
                                                                                        size="sm"
                                                                                        className="w-full h-8 px-2 text-xs bg-white/70 text-gray-900 hover:bg-white/90"
                                                                                        onClick={(e) => handleCopyMediaUrl(media.uploadedUrl!, e)}
                                                                                    >
                                                                                        <Copy className="h-4 w-4 mr-1" /> Salin URL
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {!media.uploading && media.uploadedUrl === undefined && (
                                                                            <div className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center text-white">
                                                                                <X className="h-8 w-8 mb-2" />
                                                                                <span className="text-sm text-center">Upload Gagal</span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <Button
                                                                        type="button"
                                                                        variant="destructive"
                                                                        size="icon"
                                                                        className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-80 hover:opacity-100 z-10"
                                                                        onClick={() => handleRemoveMedia(media.id!)}
                                                                        disabled={isSubmitting || media.uploading}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                        <span className="sr-only">Hapus gambar</span>
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <ScrollBar orientation="horizontal" />
                                                    </ScrollArea>
                                                </>
                                            )}
                                        </TabsContent>
                                        <TabsContent value="preview">
                                            <div className="min-h-[300px] p-4 border rounded-lg bg-gray-50 dark:bg-neutral-800">
                                                {form.watch("content") ? (
                                                    <div className="prose prose-sm max-w-none dark:prose-invert">
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.watch("content")}</ReactMarkdown>
                                                    </div>
                                                ) : (
                                                    <p className="text-gray-500 italic">Tidak ada konten untuk di-preview</p>
                                                )}
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6 lg:sticky lg:top-8 h-fit">
                            {selectedType && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-lg flex items-center gap-2">
                                            {(() => {
                                                const TypeIcon = typeIconsMap[selectedType.icon] || Plus;
                                                return <TypeIcon className="h-5 w-5" />;
                                            })()}
                                            {selectedType.name}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-600 mb-3">{selectedType.description}</p>
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
                                        <ul className="space-y-1 text-gray-600 dark:text-gray-400 list-disc list-inside">
                                            <li>Gunakan judul yang jelas dan deskriptif</li>
                                            <li>Berikan konteks yang cukup dalam konten</li>
                                            <li>Gunakan tag yang relevan</li>
                                            <li>Sertakan screenshot jika diperlukan</li>
                                            <li>Bersikap sopan dan konstruktif</li>
                                        </ul>
                                    </div>

                                    {selectedType?.id === "pertanyaan" && (
                                        <div className="space-y-2">
                                            <h4 className="font-medium">Khusus untuk pertanyaan:</h4>
                                            <ul className="space-y-1 text-gray-600 list-disc list-inside">
                                                <li>Jelaskan masalah dengan detail</li>
                                                <li>Sebutkan apa yang sudah dicoba</li>
                                                <li>Sertakan spesifikasi sistem jika relevan</li>
                                                <li>Tandai jawaban terbaik sebagai solusi</li>
                                            </ul>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                            <Card>
                                <CardContent className="p-4">
                                    <Button
                                        type="submit"
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