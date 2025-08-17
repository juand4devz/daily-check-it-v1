// app/forum/bookmarks/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Search,
    MoreHorizontal,
    Trash2,
    ExternalLink,
    Share2,
    Copy,
    ArrowLeft,
    Heart,
    MessageSquare,
    CheckCircle,
    ImageIcon,
    Calendar,
    BookmarkX,
    Grid3X3,
    List,
    Loader2,
    BookmarkCheck, // Added Loader2 for loading states
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Fuse from "fuse.js";

import { formatTimeAgo } from '@/lib/utils/date-utils';
import { getCategoryIcon, FORUM_CATEGORIES, getRandomGradient } from "@/lib/utils/forum-utils";

// --- Definisi Tipe Internal (dari @/types/forum) ---
import { ForumPost, ForumBookmark } from "@/types/forum";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import BookmarksSkeleton from "./loading";


// Extend ForumPost for bookmarked context
interface BookmarkedPostDisplay extends ForumPost {
    bookmarkedAt: string; // Time when the post was bookmarked
    bookmarkNote?: string; // Optional user note for the bookmark
    bookmarkId: string; // The ID of the bookmark document itself (for deletion)
}

// Komponen BookmarkCard
interface BookmarkCardProps {
    post: BookmarkedPostDisplay;
    viewMode: "grid" | "list";
    isSelected: boolean;
    bulkDeleteMode: boolean;
    onToggleSelection: () => void;
    onAction: (bookmarkId: string, postId: string, action: string) => void;
}

