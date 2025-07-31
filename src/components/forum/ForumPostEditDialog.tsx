// /components/forum/ForumPostEditDialog.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ForumPost } from "@/types/forum";
import { ForumPostForm } from "@/components/forum/ForumPostForm";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Edit as EditIcon, Loader2, AlertTriangle } from "lucide-react";

interface ForumPostEditDialogProps {
    postId: string;
    trigger?: React.ReactNode;
    onEditSuccess?: (updatedPostId: string) => void;
    isPostAuthor?: boolean;
    isAdmin?: boolean;
}

export function ForumPostEditDialog({
    postId,
    trigger,
    onEditSuccess,
    isPostAuthor: propIsPostAuthor,
    isAdmin: propIsAdmin,
}: ForumPostEditDialogProps) {
    const router = useRouter();
    const { data: session, status } = useSession();
    const userId = session?.user?.id;
    const currentIsAdmin = session?.user?.role === "admin";

    const [initialPostData, setInitialPostData] = useState<ForumPost | null>(null);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [errorLoadingPost, setErrorLoadingPost] = useState(false);

    const canEdit = (propIsPostAuthor || propIsAdmin || currentIsAdmin) && !!userId;

    useEffect(() => {
        if (!isDialogOpen || !postId || status === "loading" || (initialPostData && !errorLoadingPost)) {
            if (status === 'loading') return;
            if (isDialogOpen && !canEdit) {
                toast.error("Anda tidak memiliki izin untuk mengedit postingan ini.");
                setIsDialogOpen(false);
            }
            return;
        }

        const fetchPost = async () => {
            setIsLoadingInitialData(true);
            setErrorLoadingPost(false);
            try {
                const response = await fetch(`/api/forum/posts/${postId}`);
                if (!response.ok) {
                    throw new Error("Failed to fetch post for editing.");
                }
                const data = await response.json();
                if (data.status && data.data) {
                    const fetchedPost: ForumPost = data.data;

                    if (fetchedPost.authorId !== userId && !currentIsAdmin) {
                        toast.error("Anda tidak memiliki izin untuk mengedit postingan ini.", { duration: 3000 });
                        setIsDialogOpen(false);
                        return;
                    }
                    setInitialPostData(fetchedPost);
                } else {
                    throw new Error(data.message || "Postingan tidak ditemukan.");
                }
            } catch (error) {
                console.error("Error fetching post for editing:", error);
                toast.error("Gagal memuat postingan untuk diedit.", { description: (error as Error).message });
                setErrorLoadingPost(true);
            } finally {
                setIsLoadingInitialData(false);
            }
        };

        fetchPost();
    }, [isDialogOpen, postId, userId, currentIsAdmin, status, initialPostData, errorLoadingPost, canEdit]);

    const handleOpenChange = useCallback((open: boolean) => {
        setIsDialogOpen(open);
        if (!open && !isSubmitting) {
            setInitialPostData(null);
            setErrorLoadingPost(false);
            setIsLoadingInitialData(true);
        }
    }, [isSubmitting]);

    const handleSubmit = useCallback(async (
        postData: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'replies' | 'views' | 'isResolved' | 'isPinned' | 'isArchived'>,
        submitPostId?: string
    ) => {
        if (!submitPostId) {
            toast.error("ID postingan tidak ditemukan untuk diperbarui.");
            return;
        }
        if (!userId) {
            toast.error("Anda harus login untuk memperbarui postingan.");
            router.push("/login");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await fetch(`/api/forum/posts/${submitPostId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ...postData, isEdited: true }),
            });

            const data = await response.json();

            if (response.ok && data.status) {
                toast.success("Diskusi berhasil diperbarui", {
                    description: "Perubahan Anda telah disimpan.",
                });
                handleOpenChange(false);
                if (onEditSuccess) {
                    onEditSuccess(submitPostId);
                }
            } else {
                throw new Error(data.message || "Terjadi kesalahan saat menyimpan perubahan.");
            }
        } catch (error) {
            console.error("Error updating post:", error);
            toast.error("Gagal menyimpan perubahan diskusi", {
                description: error instanceof Error ? error.message : "Terjadi kesalahan yang tidak diketahui.",
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [userId, onEditSuccess, router, handleOpenChange]);


    if (!canEdit) {
        return null;
    }

    return (
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button variant="ghost" size="icon" aria-label="Edit post" title="Edit Post">
                        <EditIcon className="h-4 w-4" />
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[800px] lg:max-w-[1000px] h-[90vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                    <DialogTitle>{`Edit Diskusi: ${initialPostData?.title || 'Memuat...'}`}</DialogTitle>
                    <DialogDescription>Perbarui postingan Anda.</DialogDescription>
                </DialogHeader>
                {errorLoadingPost ? (
                    <div className="flex-grow flex items-center justify-center p-8">
                        <div className="text-center">
                            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                            <h2 className="text-xl font-semibold mb-2">Gagal Memuat Postingan</h2>
                            <p className="text-gray-600 mb-4">Postingan tidak dapat dimuat atau Anda tidak memiliki izin.</p>
                            <Button onClick={() => handleOpenChange(false)}>Tutup</Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow overflow-y-auto">
                        {isLoadingInitialData ? (
                            <div className="p-6 text-center">
                                <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto mb-4" />
                                <p className="text-gray-600">Memuat data postingan...</p>
                            </div>
                        ) : (
                            <ForumPostForm
                                pageTitle=""
                                pageDescription=""
                                onSubmit={handleSubmit}
                                initialData={initialPostData}
                                isLoadingInitialData={isLoadingInitialData}
                                isSubmitting={isSubmitting}
                                isModal={true}
                                onClose={() => handleOpenChange(false)}
                                showRightSidebar={true} // <--- PERUBAHAN: Tampilkan sidebar di modal edit
                            />
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}