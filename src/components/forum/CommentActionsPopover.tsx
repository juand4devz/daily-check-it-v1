// /components/forum/CommentActionsPopover.tsx
"use client";

import React, { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    MoreHorizontal,
    Flag,
    Edit,
    Trash2,
    Link as LinkIcon,
    ExternalLink,
} from "lucide-react";
import {
    DropdownMenu, // PENTING: Import DropdownMenu
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"; // Pastikan semua diimpor dari shadcn/ui
import type { ForumReply } from "@/types/forum";
import { ReportDialog } from "@/components/shared/ReportDialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface CommentActionsPopoverProps {
    reply: ForumReply;
    isAuthor: boolean;
    onAction: (replyId: string, action: string) => void;
    currentUserId: string | undefined;
    isAdmin: boolean;
    postId: string;
    postTitle?: string;
}

export function CommentActionsPopover({
    reply,
    isAuthor,
    onAction,
    currentUserId,
    isAdmin,
    postId,
    postTitle,
}: CommentActionsPopoverProps) {
    const router = useRouter();
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

    const handleInternalAction = useCallback(async (action: string) => {
        if (action === "share-link") {
            await navigator.clipboard.writeText(`${window.location.origin}/forum/${postId}#comment-${reply.id}`);
            toast.success("Link disalin", { description: "Link komentar telah disalin ke clipboard" });
        } else if (action === "share-external") {
            window.open(`${window.location.origin}/forum/${postId}#comment-${reply.id}`, "_blank");
        } else if (action === "report") {
            if (!currentUserId) {
                toast.error("Anda harus login untuk melaporkan.");
                router.push("/login");
                return;
            }
            setIsReportDialogOpen(true);
        } else {
            onAction(reply.id, action); // Delegate to parent for other actions
        }
    }, [reply.id, postId, currentUserId, router, onAction]);

    return (
        <>
            {/* PENTING: Pastikan komponen DropdownMenu membungkus Trigger dan Content */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100">
                        <MoreHorizontal className="h-3 w-3" />
                        <span className="sr-only">Opsi komentar</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 p-2" align="end">
                    <div className="space-y-1">
                        <DropdownMenuItem onSelect={() => handleInternalAction("share-link")}>
                            <LinkIcon className="h-3 w-3 mr-2" />
                            Salin Link
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => handleInternalAction("share-external")}>
                            <ExternalLink className="h-3 w-3 mr-2" />
                            Buka Link
                        </DropdownMenuItem>
                        <Separator className="my-1" />
                        {(isAuthor || isAdmin) ? (
                            <>
                                <DropdownMenuItem onSelect={() => handleInternalAction("edit")}>
                                    <Edit className="h-3 w-3 mr-2" />
                                    Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onSelect={() => handleInternalAction("delete")}
                                    className="text-red-600 focus:text-red-600"
                                >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Hapus
                                </DropdownMenuItem>
                                <Separator className="my-1" />
                            </>
                        ) : null}
                        <DropdownMenuItem
                            onSelect={() => handleInternalAction("report")}
                            className="text-red-600 focus:text-red-600"
                        >
                            <Flag className="h-3 w-3 mr-2" />
                            Laporkan
                        </DropdownMenuItem>
                    </div>
                </DropdownMenuContent>
            </DropdownMenu>
            {/* Report Dialog untuk Komentar */}
            <ReportDialog
                isOpen={isReportDialogOpen}
                onOpenChange={setIsReportDialogOpen}
                reportType="forum_reply"
                entityId={reply.id}
                postIdForReply={postId}
                entityContentPreview={reply.content}
                entityUsername={reply.authorUsername}
                entityAuthorId={reply.authorId}
                entityAuthorUsername={reply.authorUsername}
                entityTitle={postTitle}
            />
        </>
    );
}