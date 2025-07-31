// /components/forum/PostActionsPopover.tsx
"use client";

import React, { useState, useCallback } from "react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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

import { ForumPostEditDialog } from "./ForumPostEditDialog"; // Import PostEditDialog

interface PostActionsPopoverProps {
    post: ForumPost;
    isBookmarked: boolean;
    isPostAuthor: boolean;
    onAction: (action: string) => Promise<void> | void; // Aksi umum (delete, pin, archive, bookmark, share, report)
    isAdmin: boolean;
    isLoggedIn: boolean;
}

export function PostActionsPopover({
    post,
    isBookmarked,
    isPostAuthor,
    onAction,
    isAdmin,
    isLoggedIn,
}: PostActionsPopoverProps) {
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

    const handleGeneralAction = useCallback(async (action: string) => {
        if (action === "report") {
            setIsReportDialogOpen(true);
        } else {
            // Untuk aksi 'edit', kita tidak memanggil onAction di sini,
            // karena DialogTrigger akan menangani pembukaan modal secara langsung.
            // Untuk aksi lain, panggil onAction.
            if (action !== "edit") {
                await onAction(action);
            }
        }
    }, [onAction]);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 p-0 hover:bg-gray-100"
                    aria-label="Post actions"
                    // PENTING: Stop propagation on the trigger itself
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Opsi post</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
                <div className="space-y-1">
                    {/* Tambahkan e.preventDefault() pada semua onSelect */}
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleGeneralAction("share-link"); }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Salin Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleGeneralAction("share-external"); }}>
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Buka di Tab Baru
                    </DropdownMenuItem>
                    {isLoggedIn && (
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleGeneralAction("bookmark"); }}>
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
                        <DropdownMenuItem onSelect={(e) => { e.preventDefault(); handleGeneralAction("download"); }}>
                            <Download className="h-4 w-4 mr-2" />
                            Unduh Media
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />

                    {isLoggedIn && (isPostAuthor || isAdmin) ? (
                        <>
                            {/* ForumPostEditDialog now directly wraps DropdownMenuItem for 'edit' */}
                            <ForumPostEditDialog
                                postId={post.id}
                                isPostAuthor={isPostAuthor}
                                isAdmin={isAdmin}
                                trigger={
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}> {/* PENTING: e.preventDefault() */}
                                        <Edit className="h-4 w-4 mr-2" />
                                        Edit Post
                                    </DropdownMenuItem>
                                }
                            />

                            {/* Aksi Pin Post (hanya admin) */}
                            {isAdmin && (
                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onAction("pin"); }}>
                                    <Pin className="h-4 w-4 mr-2" />
                                    {post.isPinned ? "Lepas Pin" : "Pin Post"}
                                </DropdownMenuItem>
                            )}
                            {/* Aksi Arsip Post (hanya admin, fitur akan datang) */}
                            {isAdmin && (
                                <DropdownMenuItem onSelect={(e) => { e.preventDefault(); onAction("archive"); }}>
                                    <Archive className="h-4 w-4 mr-2" />
                                    {post.isArchived ? "Buka Arsip" : "Arsipkan"}
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={(e) => { e.preventDefault(); handleGeneralAction("delete"); }}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus Post
                            </DropdownMenuItem>
                        </>
                    ) : (
                        isLoggedIn && (
                            <DropdownMenuItem
                                onSelect={(e) => { e.preventDefault(); handleGeneralAction("report"); }}
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