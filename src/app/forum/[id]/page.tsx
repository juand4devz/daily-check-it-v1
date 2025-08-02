// /app/forum/[id]/page.tsx
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { MediaViewer } from "@/components/forum/media-viewer";
import { MarkdownEditor } from "@/components/forum/markdown-editor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  MessageSquare,
  Heart,
  Send,
  Eye,
  CheckCircle,
  Pin,
  Bookmark,
  BookmarkCheck,
  Share2,
  AlertTriangle,
  BookOpenText,
  Loader2,
  Edit as EditIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ForumPost,
  ForumReply,
  EMOJI_REACTIONS,
  ForumMedia,
  EmojiReactionKey,
} from "@/types/forum";
import { getReadingTime, ProcessedForumReply } from "@/lib/utils/forum-utils";
import { formatTimeAgo } from "@/lib/utils/date-utils";
import { ReplyItem } from "@/components/forum/ReplyItem";
import { ReportDialog } from "@/components/shared/ReportDialog";

import { PostHeaderSkeleton, PostContentSkeleton, CommentSkeleton } from "@/components/ui/skeleton-loader";
import { PostThumbnail } from "@/components/forum/PostThumbnail";
import { PostStats } from "@/components/forum/PostStats";
import { QuickActions } from "@/components/forum/QuickActions";
import { PostActionsPopover } from "@/components/forum/PostActionsPopover";
import { ForumPostEditDialog } from "@/components/forum/ForumPostEditDialog";

import { UserState, useUserState } from "@/lib/utils/useUserState";
import { buildReplyTree, flattenReplies } from "@/lib/utils/forum-utils";

import { clientDb } from "@/lib/firebase/firebase-client";
import { collection, query, where, orderBy, onSnapshot, doc } from "firebase/firestore";

import { upload, ImageKitAbortError, ImageKitInvalidRequestError, ImageKitServerError, ImageKitUploadNetworkError } from "@imagekit/next";
import { Progress } from "@/components/ui/progress";
import { RelatedPosts } from "@/components/forum/RelatedPosts";

interface UploadedFileState {
  file: File | null;
  previewUrl: string | null;
  uploadedData: ForumMedia | null;
  uploading: boolean;
  progress: number;
  error: string | null;
}

