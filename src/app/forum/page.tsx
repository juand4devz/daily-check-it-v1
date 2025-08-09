// app/forum/page.tsx
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Plus, Search, Award, Filter, X, TrendingUp, Waypoints } from "lucide-react";
import { ForumListSkeleton } from "@/components/ui/skeleton-loader";
import { PostCard } from "@/components/forum/PostCard";
import { toast } from "sonner";
import Fuse from "fuse.js";

import {
    ForumPost,
    FORUM_TYPES,
    FORUM_CATEGORIES,
    getTypeIcon,
    getRandomGradient,
    calculatePostStats as calculatePostStatsUtil,
} from "@/lib/utils/forum-utils";

export default function ForumPage() {
    const { data: session } = useSession();
    const userId = session?.user?.id;

    const [allPosts, setAllPosts] = useState<ForumPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("all");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [sortBy, setSortBy] = useState("newest"); // Default sort is 'newest'
    const [selectedTags, setSelectedTags] = useState<string[]>([]);

    const router = useRouter();
    const searchParams = useSearchParams();
    const hasInit = useRef(false);
    const lastUrlString = useRef("");

    const fuse = useMemo(() => {
        const options = {
            keys: [
                "title",
                "content",
                "authorUsername",
                "tags",
                "category",
                "description",
            ],
            threshold: 0.3,
            includeScore: true,
        };
        return new Fuse(allPosts, options);
    }, [allPosts]);

    // --- INIT: Parse URL params once on mount ---
    useEffect(() => {
        if (hasInit.current) return;

        const type = searchParams.get("type");
        const category = searchParams.get("category");
        const status = searchParams.get("status");
        const sort = searchParams.get("sort");
        const search = searchParams.get("search");
        const tags = searchParams.get("tags")?.split(",").filter(Boolean);

        // Only set state if param exists, otherwise let useState's default apply
        if (type) setSelectedType(type);
        if (category) setSelectedCategory(category);
        if (status) setSelectedStatus(status);
        if (sort) setSortBy(sort);
        if (search) setSearchQuery(search);
        if (tags && tags.length > 0) setSelectedTags(tags);

        hasInit.current = true;
    }, [searchParams]);

    // --- Update URL on filter/sort change ---
    useEffect(() => {
        const paramsObj: Record<string, string | string[]> = {
            type: selectedType,
            category: selectedCategory,
            status: selectedStatus,
            sort: sortBy,
            search: searchQuery,
            tags: selectedTags,
        };
        const url = new URL(window.location.href);
        const newSearchParams = new URLSearchParams(); // Use a new URLSearchParams instance

        Object.entries(paramsObj).forEach(([k, v]) => {
            // Only add parameter if it's not its default value
            if (Array.isArray(v)) {
                if (v.length > 0) {
                    newSearchParams.set(k, v.join(","));
                }
            } else {
                let isDefault = false;
                if (k === "type" || k === "category" || k === "status") {
                    isDefault = v === "all";
                } else if (k === "sort") {
                    isDefault = v === "newest"; // Check against default 'newest'
                } else if (k === "search") {
                    isDefault = v === "";
                }

                if (!isDefault) {
                    newSearchParams.set(k, v);
                }
            }
        });

        // Remove 'search' and 'tags' parameters if empty or default
        if (searchQuery === "") newSearchParams.delete("search");
        if (selectedTags.length === 0) newSearchParams.delete("tags");


        const newUrlString = `${window.location.origin}${window.location.pathname}?${newSearchParams.toString()}`;

        if (newUrlString !== lastUrlString.current) {
            window.history.replaceState({}, "", newUrlString);
            lastUrlString.current = newUrlString;
        }
    }, [selectedType, selectedCategory, selectedStatus, sortBy, searchQuery, selectedTags]);

    // ... (rest of the component remains the same)
    // Load data from API
    useEffect(() => {
        const fetchPosts = async () => {
            setLoading(true);
            try {
                const response = await fetch("/api/forum/posts");
                if (!response.ok) {
                    throw new Error("Failed to fetch posts");
                }
                const data = await response.json();
                if (data.status) {
                    setAllPosts(data.data);
                } else {
                    toast.error("Gagal memuat postingan", { description: data.message });
                }
            } catch (error) {
                console.error("Error fetching forum data:", error);
                toast.error("Error", { description: "Gagal memuat data forum." });
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    // Filter and sort posts using Fuse.js and client-side logic
    const filteredAndSortedPosts = useMemo(() => {
        let filtered = [...allPosts];

        // Search filter using Fuse.js
        if (searchQuery.trim()) {
            const fuseResults = fuse.search(searchQuery.trim());
            filtered = fuseResults.map((result) => result.item);
        }

        // Type filter
        if (selectedType !== "all") {
            filtered = filtered.filter((post) => post.type === selectedType);
        }

        // Category filter
        if (selectedCategory !== "all") {
            filtered = filtered.filter((post) => post.category === selectedCategory);
        }

        // Status filter (only for 'pertanyaan' type)
        if (selectedStatus !== "all") {
            if (selectedStatus === "resolved") {
                filtered = filtered.filter((post) => post.type === "pertanyaan" && post.isResolved);
            } else if (selectedStatus === "unresolved") {
                filtered = filtered.filter((post) => post.type === "pertanyaan" && !post.isResolved);
            }
        }

        // Tags filter
        if (selectedTags.length > 0) {
            filtered = filtered.filter((post) => selectedTags.every((tag) => post.tags.includes(tag)));
        }

        // Sort logic
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
                case "oldest":
                    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                case "most-liked":
                    return b.likes - a.likes;
                case "most-replies":
                    return b.replies - a.replies;
                case "most-viewed":
                    return b.views - a.views;
                default:
                    return 0;
            }
        });

        // Pinned posts first
        return filtered.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return 0;
        });
    }, [allPosts, searchQuery, selectedType, selectedCategory, selectedStatus, sortBy, selectedTags, fuse]);

    // Get type statistics (using allPosts)
    const typeStats = useMemo(() => {
        return FORUM_TYPES.map((type) => ({
            ...type,
            count: allPosts.filter((p) => p.type === type.id).length,
        }));
    }, [allPosts]);

    // Get popular tags (using allPosts)
    const popularTags = useMemo(() => {
        const tagCounts: { [key: string]: number } = {};
        allPosts.forEach((post) => {
            post.tags.forEach((tag) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        });

        return Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([tag, count]) => ({ tag, count }));
    }, [allPosts]);

    // Quick Stats (using utility functions on allPosts)
    const quickStats = useMemo(() => {
        return calculatePostStatsUtil(allPosts);
    }, [allPosts]);

    const handleFilterChange = useCallback(
        (key: string, value: string) => {
            switch (key) {
                case "type":
                    setSelectedType(value);
                    break;
                case "category":
                    setSelectedCategory(value);
                    break;
                case "status":
                    setSelectedStatus(value);
                    break;
                case "sort":
                    setSortBy(value);
                    break;
                case "search":
                    setSearchQuery(value);
                    break;
            }
        },
        [],
    );

    const addTag = useCallback(
        (tag: string) => {
            setSelectedTags((prev) => {
                if (!prev.includes(tag)) {
                    return [...prev, tag];
                }
                return prev;
            });
        },
        [],
    );

    const removeTag = useCallback((tag: string) => {
        setSelectedTags((prev) => prev.filter((t) => t !== tag));
    }, []);

    const clearAllFilters = useCallback(() => {
        setSearchQuery("");
        setSelectedType("all");
        setSelectedCategory("all");
        setSelectedStatus("all");
        setSortBy("newest"); // Reset to default 'newest'
        setSelectedTags([]);
    }, []);

    if (loading) {
        return <ForumListSkeleton />;
    }

    return (
        <div className="px-4 py-8 w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                <div className="flex flex-col">
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                        <Waypoints className="h-14 w-14 mr-3" />
                        Forum Diskusi
                    </h1>
                    <p className="text-gray-600">Berbagi pengetahuan, pengalaman, dan solusi bersama komunitas</p>
                </div>
                <div className="block lg:hidden md:w-32">
                    <Button className="w-full" size="sm" onClick={() => router.push("/forum/new")}>
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Diskusi
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Search and Filters */}
                    <Card className="p-0">
                        <CardContent className="p-4">
                            <div className="space-y-4">
                                {/* Search */}
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Cari diskusi, tag, atau konten..."
                                        value={searchQuery}
                                        onChange={(e) => handleFilterChange("search", e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                {/* Filter Controls */}
                                <div className="flex flex-wrap gap-4">
                                    <Select value={selectedType} onValueChange={(value) => handleFilterChange("type", value)}>
                                        <SelectTrigger className="w-full md:w-40">
                                            <SelectValue placeholder="Tipe Diskusi" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Tipe</SelectItem>
                                            {FORUM_TYPES.map((type) => (
                                                <SelectItem key={type.id} value={type.id}>
                                                    {type.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={selectedCategory} onValueChange={(value) => handleFilterChange("category", value)}>
                                        <SelectTrigger className="w-full md:w-40">
                                            <SelectValue placeholder="Kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Semua Kategori</SelectItem>
                                            {FORUM_CATEGORIES.map((category) => (
                                                <SelectItem key={category.id} value={category.id}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    {selectedType === "pertanyaan" && (
                                        <Select value={selectedStatus} onValueChange={(value) => handleFilterChange("status", value)}>
                                            <SelectTrigger className="w-full md:w-40">
                                                <SelectValue placeholder="Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="all">Semua Status</SelectItem>
                                                <SelectItem value="resolved">Terjawab</SelectItem>
                                                <SelectItem value="unresolved">Belum Terjawab</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}

                                    <Select value={sortBy} onValueChange={(value) => handleFilterChange("sort", value)}>
                                        <SelectTrigger className="w-full md:w-40">
                                            <SelectValue placeholder="Urutkan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="newest">Terbaru</SelectItem>
                                            <SelectItem value="oldest">Terlama</SelectItem>
                                            <SelectItem value="most-liked">Paling Disukai</SelectItem>
                                            <SelectItem value="most-replies">Paling Banyak Balasan</SelectItem>
                                            <SelectItem value="most-viewed">Paling Banyak Dilihat</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {(searchQuery ||
                                        selectedType !== "all" ||
                                        selectedCategory !== "all" ||
                                        selectedStatus !== "all" ||
                                        sortBy !== "newest" || // Check sortBy against its default
                                        selectedTags.length > 0) && (
                                            <Button variant="outline" size="sm" onClick={clearAllFilters}>
                                                <X className="h-4 w-4 mr-1" />
                                                Hapus Filter
                                            </Button>
                                        )}
                                </div>

                                {/* Active Tags */}
                                {selectedTags.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        <span className="text-sm text-gray-600">Tag aktif:</span>
                                        {selectedTags.map((tag) => (
                                            <Badge key={tag} variant="secondary" className="gap-1">
                                                #{tag}
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-3 w-3 p-0 hover:bg-transparent"
                                                    onClick={() => removeTag(tag)}
                                                >
                                                    <X className="h-2 w-2" />
                                                </Button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Posts Grid */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-semibold">{filteredAndSortedPosts.length} Diskusi Ditemukan</h2>
                        </div>

                        {filteredAndSortedPosts.length === 0 ? (
                            <Card>
                                <CardContent className="p-8 text-center">
                                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Tidak ada diskusi ditemukan</h3>
                                    <p className="text-gray-600 mb-4">Coba ubah filter pencarian atau buat diskusi baru</p>
                                    <Button onClick={() => router.push("/forum/new")}>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Buat Diskusi Baru
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="grid sm:grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 3xl:grid-cols-4 4xl:grid-cols-4 gap-6">
                                {filteredAndSortedPosts.map((post) => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onTagClick={addTag}
                                        initialIsLiked={userId ? post.likedBy.includes(userId) : false}
                                        initialLikeCount={post.likes}
                                        initialIsBookmarked={false}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6 lg:sticky lg:top-20 self-start">
                    <Button onClick={() => router.push("/forum/new")} className="shrink-0 w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Buat Diskusi
                    </Button>
                    <Card className="px-1 pt-3 pb-2">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Tipe Diskusi
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 px-1">
                            {typeStats.map((type) => {
                                const TypeIcon = getTypeIcon(type.id);
                                return (
                                    <div
                                        key={type.id}
                                        className={`px-3 py-2 rounded-lg cursor-pointer transition-all ${selectedType === type.id
                                            ? "bg-blue-50 dark:bg-zinc-700 border-2 border-blue-200 dark:border-gray-700 dark:text-gray-300 transform scale-[103%]"
                                            : "hover:bg-gray-50 dark:hover:bg-zinc-600 dark:hover:text-gray-200 border border-gray-200 dark:border-gray-400"
                                            }`}
                                        onClick={() => handleFilterChange("type", type.id)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className={`p-1 rounded ${getRandomGradient(type.id)} text-white`}>
                                                    <TypeIcon className="h-4 w-4 outline-zinc-800 dark:outline-zinc-100" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{type.name}</div>
                                                    <div className="text-xs text-gray-500 dark:text-gray-200">{type.description}</div>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                {type.count}
                                            </Badge>
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                    {/* Popular Tags */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <TrendingUp className="h-5 w-5" />
                                Tag Populer
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2">
                                {popularTags.slice(0, 15).map(({ tag, count }) => (
                                    <Badge
                                        key={tag}
                                        variant={selectedTags.includes(tag) ? "default" : "secondary"}
                                        className="cursor-pointer hover:bg-blue-100 dark:hover:text-zinc-800 text-xs"
                                        onClick={() => (selectedTags.includes(tag) ? removeTag(tag) : addTag(tag))}
                                    >
                                        #{tag} ({count})
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                    {/* Quick Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Award className="h-5 w-5" />
                                Statistik Cepat
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Diskusi</span>
                                <Badge variant="outline">
                                    {quickStats.totalPosts}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Diskusi Hari Ini</span>
                                <Badge variant="outline">
                                    {quickStats.todayPosts}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Pertanyaan Terjawab</span>
                                <Badge variant="outline">
                                    {quickStats.resolvedPosts}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Balasan</span>
                                <Badge variant="outline">
                                    {quickStats.totalReplies}
                                </Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}