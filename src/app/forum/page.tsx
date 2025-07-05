// app/forum/page.tsx atau pages/forum/index.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Search, AlertCircle } from "lucide-react";
import forumPostsData from "@/data/forum-posts.json";
import { ForumListSkeleton } from "@/components/ui/skeleton-loader";

// Import dari file baru
import { ForumPost, CategoryType } from "@/types/forum";
// import { getTimeAgo } from "@/lib/utils/forum";
import ForumPostCard from "@/components/forum/ForumPostCard";
import ForumRightSidebar from "@/components/forum/ForumRightSidebar";

export default function ForumPage() {
    const [posts, setPosts] = useState<ForumPost[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] =
        useState<CategoryType>("all");
    const [sortBy, setSortBy] = useState("newest");
    const [filterStatus, setFilterStatus] = useState("all");
    const router = useRouter();
    const [loading, setLoading] = useState(true);

    // Load forum post data from localStorage and JSON data
    useEffect(() => {
        const loadData = async () => {
            try {
                const localPosts = JSON.parse(localStorage.getItem("forumPosts") || "[]");
                const allPostsMap = new Map<string, ForumPost>();
                // Prioritize local storage posts to allow for user-created content to override static data
                [...forumPostsData, ...localPosts].forEach((post) => {
                    allPostsMap.set(post.id, post);
                });
                const allPosts = Array.from(allPostsMap.values());
                setPosts(allPosts);
            } catch (error) {
                console.error("Error loading forum data:", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // Memoize filtered and sorted posts to optimize re-renders
    const filteredAndSortedPosts = useMemo(() => {
        let filtered = [...posts];

        if (searchQuery) {
            const lowerCaseSearchQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (post) =>
                    post.title.toLowerCase().includes(lowerCaseSearchQuery) ||
                    post.content.toLowerCase().includes(lowerCaseSearchQuery) ||
                    post.tags.some((tag) => tag.toLowerCase().includes(lowerCaseSearchQuery))
            );
        }

        if (selectedCategory !== "all") {
            filtered = filtered.filter((post) => post.category === selectedCategory);
        }

        if (filterStatus === "resolved") {
            filtered = filtered.filter((post) => post.isResolved);
        } else if (filterStatus === "unresolved") {
            filtered = filtered.filter((post) => !post.isResolved);
        }

        filtered.sort((a, b) => {
            const dateA = new Date(a.timestamp).getTime();
            const dateB = new Date(b.timestamp).getTime();

            switch (sortBy) {
                case "newest":
                    return dateB - dateA;
                case "oldest":
                    return dateA - dateB;
                case "most-liked":
                    return b.likes - a.likes;
                case "most-replies":
                    return b.replies - a.replies;
                default:
                    return 0;
            }
        });

        return filtered;
    }, [posts, searchQuery, selectedCategory, sortBy, filterStatus]);

    // Memoize category statistics
    const categoryStats = useMemo(() => {
        const initialCategories = [
            { value: "all", label: "Semua Kategori", count: 0 },
            { value: "Hardware", label: "Hardware", count: 0 },
            { value: "Software", label: "Software", count: 0 },
            { value: "Network", label: "Network", count: 0 },
            { value: "Gaming", label: "Gaming", count: 0 },
            { value: "Diagnosa", label: "Diagnosa", count: 0 },
            { value: "Lainnya", label: "Lainnya", count: 0 },
        ];

        const stats = initialCategories.map((cat) => ({
            ...cat,
            count:
                cat.value === "all"
                    ? posts.length
                    : posts.filter((p) => p.category === cat.value).length,
        }));
        return stats;
    }, [posts]);

    if (loading) {
        return <ForumListSkeleton />;
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                        <MessageSquare className="h-8 w-8 text-blue-600" />
                        Forum Diskusi
                    </h1>
                    <p className="text-gray-600">Berbagi pengalaman dan solusi masalah komputer</p>
                </div>
                <Button onClick={() => router.push("/forum/new")} className="shrink-0 md:hidden">
                    <Plus className="mr-2 h-4 w-4" />
                    Buat Pertanyaan
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Filters and Search */}
                    <Card className="py-0">
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <Input
                                            placeholder="Cari pertanyaan, tag, atau konten..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-10"
                                            aria-label="Search forum posts"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Urutkan Berdasarkan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Terbaru</SelectItem>
                                            <SelectItem value="oldest">Terlama</SelectItem>
                                            <SelectItem value="most-liked">Paling Disukai</SelectItem>
                                            <SelectItem value="most-replies">Paling Banyak Balasan</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                                        <SelectTrigger className="w-40">
                                            <SelectValue placeholder="Filter Status" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Status</SelectItem>
                                            <SelectItem value="resolved">Terselesaikan</SelectItem>
                                            <SelectItem value="unresolved">Belum Selesai</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Posts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {filteredAndSortedPosts.length > 0 ? (
                            filteredAndSortedPosts.map((post) => (
                                <ForumPostCard key={post.id} post={post} />
                            ))
                        ) : (
                            <div className="col-span-full">
                                <Card>
                                    <CardContent className="p-8 text-center">
                                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <h3 className="text-lg font-medium mb-2">
                                            Tidak ada post ditemukan
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            {searchQuery ||
                                                selectedCategory !== "all" ||
                                                filterStatus !== "all"
                                                ? "Coba ubah filter atau kata kunci pencarian"
                                                : "Belum ada pertanyaan di forum ini"}
                                        </p>
                                        <Button onClick={() => router.push("/forum/new")}>
                                            <Plus className="mr-2 h-4 w-4" />
                                            Buat Pertanyaan Pertama
                                        </Button>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Sidebar Component */}
                <ForumRightSidebar
                    categoryStats={categoryStats}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory as (value: string) => void}
                    setSearchQuery={setSearchQuery} // Pass setSearchQuery to sidebar
                />
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
        </div>
    );
}