// Interface MarkdownEditorProps - ini harus konsisten dengan definisi di markdown-editor.tsx
interface MarkdownEditorProps {
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
  value: string;
  onChange: (value: string) => void;
  onMediaFilesChange?: (files: File[]) => void;
  onRemoveMedia?: (id: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  isUploadingMedia?: boolean;
  mediaPreviews?: {
    id: string;
    url: string;
    filename: string;
    uploading?: boolean;
    progress?: number;
    uploadedUrl?: string;
    type?: "image" | "video";
  }[];
  className?: string;
  allAvailableMentions?: { id: string; username: string }[];
  showMediaInput?: boolean;
  onPaste?: (e: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onDrop?: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onDragOver?: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  onDragLeave?: (e: React.DragEvent<HTMLTextAreaElement>) => void;
  isDragOver?: boolean;
  disableMediaPreviewInWriteTab?: boolean;
  showMediaPreviewInPreviewTab?: boolean;
  showMediaInsertActions?: boolean;
}

interface MediaViewerProps {
  media: ForumMedia[];
}


export default function ForumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const username = session?.user?.username;
  const avatar = session?.user?.avatar;
  const isAdmin = session?.user?.role === "admin";

  const { userState, updateUserState } = useUserState();

  const [post, setPost] = useState<ForumPost | null>(null);
  const [replies, setReplies] = useState<ProcessedForumReply[]>([]);
  const [newReplyContent, setNewReplyContent] = useState("");
  const [mainCommentUploadState, setMainCommentUploadState] = useState<UploadedFileState>({
    file: null,
    previewUrl: null,
    uploadedData: null,
    uploading: false,
    progress: 0,
    error: null,
  });
  const [loadingPost, setLoadingPost] = useState(true);
  const [submittingReply, setSubmittingReply] = useState(false);
  const [views, setViews] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const mainReplyTextareaRef = useRef<HTMLTextAreaElement | null>(null);
  const highlightCommentRef = useRef<HTMLDivElement | null>(null);

  const isPostAuthor = post?.authorId === userId;
  const isLiked = post ? (userState.postLikes?.[post.id] === true) : false;
  const isBookmarked = post ? (userState.bookmarks?.includes(post.id) === true) : false;

  const handleEditPostSuccess = useCallback((updatedPostId: string) => {
    toast.success("Postingan berhasil diperbarui.");
  }, []);

  const mainCommentMediaPreviews = useMemo(() => {
    if (!mainCommentUploadState.file && !mainCommentUploadState.uploadedData) return [];

    const preview: { id: string; url: string; filename: string; uploading?: boolean; progress?: number; uploadedUrl?: string; type?: "image" | "video"; } = {
      id: mainCommentUploadState.uploadedData?.id || mainCommentUploadState.file?.name || 'temp',
      url: mainCommentUploadState.uploadedData?.url || mainCommentUploadState.previewUrl || '/placeholder.svg',
      filename: mainCommentUploadState.uploadedData?.filename || mainCommentUploadState.file?.name || 'media',
      uploading: mainCommentUploadState.uploading,
      progress: mainCommentUploadState.progress,
      uploadedUrl: mainCommentUploadState.uploadedData?.url,
      type: mainCommentUploadState.uploadedData?.type || (mainCommentUploadState.file?.type.startsWith('image/') ? 'image' : mainCommentUploadState.file?.type.startsWith('video/') ? 'video' : undefined),
    };
    return [preview];
  }, [mainCommentUploadState]);

  const commentIdToHighlight = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash;
    if (hash.startsWith('#comment-')) {
      return hash.substring('#comment-'.length);
    }
    return null;
  }, [searchParams]);

  const [allCommentAuthors, setAllCommentAuthors] = useState<{ id: string; username: string }[]>([]);

  const uploadMediaToImageKit = useCallback(async (file: File, onProgress: (p: number) => void): Promise<ForumMedia | null> => {
    if (!userId) {
      toast.error("Anda harus login untuk mengunggah media.");
      return null;
    }
    if (!(file instanceof File)) {
      console.error("No file provided or invalid file object for uploadMediaToImageKit:", file);
      toast.error("File tidak valid untuk diunggah. Harap coba lagi.");
      return null;
    }

    try {
      const authRes = await fetch("/api/upload-auth");
      if (!authRes.ok) {
        const errorText = await authRes.text();
        throw new Error(`Authentication request failed: ${authRes.status} ${errorText}`);
      }
      const authData = await authRes.json();

      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const randomString = Math.random().toString(36).substring(2, 8);
      const fileExtension = file.name.split('.').pop();
      const uniqueFileName = `forum-media-${userId}-${year}${month}${day}-${hours}${minutes}${seconds}-${randomString}.${fileExtension}`;


      const uploadResponse = await upload({
        publicKey: authData.publicKey,
        fileName: uniqueFileName,
        file: file,
        folder: "forum-media",
        signature: authData.signature,
        token: authData.token,
        expire: authData.expire,
        onProgress: (event) => {
          if (event.lengthComputable) {
            onProgress((event.loaded / event.total) * 100);
          }
        },
        useUniqueFileName: false,
        overwriteFile: true,
      });

      if (uploadResponse.url) {
        return {
          id: uploadResponse.fileId,
          type: file.type.startsWith('image/') ? 'image' : 'video',
          filename: uploadResponse.name,
          size: uploadResponse.size,
          url: uploadResponse.url,
          thumbnailUrl: uploadResponse.thumbnailUrl || undefined,
        };
      } else {
        throw new Error("URL gambar tidak ditemukan dari respons upload ImageKit.");
      }
    } catch (error) {
      console.error("Error uploading file to ImageKit:", error);
      let errorMessage = "Terjadi kesalahan saat mengunggah file.";
      if (error instanceof ImageKitAbortError) errorMessage = "Upload dibatalkan.";
      else if (error instanceof ImageKitInvalidRequestError) errorMessage = `Permintaan upload tidak valid: ${error.message}`;
      else if (error instanceof ImageKitUploadNetworkError) errorMessage = `Kesalahan jaringan saat upload: ${error.message}`;
      else if (error instanceof ImageKitServerError) errorMessage = `Kesalahan server ImageKit: ${error.message}`;
      else if (error instanceof Error) errorMessage = `Gagal mengunggah file: ${error.message}`;

      toast.error(errorMessage);
      return null;
    }
  }, [userId]);

  const handleMainMediaFilesChange = useCallback(async (files: File[]) => {
    if (files.length === 0) {
      if (mainCommentUploadState.previewUrl) URL.revokeObjectURL(mainCommentUploadState.previewUrl);
      setMainCommentUploadState({ file: null, previewUrl: null, uploadedData: null, uploading: false, progress: 0, error: null });
      return;
    }

    const file = files[0];
    if (mainCommentUploadState.file && mainCommentUploadState.file !== file) {
      toast.error("Maksimal 1 media per komentar utama.");
      return;
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error("Hanya file gambar atau video yang diizinkan untuk komentar utama.");
      setMainCommentUploadState({ file: null, previewUrl: null, uploadedData: null, uploading: false, progress: 0, error: "Hanya file gambar atau video yang diizinkan." });
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setMainCommentUploadState(prev => ({
      ...prev,
      file,
      previewUrl,
      uploading: true,
      progress: 0,
      uploadedData: null,
      error: null,
    }));

    try {
      const uploadedMedia = await uploadMediaToImageKit(file, (p: number) => {
        setMainCommentUploadState(prev => ({ ...prev, progress: p }));
      });

      if (uploadedMedia) {
        toast.success(`Media "${file.name}" berhasil diunggah.`);
        setMainCommentUploadState(prev => ({ ...prev, uploading: false, progress: 100, uploadedData: uploadedMedia, error: null }));
      } else {
        toast.error(`Gagal mengunggah media "${file.name}".`);
        setMainCommentUploadState(prev => ({ ...prev, file: null, previewUrl: null, uploadedData: null, uploading: false, progress: 0, error: "Gagal mengunggah media." }));
      }
    } catch (error) {
      console.error("Error uploading main comment media:", error);
      toast.error("Gagal mengunggah media utama.");
      setMainCommentUploadState(prev => ({ ...prev, file: null, previewUrl: null, uploadedData: null, uploading: false, progress: 0, error: "Gagal mengunggah media utama." }));
    }
  }, [mainCommentUploadState, uploadMediaToImageKit]);

  const handleRemoveMainMedia = useCallback((idToRemove: string) => {
    setMainCommentUploadState(prev => {
      if (prev.previewUrl) {
        URL.revokeObjectURL(prev.previewUrl);
      }
      return { file: null, previewUrl: null, uploadedData: null, uploading: false, progress: 0, error: null };
    });
    toast.info("Media dihapus.");
  }, []);

  useEffect(() => {
    const postId = params.id as string;
    if (!postId) {
      setLoadingPost(false);
      return;
    }

    const postDocRef = doc(clientDb, "forumPosts", postId);

    const unsubscribePost = onSnapshot(postDocRef, async (docSnapshot) => {
      if (docSnapshot.exists()) {
        const fetchedPost = { id: docSnapshot.id, ...(docSnapshot.data() as Omit<ForumPost, 'id'>) };
        setPost(fetchedPost);
        setViews(fetchedPost.views);
        setError(null);
      } else {
        setPost(null);
        setError("Postingan tidak ditemukan.");
        toast.error("Postingan tidak ditemukan.", { description: "Postingan yang Anda cari mungkin sudah dihapus." });
      }
      setLoadingPost(false);
    }, (err) => {
      console.error("Error listening to post data:", err);
      setError("Gagal memuat detail postingan.");
      setLoadingPost(false);
      toast.error("Error", { description: "Gagal memuat detail postingan." });
    });

    return () => unsubscribePost();
  }, [params.id]);

  const viewIncrementRef = useRef<{ [key: string]: boolean }>({});

  useEffect(() => {
    const postId = params.id as string;
    if (!postId) return;

    const currentViewIncrementRef = viewIncrementRef.current;

    if (!currentViewIncrementRef[postId]) {
      const incrementView = async () => {
        try {
          const viewsRes = await fetch(`/api/forum/posts/${postId}/views`, { method: "PATCH" });
          const viewsData = await viewsRes.json();
          if (viewsRes.ok && viewsData.status) {
            setViews(viewsData.newViewCount);
            currentViewIncrementRef[postId] = true;
          } else {
            console.warn("Failed to increment view count via API (already viewed or API error):", viewsData.message);
          }
        } catch (error) {
          console.error("Error calling views API:", error);
        }
      };
      incrementView();
    }
    return () => {
      delete currentViewIncrementRef[postId];
    };
  }, [params.id]);

  useEffect(() => {
    const postId = params.id as string;
    if (!postId) return;

    const repliesCollectionRef = collection(clientDb, "forumReplies");
    const qReplies = query(repliesCollectionRef, where("postId", "==", postId), orderBy("createdAt", "asc"));

    const unsubscribeReplies = onSnapshot(qReplies, async (snapshot) => {
      const fetchedReplies: ForumReply[] = [];
      const uniqueAuthors = new Map<string, { id: string; username: string }>();

      if (post?.authorId && post?.authorUsername) {
        uniqueAuthors.set(post.authorId, { id: post.authorId, username: post.authorUsername });
      }

      snapshot.forEach((doc) => {
        const replyData = { id: doc.id, ...(doc.data() as Omit<ForumReply, 'id'>) };
        fetchedReplies.push(replyData);
        if (replyData.authorId && replyData.authorUsername && !uniqueAuthors.has(replyData.authorId)) {
          uniqueAuthors.set(replyData.authorId, { id: replyData.authorId, username: replyData.authorUsername });
        }
      });

      if (userId) {
        uniqueAuthors.delete(userId);
      }

      setAllCommentAuthors(Array.from(uniqueAuthors.values()));
      setReplies(buildReplyTree(fetchedReplies));
    }, (error) => {
      console.error("Error listening to replies:", error);
      toast.error("Error real-time komentar", { description: "Gagal memuat komentar secara real-time." });
    });

    return () => unsubscribeReplies();
  }, [params.id, userId, post?.authorId, post?.authorUsername]);

  useEffect(() => {
    const postId = params.id as string;
    if (!postId || !userId || !post) {
      return;
    }

    const fetchUserPostStatus = async () => {
      try {
        const bookmarkCheckRes = await fetch(`/api/forum/bookmarks?userId=${userId}&postId=${postId}`);
        const bookmarkCheckData = await bookmarkCheckRes.json();
        if (bookmarkCheckRes.ok && bookmarkCheckData.status) {
          const isBookmarkedNow = bookmarkCheckData.data.some((b: any) => b.postId === postId && b.userId === userId);
          updateUserState(prevUserState => {
            const currentBookmarks = prevUserState.bookmarks || [];
            const prevBookmarked = currentBookmarks.includes(postId);
            if (isBookmarkedNow !== prevBookmarked) {
              const newBookmarks = isBookmarkedNow
                ? [...currentBookmarks, postId]
                : currentBookmarks.filter(id => id !== postId);
              return { ...prevUserState, bookmarks: newBookmarks };
            }
            return prevUserState;
          });
        } else {
          console.warn("Failed to fetch bookmark status:", bookmarkCheckData.message);
        }

        const postIsLiked = post.likedBy?.includes(userId) || false;
        updateUserState(prevUserState => {
          const currentPostLikes = prevUserState.postLikes || {};
          const prevLiked = currentPostLikes[postId];
          if (postIsLiked !== prevLiked) {
            return {
              ...prevUserState,
              postLikes: {
                ...currentPostLikes,
                [postId]: postIsLiked,
              },
            };
          }
          return prevUserState;
        });

      } catch (error) {
        console.error("Error fetching user post status:", error);
      }
    };

    fetchUserPostStatus();
  }, [params.id, userId, post?.likedBy, post?.id, updateUserState, post]);

  const handleSubmitReply = useCallback(
    async (content: string, mediaFilesInput: ForumMedia[], parentId?: string, mentionedUserIds?: string[]) => {
      if (submittingReply || !userId || !username || !avatar || !post) {
        if (!userId) toast.error("Anda harus login untuk berkomentar.");
        return;
      }

      if (!content.trim() && mediaFilesInput.length === 0 && (!parentId && !mainCommentUploadState.uploadedData)) {
        toast.error("Komentar tidak boleh kosong.");
        return;
      }

      if (!parentId && mainCommentUploadState.uploading) {
        toast.error("Tunggu! Ada media yang masih diunggah. Harap tunggu hingga upload selesai.");
        return;
      }
      if (!parentId && mainCommentUploadState.file && !mainCommentUploadState.uploadedData && !mainCommentUploadState.uploading) {
        toast.error("Ada media yang gagal diunggah. Harap hapus atau coba unggah ulang.");
        return;
      }

      const finalMediaForSubmission: ForumMedia[] = parentId ? mediaFilesInput : (mainCommentUploadState.uploadedData ? [mainCommentUploadState.uploadedData] : []);

      setSubmittingReply(true);

      try {
        const replyPayload = {
          postId: post.id,
          content: content,
          authorId: userId,
          authorUsername: username,
          authorAvatar: avatar || "/placeholder.svg",
          parentId: parentId || null,
          mentions: mentionedUserIds || [],
          media: finalMediaForSubmission,
        };

        const response = await fetch(`/api/forum/posts/${post.id}/replies`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(replyPayload),
        });

        const data = await response.json();
        if (response.ok && data.status) {
          toast.success("Komentar berhasil", { description: "Komentar Anda telah ditambahkan." });
          setNewReplyContent("");
          if (!parentId) {
            if (mainCommentUploadState.previewUrl) URL.revokeObjectURL(mainCommentUploadState.previewUrl);
            setMainCommentUploadState({ file: null, previewUrl: null, uploadedData: null, uploading: false, progress: 0, error: null });
          }
        } else {
          throw new Error(data.message || "Gagal menambahkan komentar.");
        }
      } catch (error) {
        console.error("Error submitting reply:", error);
        toast.error("Gagal menambahkan komentar", {
          description: (error instanceof Error) ? error.message : "Terjadi kesalahan yang tidak diketahui."
        });
      } finally {
        setSubmittingReply(false);
      }
    },
    [submittingReply, userId, username, avatar, post, mainCommentUploadState],
  );

  const handleVote = useCallback(
    async (replyId: string, voteType: "up" | "down", currentVoteStatus: "up" | "down" | null) => {
      if (!userId) {
        toast.error("Anda harus login untuk voting.");
        router.push("/login");
        return;
      }
      if (!post?.id) return;

      setReplies((prev) =>
        buildReplyTree(
          flattenReplies(prev).map((r: ForumReply) => {
            if (r.id === replyId) {
              let newUpvotedBy = [...r.upvotedBy];
              let newDownvotedBy = [...r.downvotedBy];
              let newUpvotes = r.upvotes;
              let newDownvotes = r.downvotes;

              if (currentVoteStatus === voteType) {
                if (voteType === "up") {
                  newUpvotes = Math.max(0, newUpvotes - 1);
                  newUpvotedBy = newUpvotedBy.filter(id => id !== userId);
                } else {
                  newDownvotes = Math.max(0, newDownvotes - 1);
                  newDownvotedBy = newDownvotedBy.filter(id => id !== userId);
                }
                updateUserState((prevUserState) => ({
                  ...prevUserState,
                  votes: { ...(prevUserState.votes || {}), [replyId]: null }
                }));
              } else {
                if (voteType === "up") {
                  newUpvotes++;
                  newUpvotedBy.push(userId);
                  if (newDownvotedBy.includes(userId)) {
                    newDownvotedBy = newDownvotedBy.filter(id => id !== userId);
                    newDownvotes = Math.max(0, newDownvotes - 1);
                  }
                } else {
                  newDownvotes++;
                  newDownvotedBy.push(userId);
                  if (newUpvotedBy.includes(userId)) {
                    newUpvotedBy = newUpvotedBy.filter(id => id !== userId);
                    newUpvotes = Math.max(0, newUpvotes - 1);
                  }
                }
                updateUserState((prevUserState) => ({
                  ...prevUserState,
                  votes: { ...(prevUserState.votes || {}), [replyId]: voteType }
                }));
              }
              return { ...r, upvotes: newUpvotes, downvotes: newDownvotes, upvotedBy: newUpvotedBy, downvotedBy: newDownvotedBy };
            }
            return r;
          })
        )
      );

      try {
        const response = await fetch(`/api/forum/posts/${post.id}/replies/${replyId}/vote`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ voteType }),
        });

        const data = await response.json();
        if (!response.ok || !data.status) {
          toast.error("Gagal memperbarui vote", { description: data.message });
        } else {
          toast.success("Vote berhasil diperbarui.");
        }
      } catch (error) {
        console.error("Error updating vote:", error);
        toast.error("Gagal memperbarui vote.");
      }
    },
    [post, userId, updateUserState, setReplies, router],
  );

  const handleLike = useCallback(async () => {
    if (!post || !userId) {
      toast.error("Anda harus login untuk menyukai postingan.");
      router.push("/login");
      return;
    }

    const currentLikeStatus = userState.postLikes?.[post.id] === true;

    updateUserState((prevUserState) => ({
      ...prevUserState,
      postLikes: {
        ...(prevUserState.postLikes || {}),
        [post.id]: !currentLikeStatus,
      },
    }));
    setPost((prev) => {
      if (!prev) return null;
      let newLikedBy = [...prev.likedBy];
      let newLikes = prev.likes;

      if (currentLikeStatus) {
        newLikes--;
        newLikedBy = newLikedBy.filter(id => id !== userId);
      } else {
        newLikes++;
        newLikedBy.push(userId);
      }

      return {
        ...prev,
        likes: newLikes,
        likedBy: newLikedBy,
      };
    });

    try {
      const response = await fetch(`/api/forum/posts/${post.id}/like`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.status) {
        updateUserState((prevUserState) => ({
          ...prevUserState,
          postLikes: {
            ...(prevUserState.postLikes || {}),
            [post.id]: currentLikeStatus,
          },
        }));
        setPost((prev) => {
          if (!prev) return null;
          let newLikedBy = [...prev.likedBy];
          let newLikes = prev.likes;
          if (currentLikeStatus) {
            newLikes++;
            newLikedBy.push(userId);
          } else {
            newLikes--;
            newLikedBy = newLikedBy.filter(id => id !== userId);
          }
          return {
            ...prev,
            likes: newLikes,
            likedBy: newLikedBy,
          };
        });
        toast.error("Gagal mengubah status suka.", { description: data.message });
      } else {
        toast.success(data.message);
      }
    } catch (error) {
      console.error("Error changing like status:", error);
      toast.error("Gagal mengubah status suka.");
    }
  }, [post, userId, userState.postLikes, updateUserState, router, setPost]);

  const handleBookmark = useCallback(async () => {
    if (!post || !userId) {
      toast.error("Anda harus login untuk membookmark postingan.");
      router.push("/login");
      return;
    }

    const isCurrentlyBookmarked = userState.bookmarks?.includes(post.id) === true;

    updateUserState((prevUserState) => ({
      ...prevUserState,
      bookmarks: isCurrentlyBookmarked
        ? (prevUserState.bookmarks || []).filter((id) => id !== post.id)
        : [...(prevUserState.bookmarks || []), post.id],
    }));

    try {
      const response = await fetch(`/api/forum/posts/${post.id}/bookmarks`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.status) {
        updateUserState((prevUserState) => ({
          ...prevUserState,
          bookmarks: isCurrentlyBookmarked
            ? [...(prevUserState.bookmarks || []), post.id]
            : (prevUserState.bookmarks || []).filter((id) => id !== post.id),
        }));
        toast.error("Gagal mengubah status bookmark.", { description: data.message });
      } else {
        toast.success(data.message);
      }
    } catch (error) {
      console.error("Error changing bookmark status:", error);
      toast.error("Gagal mengubah status bookmark.");
    }
  }, [post, userId, userState.bookmarks, updateUserState, router]);

  const handleReaction = useCallback(
    async (replyId: string, newReactionKey: EmojiReactionKey | null, oldReactionKey: EmojiReactionKey | null) => {
      if (!userId || !post) {
        toast.error("Anda harus login untuk memberikan reaksi.");
        router.push("/login");
        return;
      }

      setReplies((prev) =>
        buildReplyTree(
          flattenReplies(prev).map((r: ForumReply) => {
            if (r.id === replyId) {
              const updatedReactions = { ...r.reactions };

              if (oldReactionKey && updatedReactions[oldReactionKey]) {
                updatedReactions[oldReactionKey] = updatedReactions[oldReactionKey].filter(id => id !== userId);
              }

              if (newReactionKey && newReactionKey !== oldReactionKey) {
                if (!updatedReactions[newReactionKey]) {
                  updatedReactions[newReactionKey] = [];
                }
                updatedReactions[newReactionKey].push(userId);
              }

              return { ...r, reactions: updatedReactions };
            }
            return r;
          })
        )
      );

      updateUserState((prevUserState) => ({
        ...prevUserState,
        reactions: {
          ...(prevUserState.reactions || {}),
          [replyId]: newReactionKey,
        },
      }));

      try {
        const response = await fetch(`/api/forum/posts/${post.id}/replies/${replyId}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newReactionKey: newReactionKey,
            oldReactionKey: oldReactionKey
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.status) {
          toast.error("Gagal memperbarui reaksi", { description: data.message });
        } else {
          toast.success(data.message);
        }
      } catch (error) {
        console.error("Error updating reaction:", error);
        toast.error("Gagal memperbarui reaksi.");
      }
    },
    [userId, post, userState.reactions, updateUserState, setReplies, router],
  );

  const handleMarkAsSolution = useCallback(
    async (replyId: string, isCurrentlySolution: boolean) => {
      if (!userId || !post) {
        toast.error("Anda harus login untuk menandai solusi.");
        return;
      }

      // Optimistic UI update
      setPost(prevPost => {
        if (!prevPost) return null;
        let newSolutionReplyIds = [...(prevPost.solutionReplyIds || [])];

        if (isCurrentlySolution) {
          const index = newSolutionReplyIds.indexOf(replyId);
          if (index > -1) newSolutionReplyIds.splice(index, 1);
        } else {
          newSolutionReplyIds.push(replyId);
        }
        const finalIsResolved = newSolutionReplyIds.length > 0;

        return {
          ...prevPost,
          solutionReplyIds: newSolutionReplyIds,
          isResolved: finalIsResolved,
        };
      });

      setReplies((prev) =>
        buildReplyTree(
          flattenReplies(prev).map((r: ForumReply) =>
            r.id === replyId ? { ...r, isSolution: !isCurrentlySolution } : r
          )
        )
      );

      try {
        // PENTING: Kirim userId dan isPostAuthor (bukan isAdmin) ke API untuk validasi backend
        const response = await fetch(`/api/forum/posts/${post.id}/replies/${replyId}/solution`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isSolution: !isCurrentlySolution,
            userId: userId, // User yang melakukan aksi
            isPostAuthor: post.authorId === userId // Pastikan ini true jika author post
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.status) {
          toast.error("Gagal memperbarui status solusi", { description: data.message });
          // Revert optimistic UI here if API fails, or rely on Firestore listener
        } else {
          toast.success(data.message);
        }
      } catch (error) {
        console.error("Error marking solution:", error);
        toast.error("Gagal memperbarui status solusi.");
      }
    },
    [userId, post, setPost, setReplies], // Hapus isAdmin dari deps karena tidak lagi digunakan di sini
  );

  const [isPostReportDialogOpen, setIsPostReportDialogOpen] = useState(false);

  const handlePostAction = useCallback(
    async (action: string) => {
      if (!post) return;

      try {
        switch (action) {
          case "edit":
            // Logika edit sudah dipindahkan ke PostActionsPopover yang langsung memicu DialogTrigger
            break;
          case "delete":
            if (confirm("Apakah Anda yakin ingin menghapus post ini?")) {
              const response = await fetch(`/api/forum/posts/${post.id}`, { method: "DELETE" });
              const data = await response.json();
              if (response.ok && data.status) {
                toast.success("Post berhasil dihapus", { description: data.message });
                router.push("/forum");
              } else {
                toast.error("Gagal menghapus post", { description: data.message });
              }
            }
            break;
          case "pin":
          case "archive":
            if (!isAdmin) {
              toast.error("Anda tidak memiliki izin untuk melakukan aksi ini.");
              return;
            }
            const response = await fetch(`/api/forum/posts/${post.id}/pin`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ action: action, status: action === 'pin' ? !post.isPinned : !post.isArchived }),
            });
            const data = await response.json();
            if (response.ok && data.status) {
              // setPost((prev) => (prev ? { ...prev, ...updateData } : null)); // Firestore listener akan update
              toast.success(data.message);
            } else {
              toast.error("Gagal melakukan aksi", { description: data.message });
            }
            break;
          case "bookmark":
            handleBookmark();
            break;
          case "share-link":
            if (typeof window !== "undefined") {
              await navigator.clipboard.writeText(window.location.href);
              toast.success("Link disalin", { description: "Link post telah disalin ke clipboard" });
            }
            break;
          case "share-external":
            if (typeof window !== "undefined") {
              window.open(window.location.href, "_blank");
            }
            break;
          case "download":
            if (post.media && post.media.length > 0) {
              post.media.forEach((media, index) => {
                const link = document.createElement("a");
                link.href = media.url;
                link.download = `media-${post.id}-${index + 1}.${media.type === "image" ? "jpg" : "mp4"}`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              });
              toast.info("Download dimulai", { description: "Media sedang diunduh" });
            } else {
              toast.info("Tidak ada media untuk diunduh.", { description: "Postingan ini tidak memiliki lampiran media." });
            }
            break;
          case "report":
            if (!userId) {
              toast.error("Anda harus login untuk melaporkan.");
              router.push("/login");
              return;
            }
            setIsPostReportDialogOpen(true);
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(error);
        toast.error("Error", { description: "Gagal melakukan aksi" });
      }
    },
    [post, router, handleBookmark, isAdmin, userId, setPost],
  );

  const handleCommentAction = useCallback(
    async (replyId: string, action: string) => {
      if (!post) return;

      try {
        switch (action) {
          case "share-link":
            if (typeof window !== "undefined") {
              const shareUrl = `${window.location.origin}/forum/${post.id}#comment-${replyId}`;
              await navigator.clipboard.writeText(shareUrl);
              toast.success("Link disalin", { description: "Link komentar telah disalin ke clipboard" });
            }
            break;
          case "share-external":
            if (typeof window !== "undefined") {
              const externalUrl = `${window.location.origin}/forum/${post.id}#comment-${replyId}`;
              window.open(externalUrl, "_blank");
            }
            break;
          case "report":
            if (!userId) {
              toast.error("Anda harus login untuk melaporkan.");
              router.push("/login");
              return;
            }
            toast.info("Fitur lapor komentar akan segera tersedia.");
            break;
          case "edit":
            toast.info("Fitur edit komentar akan segera tersedia.");
            break;
          case "delete":
            if (confirm("Apakah Anda yakin ingin menghapus komentar ini?")) {
              const response = await fetch(`/api/forum/posts/${post.id}/replies/${replyId}`, { method: "DELETE" });
              const data = await response.json();
              if (response.ok && data.status) {
                toast.success("Komentar dihapus", { description: data.message });
              } else {
                toast.error("Gagal menghapus komentar", { description: data.message });
              }
            }
            break;
          default:
            break;
        }
      } catch (error) {
        console.error(error);
        toast.error("Error", { description: "Gagal melakukan aksi" });
      }
    },
    [post, userId, router],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isMainEditorFocused = mainReplyTextareaRef.current === document.activeElement;

      if (isMainEditorFocused && (event.ctrlKey || event.metaKey) && event.key === "Enter") {
        if (newReplyContent.trim() || mainCommentUploadState.uploadedData) {
          event.preventDefault();
          handleSubmitReply(newReplyContent, mainCommentUploadState.uploadedData ? [mainCommentUploadState.uploadedData] : []);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [newReplyContent, mainCommentUploadState.uploadedData, handleSubmitReply]);

  useEffect(() => {
    if (commentIdToHighlight && replies.length > 0) {
      setTimeout(() => {
        const targetElement = document.getElementById(`comment-${commentIdToHighlight}`);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    }
  }, [commentIdToHighlight, replies]);

  const fullPostContent = useMemo(() => `${post?.title || ""} ${post?.description || ""} ${post?.content || ""}`, [post]);
  const readingTime = useMemo(() => getReadingTime(fullPostContent), [fullPostContent]);

  if (!loadingPost && !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Post tidak ditemukan</h2>
            <p className="text-gray-600 mb-4">{error || "Post yang Anda cari tidak ada atau telah dihapus."}</p>
            <Button type="button" variant="ghost" onClick={() => router.push("/forum")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Forum
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-4 py-8 w-full">
      <div className="flex items-center justify-between mb-6">
        <Button type="button" variant="ghost" onClick={() => router.push("/forum")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Forum
        </Button>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant={isBookmarked ? "default" : "outline"}
            size="sm"
            onClick={handleBookmark}
            className="hidden sm:flex"
            disabled={loadingPost || !userId}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4 mr-1" /> : <Bookmark className="h-4 w-4 mr-1" />}
            {isBookmarked ? "Tersimpan" : "Bookmark"}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handlePostAction("share-link")}
            className="hidden sm:flex"
            disabled={loadingPost}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Bagikan
          </Button>
        </div>
      </div>

      <div className="mb-6">
        <PostThumbnail post={post} isLoading={loadingPost} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              {loadingPost ? (
                <PostHeaderSkeleton />
              ) : post ? (
                <>
                  <div className="flex items-start justify-between">
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarImage src={post.authorAvatar || "/placeholder.svg"} />
                      <AvatarFallback>{post.authorUsername?.[0] || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{post.authorUsername}</p>
                      <p className="text-sm text-gray-500">{formatTimeAgo(post.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={post.isResolved ? "default" : "secondary"} className="shrink-0">
                        {post.isResolved ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selesai
                          </>
                        ) : (
                          "Belum Selesai"
                        )}
                      </Badge>
                      {post.isPinned && (
                        <Badge variant="outline" className="shrink-0">
                          <Pin className="h-3 w-3 mr-1" />
                          Pinned
                        </Badge>
                      )}
                      {/* PostActionsPopover */}
                      {/* Pastikan post.id tersedia sebelum render ForumPostEditDialog */}
                      <PostActionsPopover
                        post={post}
                        isBookmarked={isBookmarked}
                        isPostAuthor={isPostAuthor}
                        onAction={handlePostAction}
                        isAdmin={isAdmin}
                        isLoggedIn={!!userId}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <h1 className="text-2xl font-bold mb-3 leading-tight">{post.title}</h1>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{post.category}</Badge>
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </CardHeader>

            <CardContent>
              {loadingPost ? (
                <PostContentSkeleton />
              ) : post ? (
                <>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {post.content}
                    </ReactMarkdown>
                  </div>

                  {post.media && post.media.length > 0 && (
                    <div className="mb-6 mt-4">
                      <MediaViewer media={post.media} />
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        type="button"
                        variant={isLiked ? "default" : "outline"}
                        size="sm"
                        onClick={handleLike}
                        className="flex items-center gap-2"
                        disabled={!userId}
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                        {post.likes}
                      </Button>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MessageSquare className="h-4 w-4" />
                        {post.replies} balasan
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Eye className="h-4 w-4" />
                        {views.toLocaleString()} views
                      </div>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <BookOpenText className="h-4 w-4" />
                        {readingTime}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => handlePostAction("share-link")}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold">
                  Komentar ({flattenReplies(replies).length})
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <div>
                <div ref={highlightCommentRef} className="space-y-4">
                  {loadingPost ? (
                    Array.from({ length: 3 }).map((_, i) => <CommentSkeleton key={i} />)
                  ) : replies.length > 0 ? (
                    replies.map((reply) => (
                      <ReplyItem
                        key={reply.id}
                        reply={reply}
                        postId={post?.id || ""}
                        postTitle={post?.title || ""}
                        postAuthorId={post?.authorId || ""}
                        postType={post?.type} // Teruskan post.type ke ReplyItem
                        onVote={handleVote}
                        onReaction={handleReaction}
                        onMarkAsSolution={handleMarkAsSolution}
                        onCommentAction={handleCommentAction}
                        currentUserId={userId || undefined}
                        isAdmin={isAdmin}
                        currentUserVoteStatus={userState.votes?.[reply.id] || null}
                        currentUserReaction={userState.reactions?.[reply.id] || null}
                        onSubmitReply={handleSubmitReply}
                        isSubmittingReply={submittingReply}
                        isNested={false}
                        isHighlighted={commentIdToHighlight === reply.id}
                        uploadMediaToImageKit={uploadMediaToImageKit}
                        allAvailableMentions={allCommentAuthors}
                      />
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Belum ada komentar</h3>
                      <p className="text-gray-600">Jadilah yang pertama memberikan komentar!</p>
                    </div>
                  )}
                </div>
              </div>
              {!loadingPost && userId && (
                <div className="mt-6 border-t pt-4">
                  <div className="flex items-start gap-3">
                    {/* <Avatar className="h-10 w-10">
                      <AvatarImage src={avatar || "/placeholder.svg"} />
                      <AvatarFallback>{username?.[0] || '?'}</AvatarFallback>
                    </Avatar> */}
                    <div className="flex-1">
                      <MarkdownEditor
                        textareaRef={mainReplyTextareaRef}
                        value={newReplyContent}
                        onChange={setNewReplyContent}
                        onMediaFilesChange={handleMainMediaFilesChange}
                        mediaPreviews={mainCommentMediaPreviews}
                        placeholder="Tulis komentar Anda..."
                        rows={4}
                        disabled={submittingReply || mainCommentUploadState.uploading}
                        isUploadingMedia={mainCommentUploadState.uploading}
                        showMediaInput={true}
                        onRemoveMedia={handleRemoveMainMedia}
                        allAvailableMentions={allCommentAuthors}
                        disableMediaPreviewInWriteTab={false}
                        showMediaPreviewInPreviewTab={false}
                        showMediaInsertActions={true}
                      />
                      <div className="flex justify-between text-sm text-gray-500 mt-1">
                        <span>Mendukung Markdown formatting</span>
                        {mainCommentUploadState.uploading && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            <Progress value={mainCommentUploadState.progress} className="w-24 h-2" />
                            <span>{Math.round(mainCommentUploadState.progress)}%</span>
                          </div>
                        )}
                        {mainCommentUploadState.error && (
                          <p className="text-red-500 text-xs mt-1">{mainCommentUploadState.error}</p>
                        )}
                        <span>{newReplyContent.length}/5000</span>
                      </div>
                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-gray-500">Tekan Ctrl+Enter untuk mengirim cepat</div>
                        <Button
                          type="button"
                          className="max-h-7"
                          onClick={() => handleSubmitReply(newReplyContent, mainCommentUploadState.uploadedData ? [mainCommentUploadState.uploadedData] : [])}
                          disabled={(!newReplyContent.trim() && !mainCommentUploadState.file) || submittingReply || mainCommentUploadState.uploading || (mainCommentUploadState.file && !mainCommentUploadState.uploadedData)}
                        >
                          {submittingReply || mainCommentUploadState.uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Mengirim...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Kirim Komentar
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {!userId && !loadingPost && (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Login untuk bergabung dalam diskusi dan meninggalkan komentar.</p>
                  <Button type="button" variant="link" onClick={() => router.push('/login')} className="mt-2">Login Sekarang</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="hidden lg:block space-y-6 lg:sticky lg:top-[87px] h-fit">
          <PostStats post={post} views={views} isLiked={isLiked} isLoading={loadingPost} />
          <QuickActions
            onBookmark={handleBookmark}
            onShare={() => handlePostAction("share-link")}
            onNewPost={() => router.push("/forum/new")}
            isBookmarked={isBookmarked}
            isLoading={loadingPost}
          />
          <RelatedPosts currentPost={post} isLoading={loadingPost} />
        </div>
      </div>
      {/* Forum Post Edit Dialog */}
      {/* {post && userId && (isPostAuthor || isAdmin) && ( // Admin bisa edit post, tapi tidak bisa mark solution
        <ForumPostEditDialog
          postId={post.id}
          isPostAuthor={isPostAuthor} // Teruskan isPostAuthor
          isAdmin={isAdmin} // Teruskan isAdmin
          onEditSuccess={handleEditPostSuccess}
        />
      )} */}
      <ReportDialog
        isOpen={isPostReportDialogOpen}
        onOpenChange={setIsPostReportDialogOpen}
        reportType="forum_post"
        entityId={post?.id || ""}
        entityTitle={post?.title}
        entityAuthorId={post?.authorId}
        entityAuthorUsername={post?.authorUsername}
      />
    </div>
  );
}