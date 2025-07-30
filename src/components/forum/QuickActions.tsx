// /components/forum/QuickActions.tsx
"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bookmark, BookmarkCheck, Share2, MessageSquare, Settings } from "lucide-react";
import { SidebarSkeleton } from "@/components/ui/skeleton-loader"; // Import SidebarSkeleton

interface QuickActionsProps {
    onBookmark: () => void;
    onShare: () => void;
    onNewPost: () => void;
    isBookmarked: boolean;
    isLoading: boolean;
}

export function QuickActions({ onBookmark, onShare, onNewPost, isBookmarked, isLoading }: QuickActionsProps) {
    if (isLoading) {
        return <SidebarSkeleton />;
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
                    type="button"
                    variant={isBookmarked ? "default" : "outline"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={onBookmark}
                >
                    {isBookmarked ? <BookmarkCheck className="h-4 w-4 mr-2" /> : <Bookmark className="h-4 w-4 mr-2" />}
                    {isBookmarked ? "Tersimpan" : "Bookmark Post"}
                </Button>
                <Button type="button" variant="outline" size="sm" className="w-full justify-start bg-transparent" onClick={onShare}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Bagikan Post
                </Button>
                <Button type="button" variant="outline" size="sm" className="w-full justify-start bg-transparent" onClick={onNewPost}>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Buat Post Baru
                </Button>
            </CardContent>
        </Card>
    );
}