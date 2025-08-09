// /components/forum/PostThumbnail.tsx
"use client";

import React from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils"; // Import cn
import { getTypeIcon, getRandomGradient } from "@/lib/utils/forum-utils"; // Import utils
import { ForumPost } from "@/types/forum"; // Import ForumPost type

interface PostThumbnailProps {
    post: ForumPost | null;
    isLoading: boolean;
}

export function PostThumbnail({ post, isLoading }: PostThumbnailProps) {
    if (isLoading) {
        return <Skeleton className="w-full h-64 rounded-lg" />;
    }

    if (!post) return null;

    const hasThumbnail = post.thumbnail && post.thumbnail !== "null";

    const TypeIcon = getTypeIcon(post.type || "lainnya");
    const gradient = getRandomGradient(post.id);

    return (
        <div className="relative w-full h-44 md:h-60 rounded-lg overflow-hidden group">
            {hasThumbnail ? (
                <Image
                    height={200}
                    width={200}
                    src={post.thumbnail!}
                    alt={post.title}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
            ) : (
                <div className={cn("w-full h-full flex items-center justify-center relative overflow-hidden", gradient)}>
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <TypeIcon className="h-16 w-16 text-white/80" />
                    </div>
                </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 text-white bg-black/30 p-3">
                <h2 className="text-xl font-bold line-clamp-2">{post.title}</h2>
            </div>
            {post.media && post.media.length > 0 && (
                <div className="absolute top-4 right-4">
                    <Badge variant="secondary" className="bg-black/50 text-white border-0">
                        {post.media.length === 1 ? '1 media' : `+${post.media.length} media`}
                    </Badge>
                    <Badge variant="secondary" className="bg-black/50 text-white border-0 ml-2">
                        {post.category}
                    </Badge>
                </div>
            )}
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
        </div>
    );
}