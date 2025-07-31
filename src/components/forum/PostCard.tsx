// /components/forum/PostCard.tsx
"use client";

import type React from "react";
import Image from "next/image";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
// DropdownMenu imports are handled by PostActionsPopover internally now
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
    MessageSquare,
    Heart,
    CheckCircle,
    MoreHorizontal,
    Pin,
    Archive,
    Edit,
    Trash2,
    Flag,
    Share2,
    BookmarkPlus,
    ExternalLink,
    Copy,
    Eye,
    BookmarkCheck,
    BookOpenText,
} from "lucide-react";
import type { ForumPost } from "@/types/forum";
import {
    getRandomGradient,
    getTypeIcon,
    FORUM_TYPES,
    FORUM_CATEGORIES,
    getCategoryIcon,
    getReadingTime,
} from "@/lib/utils/forum-utils";
import { formatTimeAgo } from "@/lib/utils/date-utils";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { UserProfileClickPopover } from "@/components/user/UserProfileClickPopover";
import { PostActionsPopover } from "@/components/forum/PostActionsPopover"; // Import PostActionsPopover

interface PostCardProps {
    post: ForumPost;
    onPostAction?: (postId: string, action: string) => void;
    onTagClick?: (tag: string) => void;
    initialIsLiked: boolean;
    initialIsBookmarked: boolean;
    initialLikeCount: number;
}

