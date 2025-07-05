"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"
import { MediaUpload } from "@/components/forum/media-upload"
import { MediaViewer } from "@/components/forum/media-viewer"
import {
  ArrowLeft,
  MessageSquare,
  Heart,
  MoreHorizontal,
  Send,
  X,
  Eye,
  Reply,
  Smile,
  Flag,
  CheckCircle,
  Award,
  Copy,
  Edit,
  Trash2,
  Pin,
  Archive,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Share2,
  Clock,
  Users,
  TrendingUp,
  MessageCircle,
  Loader2,
  Calendar,
  Tag,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle,
  Settings,
  Download,
  Link,
  ChevronUp,
  ChevronDown,
} from "lucide-react"
import forumPostsData from "@/data/forum-posts.json"
import forumRepliesData from "@/data/forum-replies.json"
import Image from "next/image"

// Types
interface ForumPost {
  id: string
  title: string
  content: string
  author: string
  avatar: string
  category: string
  tags: string[]
  timestamp: string
  likes: number
  replies: number
  views?: number
  isResolved?: boolean
  solutionId?: string
  isPinned?: boolean
  isArchived?: boolean
  media?: MediaItem[]
  thumbnail?: string
}

interface ForumReply {
  id: string
  content: string
  author: string
  avatar: string
  createdAt: string
  upvotes: number
  downvotes: number
  parentId?: string
  mentions?: string[]
  isSolution?: boolean
  reactions?: ReactionMap
  media?: MediaItem[]
  isEdited?: boolean
  editedAt?: string
}

interface MediaItem {
  type: "image" | "video"
  url: string
  thumbnail?: string
}

interface ReactionMap {
  [key: string]: string[]
}

interface UserState {
  votes: { [replyId: string]: "up" | "down" | null }
  reactions: { [replyId: string]: string[] }
  bookmarks: string[]
}

// Constants
const EMOJI_REACTIONS = [
  { emoji: "👍", label: "Like", key: "like" },
  { emoji: "❤️", label: "Love", key: "love" },
  { emoji: "😂", label: "Laugh", key: "laugh" },
  { emoji: "😮", label: "Wow", key: "wow" },
  { emoji: "😢", label: "Sad", key: "sad" },
  { emoji: "😡", label: "Angry", key: "angry" },
] as const

const CURRENT_USER = "CurrentUser"
const IS_ADMIN = true

