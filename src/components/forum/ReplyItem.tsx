// /components/forum/ReplyItem.tsx
"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Diperlukan untuk EmojiReactionPopover
import { Progress } from "@/components/ui/progress"; // Tambahkan import Progress
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
    ChevronUp,
    ChevronDown,
    MessageSquare,
    Award,
    CheckCircle,
    X,
    Loader2,
    Send,
    Copy, // Digunakan di MarkdownEditor untuk "Salin URL"
    Link as LinkIcon, // Digunakan di MarkdownEditor untuk "Sisipkan URL"
    Image as ImageIcon, // Digunakan di MarkdownEditor untuk icon preview
    Video, // Digunakan di MarkdownEditor untuk icon preview
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
    ForumReply,
    EMOJI_REACTIONS,
    ForumMedia,
} from "@/types/forum";
import { formatTimeAgo } from "@/lib/utils/date-utils";
import { MarkdownEditor } from "./markdown-editor";
import { Input } from "@/components/ui/input";
import { MediaViewer } from "./media-viewer";
import { UserProfileClickPopover } from "@/components/user/UserProfileClickPopover";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

// Import komponen Popover yang sudah dipisah
import { EmojiReactionPopover } from "./EmojiReactionPopover";
import { CommentActionsPopover } from "./CommentActionsPopover";
import { ReportDialog } from "@/components/shared/ReportDialog";

// NEW INTERFACE: Untuk mengelola file media di state inline reply
interface InlineMediaFile {
    file: File;
    id: string;
    previewUrl: string;
    uploading: boolean;
    progress: number;
    uploadedMediaData?: ForumMedia;
}

export interface ProcessedForumReply extends ForumReply {
    children: ProcessedForumReply[];
}

interface ReplyItemProps {
    reply: ProcessedForumReply;
    postId: string;
    postTitle?: string;
    postAuthorId: string;
    onVote: (replyId: string, voteType: "up" | "down", currentVoteStatus: "up" | "down" | null) => Promise<void>;
    // PERUBAHAN: currentUserReactions sekarang string | null
    onReaction: (replyId: string, reactionKey: string, hasReacted: boolean) => Promise<void>; // Prop ini tetap sama, logika penanganan ada di dalamnya
    onMarkAsSolution: (replyId: string, isCurrentlySolution: boolean) => Promise<void>;
    onCommentAction: (replyId: string, action: string) => void;
    currentUserVoteStatus: "up" | "down" | null;
    // PERUBAHAN PENTING: Tipe currentUserReactions menjadi string (kunci reaksi) atau null
    currentUserReactions: string | null;
    onSubmitReply: (content: string, mediaFiles: ForumMedia[], parentId?: string, mentionedUserIds?: string[]) => Promise<void>;
    isSubmittingReply: boolean;
    isNested?: boolean;
    currentUserId: string | undefined;
    isAdmin: boolean;
    isHighlighted?: boolean;
    uploadMediaToImageKit: (file: File, onProgress: (p: number) => void) => Promise<ForumMedia | null>;
    allAvailableMentions: { id: string; username: string }[];
}

const COMMENT_TRUNCATE_LIMIT = 500;

const highlightMentions = (text: string): string => {
    return text.replace(/@(\w+)/g, '<span class="text-blue-500 font-semibold">@$1</span>');
};

const extractMentions = (text: string): string[] => {
    const mentionRegex = /@(\w+)/g;
    const matches = text.match(mentionRegex);
    if (!matches) return [];
    return matches.map(match => match.substring(1));
};

