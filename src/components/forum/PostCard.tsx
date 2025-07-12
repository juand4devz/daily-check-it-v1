"use client"

import type React from "react"
import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    MessageSquare,
    Heart,
    CheckCircle,
    ImageIcon,
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
} from "lucide-react"
import type { ForumPost } from "@/lib/utils/forum-utils"
import {
    getTimeAgo,
    getRandomGradient,
    getTypeIcon,
    FORUM_TYPES,
    FORUM_CATEGORIES,
    getCategoryIcon
} from "@/lib/utils/forum-utils"

import { toast } from "sonner"

interface PostCardProps {
    post: ForumPost
    currentUser?: string
    isAdmin?: boolean
    onPostAction?: (postId: string, action: string) => void
    onTagClick?: (tag: string) => void
}

export function PostCard({ post, currentUser, isAdmin, onPostAction, onTagClick }: PostCardProps) {
    const router = useRouter()
    const [isLiked, setIsLiked] = useState(false) // This state should ideally come from a global state or API
    const isAuthor = post.author === currentUser

    const handleAction = async (action: string, event: React.MouseEvent) => {
        event.stopPropagation() // Prevent card click from triggering

        try {
            switch (action) {
                case "like":
                    setIsLiked(!isLiked)
                    // TODO: API call to toggle like
                    break
                case "share-link":
                    await navigator.clipboard.writeText(`${window.location.origin}/forum/${post.id}`)
                    toast("Link disalin", { description: "Link post telah disalin ke clipboard" })
                    break
                case "share-external":
                    window.open(`${window.location.origin}/forum/${post.id}`, "_blank")
                    break
                default:
                    onPostAction?.(post.id, action)
            }
        } catch (error) {
            console.error("Error handling action:", error)
            toast.error("Error", {
                description: "Gagal melakukan aksi",
            })
        }
    }

    const hasMedia = post.media && post.media.length > 0
    const thumbnail = post.thumbnail || (post.media && post.media.length > 0 ? post.media[0].url : null)
    const TypeIcon = getTypeIcon(post.type)
    const CategoryIcon = getCategoryIcon(post.category)
    const forumType = FORUM_TYPES.find((t) => t.id === post.type)
    const forumCategory = FORUM_CATEGORIES.find((c) => c.id === post.category)

    return (
        <Card
            key={post.id}
            className="hover:shadow-lg transition-all duration-300 cursor-pointer group py-0 overflow-hidden"
            onClick={() => router.push(`/forum/${post.id}`)}
        >
            <div>
                {/* Thumbnail or Placeholder */}
                <div className="relative h-48 overflow-hidden">
                    {thumbnail ? (
                        <Image
                            height={500}
                            width={500}
                            src={thumbnail || "/placeholder.svg"}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className={`w-full h-full ${getRandomGradient(post.id)} animate-pulse relative overflow-hidden`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <TypeIcon className="h-16 w-16 text-white/80" />
                            </div>
                        </div>
                    )}

                    {/* Status Badges */}
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

                    {/* Media indicator */}
                    {hasMedia && (
                        <div className="absolute top-3 right-3">
                            <Badge variant="secondary" className="bg-black/50 text-white border-0">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {post.media!.length}
                            </Badge>
                        </div>
                    )}

                    {/* Actions dropdown */}
                    <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0">
                                    <MoreHorizontal className="h-4 w-4 text-white" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem onClick={(e) => handleAction("share-link", e)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Salin Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => handleAction("share-external", e)}>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Buka di Tab Baru
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={(e) => handleAction("bookmark", e)}>
                                    <BookmarkPlus className="h-4 w-4 mr-2" />
                                    Bookmark
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                {(isAuthor || isAdmin) && (
                                    <>
                                        <DropdownMenuItem onClick={(e) => handleAction("edit", e)}>
                                            <Edit className="h-4 w-4 mr-2" />
                                            Edit Post
                                        </DropdownMenuItem>
                                        {isAdmin && (
                                            <DropdownMenuItem onClick={(e) => handleAction("pin", e)}>
                                                <Pin className="h-4 w-4 mr-2" />
                                                {post.isPinned ? "Lepas Pin" : "Pin Post"}
                                            </DropdownMenuItem>
                                        )}
                                        {isAdmin && (
                                            <DropdownMenuItem onClick={(e) => handleAction("archive", e)}>
                                                <Archive className="h-4 w-4 mr-2" />
                                                {post.isArchived ? "Buka Arsip" : "Arsipkan"}
                                            </DropdownMenuItem>
                                        )}
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            onClick={(e) => handleAction("delete", e)}
                                            className="text-red-600 focus:text-red-600"
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Hapus Post
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {!isAuthor && (
                                    <DropdownMenuItem
                                        onClick={(e) => handleAction("report", e)}
                                        className="text-red-600 focus:text-red-600"
                                    >
                                        <Flag className="h-4 w-4 mr-2" />
                                        Laporkan
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={post.avatar || "/placeholder.svg"} />
                            <AvatarFallback>{post.author[0]}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{post.author}</p>
                            <p className="text-xs text-gray-500">{getTimeAgo(post.timestamp)}</p>
                        </div>
                        {forumCategory && (
                            <Badge variant="outline" className="text-xs flex-shrink-0">
                                <CategoryIcon className="h-3 w-3 mr-1" />
                                {forumCategory.name}
                            </Badge>
                        )}
                    </div>

                    <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {post.title}
                    </h3>

                    <p className="text-gray-600 text-sm line-clamp-3 mb-3">{post.content}</p>

                    {/* Tags */}
                    {post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                            {post.tags.slice(0, 3).map((tag, index) => (
                                <Badge
                                    key={index}
                                    variant="outline"
                                    className="text-xs cursor-pointer hover:bg-blue-100"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        onTagClick?.(tag)
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

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
                        <div className="flex items-center gap-4">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs hover:text-red-500"
                                onClick={(e) => handleAction("like", e)}
                            >
                                <Heart className={`h-4 w-4 mr-1 ${isLiked ? "fill-current text-red-500" : ""}`} />
                                {post.likes + (isLiked ? 1 : 0)}
                            </Button>
                            <span className="flex items-center gap-1">
                                <MessageSquare className="h-4 w-4" />
                                {post.replies}
                            </span>
                            <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {post.views}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-xs"
                            onClick={(e) => handleAction("share-link", e)}
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
        </Card>
    )
}
