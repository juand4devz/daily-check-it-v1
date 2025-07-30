// /components/forum/PostActionsPopover.tsx
"use client";

import React, { useState, useCallback } from "react";
import {
    DropdownMenu, // Import DropdownMenu
    DropdownMenuTrigger, // Import DropdownMenuTrigger
    DropdownMenuContent, // Import DropdownMenuContent
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"; // Pastikan semua diimpor dari sini
// Hapus import Popover dan PopoverContent karena tidak digunakan lagi
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
    MoreHorizontal,
    Copy,
    ExternalLink,
    BookmarkPlus,
    BookmarkCheck,
    Download,
    Edit,
    Pin,
    Archive,
    Trash2,
    Flag,
} from "lucide-react";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { ForumPost } from "@/types/forum";

interface PostActionsPopoverProps {
    post: ForumPost;
    isBookmarked: boolean;
    isPostAuthor: boolean;
    onAction: (action: string) => void;
    isAdmin: boolean;
    isLoggedIn: boolean; // Penting: Tambahkan kembali prop ini dari versi sebelumnya
}

export function PostActionsPopover({
    post,
    isBookmarked,
    isPostAuthor,
    onAction,
    isAdmin,
    isLoggedIn, // Terima prop ini
}: PostActionsPopoverProps) {
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

    const handleInternalAction = useCallback((action: string) => {
        if (action === "report") {
            setIsReportDialogOpen(true);
        } else {
            onAction(action);
        }
    }, [onAction]);

    return (
        // Ganti Popover dengan DropdownMenu
        <DropdownMenu>
            {/* Ganti PopoverTrigger dengan DropdownMenuTrigger */}
            <DropdownMenuTrigger asChild>
                <Button type="button" variant="ghost" size="icon" className="h-8 w-8 p-0 hover:bg-gray-100" aria-label="Post actions">
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Opsi post</span>
                </Button>
            </DropdownMenuTrigger>
            {/* Ganti PopoverContent dengan DropdownMenuContent */}
            {/* Pastikan DropdownMenuContent selalu di-render, logika kondisional ada di dalam itemnya */}
            <DropdownMenuContent className="w-56 p-2" align="end">
                <div className="space-y-1">
                    {/* Items yang selalu ada, jika sesuai */}
                    <DropdownMenuItem onSelect={() => handleInternalAction("share-link")}>
                        <Copy className="h-4 w-4 mr-2" />
                        Salin Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => handleInternalAction("share-external")}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Buka di Tab Baru
                    </DropdownMenuItem>
                    {/* Pastikan hanya tampil jika pengguna login, karena bookmark membutuhkan userId */}
                    {isLoggedIn && (
                        <DropdownMenuItem onSelect={() => handleInternalAction("bookmark")}>
                            {isBookmarked ? (
                                <>
                                    <BookmarkCheck className="h-4 w-4 mr-2" />
                                    Hapus Bookmark
                                </>
                            ) : (
                                <>
                                    <BookmarkPlus className="h-4 w-4 mr-2" />
                                    Bookmark
                                </>
                            )}
                        </DropdownMenuItem>
                    )}
                    {post.media && post.media.length > 0 && (
                        <DropdownMenuItem onSelect={() => handleInternalAction("download")}>
                            <Download className="h-4 w-4 mr-2" />
                            Download Media
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />

                    {/* Aksi untuk penulis post atau admin (jika login) */}
                    {isLoggedIn && (isPostAuthor || isAdmin) ? (
                        <>
                            <DropdownMenuItem onSelect={() => handleInternalAction("edit")}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit Post
                            </DropdownMenuItem>
                            {isAdmin && (
                                <DropdownMenuItem onSelect={() => handleInternalAction("pin")}>
                                    <Pin className="h-4 w-4 mr-2" />
                                    {post.isPinned ? "Lepas Pin" : "Pin Post"}
                                </DropdownMenuItem>
                            )}
                            {isAdmin && (
                                <DropdownMenuItem onSelect={() => handleInternalAction("archive")}>
                                    <Archive className="h-4 w-4 mr-2" />
                                    {post.isArchived ? "Buka Arsip" : "Arsipkan"}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() => handleInternalAction("delete")}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus Post
                            </DropdownMenuItem>
                        </>
                    ) : (
                        // Aksi untuk user lain (jika login)
                        isLoggedIn && (
                            <DropdownMenuItem
                                onSelect={() => handleInternalAction("report")}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Flag className="h-4 w-4 mr-2" />
                                Laporkan
                            </DropdownMenuItem>
                        )
                    )}
                </div>
            </DropdownMenuContent>
            <ReportDialog
                isOpen={isReportDialogOpen}
                onOpenChange={setIsReportDialogOpen}
                reportType="forum_post"
                entityId={post.id}
                entityTitle={post.title}
                entityAuthorId={post.authorId}
                entityAuthorUsername={post.authorUsername}
            />
        </DropdownMenu>
    );
}