export function ReplyItem({
    reply,
    postId,
    postTitle,
    postAuthorId,
    onVote,
    onReaction,
    onMarkAsSolution,
    onCommentAction,
    currentUserVoteStatus,
    currentUserReactions, // Ini sekarang adalah string | null
    onSubmitReply,
    isSubmittingReply,
    isNested = false,
    currentUserId,
    isAdmin,
    isHighlighted = false,
    uploadMediaToImageKit,
    allAvailableMentions,
}: ReplyItemProps) {
    const router = useRouter();
    const [isInlineReplyExpanded, setIsInlineReplyExpanded] = useState(false);
    const [inlineReplyContent, setInlineReplyContent] = useState<string>("");

    const [inlineReplyMediaFiles, setInlineReplyMediaFiles] = useState<InlineMediaFile[]>([]);
    const inlineReplyMediaPreviews = useMemo(() => {
        return inlineReplyMediaFiles.map(fileItem => ({
            id: fileItem.id,
            url: fileItem.previewUrl,
            filename: fileItem.file?.name || 'media',
            uploading: fileItem.uploading,
            progress: fileItem.progress,
            uploadedUrl: fileItem.uploadedMediaData?.url,
            type: fileItem.file.type.startsWith('image/') ? 'image' : fileItem.file.type.startsWith('video/') ? 'video' : undefined, // Tambahkan tipe
        }));
    }, [inlineReplyMediaFiles]);


    const inlineReplyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
    const itemRef = useRef<HTMLDivElement>(null);

    const [isContentExpanded, setIsContentExpanded] = useState(false);
    const showReadMore = reply.content.length > COMMENT_TRUNCATE_LIMIT;
    const displayedContent = isContentExpanded
        ? reply.content
        : reply.content.slice(0, COMMENT_TRUNCATE_LIMIT) + (showReadMore ? "..." : "");

    const [showNestedReplies, setShowNestedReplies] = useState(false);
    // const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false); // Tidak digunakan
    const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);

    const [showMentionPopover, setShowMentionPopover] = useState(false);
    const [mentionQuery, setMentionQuery] = useState("");
    const [mentionCaretPosition, setMentionCaretPosition] = useState(0);

    const isReplyAuthor = reply.authorId === currentUserId;
    const isPostAuthor = postAuthorId === currentUserId;

    const filteredMentions = useMemo(() => {
        if (!mentionQuery) return allAvailableMentions;
        const lowerCaseQuery = mentionQuery.toLowerCase();
        return allAvailableMentions.filter(user =>
            user.username.toLowerCase().includes(lowerCaseQuery)
        );
    }, [mentionQuery, allAvailableMentions]);

    const handleInlineMediaFilesChange = useCallback(async (files: File[]) => {
        if (files.length === 0) {
            setInlineReplyMediaFiles([]);
            return;
        }
        if (inlineReplyMediaFiles.length >= 1) {
            toast.error("Maksimal 1 media per balasan.");
            return;
        }

        const file = files[0];
        if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) { // Izinkan video
            toast.error("Hanya file gambar atau video yang diizinkan.");
            return;
        }

        const tempId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        const previewUrl = URL.createObjectURL(file);

        setInlineReplyMediaFiles(prev => [...prev, {
            file,
            id: tempId,
            previewUrl,
            uploading: true,
            progress: 0,
        }]);

        try {
            const uploadedMedia = await uploadMediaToImageKit(file, (p: number) => {
                setInlineReplyMediaFiles(prev =>
                    prev.map(item => item.id === tempId ? { ...item, progress: p } : item)
                );
            });

            if (uploadedMedia) {
                toast.success(`Media "${file.name}" berhasil diunggah.`);
                setInlineReplyMediaFiles(prev =>
                    prev.map(item => item.id === tempId ? { ...item, uploading: false, progress: 100, uploadedMediaData: uploadedMedia } : item)
                );
            } else {
                toast.error(`Gagal mengunggah media "${file.name}".`);
                setInlineReplyMediaFiles(prev => prev.filter(item => item.id !== tempId));
            }
        } catch (error) {
            console.error("Error uploading inline media:", error);
            toast.error("Gagal mengunggah media inline.");
            setInlineReplyMediaFiles(prev => prev.filter(item => item.id !== tempId));
        }
    }, [inlineReplyMediaFiles, uploadMediaToImageKit]);

    const handleRemoveInlineMedia = useCallback((idToRemove: string) => {
        setInlineReplyMediaFiles(prev => {
            const itemToRemove = prev.find(item => item.id === idToRemove);
            if (itemToRemove && itemToRemove.previewUrl) {
                URL.revokeObjectURL(itemToRemove.previewUrl);
            }
            return prev.filter(item => item.id !== idToRemove);
        });
        toast.info("Media dihapus.");
    }, []);


    const handleReplySubmit = async () => {
        const isAnyMediaUploading = inlineReplyMediaFiles.some(item => item.uploading);
        const isAnyMediaUploadFailed = inlineReplyMediaFiles.some(item => !item.uploadedMediaData && !item.uploading);

        if (isAnyMediaUploading) {
            toast.error("Tunggu! Ada media yang masih diunggah. Harap tunggu hingga upload selesai.");
            return;
        }
        if (isAnyMediaUploadFailed) {
            toast.error("Ada media yang gagal diunggah. Harap hapus atau coba unggah ulang.");
            return;
        }
        if (!inlineReplyContent.trim() && inlineReplyMediaFiles.length === 0) {
            toast.error("Balasan tidak boleh kosong.");
            return;
        }

        const mentionedUsernamesFromContent = extractMentions(inlineReplyContent);
        const mentionedUserIds = mentionedUsernamesFromContent
            .map(mUsername => allAvailableMentions.find(u => u.username === mUsername)?.id)
            .filter(Boolean) as string[];

        const finalMediaForSubmission: ForumMedia[] = inlineReplyMediaFiles
            .filter(item => item.uploadedMediaData)
            .map(item => item.uploadedMediaData!);

        await onSubmitReply(inlineReplyContent, finalMediaForSubmission, reply.id, mentionedUserIds);

        setInlineReplyContent("");
        setInlineReplyMediaFiles([]);
        setIsInlineReplyExpanded(false);
        setShowMentionPopover(false);
        setMentionQuery("");
    };

    useEffect(() => {
        if (isInlineReplyExpanded && inlineReplyTextareaRef.current) {
            inlineReplyTextareaRef.current.focus();
            const length = inlineReplyTextareaRef.current.value.length;
            inlineReplyTextareaRef.current.setSelectionRange(length, length);
        }
    }, [isInlineReplyExpanded]);

    // PERUBAHAN: hasUserReactedWith sekarang memeriksa string | null
    const hasUserReactedWith = useCallback((reactionKey: string): boolean => {
        return currentUserReactions === reactionKey;
    }, [currentUserReactions]);

    const displayedChildren = showNestedReplies ? reply.children : [];

    const handleMarkdownEditorChange = (value: string) => {
        setInlineReplyContent(value);

        const textarea = inlineReplyTextareaRef.current;
        if (!textarea) {
            setShowMentionPopover(false);
            setMentionQuery("");
            return;
        }

        const cursorPosition = textarea.selectionStart;
        setMentionCaretPosition(cursorPosition);

        const textBeforeCaret = value.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCaret.lastIndexOf('@');

        if (lastAtIndex !== -1 && (lastAtIndex === 0 || /\s|\n/.test(textBeforeCaret[lastAtIndex - 1]))) {
            const potentialMention = textBeforeCaret.substring(lastAtIndex + 1);
            if (!/\s|\n/.test(potentialMention)) {
                setMentionQuery(potentialMention);
                setShowMentionPopover(true);
            } else {
                setShowMentionPopover(false);
                setMentionQuery("");
            }
        } else {
            setShowMentionPopover(false);
            setMentionQuery("");
        }
    };

    const handleMentionSelect = (username: string) => {
        const textarea = inlineReplyTextareaRef.current;
        if (!textarea) return;

        const textBeforeCaret = inlineReplyContent.substring(0, mentionCaretPosition);
        const lastAtIndex = textBeforeCaret.lastIndexOf('@');

        if (lastAtIndex !== -1) {
            const newContent =
                inlineReplyContent.substring(0, lastAtIndex) +
                `@${username} ` +
                inlineReplyContent.substring(mentionCaretPosition);

            setInlineReplyContent(newContent);
            setShowMentionPopover(false);
            setMentionQuery("");

            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(lastAtIndex + `@${username} `.length, lastAtIndex + `@${username} `.length);
            }, 0);
        }
    };


    return (
        <Card
            id={`comment-${reply.id}`}
            ref={itemRef}
            className={cn(
                reply.isSolution ? "border-green-200 border-2 bg-green-50/50 dark:bg-green-900/20" : "",
                isHighlighted && "animate-highlight border-blue-500 border-2 shadow-lg",
                "flex-col"
            )}
        >
            <CardContent className="p-4">
                <div className="flex gap-3">
                    {!isNested && (
                        <div className="flex flex-col items-center gap-1 mr-2">
                            <Button
                                type="button"
                                variant={currentUserVoteStatus === "up" ? "default" : "ghost"}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => onVote(reply.id, "up", currentUserVoteStatus)}
                                disabled={!currentUserId}
                            >
                                <ChevronUp className="h-4 w-4" />
                            </Button>
                            <span className="text-sm font-medium text-center min-w-[2rem]">
                                {reply.upvotes - reply.downvotes}
                            </span>
                            <Button
                                type="button"
                                variant={currentUserVoteStatus === "down" ? "default" : "ghost"}
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => onVote(reply.id, "down", currentUserVoteStatus)}
                                disabled={!currentUserId}
                            >
                                <ChevronDown className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 w-full">
                                {/* Menggunakan UserProfileClickPopover untuk avatar/username */}
                                <UserProfileClickPopover userId={reply.authorId}>
                                    <div
                                        className="flex items-center gap-2 cursor-pointer"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Avatar className={cn(isNested ? "h-7 w-7 border border-gray-300" : "h-9 w-9 border-2 border-blue-400")}>
                                            <AvatarImage src={reply.authorAvatar || "/placeholder.svg"} />
                                            <AvatarFallback className={cn(isNested ? "bg-gray-100 text-gray-600" : "bg-blue-200 text-blue-800 font-semibold")}>{reply.authorUsername?.[0] || '?'}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium hover:underline">
                                            {reply.authorUsername}
                                        </span>
                                    </div>
                                </UserProfileClickPopover>
                                <span className="text-sm text-gray-500 ml-2">
                                    {formatTimeAgo(reply.createdAt)}
                                </span>
                                {reply.isSolution && (
                                    <Badge className="bg-green-600 text-white">
                                        <Award className="h-3 w-3 mr-1" />
                                        Solusi
                                    </Badge>
                                )}
                                {reply.isEdited && (
                                    <Badge variant="outline" className="text-xs">
                                        Diedit
                                    </Badge>
                                )}
                            </div>
                            <CommentActionsPopover
                                reply={reply}
                                isAuthor={isReplyAuthor}
                                onAction={onCommentAction}
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                                postId={postId}
                                postTitle={postTitle}
                            />
                        </div>

                        <div className={
                            isNested ? (
                                "prose prose-sm max-w-none dark:prose-invert"
                            ) : (
                                "prose prose-sm max-w-none dark:prose-invert mb-2"
                            )
                        }>
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>{highlightMentions(displayedContent)}</ReactMarkdown>
                            {showReadMore && (
                                <Button type="button" variant="link" onClick={() => setIsContentExpanded(!isContentExpanded)} className="p-0 h-auto">
                                    {isContentExpanded ? "Sembunyikan" : "Baca Selengkapnya"}
                                </Button>
                            )}
                        </div>

                        {reply.media && reply.media.length > 0 && (
                            <div className="mb-3">
                                <MediaViewer media={reply.media} />
                            </div>
                        )}

                        {!isNested && (
                            <div className="flex items-center gap-2 text-sm">
                                {/* PERBAIKAN: onSelect sekarang akan mengirim reactionKey yang dipilih dan apakah user sudah mereaksi itu sebelumnya */}
                                <EmojiReactionPopover
                                    onSelect={(reactionKey) => onReaction(reply.id, reactionKey, hasUserReactedWith(reactionKey))}
                                    currentUserReactions={currentUserReactions !== null ? [currentUserReactions] : []} // Mengubah single reactionKey menjadi array untuk EmojiReactionPopover
                                    replyReactions={reply.reactions || {}}
                                    disabled={!currentUserId}
                                />
                                {EMOJI_REACTIONS.map((reaction) => {
                                    const count = reply.reactions?.[reaction.key]?.length || 0;
                                    // PERUBAHAN: isActive sekarang membandingkan dengan reactionKey tunggal dari currentUserReactions
                                    const isActive = currentUserReactions === reaction.key;

                                    // Hanya tampilkan emoji jika ada yang bereaksi atau jika itu adalah reaksi aktif user
                                    if (count === 0 && !isActive) return null;

                                    return (
                                        <Button
                                            type="button"
                                            key={reaction.key}
                                            variant="outline"
                                            size="sm"
                                            className={cn(
                                                "h-6 px-2 text-xs flex items-center gap-1",
                                                isActive && "bg-blue-100 text-blue-600 border-blue-200",
                                            )}
                                            // onReaction akan menangani logika un-react jika isActive true
                                            onClick={() => onReaction(reply.id, reaction.key, isActive)}
                                            disabled={!currentUserId}
                                        >
                                            {reaction.emoji}
                                            {count > 0 && <span className="font-medium">{count}</span>}
                                        </Button>
                                    );
                                })}

                                {(isPostAuthor || isAdmin) && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onMarkAsSolution(reply.id, reply.isSolution)}
                                        className={`h-6 px-2 text-xs ${reply.isSolution ? "text-green-600 hover:text-red-700" : "text-gray-600 hover:text-green-700"}`}
                                        disabled={!currentUserId}
                                    >
                                        {reply.isSolution ? (
                                            <>
                                                <X className="h-3 w-3 mr-1" />
                                                Batalkan Solusi
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                Tandai Solusi
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        )}

                        {reply.children && reply.children.length > 0 && (
                            <div className="ml-4 mt-4 space-y-4 border-l pl-4">
                                {showNestedReplies &&
                                    displayedChildren.map((childReply) => (
                                        <ReplyItem
                                            key={childReply.id}
                                            reply={childReply}
                                            postId={postId}
                                            postTitle={postTitle}
                                            postAuthorId={postAuthorId}
                                            onVote={onVote}
                                            onReaction={onReaction}
                                            onMarkAsSolution={onMarkAsSolution}
                                            onCommentAction={onCommentAction}
                                            currentUserId={currentUserId}
                                            isAdmin={isAdmin}
                                            currentUserVoteStatus={
                                                currentUserId && childReply.upvotedBy.includes(currentUserId) ? "up" :
                                                    currentUserId && childReply.downvotedBy.includes(currentUserId) ? "down" : null
                                            }
                                            // PERUBAHAN: currentUserReactions di sini untuk nested ReplyItem
                                            // Ambil reaksi tunggal dari childReply.reactions jika user saat ini ada di sana
                                            currentUserReactions={
                                                currentUserId ? (
                                                    EMOJI_REACTIONS.find(emoji => childReply.reactions?.[emoji.key]?.includes(currentUserId))?.key || null
                                                ) : null
                                            }
                                            onSubmitReply={onSubmitReply}
                                            isSubmittingReply={isSubmittingReply}
                                            isNested={true}
                                            isHighlighted={false}
                                            uploadMediaToImageKit={uploadMediaToImageKit}
                                            allAvailableMentions={allAvailableMentions}
                                        />
                                    ))}
                                <Button
                                    type="button"
                                    variant="link"
                                    size="sm"
                                    onClick={() => setShowNestedReplies(!showNestedReplies)}
                                    className="w-full justify-start pl-0 text-sm font-medium"
                                >
                                    {showNestedReplies ? (
                                        <>
                                            <ChevronUp className="h-4 w-4 mr-2" />
                                            Sembunyikan Balasan ({reply.children.length})
                                        </>
                                    ) : (
                                        <>
                                            <ChevronDown className="h-4 w-4 mr-2" />
                                            Lihat Balasan ({reply.children.length})
                                        </>
                                    )}
                                </Button>
                            </div>
                        )}

                        {!isNested && currentUserId && (
                            <div className="mt-4 border-t pt-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex-1 relative">
                                        {!isInlineReplyExpanded ? (
                                            <div className="flex items-center gap-2 w-full">
                                                <Input
                                                    placeholder={`Balas komentar...`}
                                                    value={inlineReplyContent}
                                                    onChange={(e) => setInlineReplyContent(e.target.value)}
                                                    onFocus={() => setIsInlineReplyExpanded(true)}
                                                    className="flex-1"
                                                    disabled={isSubmittingReply}
                                                />
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={handleReplySubmit}
                                                    disabled={(!inlineReplyContent.trim() && inlineReplyMediaFiles.length === 0) || isSubmittingReply}
                                                    className="shrink-0"
                                                >
                                                    {isSubmittingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                                    <span className="sr-only">Kirim</span>
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <MarkdownEditor
                                                    textareaRef={inlineReplyTextareaRef}
                                                    value={inlineReplyContent}
                                                    onChange={handleMarkdownEditorChange}
                                                    onMediaFilesChange={handleInlineMediaFilesChange}
                                                    mediaPreviews={inlineReplyMediaFiles.map(p => ({
                                                        id: p.id,
                                                        url: p.previewUrl,
                                                        filename: p.file?.name || 'media',
                                                        uploading: p.uploading,
                                                        progress: p.progress,
                                                        uploadedUrl: p.uploadedMediaData?.url,
                                                        type: p.file.type.startsWith('image/') ? 'image' : p.file.type.startsWith('video/') ? 'video' : undefined,
                                                    }))}
                                                    placeholder={`Balas komentar...`}
                                                    rows={3}
                                                    disabled={isSubmittingReply || inlineReplyMediaFiles.some(f => f.uploading)}
                                                    isUploadingMedia={inlineReplyMediaFiles.some(f => f.uploading)} // Tambahkan prop ini
                                                    showMediaInput={true}
                                                    onRemoveMedia={handleRemoveInlineMedia}
                                                    allAvailableMentions={allAvailableMentions}
                                                />
                                                {showMentionPopover && filteredMentions.length > 0 && (
                                                    <div
                                                        className="absolute z-50 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto"
                                                        style={{
                                                            top: 'calc(100% + 8px)',
                                                            left: '0px',
                                                            width: '100%',
                                                        }}
                                                    >
                                                        <div className="p-2 text-sm text-muted-foreground border-b">Saran Mention:</div>
                                                        {filteredMentions.map((user) => (
                                                            <div
                                                                key={user.id}
                                                                className="px-3 py-2 cursor-pointer hover:bg-accent hover:text-accent-foreground"
                                                                onClick={() => handleMentionSelect(user.username)}
                                                            >
                                                                @{user.username}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                {showMentionPopover && filteredMentions.length === 0 && mentionQuery.length > 0 && (
                                                    <div
                                                        className="absolute z-50 bg-popover border rounded-md shadow-lg p-2 text-sm text-muted-foreground"
                                                        style={{
                                                            top: 'calc(100% + 8px)',
                                                            left: '0px',
                                                            width: '100%',
                                                        }}
                                                    >
                                                        Tidak ada pengguna ditemukan.
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="text-xs text-gray-500">Tekan Ctrl+Enter untuk mengirim cepat</div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => {
                                                                setIsInlineReplyExpanded(false);
                                                                setInlineReplyContent("");
                                                                setInlineReplyMediaFiles([]);
                                                                setShowMentionPopover(false);
                                                                setMentionQuery("");
                                                            }}
                                                            disabled={isSubmittingReply}
                                                        >
                                                            Batal
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            onClick={handleReplySubmit}
                                                            disabled={(!inlineReplyContent.trim() && inlineReplyMediaFiles.length === 0) || isSubmittingReply || inlineReplyMediaFiles.some(f => f.uploading)}
                                                        >
                                                            {isSubmittingReply || inlineReplyMediaFiles.some(f => f.uploading) ? (
                                                                <>
                                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                                    Mengirim...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Send className="h-3 w-3 mr-1" />
                                                                    Kirim
                                                                </>
                                                            )}
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>

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
        </Card>
    );
}