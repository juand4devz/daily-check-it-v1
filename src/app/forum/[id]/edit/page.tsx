// /app/forum/[id]/edit/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ForumPost } from "@/types/forum";
import { ForumPostForm } from "@/components/forum/ForumPostForm";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function EditForumPostPage() {
    const { id: postId } = useParams(); // Get post ID from URL params
    const router = useRouter();
    const { data: session, status } = useSession();
    const userId = session?.user?.id;
    const isAdmin = session?.user?.role === "admin";

    const [initialPostData, setInitialPostData] = useState<ForumPost | null>(null);
    const [isLoadingInitialData, setIsLoadingInitialData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errorLoadingPost, setErrorLoadingPost] = useState(false);


    // --- EFFECT: Load initial post data for editing ---
    useEffect(() => {
        if (!postId || status === "loading") return; // Wait for postId and session

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

                    // Authorization check: Only author or admin can edit
                    if (fetchedPost.authorId !== userId && !isAdmin) {
                        toast.error("Anda tidak memiliki izin untuk mengedit postingan ini.", { duration: 3000 });
                        router.push(`/forum/${postId}`); // Redirect to post detail if not authorized
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
    }, [postId, userId, isAdmin, status, router]);


    const handleSubmit = useCallback(async (
        postData: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'replies' | 'views' | 'isResolved' | 'isPinned' | 'isArchived'>,
        submitPostId?: string // This will be the actual postId (from initialData.id)
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
                method: "PATCH", // Use PATCH for updates
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(postData),
            });

            const data = await response.json();

            if (response.ok && data.status) {
                toast.success("Diskusi berhasil diperbarui", {
                    description: "Perubahan Anda telah disimpan.",
                });
                router.push(`/forum/${submitPostId}`); // Redirect back to post detail
            } else {
                throw new Error(data.message || "Terjadi kesalahan saat menyimpan perubahan.");
            }
        } catch (error) {
            console.error("Error updating post:", error);
            toast.error("Gagal menyimpan perubahan diskusi", {
                description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan perubahan",
            });
        } finally {
            setIsSubmitting(false);
        }
    }, [userId, router]);

    if (errorLoadingPost) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl">
                <Card>
                    <CardContent className="p-8 text-center">
                        <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Gagal Memuat Postingan</h2>
                        <p className="text-gray-600 mb-4">Postingan yang Anda coba edit tidak dapat dimuat atau tidak ada.</p>
                        <Button onClick={() => router.push(`/forum/${postId}`)}>
                            Kembali ke Postingan
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <ForumPostForm
            pageTitle="Edit Diskusi"
            pageDescription="Perbarui postingan Anda"
            backUrl={`/forum/${postId}`} // Go back to the post detail page
            onSubmit={handleSubmit}
            initialData={initialPostData} // Pass the fetched data
            isLoadingInitialData={isLoadingInitialData} // Pass loading state
            isSubmitting={isSubmitting}
        />
    );
}