// Utility functions
const formatTimeAgo = (timestamp: string): string => {
  const now = new Date()
  const time = new Date(timestamp)
  const diffInSeconds = Math.floor((now.getTime() - time.getTime()) / 1000)

  if (diffInSeconds < 60) return "Baru saja"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} menit yang lalu`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} jam yang lalu`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} hari yang lalu`

  return time.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const getStoredUserState = (): UserState => {
  if (typeof window === "undefined") {
    return { votes: {}, reactions: {}, bookmarks: [] }
  }

  try {
    const stored = localStorage.getItem("forum-user-state")
    return stored ? JSON.parse(stored) : { votes: {}, reactions: {}, bookmarks: [] }
  } catch {
    return { votes: {}, reactions: {}, bookmarks: [] }
  }
}

const saveUserState = (state: UserState) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("forum-user-state", JSON.stringify(state))
    } catch (error) {
      console.error("Failed to save user state:", error)
    }
  }
}

// Custom hooks
const useUserState = () => {
  const [userState, setUserState] = useState<UserState>(getStoredUserState)

  const updateUserState = useCallback((updates: Partial<UserState>) => {
    setUserState((prev) => {
      const newState = { ...prev, ...updates }
      saveUserState(newState)
      return newState
    })
  }, [])

  return { userState, updateUserState }
}

const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

// Skeleton Components
const PostHeaderSkeleton = () => (
  <div className="space-y-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
    <Skeleton className="h-8 w-3/4" />
    <div className="flex gap-2">
      <Skeleton className="h-6 w-20" />
      <Skeleton className="h-6 w-16" />
      <Skeleton className="h-6 w-24" />
    </div>
  </div>
)

const PostContentSkeleton = () => (
  <div className="space-y-4">
    <div className="space-y-2">
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
    <Skeleton className="h-64 w-full rounded-lg" />
    <div className="flex items-center gap-4">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
)

const CommentSkeleton = () => (
  <Card className="mb-4">
    <CardContent className="p-4">
      <div className="flex gap-3">
        <div className="flex flex-col items-center gap-1 mr-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-4 w-6" />
          <Skeleton className="h-8 w-8" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="space-y-2 mb-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-12" />
            <Skeleton className="h-6 w-14" />
            <Skeleton className="h-6 w-16" />
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)

const SidebarSkeleton = () => (
  <div className="space-y-4">
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-8 mx-auto" />
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <Skeleton className="h-8 w-12 mx-auto mb-1" />
            <Skeleton className="h-3 w-8 mx-auto" />
          </div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </CardContent>
    </Card>
  </div>
)

// Components
const PostActionsPopover = ({
  post,
  isBookmarked,
  isPostAuthor,
  onAction,
}: {
  post: ForumPost
  isBookmarked: boolean
  isPostAuthor: boolean
  onAction: (action: string) => void
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-gray-100">
        <MoreHorizontal className="h-4 w-4" />
        <span className="sr-only">Opsi post</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-56 p-2" align="end">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="w-full justify-start h-8" onClick={() => onAction("share-link")}>
          <Copy className="h-4 w-4 mr-2" />
          Salin Link
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8"
          onClick={() => onAction("share-external")}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Buka di Tab Baru
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start h-8" onClick={() => onAction("bookmark")}>
          {isBookmarked ? (
            <>
              <BookmarkCheck className="h-4 w-4 mr-2" />
              Hapus Bookmark
            </>
          ) : (
            <>
              <Bookmark className="h-4 w-4 mr-2" />
              Bookmark
            </>
          )}
        </Button>
        <Button variant="ghost" size="sm" className="w-full justify-start h-8" onClick={() => onAction("download")}>
          <Download className="h-4 w-4 mr-2" />
          Download Media
        </Button>
        <Separator className="my-1" />
        {(isPostAuthor || IS_ADMIN) && (
          <>
            <Button variant="ghost" size="sm" className="w-full justify-start h-8" onClick={() => onAction("edit")}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Post
            </Button>
            {IS_ADMIN && (
              <Button variant="ghost" size="sm" className="w-full justify-start h-8" onClick={() => onAction("pin")}>
                <Pin className="h-4 w-4 mr-2" />
                {post.isPinned ? "Lepas Pin" : "Pin Post"}
              </Button>
            )}
            {IS_ADMIN && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start h-8"
                onClick={() => onAction("archive")}
              >
                <Archive className="h-4 w-4 mr-2" />
                {post.isArchived ? "Buka Arsip" : "Arsipkan"}
              </Button>
            )}
            <Separator className="my-1" />
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onAction("delete")}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Post
            </Button>
          </>
        )}
        {!isPostAuthor && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={() => onAction("report")}
          >
            <Flag className="h-4 w-4 mr-2" />
            Laporkan
          </Button>
        )}
      </div>
    </PopoverContent>
  </Popover>
)

const CommentActionsPopover = ({
  // reply,
  isAuthor,
  onAction,
}: {
  reply: ForumReply
  isAuthor: boolean
  onAction: (action: string) => void
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-gray-100">
        <MoreHorizontal className="h-3 w-3" />
        <span className="sr-only">Opsi komentar</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-48 p-2" align="end">
      <div className="space-y-1">
        <Button variant="ghost" size="sm" className="w-full justify-start h-8" onClick={() => onAction("share-link")}>
          <Link className="h-3 w-3 mr-2" />
          Salin Link
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8"
          onClick={() => onAction("share-external")}
        >
          <ExternalLink className="h-3 w-3 mr-2" />
          Buka Link
        </Button>
        <Separator className="my-1" />
        {(isAuthor || IS_ADMIN) && (
          <>
            <Button variant="ghost" size="sm" className="w-full justify-start h-8" onClick={() => onAction("edit")}>
              <Edit className="h-3 w-3 mr-2" />
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => onAction("delete")}
            >
              <Trash2 className="h-3 w-3 mr-2" />
              Hapus
            </Button>
            <Separator className="my-1" />
          </>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onAction("report")}
        >
          <Flag className="h-3 w-3 mr-2" />
          Laporkan
        </Button>
      </div>
    </PopoverContent>
  </Popover>
)

const EmojiReactionPopover = ({
  onSelect,
}: {
  onSelect: (key: string) => void
}) => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
        <Smile className="h-3 w-3 mr-1" />
        Reaksi
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-auto p-2" align="start">
      <div className="flex gap-1">
        {EMOJI_REACTIONS.map((reaction) => (
          <button
            key={reaction.key}
            onClick={() => onSelect(reaction.key)}
            className="p-2 hover:bg-gray-100 rounded text-lg transition-colors"
            title={reaction.label}
          >
            {reaction.emoji}
          </button>
        ))}
      </div>
    </PopoverContent>
  </Popover>
)

const PostThumbnail = ({ post, isLoading }: { post: ForumPost | null; isLoading: boolean }) => {
  if (isLoading) {
    return <Skeleton className="w-full h-64 rounded-lg" />
  }

  if (!post) return null

  const thumbnail = post.thumbnail || (post.media && post.media.length > 0 ? post.media[0].url : null)

  if (!thumbnail) {
    return (
      <div className="w-full h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative z-10 text-center text-white">
          <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-80" />
          <h3 className="text-xl font-semibold mb-2">{post.category}</h3>
          <p className="text-sm opacity-90">Forum Diskusi</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-64 rounded-lg overflow-hidden group">
      <Image
        height={500} width={500}
        src={thumbnail || "/placeholder.svg"}
        alt={post.title}
        className="w-full h-full object-cover transition-transform group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
      <div className="absolute bottom-4 left-4 right-4 text-white">
        <Badge variant="secondary" className="bg-black/50 text-white border-0 mb-2">
          {post.category}
        </Badge>
        <h2 className="text-xl font-bold line-clamp-2">{post.title}</h2>
      </div>
      {post.media && post.media.length > 1 && (
        <div className="absolute top-4 right-4">
          <Badge variant="secondary" className="bg-black/50 text-white border-0">
            +{post.media.length - 1} media
          </Badge>
        </div>
      )}
    </div>
  )
}

const PostStats = ({
  post,
  views,
  isLiked,
  isLoading,
}: {
  post: ForumPost | null
  views: number
  isLiked: boolean
  isLoading: boolean
}) => {
  if (isLoading) {
    return <SidebarSkeleton />
  }

  if (!post) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          <span className="font-semibold">Statistik Post</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
              <Eye className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-blue-700">{views.toLocaleString()}</div>
            <div className="text-xs text-blue-600">Views</div>
          </div>
          <div className="text-center p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-center gap-1 text-red-600 mb-1">
              <Heart className="h-4 w-4" />
            </div>
            <div className="text-2xl font-bold text-red-700">{(post.likes + (isLiked ? 1 : 0)).toLocaleString()}</div>
            <div className="text-xs text-red-600">Likes</div>
          </div>
        </div>
        <Separator />
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <MessageCircle className="h-4 w-4" />
              Komentar
            </span>
            <span className="font-medium">{post.replies}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Status
            </span>
            <Badge variant={post.isResolved ? "default" : "secondary"} className="text-xs">
              {post.isResolved ? "Selesai" : "Belum Selesai"}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Users className="h-4 w-4" />
              Kategori
            </span>
            <Badge variant="outline" className="text-xs">
              {post.category}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Dibuat
            </span>
            <span className="text-xs text-gray-600">{formatTimeAgo(post.timestamp)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

const QuickActions = ({
  onBookmark,
  onShare,
  onNewPost,
  isBookmarked,
  isLoading,
}: {
  onBookmark: () => void
  onShare: () => void
  onNewPost: () => void
  isBookmarked: boolean
  isLoading: boolean
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <span className="font-semibold">Aksi Cepat</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button
          variant={isBookmarked ? "default" : "outline"}
          size="sm"
          className="w-full justify-start"
          onClick={onBookmark}
        >
          {isBookmarked ? <BookmarkCheck className="h-4 w-4 mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
          {isBookmarked ? "Tersimpan" : "Bookmark Post"}
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start" onClick={onShare}>
          <Share2 className="h-4 w-4 mr-2" />
          Bagikan Post
        </Button>
        <Button variant="outline" size="sm" className="w-full justify-start" onClick={onNewPost}>
          <MessageSquare className="h-4 w-4 mr-2" />
          Buat Post Baru
        </Button>
      </CardContent>
    </Card>
  )
}

const RelatedPosts = ({ currentPost, isLoading }: { currentPost: ForumPost | null; isLoading: boolean }) => {
  const relatedPosts = useMemo(() => {
    if (!currentPost) return []
    return forumPostsData.filter((p) => p.id !== currentPost.id && p.category === currentPost.category).slice(0, 3)
  }, [currentPost])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-3 border rounded-lg">
              <Skeleton className="h-4 w-full mb-2" />
              <div className="flex gap-2">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (relatedPosts.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          <span className="font-semibold">Post Terkait</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {relatedPosts.map((relatedPost) => (
          <div
            key={relatedPost.id}
            className="p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
            onClick={() => (window.location.href = `/forum/${relatedPost.id}`)}
          >
            <h4 className="font-medium text-sm line-clamp-2 mb-2">{relatedPost.title}</h4>
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {relatedPost.replies}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {relatedPost.likes}
              </span>
              <Badge variant="outline" className="text-xs">
                {relatedPost.category}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

const InlineReplyForm = ({
  // replyId,
  replyAuthor,
  content,
  media,
  onContentChange,
  onMediaChange,
  onSubmit,
  onCancel,
  isSubmitting,
}: {
  replyId: string
  replyAuthor: string
  content: string
  media: File[]
  onContentChange: (content: string) => void
  onMediaChange: (files: File[]) => void
  onSubmit: () => void
  onCancel: () => void
  isSubmitting: boolean
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus()
      const length = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(length, length)
    }
  }, [])

  return (
    <div className="mt-4 border-t pt-4">
      <Card className="bg-blue-50/50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>{CURRENT_USER[0]}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-blue-700 font-medium">Membalas {replyAuthor}</span>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-auto" onClick={onCancel}>
              <X className="h-3 w-3" />
            </Button>
          </div>

          <div className="space-y-3">
            <Textarea
              ref={textareaRef}
              placeholder="Tulis balasan Anda..."
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              disabled={isSubmitting}
            />

            <MediaUpload files={media} onFilesChange={onMediaChange} maxFiles={1} acceptVideo={false} />

            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">Tekan Ctrl+Enter untuk mengirim cepat</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>
                  Batal
                </Button>
                <Button size="sm" onClick={onSubmit} disabled={!content.trim() || isSubmitting}>
                  {isSubmitting ? (
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
        </CardContent>
      </Card>
    </div>
  )
}

// Main component
export default function ForumDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { userState, updateUserState } = useUserState()

  // State
  const [post, setPost] = useState<ForumPost | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [newReply, setNewReply] = useState("")
  const [selectedMedia, setSelectedMedia] = useState<File[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingComments, setLoadingComments] = useState(false)
  const [submittingReply, setSubmittingReply] = useState(false)
  const [views, setViews] = useState(0)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [inlineReplies, setInlineReplies] = useState<{ [key: string]: string }>({})
  const [inlineReplyMedia, setInlineReplyMedia] = useState<{ [key: string]: File[] }>({})

  // Debounced search for better performance
  // const debouncedNewReply = useDebounce(newReply, 300)

  // Computed values
  const isPostAuthor = post?.author === CURRENT_USER
  const isLiked = post ? userState.votes[`post-${post.id}`] === "up" : false
  const isBookmarked = post ? userState.bookmarks.includes(post.id) : false

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        const postId = params.id as string

        // Simulate API delay with realistic timing
        await new Promise((resolve) => setTimeout(resolve, 1200))

        const foundPost = forumPostsData.find((p) => p.id === postId)

        if (foundPost) {
          setPost(foundPost as ForumPost)
          setViews(Math.floor(Math.random() * 1000) + 100)

          // Load comments separately for better UX
          setLoadingComments(true)
          await new Promise((resolve) => setTimeout(resolve, 800))

          const postReplies = (forumRepliesData as any)[postId] || []
          const transformedReplies = postReplies.map((reply: any) => ({
            ...reply,
            upvotes: Math.floor(Math.random() * 20) + 1,
            downvotes: Math.floor(Math.random() * 5),
            reactions: {
              like: [],
              love: [],
              laugh: [],
              wow: [],
              sad: [],
              angry: [],
            },
          }))
          setReplies(transformedReplies)
          setLoadingComments(false)
        }
      } catch (error) {
        console.error("Error loading data:", error)
        toast.error("Error", {
          description: "Gagal memuat data forum",
        })
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [params.id])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setReplyingTo(null)
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        if (replyingTo && inlineReplies[replyingTo]?.trim()) {
          handleSubmitReply(replyingTo)
        } else if (newReply.trim()) {
          handleSubmitReply()
        }
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "b") {
        event.preventDefault()
        handleBookmark()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [replyingTo, inlineReplies, newReply])

  // Handlers
  const handlePostAction = useCallback(
    async (action: string) => {
      if (!post) return

      try {
        switch (action) {
          case "edit":
            router.push(`/forum/${post.id}/edit`)
            break
          case "delete":
            if (confirm("Apakah Anda yakin ingin menghapus post ini?")) {
              toast("Post dihapus", { description: "Post berhasil dihapus" })
              router.push("/forum")
            }
            break
          case "pin":
            setPost((prev) => (prev ? { ...prev, isPinned: !prev.isPinned } : null))
            toast(post.isPinned ? "Post dilepas pin" : "Post dipasang pin", {
              description: post.isPinned ? "Post tidak lagi dipasang di atas" : "Post dipasang di bagian atas forum",
            })
            break
          case "archive":
            setPost((prev) => (prev ? { ...prev, isArchived: !prev.isArchived } : null))
            toast(post.isArchived ? "Post dibuka arsip" : "Post diarsipkan", {
              description: post.isArchived ? "Post kembali aktif" : "Post diarsipkan",
            })
            break
          case "bookmark":
            handleBookmark()
            break
          case "share-link":
            await navigator.clipboard.writeText(window.location.href)
            toast("Link disalin", { description: "Link post telah disalin ke clipboard" })
            break
          case "share-external":
            window.open(window.location.href, "_blank")
            break
          case "download":
            if (post.media && post.media.length > 0) {
              post.media.forEach((media, index) => {
                const link = document.createElement("a")
                link.href = media.url
                link.download = `media-${index + 1}.${media.type === "image" ? "jpg" : "mp4"}`
                link.click()
              })
              toast("Download dimulai", { description: "Media sedang diunduh" })
            }
            break
          case "report":
            toast("Laporan dikirim", { description: "Post telah dilaporkan untuk ditinjau moderator" })
            break
        }
      } catch (error) {
        console.error(error)
        toast.error("Error", { description: "Gagal melakukan aksi" })
      }
    },
    [post, router],
  )

  const handleCommentAction = useCallback(
    async (replyId: string, action: string) => {
      if (!post) return

      try {
        switch (action) {
          case "share-link":
            const shareUrl = `${window.location.origin}/forum/${post.id}#comment-${replyId}`
            await navigator.clipboard.writeText(shareUrl)
            toast("Link disalin", { description: "Link komentar telah disalin ke clipboard" })
            break
          case "share-external":
            const externalUrl = `${window.location.origin}/forum/${post.id}#comment-${replyId}`
            window.open(externalUrl, "_blank")
            break
          case "report":
            toast("Laporan dikirim", { description: "Komentar telah dilaporkan untuk ditinjau moderator" })
            break
          case "edit":
            toast("Edit", { description: "Fitur edit komentar akan segera tersedia" })
            break
          case "delete":
            if (confirm("Apakah Anda yakin ingin menghapus komentar ini?")) {
              setReplies((prev) => prev.filter((reply) => reply.id !== replyId))
              toast("Komentar dihapus", { description: "Komentar berhasil dihapus" })
            }
            break
        }
      } catch (error) {
        console.error(error)
        toast("Error", { description: "Gagal melakukan aksi" })
      }
    },
    [post],
  )

  const handleVote = useCallback(
    (replyId: string, voteType: "up" | "down") => {
      const currentVote = userState.votes[replyId]
      let newVote: "up" | "down" | null = voteType

      if (currentVote === voteType) {
        newVote = null
      }

      updateUserState({
        votes: { ...userState.votes, [replyId]: newVote },
      })

      setReplies((prev) =>
        prev.map((reply) => {
          if (reply.id === replyId) {
            let upvotes = reply.upvotes
            let downvotes = reply.downvotes

            if (currentVote === "up") upvotes--
            if (currentVote === "down") downvotes--
            if (newVote === "up") upvotes++
            if (newVote === "down") downvotes++

            return { ...reply, upvotes, downvotes }
          }
          return reply
        }),
      )

      toast("Vote berhasil", {
        description: `Anda telah ${newVote === "up" ? "upvote" : newVote === "down" ? "downvote" : "membatalkan vote"}`,
      })
    },
    [userState.votes, updateUserState],
  )

  const handleLike = useCallback(() => {
    if (!post) return

    const postKey = `post-${post.id}`
    const currentLike = userState.votes[postKey] === "up"
    const newLike = !currentLike

    updateUserState({
      votes: { ...userState.votes, [postKey]: newLike ? "up" : null },
    })

    setPost((prev) => {
      if (!prev) return null
      return {
        ...prev,
        likes: prev.likes + (newLike ? 1 : currentLike ? -1 : 0),
      }
    })

    toast(newLike ? "Post disukai" : "Like dibatalkan", {
      description: newLike ? "Anda menyukai post ini" : "Anda membatalkan like",
    })
  }, [post, userState.votes, updateUserState])

  const handleBookmark = useCallback(() => {
    if (!post) return

    const isCurrentlyBookmarked = userState.bookmarks.includes(post.id)
    const newBookmarks = isCurrentlyBookmarked
      ? userState.bookmarks.filter((id) => id !== post.id)
      : [...userState.bookmarks, post.id]

    updateUserState({
      bookmarks: newBookmarks,
    })

    toast(isCurrentlyBookmarked ? "Bookmark dihapus" : "Post di-bookmark", {
      description: isCurrentlyBookmarked ? "Post dihapus dari bookmark" : "Post ditambahkan ke bookmark",
    })
  }, [post, userState.bookmarks, updateUserState])

  const handleReaction = useCallback(
    (replyId: string, reactionKey: string) => {
      const currentUserReactions = userState.reactions[replyId] || []
      const hasReacted = currentUserReactions.includes(reactionKey)

      let newReactions: string[]
      if (hasReacted) {
        newReactions = currentUserReactions.filter((r) => r !== reactionKey)
      } else {
        newReactions = [...currentUserReactions, reactionKey]
      }

      updateUserState({
        reactions: { ...userState.reactions, [replyId]: newReactions },
      })

      setReplies((prev) =>
        prev.map((reply) => {
          if (reply.id === replyId) {
            const updatedReactions = { ...reply.reactions }
            if (hasReacted) {
              updatedReactions[reactionKey] = updatedReactions[reactionKey].filter((user) => user !== CURRENT_USER)
            } else {
              updatedReactions[reactionKey] = [...(updatedReactions[reactionKey] || []), CURRENT_USER]
            }
            return { ...reply, reactions: updatedReactions }
          }
          return reply
        }),
      )

      toast("Reaksi berhasil", {
        description: `Anda telah ${hasReacted ? "menghapus" : "menambahkan"} reaksi`,
      })
    },
    [userState.reactions, updateUserState],
  )

  const handleMarkAsSolution = useCallback(
    (replyId: string) => {
      if (!post) return

      setPost((prev) => (prev ? { ...prev, isResolved: true, solutionId: replyId } : null))
      setReplies((prev) =>
        prev.map((reply) => ({
          ...reply,
          isSolution: reply.id === replyId,
        })),
      )

      toast("Solusi ditandai", { description: "Komentar telah ditandai sebagai solusi" })
    },
    [post],
  )

  const handleSubmitReply = useCallback(
    async (replyId?: string) => {
      if (submittingReply) return

      let content: string
      let parentId: string | undefined
      let mediaFiles: File[]

      if (replyId) {
        content = inlineReplies[replyId] || ""
        parentId = replyId
        mediaFiles = inlineReplyMedia[replyId] || []
      } else {
        content = newReply
        parentId = undefined
        mediaFiles = selectedMedia
      }

      if (!content.trim()) return

      try {
        setSubmittingReply(true)

        // Simulate API delay
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const reply: ForumReply = {
          id: Date.now().toString(),
          content,
          author: CURRENT_USER,
          avatar: "/placeholder.svg?height=40&width=40",
          createdAt: new Date().toISOString(),
          upvotes: 0,
          downvotes: 0,
          parentId,
          reactions: {
            like: [],
            love: [],
            laugh: [],
            wow: [],
            sad: [],
            angry: [],
          },
          media:
            mediaFiles.length > 0
              ? mediaFiles.map((file) => ({
                type: file.type.startsWith("image/") ? ("image" as const) : ("video" as const),
                url: URL.createObjectURL(file),
              }))
              : undefined,
        }

        setReplies((prev) => [...prev, reply])

        if (replyId) {
          setInlineReplies((prev) => ({ ...prev, [replyId]: "" }))
          setInlineReplyMedia((prev) => ({ ...prev, [replyId]: [] }))
          setReplyingTo(null)
        } else {
          setNewReply("")
          setSelectedMedia([])
        }

        if (post) {
          setPost((prev) => (prev ? { ...prev, replies: prev.replies + 1 } : null))
        }

        toast("Komentar berhasil", { description: "Komentar Anda telah ditambahkan" })
      } catch (error) {
        console.error(error)
        toast("Error", { description: "Gagal menambahkan komentar" })
      } finally {
        setSubmittingReply(false)
      }
    },
    [submittingReply, inlineReplies, inlineReplyMedia, newReply, selectedMedia, post],
  )

  const toggleInlineReplyForm = useCallback(
    (replyId: string) => {
      if (replyingTo === replyId) {
        setReplyingTo(null)
        setInlineReplies((prev) => ({ ...prev, [replyId]: "" }))
        setInlineReplyMedia((prev) => ({ ...prev, [replyId]: [] }))
      } else {
        setReplyingTo(replyId)
        const replyAuthor = replies.find((r) => r.id === replyId)?.author
        if (replyAuthor) {
          setInlineReplies((prev) => ({ ...prev, [replyId]: `@${replyAuthor} ` }))
        }
      }
    },
    [replyingTo, replies],
  )

  // Render not found state
  if (!loading && !post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Post tidak ditemukan</h2>
            <p className="text-gray-600 mb-4">Post yang Anda cari tidak ada atau telah dihapus.</p>
            <Button onClick={() => router.push("/forum")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Kembali ke Forum
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="outline" onClick={() => router.push("/forum")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali ke Forum
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant={isBookmarked ? "default" : "outline"}
            size="sm"
            onClick={handleBookmark}
            className="hidden sm:flex"
            disabled={loading}
          >
            {isBookmarked ? <BookmarkCheck className="h-4 w-4 mr-1" /> : <Bookmark className="h-4 w-4 mr-1" />}
            {isBookmarked ? "Tersimpan" : "Bookmark"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePostAction("share-link")}
            className="hidden sm:flex"
            disabled={loading}
          >
            <Share2 className="h-4 w-4 mr-1" />
            Bagikan
          </Button>
        </div>
      </div>

      {/* Thumbnail Section */}
      <div className="mb-6">
        <PostThumbnail post={post} isLoading={loading} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Post Card */}
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              {loading ? (
                <PostHeaderSkeleton />
              ) : post ? (
                <>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={post.avatar || "/placeholder.svg"} />
                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{post.author}</p>
                        <p className="text-sm text-gray-500">{formatTimeAgo(post.timestamp)}</p>
                      </div>
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
                      <PostActionsPopover
                        post={post}
                        isBookmarked={isBookmarked}
                        isPostAuthor={isPostAuthor || false}
                        onAction={handlePostAction}
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
              {loading ? (
                <PostContentSkeleton />
              ) : post ? (
                <>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="whitespace-pre-wrap leading-relaxed">{post.content}</p>
                  </div>

                  {post.media && post.media.length > 0 && (
                    <div className="mb-6">
                      <MediaViewer media={post.media} />
                    </div>
                  )}

                  <Separator className="my-4" />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Button
                        variant={isLiked ? "default" : "outline"}
                        size="sm"
                        onClick={handleLike}
                        className="flex items-center gap-2"
                      >
                        <Heart className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
                        {post.likes}
                      </Button>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MessageSquare className="h-4 w-4" />
                        {replies.length} balasan
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Eye className="h-4 w-4" />
                        {views.toLocaleString()} views
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Dibuat {formatTimeAgo(post.timestamp)}</div>
                  </div>
                </>
              ) : null}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                <span className="font-semibold">Komentar {loadingComments ? "" : `(${replies.length})`}</span>
              </div>
            </CardHeader>
            <CardContent>
              {/* New Reply Form */}
              {!loading && (
                <div className="mb-6">
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="/placeholder.svg" />
                      <AvatarFallback>{CURRENT_USER[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Tulis komentar Anda..."
                        value={newReply}
                        onChange={(e) => setNewReply(e.target.value)}
                        rows={4}
                        className="resize-none"
                        disabled={submittingReply}
                      />

                      <div className="mt-3">
                        <MediaUpload
                          files={selectedMedia}
                          onFilesChange={setSelectedMedia}
                          maxFiles={1}
                          acceptVideo={false}
                          disabled={submittingReply}
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3">
                        <div className="text-xs text-gray-500">Tekan Ctrl+Enter untuk mengirim cepat</div>
                        <Button onClick={() => handleSubmitReply()} disabled={!newReply.trim() || submittingReply}>
                          {submittingReply ? (
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

              {/* Comments List */}
              <ScrollArea className="max-h-[800px]">
                <div className="space-y-4">
                  {loadingComments ? (
                    Array.from({ length: 3 }).map((_, i) => <CommentSkeleton key={i} />)
                  ) : replies.length > 0 ? (
                    replies.map((reply) => (
                      <div key={reply.id} id={`comment-${reply.id}`}>
                        <Card className={`${reply.isSolution ? "border-green-200 border-2 bg-green-50/50 dark:bg-green-50/0" : ""}`}>
                          <CardContent className="p-4">
                            <div className="flex gap-3">
                              {/* Vote buttons */}
                              <div className="flex flex-col items-center gap-1 mr-2">
                                <Button
                                  variant={userState.votes[reply.id] === "up" ? "default" : "ghost"}
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleVote(reply.id, "up")}
                                >
                                  <ChevronUp className="h-4 w-4" />
                                </Button>
                                <span className="text-sm font-medium text-center min-w-[2rem]">
                                  {reply.upvotes - reply.downvotes}
                                </span>
                                <Button
                                  variant={userState.votes[reply.id] === "down" ? "default" : "ghost"}
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                  onClick={() => handleVote(reply.id, "down")}
                                >
                                  <ChevronDown className="h-4 w-4" />
                                </Button>
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                      <AvatarImage src={reply.avatar || "/placeholder.svg"} />
                                      <AvatarFallback>{reply.author[0]}</AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium">{reply.author}</span>
                                    <span className="text-sm text-gray-500">{formatTimeAgo(reply.createdAt)}</span>
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
                                    isAuthor={reply.author === CURRENT_USER}
                                    onAction={(action) => handleCommentAction(reply.id, action)}
                                  />
                                </div>

                                <div className="prose prose-sm max-w-none dark:prose-invert mb-2">
                                  <p className="whitespace-pre-wrap text-sm leading-relaxed">{reply.content}</p>
                                </div>

                                {reply.media && reply.media.length > 0 && (
                                  <div className="mb-3">
                                    <MediaViewer media={reply.media} />
                                  </div>
                                )}

                                {/* Reactions */}
                                {reply.reactions &&
                                  Object.values(reply.reactions).some((users) => users.length > 0) && (
                                    <div className="flex gap-1 mb-3 flex-wrap">
                                      {EMOJI_REACTIONS.map((reaction) => {
                                        const users = reply.reactions?.[reaction.key] || []
                                        if (users.length === 0) return null
                                        return (
                                          <Button
                                            key={reaction.key}
                                            variant="outline"
                                            size="sm"
                                            className="h-6 px-2 text-xs"
                                            onClick={() => handleReaction(reply.id, reaction.key)}
                                          >
                                            {reaction.emoji} {users.length}
                                          </Button>
                                        )
                                      })}
                                    </div>
                                  )}

                                {/* Action buttons */}
                                <div className="flex items-center gap-2 text-sm">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => toggleInlineReplyForm(reply.id)}
                                    className="h-6 px-2 text-xs"
                                  >
                                    <Reply className="h-3 w-3 mr-1" />
                                    Balas
                                  </Button>
                                  <EmojiReactionPopover
                                    onSelect={(reactionKey) => handleReaction(reply.id, reactionKey)}
                                  />
                                  {(isPostAuthor || IS_ADMIN) && !post?.isResolved && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => handleMarkAsSolution(reply.id)}
                                      className="h-6 px-2 text-xs text-green-600 hover:text-green-700"
                                    >
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      Tandai Solusi
                                    </Button>
                                  )}
                                </div>

                                {replyingTo === reply.id && (
                                  <InlineReplyForm
                                    replyId={reply.id}
                                    replyAuthor={reply.author}
                                    content={inlineReplies[reply.id] || ""}
                                    media={inlineReplyMedia[reply.id] || []}
                                    onContentChange={(content) =>
                                      setInlineReplies((prev) => ({ ...prev, [reply.id]: content }))
                                    }
                                    onMediaChange={(files) =>
                                      setInlineReplyMedia((prev) => ({ ...prev, [reply.id]: files }))
                                    }
                                    onSubmit={() => handleSubmitReply(reply.id)}
                                    onCancel={() => toggleInlineReplyForm(reply.id)}
                                    isSubmitting={submittingReply}
                                  />
                                )}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-12">
                      <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium mb-2">Belum ada komentar</h3>
                      <p className="text-gray-600">Jadilah yang pertama memberikan komentar!</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Sidebar */}
        <div className="hidden xl:block space-y-6">
          <PostStats post={post} views={views} isLiked={isLiked} isLoading={loading} />
          <QuickActions
            onBookmark={handleBookmark}
            onShare={() => handlePostAction("share-link")}
            onNewPost={() => router.push("/forum/new")}
            isBookmarked={isBookmarked}
            isLoading={loading}
          />
          <RelatedPosts currentPost={post} isLoading={loading} />
        </div>
      </div>
    </div>
  )
}
