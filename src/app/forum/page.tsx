"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageSquare, Plus, Search, Award, Filter, X, TrendingUp, Waypoints } from "lucide-react"
import forumPostsData from "@/data/forum-posts-extended.json"
import { ForumListSkeleton } from "@/components/ui/skeleton-loader"
import { PostCard } from "@/components/forum/PostCard"
import {
    ForumPost,
    FORUM_TYPES,
    FORUM_CATEGORIES,
    getTypeIcon,
    getRandomGradient
} from "@/lib/utils/forum-utils"

export default function ForumPage() {
    const [posts, setPosts] = useState<ForumPost[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedType, setSelectedType] = useState("all")
    const [selectedCategory, setSelectedCategory] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState("all")
    const [sortBy, setSortBy] = useState("newest")
    const [selectedTags, setSelectedTags] = useState<string[]>([])

    const router = useRouter()
    const searchParams = useSearchParams()
    const hasInit = useRef(false) // ⬅️ menandai apakah sudah mem-parse URL pertama kali
    const lastUrlString = useRef("") // ⬅️ menyimpan snapshot URL terakhir untuk membandingkan

    // Helper to update URL params
    // const updateURL = useCallback((params: Record<string, string | string[]>) => {
    //     const url = new URL(window.location.href)
    //     Object.entries(params).forEach(([key, value]) => {
    //         if (Array.isArray(value)) {
    //             if (value.length > 0) {
    //                 url.searchParams.set(key, value.join(","))
    //             } else {
    //                 url.searchParams.delete(key)
    //             }
    //         } else if (value && value !== "all" && value !== "") {
    //             url.searchParams.set(key, value)
    //         } else {
    //             url.searchParams.delete(key)
    //         }
    //     })
    //     window.history.replaceState({}, "", url.toString())
    // }, [])

    // --- INIT : sekali saja ambil parameter URL ke state
    useEffect(() => {
        if (hasInit.current) return

        const type = searchParams.get("type") || "all"
        const category = searchParams.get("category") || "all"
        const status = searchParams.get("status") || "all"
        const sort = searchParams.get("sort") || "newest"
        const search = searchParams.get("search") || ""
        const tags = searchParams.get("tags")?.split(",").filter(Boolean) || []

        setSelectedType(type)
        setSelectedCategory(category)
        setSelectedStatus(status)
        setSortBy(sort)
        setSearchQuery(search)
        setSelectedTags(tags)

        hasInit.current = true
    }, [searchParams]) // ← depend tetap, tapi hanya eksekusi 1×

    useEffect(() => {
        // Hindari loop: hanya update bila string URL memang berubah
        const paramsObj = {
            type: selectedType,
            category: selectedCategory,
            status: selectedStatus,
            sort: sortBy,
            search: searchQuery,
            tags: selectedTags,
        }
        const url = new URL(window.location.href)
        Object.entries(paramsObj).forEach(([k, v]) => {
            if (Array.isArray(v)) {
                if (v.length) url.searchParams.set(k, v.join(","))
                else url.searchParams.delete(k)
            } else if (v && v !== "all" && v !== "") {
                url.searchParams.set(k, v)
            } else {
                url.searchParams.delete(k)
            }
        })

        if (url.toString() !== lastUrlString.current) {
            window.history.replaceState({}, "", url.toString())
            lastUrlString.current = url.toString()
        }
    }, [selectedType, selectedCategory, selectedStatus, sortBy, searchQuery, selectedTags])

    // Load data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true)
                // Simulate API delay
                await new Promise((resolve) => setTimeout(resolve, 1000))

                const localPosts = JSON.parse(localStorage.getItem("forumPosts") || "[]")
                const allPosts = [...localPosts, ...forumPostsData]
                setPosts(allPosts)
            } catch (error) {
                console.error("Error loading forum data:", error)
            } finally {
                setLoading(false)
            }
        }

        loadData()
    }, [])

    // Filter and sort posts
    const filteredAndSortedPosts = useMemo(() => {
        let filtered = [...posts]

        // Search filter
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase()
            filtered = filtered.filter(
                (post) =>
                    post.title.toLowerCase().includes(query) ||
                    post.content.toLowerCase().includes(query) ||
                    post.author.toLowerCase().includes(query) ||
                    post.tags.some((tag) => tag.toLowerCase().includes(query)),
            )
        }

        // Type filter
        if (selectedType !== "all") {
            filtered = filtered.filter((post) => post.type === selectedType)
        }

        // Category filter
        if (selectedCategory !== "all") {
            filtered = filtered.filter((post) => post.category === selectedCategory)
        }

        // Status filter (only for questions)
        if (selectedStatus !== "all") {
            if (selectedStatus === "resolved") {
                filtered = filtered.filter((post) => post.type === "pertanyaan" && post.isResolved)
            } else if (selectedStatus === "unresolved") {
                filtered = filtered.filter((post) => post.type === "pertanyaan" && !post.isResolved)
            }
        }

        // Tags filter
        if (selectedTags.length > 0) {
            filtered = filtered.filter((post) => selectedTags.some((tag) => post.tags.includes(tag)))
        }

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
                case "oldest":
                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
                case "most-liked":
                    return b.likes - a.likes
                case "most-replies":
                    return b.replies - a.replies
                case "most-viewed":
                    return b.views - a.views
                default:
                    return 0
            }
        })

        // Pinned posts first
        return filtered.sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1
            if (!a.isPinned && b.isPinned) return 1
            return 0
        })
    }, [posts, searchQuery, selectedType, selectedCategory, selectedStatus, sortBy, selectedTags])

    // Get statistics
    // const stats = useMemo(() => {
    //     const totalPosts = posts.length
    //     const totalReplies = posts.reduce((sum, post) => sum + post.replies, 0)
    //     const totalViews = posts.reduce((sum, post) => sum + post.views, 0)
    //     const resolvedQuestions = posts.filter((p) => p.type === "pertanyaan" && p.isResolved).length
    //     const totalQuestions = posts.filter((p) => p.type === "pertanyaan").length

    //     return {
    //         totalPosts,
    //         totalReplies,
    //         totalViews,
    //         resolvedQuestions,
    //         totalQuestions,
    //         resolutionRate: totalQuestions > 0 ? Math.round((resolvedQuestions / totalQuestions) * 100) : 0,
    //     }
    // }, [posts])

    // Get type statistics
    const typeStats = useMemo(() => {
        return FORUM_TYPES.map((type) => ({
            ...type,
            count: posts.filter((p) => p.type === type.id).length,
        }))
    }, [posts])

    // Get popular tags
    const popularTags = useMemo(() => {
        const tagCounts: { [key: string]: number } = {}
        posts.forEach((post) => {
            post.tags.forEach((tag) => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1
            })
        })

        return Object.entries(tagCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 20)
            .map(([tag, count]) => ({ tag, count }))
    }, [posts])

    // Simplified handleFilterChange to only update state
    const handleFilterChange = useCallback(
        (key: string, value: string) => {
            switch (key) {
                case "type":
                    setSelectedType(value)
                    break
                case "category":
                    setSelectedCategory(value)
                    break
                case "status":
                    setSelectedStatus(value)
                    break
                case "sort":
                    setSortBy(value)
                    break
                case "search":
                    setSearchQuery(value)
                    break
            }
        },
        [], // No dependencies needed as it only calls setters
    )

    const addTag = useCallback(
        (tag: string) => {
            setSelectedTags((prev) => {
                if (!prev.includes(tag)) {
                    return [...prev, tag]
                }
                return prev
            })
        },
        [], // selectedTags is not a dependency here because we use functional update
    )

    const removeTag = useCallback((tag: string) => {
        setSelectedTags((prev) => prev.filter((t) => t !== tag))
    }, [])

    const clearAllFilters = useCallback(() => {
        setSearchQuery("")
        setSelectedType("all")
        setSelectedCategory("all")
        setSelectedStatus("all")
        setSortBy("newest")
        setSelectedTags([])
    }, [])

    if (loading) {
        return <ForumListSkeleton />
    }

    return (
        <div className="px-4 py-8 w-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                        <Waypoints className="h-14 w-14 mr-3" />
                        Forum Diskusi
                    </h1>
                    <p className="text-gray-600">Berbagi pengetahuan, pengalaman, dan solusi bersama komunitas</p>
                </div>
                {/* Moved "Buat Diskusi" button to sidebar for better layout on larger screens */}
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
                                <div className="flex flex-wrap gap-2">
                                    <Select value={selectedType} onValueChange={(value) => handleFilterChange("type", value)}>
                                        <SelectTrigger className="w-40">
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
                                        <SelectTrigger className="w-40">
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
                                            <SelectTrigger className="w-40">
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
                                        <SelectTrigger className="w-40">
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
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                {filteredAndSortedPosts.map((post) => (
                                    <PostCard key={post.id} post={post} onTagClick={addTag} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6 lg:sticky lg:top-20 self-start">
                    {" "}
                    {/* Added sticky positioning */}
                    {/* Forum Types */}
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
                                const TypeIcon = getTypeIcon(type.id)
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
                                                    <TypeIcon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium text-sm">{type.name}</div>
                                                    <div className="text-xs text-gray-500">{type.description}</div>
                                                </div>
                                            </div>
                                            <Badge variant="secondary" className="text-xs">
                                                {type.count}
                                            </Badge>
                                        </div>
                                    </div>
                                )
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
                                        className="cursor-pointer hover:bg-blue-100 text-xs"
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
                                <span className="text-sm text-gray-600">Diskusi Hari Ini</span>
                                <Badge variant="outline">
                                    {
                                        posts.filter((p) => {
                                            const today = new Date()
                                            const postDate = new Date(p.timestamp)
                                            return postDate.toDateString() === today.toDateString()
                                        }).length
                                    }
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Pertanyaan Aktif</span>
                                <Badge variant="outline">{posts.filter((p) => p.type === "pertanyaan" && !p.isResolved).length}</Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Tutorial Tersedia</span>
                                <Badge variant="outline">{posts.filter((p) => p.type === "tutorial").length}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
