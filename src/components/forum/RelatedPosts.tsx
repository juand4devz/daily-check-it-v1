// /components/forum/RelatedPosts.tsx
"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Heart, Tag } from "lucide-react";
import { ForumPost } from "@/types/forum"; // Import ForumPost type
import { Skeleton } from "../ui/skeleton";

interface RelatedPostsProps {
    currentPost: ForumPost | null;
    isLoading: boolean;
}

// Data dummy untuk related posts jika tidak ada implementasi API
const dummyRelatedPosts: ForumPost[] = [
    // Contoh dummy data (ganti dengan data relevan jika diperlukan)
    // Ini harus datang dari API di aplikasi nyata, atau dari data yang sudah di-cache jika memungkinkan.
    // Misalnya, filter postingan dari allPosts yang memiliki kategori/tag yang sama.
    // Untuk tujuan ini, kita akan kembalikan array kosong jika tidak ada data dari prop.
];

export function RelatedPosts({ currentPost, isLoading }: RelatedPostsProps) {
    // Di aplikasi nyata, Anda akan fetch related posts dari backend
    // berdasarkan currentPost.category, currentPost.tags, dll.
    const relatedPosts = useMemo(() => {
        if (!currentPost) return [];
        // Untuk demo, kita bisa mengambil beberapa dari dummy data jika ada
        // atau Anda bisa memiliki fungsi fetch `getRelatedPosts(postId)` di service
        // dan API route yang memanggilnya.
        // Untuk saat ini, asumsikan ini akan datang dari prop jika Anda punya.
        return dummyRelatedPosts.filter(p => p.id !== currentPost.id).slice(0, 3);
    }, [currentPost]);

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
        );
    }

    if (!relatedPosts || relatedPosts.length === 0) return null; // Tidak render jika tidak ada related posts

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
    );
}