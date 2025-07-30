// /components/forum/PostStats.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Eye, Heart, MessageCircle, Clock, Users, TrendingUp, Calendar } from "lucide-react";
import { formatTimeAgo } from "@/lib/utils/date-utils";
import { ForumPost } from "@/types/forum";
import { SidebarSkeleton } from "@/components/ui/skeleton-loader"; // Import SidebarSkeleton

interface PostStatsProps {
    post: ForumPost | null;
    views: number;
    isLiked: boolean; // Menunjukkan apakah pengguna saat ini menyukai postingan ini
    isLoading: boolean;
}

export function PostStats({ post, views, isLiked, isLoading }: PostStatsProps) {
    if (isLoading) {
        return <SidebarSkeleton />;
    }

    if (!post) return null;

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
                        <div className="text-2xl font-bold text-red-700">{post.likes.toLocaleString()}</div>
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
                        <span className="text-xs text-gray-600">{formatTimeAgo(post.createdAt)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}