function BookmarkCard({ post, viewMode, isSelected, bulkDeleteMode, onToggleSelection, onAction }: BookmarkCardProps) {
    const hasMedia = post.media && post.media.length > 0;
    const thumbnail = post.media?.[0]?.url || null;
    const CategoryIcon = getCategoryIcon(post.category);

    const handleCopyLink = (event: React.MouseEvent) => {
        event.stopPropagation();
        const link = `${window.location.origin}/forum/${post.id}`;
        navigator.clipboard.writeText(link)
            .then(() => toast.success("Tautan postingan berhasil disalin!"))
            .catch(() => toast.error("Gagal menyalin tautan."));
    };

    const handleShareExternal = (event: React.MouseEvent) => {
        event.stopPropagation();
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.description,
                url: `${window.location.origin}/forum/${post.id}`,
            })
                .catch((error) => console.error("Error sharing:", error));
        } else {
            toast.info("Fitur berbagi tidak didukung di browser ini. Gunakan 'Salin Link'.");
        }
    };

    // Handler untuk event klik pada card utama
    const handleCardClick = () => {
        if (!bulkDeleteMode) {
            onAction(post.bookmarkId, post.id, "view-post");
        }
    };

    // List View
    if (viewMode === "list") {
        return (
            <Card className={cn(
                "hover:shadow-md transition-all duration-300 py-2",
                isSelected ? "ring-2 ring-blue-500" : ""
            )}>
                <CardContent className="p-4 cursor-pointer" onClick={handleCardClick}>
                    <div className="flex gap-4">
                        {/* Checkbox for Bulk Delete */}
                        {bulkDeleteMode && (
                            <div onClick={(e) => e.stopPropagation()}>
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={onToggleSelection}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        {/* Thumbnail Post */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                            {thumbnail ? (
                                <Image
                                    src={thumbnail}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                    width={80}
                                    height={80}
                                    sizes="80px"
                                />
                            ) : (
                                <div className={cn("w-full h-full flex items-center justify-center", getRandomGradient(post.id))}>
                                    <MessageSquare className="h-8 w-8 text-white/80" />
                                </div>
                            )}
                        </div>

                        {/* Post Content (Title, Author, Description, Statistik) */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h3
                                        className="font-semibold text-lg line-clamp-1 hover:text-blue-600 cursor-pointer transition-colors"
                                    >
                                        {post.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                                            <AvatarFallback className="text-xs">{post.authorUsername[0]}</AvatarFallback>
                                        </Avatar>
                                        <span>{post.authorUsername}</span>
                                        <span>•</span>
                                        <span>{formatTimeAgo(post.createdAt)}</span>
                                    </div>
                                </div>

                                {/* Aksi pada Popover (List View) */}
                                <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent className="w-48" align="end">
                                            <DropdownMenuItem onClick={() => onAction(post.bookmarkId, post.id, "view-post")}>
                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                Lihat Post
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleCopyLink}>
                                                <Copy className="h-4 w-4 mr-2" />
                                                Salin Link
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={handleShareExternal}>
                                                <Share2 className="h-4 w-4 mr-2" />
                                                Bagikan
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                                onClick={() => onAction(post.bookmarkId, post.id, "remove-bookmark")}
                                                className="text-red-600 focus:text-red-600"
                                            >
                                                <BookmarkX className="h-4 w-4 mr-2" />
                                                Hapus Bookmark
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.description}</p>

                            {post.bookmarkNote && (
                                <p className="text-sm text-blue-700 italic mb-2 line-clamp-1">
                                    &quot;Catatan: {post.bookmarkNote}&quot;
                                </p>
                            )}

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Heart className="h-4 w-4" />
                                        {post.likes}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4" />
                                        {post.replies}
                                    </span>
                                    {hasMedia && (
                                        <span className="flex items-center gap-1">
                                            <ImageIcon className="h-4 w-4" />
                                            {post.media?.length}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400">Bookmark: {formatTimeAgo(post.bookmarkedAt)}</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Grid View (Default)
    return (
        <Card
            className={cn(
                "hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden p-0",
                isSelected ? "ring-2 ring-blue-500" : ""
            )}
        >
            <div onClick={handleCardClick}>
                {/* Thumbnail Post */}
                <div className="relative h-48 overflow-hidden">
                    {thumbnail ? (
                        <Image
                            src={thumbnail}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            width={500}
                            height={500}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className={cn("w-full h-full relative overflow-hidden flex items-center justify-center", getRandomGradient(post.id))}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <MessageSquare className="h-16 w-16 text-white/80" />
                            </div>
                        </div>
                    )}

                    {/* Checkbox Selection (when bulk delete mode is active) */}
                    {bulkDeleteMode && (
                        <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={onToggleSelection}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 bg-white"
                            />
                        </div>
                    )}

                    {/* Status Badges (Category, Resolved) */}
                    <div className={cn("absolute top-3 flex gap-2 z-10", bulkDeleteMode ? "right-3" : "left-3")} onClick={(e) => e.stopPropagation()}>
                        <Badge variant="secondary" className="bg-black/50 text-white border-0">
                            <CategoryIcon className="h-3 w-3 mr-1" />
                            {post.category}
                        </Badge>
                        {post.isResolved && (
                            <Badge className="bg-green-600 text-white border-0">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Selesai
                            </Badge>
                        )}
                    </div>

                    {/* Media Indicator */}
                    {hasMedia && (
                        <div className="absolute bottom-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                            <Badge variant="secondary" className="bg-black/50 text-white border-0">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {post.media?.length}
                            </Badge>
                        </div>
                    )}

                    {/* Actions Dropdown (Grid View) */}
                    {!bulkDeleteMode && (
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10" onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0">
                                        <MoreHorizontal className="h-4 w-4 text-white" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-48" align="end">
                                    <DropdownMenuItem onClick={() => onAction(post.bookmarkId, post.id, "view-post")}>
                                        <ExternalLink className="h-4 w-4 mr-2" />
                                        Lihat Post
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleCopyLink}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Salin Link
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={handleShareExternal}>
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Bagikan
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        onClick={() => onAction(post.bookmarkId, post.id, "remove-bookmark")}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <BookmarkX className="h-4 w-4 mr-2" />
                                        Hapus Bookmark
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>
            </div>

            <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                        <AvatarFallback>{post.authorUsername[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{post.authorUsername}</p>
                        <p className="text-xs text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                    </div>
                </div>

                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                </h3>

                <p className="text-gray-600 text-sm line-clamp-3 mb-3">{post.description}</p>

                {post.bookmarkNote && (
                    <p className="text-sm text-blue-700 italic mb-2 line-clamp-1">
                        &quot;Catatan: {post.bookmarkNote}&quot;
                    </p>
                )}

                {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                        {post.tags.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
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
                        <span className="flex items-center gap-1">
                            <Heart className="h-4 w-4" />
                            {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                            <MessageSquare className="h-4 w-4" />
                            {post.replies}
                        </span>
                    </div>
                    <div className="text-xs text-gray-400">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {formatTimeAgo(post.bookmarkedAt)}
                    </div>
                </div>
            </CardContent>

            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite;
                }
            `}</style>
        </Card>
    );
}

// --- Komponen Utama BookmarksPage ---
export default function BookmarksPage() {
    const { data: session, status } = useSession();
    const userId = session?.user?.id;

    const [bookmarkedPosts, setBookmarkedPosts] = useState<BookmarkedPostDisplay[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<BookmarkedPostDisplay[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("bookmark-newest");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [loading, setLoading] = useState(true);
    const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set()); // Stores bookmark IDs
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [bookmarkIdToDelete, setBookmarkIdToDelete] = useState<string | null>(null); // For single deletion
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false); // State for delete operation loading

    const router = useRouter();

    // Redirect if not authenticated or user is loading
    useEffect(() => {
        if (status === "loading") {
            setLoading(true); // Keep loading true while session is loading
            return;
        }
        if (!userId) {
            toast.error("Anda harus login untuk melihat bookmark.", { duration: 3000 });
            router.push("/login");
            return;
        }
        setLoading(false); // Set loading false if user is authenticated
    }, [userId, status, router]);

    // Fetch bookmarked posts from API
    useEffect(() => {
        if (!userId) return; // Don't fetch if user not logged in or loading

        const fetchBookmarks = async () => {
            setLoading(true); // Set loading true before fetching
            try {
                const bookmarksResponse = await fetch(`/api/forum/bookmarks?userId=${userId}`);
                if (!bookmarksResponse.ok) {
                    throw new Error("Failed to fetch bookmarks list");
                }
                const bookmarksData = await bookmarksResponse.json();

                if (bookmarksData.status && bookmarksData.data) {
                    const bookmarks: ForumBookmark[] = bookmarksData.data;

                    // Use Promise.all to fetch all post details concurrently
                    const postDetailsPromises = bookmarks.map(async (bookmark) => {
                        const postRes = await fetch(`/api/forum/posts/${bookmark.postId}`);
                        if (postRes.ok) {
                            const postData = await postRes.json();
                            if (postData.status && postData.data) {
                                return {
                                    ...postData.data,
                                    bookmarkedAt: bookmark.bookmarkedAt,
                                    bookmarkNote: bookmark.note,
                                    bookmarkId: bookmark.id,
                                };
                            }
                        }
                        return null; // Return null for posts that couldn't be fetched
                    });

                    const detailedBookmarks = (await Promise.all(postDetailsPromises)).filter(
                        (post): post is BookmarkedPostDisplay => post !== null
                    ); // Filter out nulls and assert type

                    setBookmarkedPosts(detailedBookmarks);
                } else {
                    toast.error("Gagal memuat bookmark", { description: bookmarksData.message });
                }
            } catch (error) {
                console.error("Error fetching bookmarks:", error);
                toast.error("Error", { description: "Gagal memuat data bookmark." });
            } finally {
                setLoading(false);
            }
        };

        fetchBookmarks();
    }, [userId]); // Re-fetch when userId changes

    // Initialize Fuse.js for client-side searching
    const fuse = useMemo(() => {
        const options = {
            keys: [
                "title",
                "description",
                "content", // Assuming ForumPost has a content field
                "authorUsername",
                "tags",
                "category",
                "bookmarkNote", // Search in bookmark notes too
            ],
            threshold: 0.3,
            includeScore: true,
        };
        return new Fuse(bookmarkedPosts, options);
    }, [bookmarkedPosts]);

    // Filter and sort posts every time bookmarkedPosts or filter/sort parameters change
    useEffect(() => {
        let currentFilteredPosts = [...bookmarkedPosts];

        // Search filter using Fuse.js
        if (searchQuery.trim()) {
            const fuseResults = fuse.search(searchQuery.trim());
            currentFilteredPosts = fuseResults.map((result) => result.item);
        }

        // Category filter
        if (selectedCategory !== "all") {
            currentFilteredPosts = currentFilteredPosts.filter((post) => post.category === selectedCategory);
        }

        // Sorting
        currentFilteredPosts.sort((a, b) => {
            switch (sortBy) {
                case "bookmark-newest":
                    return new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime();
                case "bookmark-oldest":
                    return new Date(a.bookmarkedAt).getTime() - new Date(b.bookmarkedAt).getTime();
                case "post-newest":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "post-oldest":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case "most-liked":
                    return b.likes - a.likes;
                case "most-replies":
                    return b.replies - a.replies;
                case "title-asc":
                    return a.title.localeCompare(b.title);
                case "title-desc":
                    return b.title.localeCompare(a.title);
                default:
                    return 0;
            }
        });

        setFilteredPosts(currentFilteredPosts);
    }, [bookmarkedPosts, searchQuery, selectedCategory, sortBy, fuse]);

    // Function to remove a single bookmark (from dialog or card action)
    const removeBookmark = useCallback(async (bookmarkId: string) => {
        setIsDeleting(true); // Set loading state for deletion
        try {
            const response = await fetch(`/api/forum/bookmarks/${bookmarkId}`, { method: "DELETE" });
            const data = await response.json();
            if (!response.ok || !data.status) {
                throw new Error(data.message || "Gagal menghapus bookmark.");
            }
            // Update local state (bookmarkedPosts)
            setBookmarkedPosts((prev) => prev.filter((b) => b.bookmarkId !== bookmarkId));
            setSelectedPosts((prev) => {
                const newSet = new Set(prev);
                newSet.delete(bookmarkId);
                return newSet;
            });
            toast.success("Bookmark dihapus", {
                description: "Post telah dihapus dari bookmark Anda.",
            });
        } catch (error) {
            console.error("Error removing bookmark:", error);
            toast.error("Gagal menghapus bookmark", {
                description: (error as Error).message,
            });
        } finally {
            setIsDeleting(false); // Reset loading state
        }
    }, []);

    // Function to delete selected bookmarks in bulk
    const handleBulkDelete = useCallback(async () => {
        const bookmarkIdsToDelete = Array.from(selectedPosts);
        if (bookmarkIdsToDelete.length === 0) return;

        setIsDeleting(true); // Set loading state for deletion
        try {
            const deletePromises = bookmarkIdsToDelete.map(id =>
                fetch(`/api/forum/bookmarks/${id}`, { method: "DELETE" })
            );
            const responses = await Promise.all(deletePromises);

            let allSucceeded = true;
            const successfullyDeletedIds: string[] = [];

            for (let i = 0; i < responses.length; i++) {
                const res = responses[i];
                const bookmarkId = bookmarkIdsToDelete[i];
                if (!res.ok) {
                    allSucceeded = false;
                    const errorData = await res.json();
                    console.error(`Failed to delete bookmark ${bookmarkId}: ${errorData.message}`);
                } else {
                    successfullyDeletedIds.push(bookmarkId);
                }
            }

            // Update local state by filtering out only successfully deleted bookmarks
            setBookmarkedPosts((prev) => prev.filter((p) => !successfullyDeletedIds.includes(p.bookmarkId)));
            setSelectedPosts(new Set()); // Clear all selections
            setBulkDeleteMode(false); // Exit bulk delete mode

            if (allSucceeded) {
                toast.success("Bookmark dihapus", {
                    description: `${bookmarkIdsToDelete.length} bookmark telah dihapus.`,
                });
            } else {
                toast.warning("Beberapa bookmark gagal dihapus.", {
                    description: `Berhasil menghapus ${successfullyDeletedIds.length} dari ${bookmarkIdsToDelete.length} bookmark. Periksa konsol untuk detail lebih lanjut.`,
                });
            }
        } catch (error) {
            console.error("Error bulk deleting bookmarks:", error);
            toast.error("Gagal menghapus bookmark", {
                description: "Terjadi kesalahan saat menghapus bookmark secara massal.",
            });
        } finally {
            setIsDeleting(false); // Reset loading state
        }
    }, [selectedPosts]);

    // Handler for various actions on bookmark post (view, share, delete)
    const handlePostAction = useCallback(
        async (bookmarkId: string, postId: string, action: string) => {
            try {
                switch (action) {
                    case "remove-bookmark":
                        setBookmarkIdToDelete(bookmarkId); // Set bookmark ID for confirmation dialog
                        setShowDeleteDialog(true); // Show confirmation dialog
                        break;
                    case "share-link":
                        await navigator.clipboard.writeText(`${window.location.origin}/forum/${postId}`);
                        toast.success("Link disalin", { description: "Link post telah disalin ke clipboard." });
                        break;
                    case "share-external":
                        // Use native Web Share API if available, fallback to opening new tab
                        if (navigator.share) {
                            await navigator.share({
                                title: `Lihat post: ${bookmarkedPosts.find(p => p.id === postId)?.title || 'Forum Post'
                                    }`,
                                url: `${window.location.origin}/forum/${postId}`,
                            });
                        } else {
                            window.open(`${window.location.origin}/forum/${postId}`, "_blank");
                        }
                        break;
                    case "download":
                        const postToDownload = bookmarkedPosts.find(p => p.id === postId);
                        if (postToDownload?.media && postToDownload.media.length > 0) {
                            postToDownload.media.forEach((media, index) => {
                                const link = document.createElement("a");
                                link.href = media.url;
                                // Suggest a more robust filename
                                const fileExtension = media.url.split('.').pop()?.split('?')[0] || (media.type === "image" ? "jpg" : "mp4");
                                link.download = `media_bookmark_${postToDownload.id}_${index + 1}.${fileExtension}`;
                                link.target = "_blank";
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            });
                            toast.info("Download dimulai", { description: "Media sedang diunduh." });
                        } else {
                            toast.info("Tidak ada media", { description: "Post ini tidak memiliki media untuk diunduh." });
                        }
                        break;
                    case "view-post":
                        router.push(`/forum/${postId}`);
                        break;
                }
            } catch (error) {
                console.error("Error handling post action:", error);
                toast.error("Gagal melakukan aksi", {
                    description: "Terjadi kesalahan saat melakukan aksi.",
                });
            }
        },
        [bookmarkedPosts, router],
    );

    // Function to toggle post selection (for bulk delete mode)
    const togglePostSelection = useCallback((bookmarkId: string) => {
        setSelectedPosts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(bookmarkId)) {
                newSet.delete(bookmarkId);
            } else {
                newSet.add(bookmarkId);
            }
            return newSet;
        });
    }, []);

    // Function to select all filtered posts
    const selectAllPosts = useCallback(() => {
        setSelectedPosts(new Set(filteredPosts.map((p) => p.bookmarkId)));
    }, [filteredPosts]);

    // Function to clear all selections
    const clearSelection = useCallback(() => {
        setSelectedPosts(new Set());
    }, []);

    // Calculate category statistics based on existing bookmarks
    const getCategoryStats = useMemo(() => {
        const statsMap = new Map<string, { value: string; label: string; count: number; }>();
        FORUM_CATEGORIES.forEach(cat => {
            statsMap.set(cat.id, { value: cat.id, label: cat.name, count: 0 });
        });

        bookmarkedPosts.forEach(post => {
            if (statsMap.has(post.category)) {
                statsMap.get(post.category)!.count++;
            } else {
                // Handle cases where a bookmark might refer to a category not in FORUM_CATEGORIES
                statsMap.set(post.category, { value: post.category, label: post.category, count: 1 });
            }
        });

        const allCategoriesStats = Array.from(statsMap.values());

        // Add "Semua Kategori" at the beginning
        allCategoriesStats.unshift({
            value: "all",
            label: "Semua Kategori",
            count: bookmarkedPosts.length,
        });

        return allCategoriesStats;
    }, [bookmarkedPosts]);

    // Calculate quick statistics
    const getQuickStats = useMemo(() => {
        const totalBookmarks = bookmarkedPosts.length;
        const categoriesCount = new Set(bookmarkedPosts.map((p) => p.category)).size;
        const thisWeekBookmarks = bookmarkedPosts.filter((p) => {
            const bookmarkDate = new Date(p.bookmarkedAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return bookmarkDate >= weekAgo;
        }).length;
        const resolvedBookmarks = bookmarkedPosts.filter((p) => p.isResolved).length;

        return { totalBookmarks, categoriesCount, thisWeekBookmarks, resolvedBookmarks };
    }, [bookmarkedPosts]);

    const stats = getQuickStats; // Alias for ease of use

    // Show loading skeleton if status is loading or if data is being fetched
    if (loading) {
        return <BookmarksSkeleton />;
    }

    // If no bookmarks and no search/filter applied
    if (bookmarkedPosts.length === 0 && !searchQuery.trim() && selectedCategory === "all") {
        return (
            <div className="w-full px-4 py-8">
                <Card className="text-center py-12">
                    <CardContent>
                        <BookmarkX className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold mb-4">Belum Ada Bookmark Tersimpan</h3>
                        <p className="text-gray-600 mb-6">
                            Mulai bookmark post yang menarik bagi Anda dari forum untuk disimpan di sini.
                        </p>
                        <Button onClick={() => router.push("/forum")}>Jelajahi Forum</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="w-full px-4 py-4">
            {/* Header Halaman */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="shrink-0">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                </div>
                {/* Kontrol Mode Bulk Delete (ditempatkan lebih dekat ke daftar post) */}
                <div className="flex-grow flex justify-end items-center gap-2 md:order-last md:justify-start lg:justify-end">
                    {bulkDeleteMode && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={selectAllPosts}
                                disabled={selectedPosts.size === filteredPosts.length || filteredPosts.length === 0}
                            >
                                Pilih Semua
                            </Button>
                            <Button variant="outline" size="sm" onClick={clearSelection} disabled={selectedPosts.size === 0}>
                                Batal Pilih
                            </Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={selectedPosts.size === 0 || isDeleting} // Disable during deletion
                            >
                                {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                                Hapus ({selectedPosts.size})
                            </Button>
                        </>
                    )}
                    <Button
                        variant={bulkDeleteMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            setBulkDeleteMode(!bulkDeleteMode);
                            setSelectedPosts(new Set()); // Clear selection when toggling mode
                        }}
                    >
                        {bulkDeleteMode ? "Selesai" : "Kelola"}
                    </Button>
                </div>
            </div>

            <div>
                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                    <BookmarkCheck className="h-14 w-14" />
                    Bookmark Saya
                </h1>
                <p className="text-gray-600 mb-8">Koleksi post yang telah Anda simpan</p>
            </div>

            {/* Statistik Cepat */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalBookmarks}</div>
                        <div className="text-sm text-gray-600">Total Bookmark</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.categoriesCount}</div>
                        <div className="text-sm text-gray-600">Kategori Unik</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.thisWeekBookmarks}</div>
                        <div className="text-sm text-gray-600">Bookmark Minggu Ini</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{stats.resolvedBookmarks}</div>
                        <div className="text-sm text-gray-600">Yang Terselesaikan</div>
                    </CardContent>
                </Card>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Kolom Kiri: Konten Utama (Filter dan Daftar Post) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Filter dan Kontrol Tampilan */}
                    <Card className="p-0">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4">
                                {/* Pencarian dan Toggle Tampilan */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Cari bookmark..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10"
                                                disabled={isDeleting} // Disable search during deletion
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-between"> {/* Pindahkan tombol view mode ke kanan */}
                                    {/* Filter Kategori dan Urutkan Berdasarkan */}
                                    <div className="flex flex-col md:flex-row gap-4">
                                        <Select value={selectedCategory} onValueChange={setSelectedCategory} disabled={isDeleting}> {/* Disable during deletion */}
                                            <SelectTrigger className="w-full md:w-48">
                                                <SelectValue placeholder="Filter Kategori" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {getCategoryStats.map((category) => (
                                                    <SelectItem key={category.value} value={category.value}>
                                                        {category.label} ({category.count})
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select value={sortBy} onValueChange={setSortBy} disabled={isDeleting}> {/* Disable during deletion */}
                                            <SelectTrigger className="w-full md:w-48">
                                                <SelectValue placeholder="Urutkan" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="bookmark-newest">Bookmark Terbaru</SelectItem>
                                                <SelectItem value="bookmark-oldest">Bookmark Terlama</SelectItem>
                                                <SelectItem value="post-newest">Post Terbaru</SelectItem>
                                                <SelectItem value="post-oldest">Post Terlama</SelectItem>
                                                <SelectItem value="most-liked">Paling Disukai</SelectItem>
                                                <SelectItem value="most-replies">Paling Banyak Balasan</SelectItem>
                                                <SelectItem value="title-asc">Judul A-Z</SelectItem>
                                                <SelectItem value="title-desc">Judul Z-A</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex gap-4">
                                        <Button
                                            variant={viewMode === "grid" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setViewMode("grid")}
                                        >
                                            <Grid3X3 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={viewMode === "list" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setViewMode("list")}
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Daftar Post Bookmark */}
                    {filteredPosts.length > 0 ? (
                        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
                            {filteredPosts.map((post) => (
                                <BookmarkCard
                                    key={post.bookmarkId} // Use bookmarkId as key
                                    post={post}
                                    viewMode={viewMode}
                                    isSelected={selectedPosts.has(post.bookmarkId)} // Check against bookmarkId
                                    bulkDeleteMode={bulkDeleteMode}
                                    onToggleSelection={() => togglePostSelection(post.bookmarkId)} // Toggle bookmarkId
                                    onAction={handlePostAction}
                                />
                            ))}
                        </div>
                    ) : (
                        // Message if no bookmarks match filter/search
                        <Card>
                            <CardContent className="p-8 text-center">
                                <BookmarkX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                    {searchQuery.trim() || selectedCategory !== "all" ? "Tidak ada bookmark ditemukan" : "Belum ada bookmark"}
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    {searchQuery.trim() || selectedCategory !== "all"
                                        ? "Coba ubah filter atau kata kunci pencarian Anda."
                                        : "Mulai bookmark post yang menarik bagi Anda dari forum untuk disimpan di sini."}
                                </p>
                                {(searchQuery.trim() || selectedCategory !== "all") && (
                                    <Button onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>Reset Filter</Button>
                                )}
                                {!searchQuery.trim() && selectedCategory === "all" && (
                                    <Button onClick={() => router.push("/forum")}>Jelajahi Forum</Button>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Right Column: Sidebar (Categories & Latest Bookmarks) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Category Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Kategori</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {getCategoryStats.map((category) => (
                                <button
                                    key={category.value}
                                    onClick={() => setSelectedCategory(category.value)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg transition-all duration-200",
                                        selectedCategory === category.value ? "bg-blue-100 text-blue-800 shadow-sm" : "hover:bg-gray-100",
                                        isDeleting && "opacity-50 cursor-not-allowed" // Disable during deletion
                                    )}
                                    disabled={isDeleting}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{category.label}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {category.count}
                                        </Badge>
                                    </div>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Latest Bookmarks Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Bookmark Terbaru</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <ScrollArea className="h-64">
                                {bookmarkedPosts.length > 0 ? (
                                    bookmarkedPosts.slice(0, 10).sort((a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime()).map((post) => (
                                        <div
                                            key={post.bookmarkId}
                                            className={cn("flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors mb-2", isDeleting && "opacity-50 cursor-not-allowed")} // Disable during deletion
                                            onClick={() => !isDeleting && router.push(`/forum/${post.id}`)} // Prevent navigation during deletion
                                        >
                                            <Avatar className="h-6 w-6">
                                                <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                                                <AvatarFallback className="text-xs">{post.authorUsername[0]}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium line-clamp-2">{post.title}</p>
                                                <p className="text-xs text-gray-500">Bookmark: {formatTimeAgo(post.bookmarkedAt)}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500 text-center py-4">Tidak ada bookmark terbaru.</p>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Delete Bookmark Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Bookmark</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus{" "}
                            {selectedPosts.size > 0 ? `${selectedPosts.size} bookmark ini` : "bookmark ini"}? Tindakan ini tidak dapat
                            dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (selectedPosts.size > 0) {
                                    handleBulkDelete(); // Call bulk delete if any are selected
                                } else if (bookmarkIdToDelete) {
                                    removeBookmark(bookmarkIdToDelete); // Call single delete
                                }
                                setBookmarkIdToDelete(null); // Clear ID to delete
                                setShowDeleteDialog(false); // Close dialog
                            }}
                            className="bg-red-600 hover:bg-red-700"
                            disabled={isDeleting} // Disable action button during deletion
                        >
                            {isDeleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}