// components/forum/GuestPostCard.tsx
"use client";

import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    MessageSquare,
    Heart,
    Eye,
    BookOpenText,
    CheckCircle,
    Pin,
} from "lucide-react";
import {
    ForumPost,
    FORUM_TYPES,
    FORUM_CATEGORIES,
    getTypeIcon,
    getCategoryIcon,
    getRandomGradient,
    getReadingTime,
} from "@/lib/utils/forum-utils";
import { formatTimeAgo } from "@/lib/utils/date-utils";
import { cn } from "@/lib/utils";

interface GuestPostCardProps {
    post: ForumPost;
    onClick: (post: ForumPost) => void;
}

export function GuestPostCard({ post, onClick }: GuestPostCardProps) {
    const TypeIcon = getTypeIcon(post.type || "lainnya");
    const CategoryIcon = getCategoryIcon(post.category);
    const forumType = FORUM_TYPES.find((t) => t.id === post.type);
    const forumCategory = FORUM_CATEGORIES.find((c) => c.id === post.category);
    const fullTextContent = `${post.title || ""} ${post.description || ""} ${post.content || ""
        }`;
    const readingTime = getReadingTime(fullTextContent);

    return (
        <Card
            key={post.id}
            className="hover:shadow-lg transition-all duration-300 group py-0 overflow-hidden cursor-pointer"
            onClick={() => onClick(post)}
        >
            <div>
                <div className="relative h-48 overflow-hidden">
                    {post.thumbnail ? (
                        <Image
                            height={500}
                            width={500}
                            // Perbaikan: Pastikan src adalah string
                            src={post.thumbnail}
                            alt={post.title || "Forum post thumbnail"}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div
                            className={cn(
                                "w-full h-full relative overflow-hidden flex items-center justify-center",
                                getRandomGradient(post.id),
                            )}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <TypeIcon className="h-16 w-16 text-white/80" />
                            </div>
                        </div>
                    )}

                    <div className="absolute top-3 left-3 flex gap-2">
                        {forumType && (
                            <Badge
                                variant="secondary"
                                className={`${forumType.color} text-white border-0`}
                            >
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
                    {post.isResolved && post.type === "pertanyaan" && (
                        <Badge className="bg-green-600 text-white border-0 absolute top-3 right-3">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Selesai
                        </Badge>
                    )}
                </div>

                <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage src={post.authorAvatar || ""} />
                            <AvatarFallback>{post.authorUsername?.[0] || "?"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{post.authorUsername}</p>
                            <p className="text-xs text-gray-500">
                                {formatTimeAgo(post.createdAt)}
                            </p>
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

                    <p className="text-gray-600 text-sm line-clamp-3 mb-3">
                        {post.description}
                    </p>

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
                            <span className="flex items-center gap-1">
                                <Eye className="h-4 w-4" />
                                {post.views}
                            </span>
                            <span className="flex items-center gap-1 text-xs">
                                <BookOpenText className="h-3 w-3" />
                                {readingTime}
                            </span>
                        </div>
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
    );
}