export function PostCard({
    post,
    onPostAction,
    onTagClick,
    initialIsLiked,
    initialIsBookmarked,
    initialLikeCount,
}: PostCardProps) {
    const router = useRouter();
    const { data: session } = useSession();
    const userId = session?.user?.id;
    const isAdmin = session?.user?.role === "admin";

    const [isLiked, setIsLiked] = useState<boolean>(initialIsLiked);
    const [likeCount, setLikeCount] = useState<number>(initialLikeCount);
    const [isBookmarked, setIsBookmarked] = useState<boolean>(initialIsBookmarked);
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

    useEffect(() => {
        setIsLiked(initialIsLiked);
    }, [initialIsLiked]);

    useEffect(() => {
        setLikeCount(initialLikeCount);
    }, [initialLikeCount]);

    useEffect(() => {
        setIsBookmarked(initialIsBookmarked);
    }, [initialIsBookmarked]);

    const isAuthor = post.authorId === userId;

    const handleAction = async (action: string) => {
        try {
            switch (action) {
                case "like":
                    if (!userId) {
                        toast.error("Anda harus login untuk menyukai postingan.");
                        router.push("/login");
                        return;
                    }
                    setIsLiked((prev) => !prev);
                    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

                    const likeRes = await fetch(`/api/forum/posts/${post.id}/like`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                    });
                    const likeData = await likeRes.json();
                    if (!likeRes.ok || !likeData.status) {
                        setIsLiked((prev) => !prev);
                        setLikeCount((prev) => (isLiked ? prev + 1 : prev - 1));
                        toast.error("Gagal mengubah status suka.", { description: likeData.message });
                    } else {
                        toast.success(likeData.message);
                        setLikeCount(likeData.newLikeCount);
                    }
                    break;
                case "bookmark":
                    if (!userId) {
                        toast.error("Anda harus login untuk membookmark postingan.");
                        router.push("/login");
                        return;
                    }
                    setIsBookmarked((prev) => !prev);

                    const bookmarkRes = await fetch(`/api/forum/posts/${post.id}/bookmarks`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                    });
                    const bookmarkData = await bookmarkRes.json();
                    if (!bookmarkRes.ok || !bookmarkData.status) {
                        setIsBookmarked((prev) => !prev);
                        toast.error("Gagal mengubah status bookmark.", { description: bookmarkData.message });
                    } else {
                        toast.success(bookmarkData.message);
                    }
                    break;
                case "share-link":
                    await navigator.clipboard.writeText(`${window.location.origin}/forum/${post.id}`);
                    toast.success("Link disalin", { description: "Link post telah disalin ke clipboard" });
                    break;
                case "share-external":
                    window.open(`${window.location.origin}/forum/${post.id}`, "_blank");
                    break;
                case "delete":
                    if (confirm("Apakah Anda yakin ingin menghapus post ini?")) {
                        const deleteRes = await fetch(`/api/forum/posts/${post.id}`, { method: 'DELETE' });
                        const deleteData = await deleteRes.json();
                        if (deleteRes.ok && deleteData.status) {
                            toast.success("Post berhasil dihapus", { description: deleteData.message });
                            onPostAction?.(post.id, action);
                            router.push("/forum");
                        } else {
                            toast.error("Gagal menghapus post", { description: deleteData.message });
                        }
                    }
                    break;
                case "pin":
                case "archive":
                    // Aksi pin/archive sekarang memanggil API
                    if (!isAdmin) { // Double check admin role
                        toast.error("Anda tidak memiliki izin untuk melakukan aksi ini.");
                        return;
                    }
                    const response = await fetch(`/api/forum/posts/${post.id}/pin`, { // Panggil API baru
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: action, status: action === 'pin' ? !post.isPinned : !post.isArchived }),
                    });
                    const data = await response.json();
                    if (response.ok && data.status) {
                        toast.success(data.message);
                        onPostAction?.(post.id, action); // Beri tahu parent (misal halaman listing)
                    } else {
                        toast.error("Gagal melakukan aksi", { description: data.message });
                    }
                    break;
                case "report":
                    if (!userId) {
                        toast.error("Anda harus login untuk melaporkan.");
                        router.push("/login");
                        return;
                    }
                    setIsReportDialogOpen(true);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error("Error handling action:", error);
            toast.error("Error", {
                description: "Gagal melakukan aksi",
            });
        }
    };

    const TypeIcon = getTypeIcon(post.type || "lainnya");
    const CategoryIcon = getCategoryIcon(post.category);
    const forumType = FORUM_TYPES.find((t) => t.id === post.type);
    const forumCategory = FORUM_CATEGORIES.find((c) => c.id === post.category);

    const fullTextContent = `${post.title || ""} ${post.description || ""} ${post.content || ""}`;
    const readingTime = getReadingTime(fullTextContent);

    return (
        <Card
            key={post.id}
            className="hover:shadow-lg transition-all duration-300 group py-0 overflow-hidden"
        // Hapus onMouseDown/onClick dari Card utama
        >
            <div>
                {/* Bagian gambar/thumbnail - sekarang ini yang bisa diklik untuk navigasi */}
                <div
                    className="relative h-48 overflow-hidden cursor-pointer"
                    onClick={() => router.push(`/forum/${post.id}`)} // Pindahkan navigasi ke sini
                >
                    {post.thumbnail ? (
                        <Image
                            height={500}
                            width={500}
                            src={post.thumbnail}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className={cn("w-full h-full relative overflow-hidden flex items-center justify-center", getRandomGradient(post.id))}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <TypeIcon className="h-16 w-16 text-white/80" />
                            </div>
                        </div>
                    )}

                    <div className="absolute top-3 left-3 flex gap-2">
                        <div className="flex gap-2">
                            {forumType && (
                                <Badge variant="secondary" className={`${forumType.color} text-white border-0`}>
                                    <TypeIcon className="h-3 w-3 mr-1" />
                                    {forumType.name}
                                </Badge>
                            )}
                            {post.isPinned && (
                                <Badge className="bg-blue-600 text-white border-0">
                                    <Pin className="h-3 w-3 mr-1" />
                                    Pinned
                                </Badge>
                            )}
                        </div>
                    </div>
                    {post.isResolved && post.type === "pertanyaan" && (
                        <Badge className="bg-green-600 text-white border-0 absolute top-3 right-3">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selesai
                        </Badge>
                    )}

                    {/* Popover Aksi: Pastikan event diblokir di dalamnya */}
                    <div
                        className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                        onMouseDown={(e) => e.stopPropagation()} // Ini sangat penting untuk menghentikan klik dari thumbnail/card
                        onClick={(e) => e.stopPropagation()}     // Ini juga penting untuk menghentikan klik dari thumbnail/card
                    >
                        <PostActionsPopover
                            post={post}
                            isBookmarked={isBookmarked}
                            isPostAuthor={isAuthor}
                            onAction={handleAction}
                            isAdmin={isAdmin}
                            isLoggedIn={!!userId}
                        />
                    </div>
                </div>

                {/* Bagian konten kartu (di luar thumbnail) - klik ini juga untuk navigasi */}
                <CardContent
                    className="p-4 cursor-pointer" // Menambahkan cursor-pointer
                    onClick={() => router.push(`/forum/${post.id}`)} // Pindahkan navigasi ke sini
                >
                    <UserProfileClickPopover userId={post.authorId}>
                        <div
                            className="flex items-start gap-3 mb-3 cursor-pointer"
                            onMouseDown={(e) => e.stopPropagation()} // Pastikan ini menghentikan untuk popover user
                            onClick={(e) => e.stopPropagation()}     // Pastikan ini menghentikan untuk popover user
                        >
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                                <AvatarFallback>{post.authorUsername?.[0] || '?'}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{post.authorUsername}</p>
                                <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                            </div>
                            {forumCategory && (
                                <Badge variant="outline" className="text-xs flex-shrink-0">
                                    <CategoryIcon className="h-3 w-3 mr-1" />
                                    {forumCategory.name}
                                </Badge>
                            )}
                        </div>
                    </UserProfileClickPopover>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {post.title}
                    </h3>

                    <p className="text-gray-600 text-sm line-clamp-3 mb-3">{post.description}</p>

                    {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                            {post.tags.slice(0, 3).map((tag, index) => (
                                <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs cursor-pointer hover:bg-blue-100"
                                    onMouseDown={(e) => e.stopPropagation()} // Hentikan propagasi
                                    onClick={(e) => {
                                        e.stopPropagation(); // Hentikan propagasi
                                        onTagClick?.(tag);
                                    }}
                                >
                                    #{tag}
                                </Badge>
                            ))}
                            {post.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                    +{post.tags.length - 3}
                                </Badge>
                            )}
                        </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
                        <div className="flex items-center gap-4">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className={cn("h-6 px-2 text-xs", isLiked ? "text-red-500 hover:text-red-600" : "hover:text-red-500")}
                                onMouseDown={(e) => e.stopPropagation()}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleAction("like");
                                }}
                            >
                                <Heart className={cn("h-4 w-4 mr-1", isLiked ? "fill-current text-red-500" : "")} />
                                {likeCount}
                            </Button>
                            <span className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {post.replies}
                            </span>
                            <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {post.views}
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                                <BookOpenText className="h-3 w-3" />
                                {readingTime}
                            </span>
                        </div>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAction("share-link");
                            }}
                        >
                            <Share2 className="h-4 w-4" />
                        </Button>
                    </div>
                </CardContent>
            </div>

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
            <ReportDialog
                isOpen={isReportDialogOpen}
                onOpenChange={setIsReportDialogOpen}
                reportType="forum_post"
                entityId={post.id}
                entityTitle={post.title}
                entityAuthorId={post.authorId}
                entityAuthorUsername={post.authorUsername}
            />
        </Card>
    );
}