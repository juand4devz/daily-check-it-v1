// /components/forum/BookmarkCard.tsx
"use client";

import type React from "react";
import Image from "next/image";
import Link from "next/link"; // Import Link for better accessibility
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MessageSquare,
    Heart,
    CheckCircle,
    MoreHorizontal,
    Share2,
    BookmarkX,
    ExternalLink,
    Copy,
    ImageIcon,
    Calendar,
} from "lucide-react";
import type { ForumPost } from "@/types/forum";
import {
    formatTimeAgo,
    getRandomGradient,
    getCategoryIcon,
} from "@/lib/utils/forum-utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Extend ForumPost to include bookmark-specific fields
interface BookmarkedPost extends ForumPost {
    bookmarkedAt: string; // Time when the post was bookmarked
    bookmarkNote?: string; // Optional user note for the bookmark
}

interface BookmarkCardProps {
    post: BookmarkedPost;
    viewMode: "grid" | "list";
    isSelected: boolean; // For bulk delete mode
    bulkDeleteMode: boolean; // To indicate if bulk delete is active
    onToggleSelection: () => void; // Callback to toggle selection
    onAction: (postId: string, action: string) => void; // Callback for various actions
}

export function BookmarkCard({ post, viewMode, isSelected, bulkDeleteMode, onToggleSelection, onAction }: BookmarkCardProps) {
    // This 'hasMedia' check is good, but doesn't remove the need for optional chaining later
    const hasMedia = post.media && post.media.length > 0;
    // Corrected: Use optional chaining for thumbnail access
    const thumbnail = post.media?.[0]?.url ? post.media[0].url : null;
    const CategoryIcon = getCategoryIcon(post.category);

    const handleCopyLink = () => {
        const link = `${window.location.origin}/forum/${post.id}`;
        navigator.clipboard.writeText(link)
            .then(() => toast.success("Tautan postingan berhasil disalin!"))
            .catch(() => toast.error("Gagal menyalin tautan."));
        onAction(post.id, "share-link");
    };

    const handleShareExternal = () => {
        if (navigator.share) {
            navigator.share({
                title: post.title,
                text: post.description,
                url: `${window.location.origin}/forum/${post.id}`,
            })
                .then(() => onAction(post.id, "share-external"))
                .catch((error) => console.error("Error sharing:", error));
        } else {
            toast.info("Fitur berbagi tidak didukung di browser ini. Gunakan 'Salin Link'.");
        }
    };


    // List View
    if (viewMode === "list") {
        return (
            <Card className={cn(
                "hover:shadow-md transition-all duration-300",
                isSelected ? "ring-2 ring-blue-500" : ""
            )}>
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        {/* Checkbox for Bulk Delete */}
                        {bulkDeleteMode && (
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                        e.stopPropagation(); // Prevent card click
                                        onToggleSelection();
                                    }}
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

                        {/* Post Content (Title, Author, Description, Stats) */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-lg line-clamp-1">
                                        <Link
                                            href={`/forum/${post.id}`}
                                            className="hover:text-blue-600 cursor-pointer transition-colors"
                                            onClick={() => onAction(post.id, "view-post")}
                                        >
                                            {post.title}
                                        </Link>
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

                                {/* Actions in Popover (List View) */}
                                <div className="shrink-0">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-48">
                                            <DropdownMenuItem onClick={() => onAction(post.id, "view-post")}>
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
                                                onClick={() => onAction(post.id, "remove-bookmark")}
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
                                            {post.media?.length} {/* Corrected: Use optional chaining */}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400">
                                    <Calendar className="h-3 w-3 inline mr-1" />
                                    {formatTimeAgo(post.bookmarkedAt)}
                                </div>
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
                "hover:shadow-lg transition-all duration-300 group overflow-hidden",
                isSelected ? "ring-2 ring-blue-500" : ""
            )}
        >
            <div
                onClick={() => !bulkDeleteMode && onAction(post.id, "view-post")}
                className={cn("relative", !bulkDeleteMode && "cursor-pointer")}
            >
                {/* Thumbnail Post */}
                <div className="relative h-48 overflow-hidden">
                    {thumbnail ? (
                        <Image
                            src={thumbnail}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            width={500}
                            height={500}
                            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw"
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
                        <div className="absolute top-3 left-3 z-10">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                    e.stopPropagation(); // Prevent card click
                                    onToggleSelection();
                                }}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 bg-white"
                            />
                        </div>
                    )}

                    {/* Status Badges (Category, Resolved) */}
                    <div className={cn("absolute top-3 flex gap-2 z-10", bulkDeleteMode ? "right-3" : "left-3")}>
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
                        <div className="absolute bottom-3 left-3 z-10">
                            <Badge variant="secondary" className="bg-black/50 text-white border-0">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {post.media?.length} {/* Corrected: Use optional chaining */}
                            </Badge>
                        </div>
                    )}

                    {/* Actions Dropdown (Grid View) */}
                    {!bulkDeleteMode && (
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0">
                                        <MoreHorizontal className="h-4 w-4 text-white" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem onClick={() => onAction(post.id, "view-post")}>
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
                                        onClick={() => onAction(post.id, "remove-bookmark")}
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

                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                    <Link
                        href={`/forum/${post.id}`}
                        className="group-hover:text-blue-600 transition-colors"
                        onClick={() => onAction(post.id, "view-post")}
                    >
                        {post.title}
                    </Link>
                </h3>

                <p className="text-gray-600 text-sm line-clamp-3 mb-3">{post.description}</p>

                {post.bookmarkNote && (
                    <p className="text-sm text-blue-700 italic mb-2 line-clamp-1">
                        &quot;Catatan: {post.bookmarkNote}&quot;
                    </p>
                )}

                {/* Tags */}
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

                {/* Stats */}
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
        </Card >
    );
}