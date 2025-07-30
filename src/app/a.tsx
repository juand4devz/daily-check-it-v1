bantu saya mengembangkan semua halaman forum diskusi ini termasuk halaman notifikasi dan bookmarks yang digunakan untuk setiap pengguna agar menggunakan data yang dinamis tanpa local storage lagi(kecuali untuk fitur untuk input pencarian, filter dan sejenisnya karena bagian ini saya ingin hanya sekali fetch lalu di kelola melalui sisi client tanpa mengfetch nya kembali pada firebase / firestore service, untuk pencarian saya ingin kamu menggunakan fuse.js dan untuk filter - filter dan sejenisnya juga saya ingin mengkombinasikannya dengan fuse.js dan useState react ideal code dengan default akan mempilkan semua data) via route handler api dengan service firebase / firestore("clientDb" sisi client yang sudah di saya inisialisasi sebelumnya pada local computer saya) dan menintegrasikannya juga pada component dan api imagekit.io yang sudah saya inisialisasikan sebelumnya(tinggal mengguankannya) yang yang juga sudah saya buat dengan fleksibel(tinggal penyesuaian dalam penggunaan) untuk beberapa bagian yang membutuhkan seperti thumnail, media forum posts, dan komentar.pada halaman utama forum saya ingin untuk like mengambil total jumlah data dari likes dan memiliki kemampuan untuk menyukai / batalMenyukai pada card forum posts yang juga dapat digunakan pada halaman detail[id], jumlah komentar, dan jumlah views, dan untuk fitur komentar pada halaman "/forum/[id]/page.tsx" termasuk upvotes / downvotes dan bagian komentar lainnya saya ingin bagian ini di buat dengan fullpower flexbel menggunakan snapshot dari firestore / firebase sehingga data komentar dan balasannya dapat ditampilkan secara real time, begitu juga dengan halaman notifkasi saya ingin menerapkan snapshot pada bagian ini juga.saya ingin semua code agar dibuat dengan berurutan secara lengkap, baik, dan benar dengan type yang sesuai, props antar halaman - component dan lainnya sehingga tidak ada kemungkinan baik kode maupun sistem menampilkan error, jangan lupa untuk waktu mungkin kamu dapat menggunakan paket date - fns untuk beberapa bagian yang memang benar - benar membutuhkan seperti tampilan pada beberapa halaman di bagian tanggal posts baik forum posts, comentar dan lainnya, saya tidak ingin kamu merubah dan menulis ulang code yang sudah ada seperti service, api, halaman, dan komponen jika memang tidak diperlukan karena kebanyakan dari code ini sudah memiliki fungsi masing - masing nya oleh karena itu saya ingin kamu hanya menambahkan fungsi baru dengan beberapa penyesuaian tanpa merubah kode sebelumnya yang sudah saya buat(seperti api dan component uploader imagekit) dengan beberapa penambahan dan penyesuaian yang jika memang diperluan, gunakan juga code - code dibawah ini seperti service dan route api sebagai reference untuk menulis code baru sehingga saya dapat dengan mudah mengerti dan mengembangkan sistem ini.untuk pengerjaan fitur pada sistem ini saya ingin penulisan kode ini kita bagi menjadi 3 tahap diantaranya:

- Tahap 1 – Backend
    - Tahap 2 – Komponen UI
        - Tahap 3 – Frontend Halaman

ikuti dan gunakan struktur folder dan code yang saya gunakan ini karena saya tidak ingin kamu merubah interface dan fitur / fungsi yang sudah saya buat, gunakan juga code yang saya miliki dibawah ini sebagai reference membuat code service dan api jangan lupa untuk membuat code dibawah ini tetap optimal ideal dengan membuatnya tidak mengulangi code yang sama jika memungkinakan(terapkan DRY) dan pastikan membuat code yang tidak memungkinkan menampilkan error baik dari code maupun pada sistem dan perbaiki & sesuaikan juga code milik saya pada halaman "/forum/[id]/page.tsx" karena masih ada beberapa kesalahan yang mengakibatkan error baik pada halaman maupun component(untuk firebase fitur forum diskusi kali ini saya hanya menggunakan firebase - client tidak dengan firebase - admin sdk) berikut:

// struktur folder yang saya gunakan sebelumnya 
app /
├── api /
│   ├── forum /
│   │   ├── posts /
│   │   │   ├── route.ts            // GET: all posts, POST: create new post
│   │   │   └──[id] /                 // Dynamic segment for Post ID
│   │   │       ├── route.ts          // GET: single post
│   │   │       ├── like /
│   │   │       │   └── route.ts      // POST: toggle like on post
│   │   │       ├── views /            // NEW: untuk mengupdate jumlah views
│   │   │       │   └── route.ts      // PATCH: increment view count
│   │   │       ├── bookmarks /        // NEW: untuk mengelola bookmark
│   │   │       │   └── route.ts      // POST: toggle bookmark
│   │   │       └── replies /
│   │   │           ├── route.ts      // GET: all replies for a post, POST: add new reply
│   │   │           └──[replyId] /    // Dynamic segment for Reply ID
│   │   │               ├── route.ts  // DELETE: delete reply (if needed later)
│   │   │               ├── vote /
│   │   │               │   └── route.ts // POST: upvote/downvote reply
│   │   │               └── react /
│   │   │                   └── route.ts // POST: add/remove reaction on reply
│   │   │               └── solution /
│   │   │                   └── route.ts // PATCH: mark reply as solution
│   │   ├── notifications /    // NEW: API untuk notifikasi pengguna
│   │   │   ├── route.ts      // GET: all notifications for user, PATCH: mark all read
│   │   │   └──[id] /
│   │   │       └── route.ts  // PATCH: mark single read, DELETE: delete single
│   │   └── bookmarks /        // NEW: API untuk bookmarks pengguna
│   │       ├── route.ts      // GET: all bookmarks for user
│   │       └──[id] /
│   │           └── route.ts  // DELETE: remove specific bookmark
│   └── upload - auth /
│       └── route.ts          // GET: ImageKit upload authentication (server-side)
lib /
├── firebase /
│   ├── firebase - client.ts    // Firebase client initialization
│   └── service.ts            // Firestore operations (login, register, user profile update)
└── utils /
    ├── forum - utils.ts        // Utility functions (e.g., time formatting, icon mapping, validation)
    └── date - utils.ts         // NEW: Khusus untuk fungsi tanggal (menggunakan date-fns)
types /
├── types.ts                  // General types (e.g., User, Notification)
└── forum.ts                  // Forum-specific types (e.g., ForumPost, ForumReply, ForumMedia)
components /
├── ui /
│   └── ...                   // Shadcn UI components
└── forum /
    ├── PostCard.tsx          // Diperbarui untuk menampilkan likes, comments, views
    ├── MarkdownEditor.tsx
    ├── MediaViewer.tsx
    ├── ImageUploadButton.tsx
    ├── ThumbnailUpload.tsx
    ├── BookmarkCard.tsx      // NEW: Komponen untuk menampilkan bookmark di halaman bookmarks
    └── ReplyItem.tsx         // NEW: Komponen untuk setiap balasan (komentar)
└── imagekit /
    └── ImageUploader.tsx     // ImageKit.io specific uploader component

// /types/types 

export interface User {
    id: string; // Firestore document ID 

    username: string;

    email: string;

    role: "admin" | "user" | "banned"; // Tambahkan 'banned' role 

    loginType: "email" | "github" | "google";

    avatar: string;

    bio: string;

    banner: string;

    location: string;

    phone: string;

    website: string;

    github: string;

    twitter: string;

    linkedin: string;

    instagram: string;

    createdAt: string; // ISO string 

    updatedAt: string; // ISO string 

    lastLogin: string; // ISO string 



    dailyTokens: number;

    maxDailyTokens: number;

    lastResetDate: string; // Tanggal terakhir reset token (ISO string, hanya tanggal YYYY-MM-DD) 

    totalUsage: number; // Total token yang sudah digunakan sepanjang waktu 



    isBanned?: boolean; // Opsional: true jika pengguna diblokir 

    password?: string;

}



export type UserTokenData = Pick<User, 'id' | 'dailyTokens' | 'maxDailyTokens' | 'lastResetDate' | 'totalUsage'>;



// /types/forum.ts 

import { LucideIcon } from "lucide-react";

import {

    Monitor,

    Cpu,

    Wifi,

    Gamepad2,

    Stethoscope,

    HelpCircle,

} from "lucide-react";



export interface ForumPost {

    id: string;

    title: string;

    content: string;

    author: string;

    avatar: string;

    category: string;

    timestamp: string;

    likes: number;

    replies: number;

    tags: string[];

    isResolved: boolean;

    media?: Array<{ type: string; url: string }>;

}



export type CategoryType =

    | "Hardware"

    | "Software"

    | "Network"

    | "Gaming"

    | "Diagnosa"

    | "Lainnya"

    | "all";



export const categoryIcons: Record<CategoryType, LucideIcon> = {

    Hardware: Monitor,

    Software: Cpu,

    Network: Wifi,

    Gaming: Gamepad2,

    Diagnosa: Stethoscope,

    Lainnya: HelpCircle,

    all: HelpCircle, // Default icon for 'all' or fallback 

};



export const gradientClasses = [

    "bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500",

    "bg-gradient-to-br from-green-400 via-blue-500 to-purple-600",

    "bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500",

    "bg-gradient-to-br from-purple-400 via-pink-500 to-red-500",

    "bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500",

    "bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600",

];



export interface CategoryStat {

    value: string;

    label: string;

    count: number;

}



// forum/page.tsx 



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

    //     const url = new URL(window.location.href) 

    //     Object.entries(params).forEach(([key, value]) => { 

    //         if (Array.isArray(value)) { 

    //             if (value.length > 0) { 

    //                 url.searchParams.set(key, value.join(",")) 

    //             } else { 

    //                 url.searchParams.delete(key) 

    //             } 

    //         } else if (value && value !== "all" && value !== "") { 

    //             url.searchParams.set(key, value) 

    //         } else { 

    //             url.searchParams.delete(key) 

    //         } 

    //     }) 

    //     window.history.replaceState({}, "", url.toString()) 

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

    //     const totalPosts = posts.length 

    //     const totalReplies = posts.reduce((sum, post) => sum + post.replies, 0) 

    //     const totalViews = posts.reduce((sum, post) => sum + post.views, 0) 

    //     const resolvedQuestions = posts.filter((p) => p.type === "pertanyaan" && p.isResolved).length 

    //     const totalQuestions = posts.filter((p) => p.type === "pertanyaan").length 



    //     return { 

    //         totalPosts, 

    //         totalReplies, 

    //         totalViews, 

    //         resolvedQuestions, 

    //         totalQuestions, 

    //         resolutionRate: totalQuestions > 0 ? Math.round((resolvedQuestions / totalQuestions) * 100) : 0, 

    //     } 

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



// /component/forum/PostCard.tsx 



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

    // ImageIcon, 

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



    // const hasMedia = post.media && post.media.length > 0 

    const thumbnail = post.thumbnail || (post.media && post.media.length > 0 ? post.media[0].data : null)

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

                    {/* {hasMedia && ( 

                         <div className="absolute top-3 right-3"> 

                             <Badge variant="secondary" className="bg-black/50 text-white border-0"> 

                                 <ImageIcon className="h-3 w-3 mr-1" /> 

                                 {post.media!.length} 

                             </Badge> 

                         </div> 

                     )} */}



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



// /lib/utils/forum-utils.ts 



import { type ClassValue, clsx } from "clsx"

import { twMerge } from "tailwind-merge"

import {

    Monitor,

    Cpu,

    Wifi,

    Gamepad2,

    Stethoscope,

    HelpCircle,

    BookOpen,

    UserCheck,

    GraduationCap,

    Newspaper,

} from "lucide-react"

import forumTypesData from "@/data/forum-types.json"

import forumCategoriesData from "@/data/forum-categories.json"



export function cn(...inputs: ClassValue[]) {

    return twMerge(clsx(inputs))

}



// Forum utility functions 

export interface ForumPost {

    id: string

    title: string

    description: string // Added description field 

    content: string

    author: string

    avatar: string

    category: string

    type: string

    tags: string[]

    timestamp: string

    likes: number

    replies: number

    views: number

    isResolved?: boolean

    solutionId?: string

    isPinned?: boolean

    isArchived?: boolean

    thumbnail?: string

    media?: {

        // Updated media structure to match what's sent to API 

        id: string

        type: "image" | "video" | "document"

        filename: string

        size: number

        data: string // Base64 string of the file 

    }[]

}



export interface ForumReply {

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

    reactions?: { [key: string]: string[] }

    media?: {

        type: "image" | "video"

        url: string

        thumbnail?: string

    }[]

    replies?: ForumReply[]

}



export interface ForumType {

    id: string

    name: string

    description: string

    icon: string

    color: string

    allowSolution: boolean

    allowTags: boolean

}



export interface ForumCategory {

    id: string

    name: string

    description: string

    color: string

    icon: string

}



export const FORUM_CATEGORIES: ForumCategory[] = forumCategoriesData



export const FORUM_TYPES: ForumType[] = forumTypesData



export const EMOJI_REACTIONS = [

    { emoji: "👍", label: "Like", key: "like" },

    { emoji: "❤️", label: "Love", key: "love" },

    { emoji: "😂", label: "Laugh", key: "laugh" },

    { emoji: "😮", label: "Wow", key: "wow" },

    { emoji: "😢", label: "Sad", key: "sad" },

    { emoji: "😡", label: "Angry", key: "angry" },

]



export const typeIcons = {

    "help-circle": HelpCircle,

    "book-open": BookOpen,

    "user-check": UserCheck,

    "graduation-cap": GraduationCap,

    newspaper: Newspaper,

}



export const categoryIcons = {

    hardware: Monitor,

    software: Cpu,

    network: Wifi,

    gaming: Gamepad2,

    diagnosa: Stethoscope,

    lainnya: HelpCircle,

}



export const gradientClasses = [

    "bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500",

    "bg-gradient-to-br from-green-400 via-blue-500 to-purple-600",

    "bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500",

    "bg-gradient-to-br from-purple-400 via-pink-500 to-red-500",

    "bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500",

    "bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600",

]



export function getTypeIcon(typeId: string) {

    const type = FORUM_TYPES.find((t) => t.id === typeId)

    const IconComponent = (type ? typeIcons[type.icon as keyof typeof typeIcons] : undefined) ?? HelpCircle

    return IconComponent

}



export function getCategoryIcon(categoryId: string) {

    const category = FORUM_CATEGORIES.find((c) => c.id === categoryId)

    const IconComponent =

        (category ? categoryIcons[category.icon as keyof typeof categoryIcons] : undefined) ?? HelpCircle

    return IconComponent

}



export function getRandomGradient(id: string): string {

    const index = Number.parseInt(id, 36) % gradientClasses.length

    return gradientClasses[index]

}



// File validation 

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB 

export const MAX_VIDEO_SIZE = 50 * 1024 * 1024 // 50MB 

export const MAX_MEDIA_FILES = 3



export function validateFile(file: File, type: "thumbnail" | "media"): string | null {

    if (file.type.startsWith("image/")) {

        if (file.size > MAX_IMAGE_SIZE) {

            return `Gambar terlalu besar (max ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`

        }

    } else if (file.type.startsWith("video/") && type === "media") {

        if (file.size > MAX_VIDEO_SIZE) {

            return `Video terlalu besar (max ${MAX_VIDEO_SIZE / 1024 / 1024}MB)`

        }

    } else {

        return "Format file tidak didukung"

    }

    return null

}



// Time formatting 

export function getTimeAgo(timestamp: string): string {

    const now = new Date()

    const postTime = new Date(timestamp)

    const diffInSeconds = Math.floor((now.getTime() - postTime.getTime()) / 1000)



    if (diffInSeconds < 60) return "Baru saja"



    const diffInMinutes = Math.floor(diffInSeconds / 60)

    if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`



    const diffInHours = Math.floor(diffInMinutes / 60)

    if (diffInHours < 24) return `${diffInHours} jam yang lalu`



    const diffInDays = Math.floor(diffInHours / 24)

    if (diffInDays < 7) return `${diffInDays} hari yang lalu`



    if (diffInDays < 30) {

        const weeks = Math.floor(diffInDays / 7)

        return `${weeks} minggu yang lalu`

    }



    return postTime.toLocaleDateString("id-ID", {

        year: "numeric",

        month: "long",

        day: "numeric",

    })

}



// Text processing 

export function extractMentions(text: string): string[] {

    const mentionRegex = /@(\w+)/g

    const mentions: string[] = []

    let match



    while ((match = mentionRegex.exec(text)) !== null) {

        mentions.push(match[1])

    }



    return mentions

}



export function highlightMentions(text: string): string {

    return text.replace(/@(\w+)/g, '<span class="text-blue-600 font-medium">@$1</span>')

}



// Search and filtering 

export function searchPosts(posts: ForumPost[], query: string): ForumPost[] {

    if (!query.trim()) return posts



    const searchTerm = query.toLowerCase()

    return posts.filter(

        (post) =>

            post.title.toLowerCase().includes(searchTerm) ||

            post.content.toLowerCase().includes(searchTerm) ||

            post.author.toLowerCase().includes(searchTerm) ||

            post.category.toLowerCase().includes(searchTerm) ||

            post.tags.some((tag) => tag.toLowerCase().includes(searchTerm)),

    )

}



export function filterPostsByCategory(posts: ForumPost[], category: string): ForumPost[] {

    if (category === "all") return posts

    return posts.filter((post) => post.category === category)

}



export function filterPostsByStatus(posts: ForumPost[], status: string): ForumPost[] {

    switch (status) {

        case "resolved":

            return posts.filter((post) => post.isResolved)

        case "unresolved":

            return posts.filter((post) => !post.isResolved)

        default:

            return posts

    }

}



export function sortPosts(posts: ForumPost[], sortBy: string): ForumPost[] {

    const sortedPosts = [...posts]



    switch (sortBy) {

        case "newest":

            return sortedPosts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

        case "oldest":

            return sortedPosts.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())

        case "most-liked":

            return sortedPosts.sort((a, b) => b.likes - a.likes)

        case "most-replies":

            return sortedPosts.sort((a, b) => b.replies - a.replies)

        default:

            return sortedPosts

    }

}



// Local storage helpers 

export function savePostToLocalStorage(post: ForumPost): void {

    try {

        const existingPosts = getPostsFromLocalStorage()

        const updatedPosts = [post, ...existingPosts.filter((p) => p.id !== post.id)]

        localStorage.setItem("forumPosts", JSON.stringify(updatedPosts))

    } catch (error) {

        console.error("Error saving post to localStorage:", error)

    }

}



export function getPostsFromLocalStorage(): ForumPost[] {

    try {

        const posts = localStorage.getItem("forumPosts")

        return posts ? JSON.parse(posts) : []

    } catch (error) {

        console.error("Error getting posts from localStorage:", error)

        return []

    }

}



export function deletePostFromLocalStorage(postId: string): void {

    try {

        const existingPosts = getPostsFromLocalStorage()

        const updatedPosts = existingPosts.filter((p) => p.id !== postId)

        localStorage.setItem("forumPosts", JSON.stringify(updatedPosts))

    } catch (error) {

        console.error("Error deleting post from localStorage:", error)

    }

}



// URL and sharing helpers 

export function generatePostUrl(postId: string): string {

    return `${window.location.origin}/forum/${postId}`

}



export function generateCommentUrl(postId: string, commentId: string): string {

    return `${window.location.origin}/forum/${postId}#comment-${commentId}`

}



export async function copyToClipboard(text: string): Promise<boolean> {

    try {

        await navigator.clipboard.writeText(text)

        return true

    } catch (error) {

        console.error("Error copying to clipboard:", error)

        return false

    }

}



// Statistics helpers 

export function calculatePostStats(posts: ForumPost[]) {

    const totalPosts = posts.length

    const totalReplies = posts.reduce((sum, post) => sum + post.replies, 0)

    const resolvedPosts = posts.filter((p) => p.isResolved).length

    const todayPosts = posts.filter((p) => {

        const today = new Date()

        const postDate = new Date(p.timestamp)

        return postDate.toDateString() === today.toDateString()

    }).length



    return {

        totalPosts,

        totalReplies,

        resolvedPosts,

        todayPosts,

        resolutionRate: totalPosts > 0 ? Math.round((resolvedPosts / totalPosts) * 100) : 0,

    }

}



export function getCategoryStats(posts: ForumPost[]) {

    const stats = FORUM_CATEGORIES.map((category) => ({

        ...category,

        count: posts.filter((p) => p.category === category.id).length,

    }))



    // Add "all" category 

    stats.unshift({

        id: "all",

        name: "Semua Kategori", // Use 'name' instead of 'label' and remove 'value' 

        description: "Semua kategori",

        count: posts.length,

        color: "",

        icon: "help-circle",

    })



    return stats

}



// Form validation 

export interface FormErrors {

    [key: string]: string

}



export function validatePostForm(data: {

    title: string

    content: string

    category: string

    tags: string

}): FormErrors {

    const errors: FormErrors = {}



    // Title validation 

    if (!data.title.trim()) {

        errors.title = "Judul harus diisi"

    } else if (data.title.length < 10) {

        errors.title = "Judul minimal 10 karakter"

    } else if (data.title.length > 200) {

        errors.title = "Judul maksimal 200 karakter"

    }



    // Content validation 

    if (!data.content.trim()) {

        errors.content = "Konten harus diisi"

    } else if (data.content.length < 20) {

        errors.content = "Konten minimal 20 karakter"

    } else if (data.content.length > 5000) {

        errors.content = "Konten maksimal 5000 karakter"

    }



    // Category validation 

    if (!data.category) {

        errors.category = "Kategori harus dipilih"

    }



    // Tags validation 

    if (data.tags) {

        const tags = data.tags

            .split(",")

            .map((tag) => tag.trim())

            .filter(Boolean)



        if (tags.length > 10) {

            errors.tags = "Maksimal 10 tags"

        }



        if (tags.some((tag) => tag.length > 20)) {

            errors.tags = "Setiap tag maksimal 20 karakter"

        }

    }



    return errors

}



// Random utilities 

export function generateId(): string {

    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

}

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

// /forum/new/page.tsx 

"use client"



import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"

import { useRouter } from "next/navigation"

import { useForm } from "react-hook-form"

import { zodResolver } from "@hookform/resolvers/zod"

import * as z from "zod"

import ReactMarkdown from "react-markdown"

import remarkGfm from "remark-gfm"



import { Button } from "@/components/ui/button"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { Input } from "@/components/ui/input"

import { Textarea } from "@/components/ui/textarea"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import { Badge } from "@/components/ui/badge"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

import { Skeleton } from "@/components/ui/skeleton"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { ArrowLeft, Plus, Eye, Send, Loader2, AlertCircle, LinkIcon, Edit, PencilRuler, Upload, Camera } from "lucide-react"

import { toast } from "sonner"

import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area" // Import ScrollArea 

import Image from "next/image" // Import Image for MediaViewer changes 



import { ThumbnailUpload } from "@/components/forum/thumbnail-upload"

// import { MediaUpload } from "@/components/forum/media-upload" // We'll integrate media upload directly 

// import { MediaViewer } from "@/components/forum/media-viewer" // We'll modify MediaViewer or create a new one 



import {

    FORUM_TYPES,

    FORUM_CATEGORIES,

    typeIcons,

    categoryIcons,

    type ForumType,

    type ForumCategory

} from "@/lib/utils/forum-utils"



// Define the Zod schema for form validation 

const formSchema = z.object({

    title: z.string().min(10, "Judul minimal 10 karakter").max(200, "Judul maksimal 200 karakter"),

    description: z.string().min(10, "Deskripsi minimal 10 karakter").max(300, "Deskripsi maksimal 300 karakter"),

    content: z.string().min(20, "Konten minimal 20 karakter").max(5000, "Konten maksimal 5000 karakter"),

    type: z.string().min(1, "Tipe diskusi harus dipilih"),

    category: z.string().min(1, "Kategori harus dipilih"),

    tags: z.array(z.string()).max(5, "Maksimal 5 tag dapat ditambahkan").optional(),

    thumbnail: z.string().optional(),

})



type FormSchema = z.infer<typeof formSchema>



interface MediaFile {

    id: string

    file: File

    preview: string // Base64 URL for client-side preview 

    type: "image" | "video" | "document"

    dummyUrl: string // Add dummyUrl for markdown 

}



interface DiagnosisData {

    symptoms: string

    diagnosis: string

    timestamp: string

}



const MAX_MEDIA_FILES = 5

const MAX_FILE_SIZE_MB = 10 // Max size per file in MB 



export default function NewForumPostPage() {

    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])

    const [diagnosisData, setDiagnosisData] = useState<DiagnosisData | null>(null)

    const [isLoading, setIsLoading] = useState<boolean>(true) // For initial loading of diagnosis data 

    const [newTagInput, setNewTagInput] = useState<string>("") // For new tag input field 

    const [activeTab, setActiveTab] = useState<string>("write")

    const [isDragOver, setIsDragOver] = useState(false); // New state for drag over effect 



    const fileInputRef = useRef<HTMLInputElement>(null)

    const cameraInputRef = useRef<HTMLInputElement>(null)



    // Use a single ref for textarea, combining react-hook-form's ref with your local ref 

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const { ...formProps } = useForm<FormSchema>({

        resolver: zodResolver(formSchema),

        defaultValues: {

            title: "",

            description: "",

            content: "",

            type: "",

            category: "",

            tags: [],

            thumbnail: undefined,

        },

    });



    const form = formProps; // Assign to form for consistency 



    const setCombinedTextareaRef = useCallback((element: HTMLTextAreaElement | null) => {

        textareaRef.current = element;

        // Pass the element to react-hook-form's ref as well 

        form.register('content').ref(element);

    }, [form]);



    const router = useRouter()



    // State for selected values from Select, to get `selectedType` and `selectedCategory` 

    const watchType = form.watch("type")

    const watchCategory = form.watch("category")

    const selectedType = FORUM_TYPES.find((t) => t.id === watchType)

    const selectedCategory = FORUM_CATEGORIES.find((c) => c.id === watchCategory)



    // Load diagnosis data from session storage if available 

    useEffect(() => {

        const storedData = sessionStorage.getItem("forumPostData")

        if (storedData) {

            try {

                const data = JSON.parse(storedData) as DiagnosisData

                setDiagnosisData(data)



                // Pre-fill form with diagnosis data 

                form.setValue("title", `Bantuan Diagnosa: ${data.diagnosis.split(",")[0].split("(")[0].trim()}`)

                form.setValue(

                    "description",

                    `Meminta bantuan terkait diagnosa sistem: ${data.diagnosis.split(",")[0].split("(")[0].trim()}`,

                )

                form.setValue(

                    "content",

                    `Halo semuanya! 👋 

 Saya baru saja melakukan diagnosa sistem dan mendapatkan hasil berikut: 



 **Gejala yang Dialami:** 

 ${data.symptoms} 



 **Hasil Diagnosa:** 

 ${data.diagnosis} 



 **Waktu Diagnosa:** ${new Date(data.timestamp).toLocaleString("id-ID")} 



 Apakah ada yang pernah mengalami masalah serupa? Saya ingin meminta saran dan pengalaman dari teman-teman di sini. 

 Terima kasih! 🙏`,

                )

                form.setValue("type", "pertanyaan") // Default to 'pertanyaan' for diagnosis 

                form.setValue("category", "diagnosa") // Default to 'diagnosa' category 

                form.setValue("tags", ["diagnosa", "bantuan", "troubleshooting"]) // Default tags 

                // Clear the session storage after use 

                sessionStorage.removeItem("forumPostData")

            } catch (error) {

                console.error("Error parsing diagnosis data:", error)

            }

        }

        setIsLoading(false)

    }, [form])



    const handleAddTag = useCallback(() => {

        const currentTags = form.getValues("tags") || []

        if (newTagInput.trim() && !currentTags.includes(newTagInput.trim().toLowerCase()) && currentTags.length < 5) {

            form.setValue("tags", [...currentTags, newTagInput.trim().toLowerCase()], { shouldValidate: true })

            setNewTagInput("")

        } else if (currentTags.length >= 5) {

            toast.error("Batas tag tercapai", {

                description: "Maksimal 5 tag dapat ditambahkan.",

            })

        }

    }, [newTagInput, form])



    const handleRemoveTag = useCallback(

        (tagToRemove: string) => {

            const currentTags = form.getValues("tags") || []

            form.setValue(

                "tags",

                currentTags.filter((tag) => tag !== tagToRemove),

                { shouldValidate: true },

            )

        },

        [form],

    )



    const handleKeyPress = useCallback(

        (e: React.KeyboardEvent<HTMLInputElement>) => {

            if (e.key === "Enter") {

                e.preventDefault()

                handleAddTag()

            }

        },

        [handleAddTag],

    )



    const getFileType = (file: File): "image" | "video" | "document" => {

        if (file.type.startsWith("image/")) return "image"

        if (file.type.startsWith("video/")) return "video"

        return "document"

    }



    const createPreview = (file: File): Promise<string> => {

        return new Promise((resolve) => {

            if (file.type.startsWith("image/") || file.type.startsWith("video/")) {

                const reader = new FileReader()

                reader.onload = () => resolve(reader.result as string)

                reader.readAsDataURL(file)

            } else {

                resolve("/placeholder.svg?height=100&width=100") // Generic placeholder for documents 

            }

        })

    }



    const generateDummyImageUrl = (id: string, fileName: string) => {

        const fileExtension = fileName.split(".").pop() || "jpg"

        return `https://dummy-imagekit.io/tr:w-400/${id}.${fileExtension}`

    }



    const processAndAddFiles = useCallback(async (files: FileList | null) => {

        if (!files || files.length === 0) return



        if (mediaFiles.length >= MAX_MEDIA_FILES) {

            toast.error(`Maksimal ${MAX_MEDIA_FILES} gambar dapat diunggah.`)

            return

        }



        const filesToAdd: MediaFile[] = []

        const currentMediaCount = mediaFiles.length



        for (let i = 0; i < files.length; i++) {

            if (currentMediaCount + filesToAdd.length >= MAX_MEDIA_FILES) {

                toast.error(`Maksimal ${MAX_MEDIA_FILES} gambar dapat diunggah.`)

                break

            }



            const file = files[i]

            if (!file.type.startsWith("image/")) {

                toast.error(`File "${file.name}" bukan format gambar yang didukung.`)

                continue

            }

            if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {

                toast.error(`Ukuran file "${file.name}" terlalu besar. Maksimal ${MAX_FILE_SIZE_MB}MB.`)

                continue

            }



            const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

            const preview = await createPreview(file)

            const dummyUrl = generateDummyImageUrl(id, file.name)



            filesToAdd.push({

                id,

                file,

                preview,

                type: getFileType(file),

                dummyUrl,

            })

        }



        if (filesToAdd.length > 0) {

            setMediaFiles((prev) => [...prev, ...filesToAdd])

            const currentContent = form.getValues("content") || ""

            const newContent = currentContent + filesToAdd.map(file => `\n![${file.file.name}](${file.dummyUrl})`).join('')

            form.setValue("content", newContent, { shouldValidate: true })

            toast.success(`${filesToAdd.length} gambar berhasil diunggah.`)

        }

    }, [mediaFiles, form])



    const handleDropOnTextarea = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {

        e.preventDefault();

        e.stopPropagation();

        setIsDragOver(false); // Reset drag over state 

        if (isSubmitting || mediaFiles.length >= MAX_MEDIA_FILES) return;

        processAndAddFiles(e.dataTransfer.files);

    }, [isSubmitting, mediaFiles, processAndAddFiles]);



    const handleDragOverOnTextarea = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {

        e.preventDefault();

        e.stopPropagation();

        if (isSubmitting || mediaFiles.length >= MAX_MEDIA_FILES) {

            e.dataTransfer.dropEffect = "none";

        } else {

            e.dataTransfer.dropEffect = "copy";

            setIsDragOver(true); // Set drag over state to true 

        }

    }, [isSubmitting, mediaFiles]);



    const handleDragLeaveOnTextarea = useCallback((e: React.DragEvent<HTMLTextAreaElement>) => {

        e.preventDefault();

        e.stopPropagation();

        setIsDragOver(false); // Reset drag over state 

    }, []);



    const handlePasteOnTextarea = useCallback(async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {

        if (isSubmitting || mediaFiles.length >= MAX_MEDIA_FILES) return;



        const items = e.clipboardData?.items;

        if (items) {

            const imageFiles: File[] = [];

            for (let i = 0; i < items.length; i++) {

                if (items[i].type.indexOf('image') !== -1) {

                    const file = items[i].getAsFile();

                    if (file) {

                        imageFiles.push(file);

                    }

                }

            }

            if (imageFiles.length > 0) {

                e.preventDefault(); // Prevent default paste behavior 

                await processAndAddFiles(new DataTransfer().files = (function () {

                    const dt = new DataTransfer();

                    imageFiles.forEach(file => dt.items.add(file));

                    return dt.files;

                })());

            }

        }

    }, [isSubmitting, mediaFiles, processAndAddFiles]);





    const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {

        processAndAddFiles(event.target.files);

        event.target.value = ""; // Clear input 

    }, [processAndAddFiles]);



    const onSubmit = async (values: FormSchema) => {

        setIsSubmitting(true)

        try {

            // Prepare media data for API (convert to base64, or use dummyUrl if imagekit.io is not integrated yet) 

            const mediaData = await Promise.all(

                mediaFiles.map(async (media) => {

                    const base64 = await new Promise<string>((resolve) => {

                        const reader = new FileReader()

                        reader.onload = () => resolve(reader.result as string)

                        reader.readAsDataURL(media.file)

                    })

                    return {

                        id: media.id,

                        type: media.type,

                        filename: media.file.name,

                        size: media.file.size,

                        data: base64, // Or send dummyUrl if you handle uploads on backend 

                        url: media.dummyUrl, // Include the dummy URL for demonstration 

                    }

                }),

            )



            const postData = {

                title: values.title,

                description: values.description,

                content: values.content,

                type: values.type,

                category: values.category,

                tags: values.tags || [],

                thumbnail: values.thumbnail,

                media: mediaData,

                author: "Current User", // In real app, get from auth 

                avatar: "/placeholder.svg?height=40&width=40", // Default avatar 

                timestamp: new Date().toISOString(),

                likes: 0,

                replies: 0,

                views: 0,

                isResolved: false,

                isPinned: false,

            }



            // Simulate API call 

            await new Promise((resolve) => setTimeout(resolve, 1000)) // Simulate network delay 

            const existingPosts = JSON.parse(localStorage.getItem("forumPosts") || "[]")

            const newPostWithId = { id: Date.now().toString(), ...postData } // Add unique ID 

            localStorage.setItem("forumPosts", JSON.stringify([newPostWithId, ...existingPosts]))



            toast.success("Diskusi berhasil dibuat", {

                description: "Diskusi Anda telah dipublikasikan",

            })

            router.push(`/forum/${newPostWithId.id}`) // Redirect to the newly created post 

        } catch (error) {

            console.error("Error creating post:", error)

            toast.error("Gagal membuat diskusi", {

                description: error instanceof Error ? error.message : "Terjadi kesalahan saat menyimpan diskusi",

            })

        } finally {

            setIsSubmitting(false)

        }

    }



    // --- Start of New/Modified Components --- 



    const CustomMediaPreview = ({ mediaFile }: { mediaFile: MediaFile }) => {

        return (

            <div className="relative w-full h-full overflow-hidden rounded-md border border-gray-200">

                {mediaFile.type === "image" ? (

                    <Image

                        src={mediaFile.preview}

                        alt={mediaFile.file.name}

                        layout="fill"

                        objectFit="cover"

                        className="rounded-md"

                    />

                ) : (

                    <div className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-500 text-xs">

                        {mediaFile.file.name}

                    </div>

                )}

            </div>

        );

    };



    const CustomMediaUploader = ({ disabled }: { disabled: boolean }) => {

        const handleLocalFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {

            processAndAddFiles(event.target.files);

            event.target.value = ""; // Clear input 

        };



        return (

            <div className="flex gap-2 justify-center mt-4">

                <input

                    ref={fileInputRef}

                    type="file"

                    multiple

                    accept="image/*"

                    onChange={handleLocalFileSelect}

                    className="hidden"

                    disabled={disabled}

                />

                <input

                    ref={cameraInputRef}

                    type="file"

                    accept="image/*"

                    capture="environment"

                    onChange={handleLocalFileSelect}

                    className="hidden"

                    disabled={disabled}

                />

                <Button

                    type="button"

                    variant="outline"

                    size="sm"

                    onClick={() => fileInputRef.current?.click()}

                    disabled={disabled}

                >

                    <Upload className="h-4 w-4 mr-2" />

                    Upload Gambar

                </Button>

                <Button

                    type="button"

                    variant="outline"

                    size="sm"

                    onClick={() => cameraInputRef.current?.click()}

                    disabled={disabled}

                >

                    <Camera className="h-4 w-4 mr-2" />

                    Ambil Foto

                </Button>

            </div>

        );

    };



    // --- End of New/Modified Components --- 



    if (isLoading) {

        return (

            <div className="container mx-auto px-4 py-8 max-w-4xl">

                <div className="space-y-6">

                    <Skeleton className="h-8 w-64" />

                    <Card>

                        <CardHeader>

                            <Skeleton className="h-6 w-48" />

                            <Skeleton className="h-4 w-96" />

                        </CardHeader>

                        <CardContent className="space-y-4">

                            <Skeleton className="h-10 w-full" />

                            <Skeleton className="h-32 w-full" />

                            <Skeleton className="h-10 w-48" />

                        </CardContent>

                    </Card>

                </div>

            </div>

        )

    }



    const isUploadDisabled = mediaFiles.length >= MAX_MEDIA_FILES || isSubmitting;



    return (

        <div className="p-4 mw-full">

            {/* Header */}

            <div className="flex-col items-center gap-4 mb-8">

                <Button variant="ghost" onClick={() => router.back()}>

                    <ArrowLeft className="h-4 w-4 mr-2" />

                    Kembali

                </Button>

                <div className="mt-4 flex items-center">

                    <PencilRuler className="h-14 w-14 mr-4" />

                    <div>

                        <h1 className="text-3xl font-bold">Buat Diskusi Baru</h1>

                        <p className="text-gray-600">Bagikan pertanyaan, pengetahuan, atau pengalaman Anda</p>

                    </div>

                </div>

            </div>



            {diagnosisData && (

                <Alert variant="default" className="mt-5 mb-8">

                    <AlertCircle className="h-5 w-5" />

                    <AlertTitle>Data Diagnosa Terdeteksi</AlertTitle>

                    <AlertDescription>

                        Form telah diisi otomatis berdasarkan hasil diagnosa Anda. Silakan edit sesuai kebutuhan.

                    </AlertDescription>

                </Alert>

            )}



            <Form {...form}>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Main Form */}

                        <div className="lg:col-span-2 space-y-6">

                            {/* Basic Info */}

                            <Card>

                                <CardHeader>

                                    <CardTitle>Informasi Dasar</CardTitle>

                                </CardHeader>

                                <CardContent className="space-y-4">

                                    {/* Title */}

                                    <FormField

                                        control={form.control}

                                        name="title"

                                        render={({ field }) => (

                                            <FormItem>

                                                <FormLabel htmlFor="title">Judul Diskusi *</FormLabel>

                                                <FormControl>

                                                    <Input

                                                        id="title"

                                                        placeholder="Tulis judul yang jelas dan deskriptif..."

                                                        maxLength={200}

                                                        disabled={isSubmitting}

                                                        {...field}

                                                    />

                                                </FormControl>

                                                <div className="text-xs text-gray-500 mt-1">{field.value?.length || 0}/200 karakter</div>

                                                <FormMessage />

                                            </FormItem>

                                        )}

                                    />

                                    {/* Description */}

                                    <FormField

                                        control={form.control}

                                        name="description"

                                        render={({ field }) => (

                                            <FormItem>

                                                <FormLabel htmlFor="description">Deskripsi Singkat *</FormLabel>

                                                <FormControl>

                                                    <Textarea

                                                        id="description"

                                                        placeholder="Berikan deskripsi singkat tentang diskusi Anda (maks 300 karakter)..."

                                                        maxLength={300}

                                                        rows={3}

                                                        disabled={isSubmitting}

                                                        {...field}

                                                    />

                                                </FormControl>

                                                <div className="text-xs text-gray-500 mt-0">{field.value?.length || 0}/300 karakter</div>

                                                <FormMessage />

                                            </FormItem>

                                        )}

                                    />

                                    {/* Type and Category */}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                                        <FormField

                                            control={form.control}

                                            name="type"

                                            render={({ field }) => (

                                                <FormItem className="space-y-3 col-span-1">

                                                    <FormLabel htmlFor="type">Tipe Diskusi *</FormLabel>

                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>

                                                        <FormControl>

                                                            <SelectTrigger className="w-full">

                                                                <SelectValue placeholder="Pilih tipe diskusi" />

                                                            </SelectTrigger>

                                                        </FormControl>

                                                        <SelectContent>

                                                            {FORUM_TYPES.map((forumType: ForumType) => {

                                                                const TypeIcon = typeIcons[forumType.icon as keyof typeof typeIcons] || Plus // Default icon 

                                                                return (

                                                                    <SelectItem key={forumType.id} value={forumType.id}>

                                                                        <div className="flex items-center gap-2">

                                                                            <TypeIcon className="h-4 w-4" />

                                                                            <div className="text-left">

                                                                                <div className="font-medium">{forumType.name}</div>

                                                                                <div className="text-[10px] text-gray-500">{forumType.description}</div>

                                                                            </div>

                                                                        </div>

                                                                    </SelectItem>

                                                                )

                                                            })}

                                                        </SelectContent>

                                                    </Select>

                                                    <FormMessage />

                                                </FormItem>

                                            )}

                                        />

                                        <FormField

                                            control={form.control}

                                            name="category"

                                            render={({ field }) => (

                                                <FormItem className="space-y-3 col-span-1">

                                                    <FormLabel htmlFor="category">Kategori *</FormLabel>

                                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>

                                                        <FormControl>

                                                            <SelectTrigger className="w-full">

                                                                <SelectValue placeholder="Pilih kategori" />

                                                            </SelectTrigger>

                                                        </FormControl>

                                                        <SelectContent>

                                                            {FORUM_CATEGORIES.map((cat: ForumCategory) => {

                                                                const CategoryIcon = categoryIcons[cat.id as keyof typeof categoryIcons] || Plus // Default icon 

                                                                return (

                                                                    <SelectItem key={cat.id} value={cat.id}>

                                                                        <div className="flex items-center gap-2">

                                                                            <CategoryIcon className="h-4 w-4" />

                                                                            <span>{cat.name}</span>

                                                                        </div>

                                                                    </SelectItem>

                                                                )

                                                            })}

                                                        </SelectContent>

                                                    </Select>

                                                    <FormMessage />

                                                </FormItem>

                                            )}

                                        />

                                    </div>

                                    {/* Tags - only show if type allows tags */}

                                    {selectedType?.allowTags && (

                                        <FormField

                                            control={form.control}

                                            name="tags"

                                            render={({ field }) => (

                                                <FormItem className="space-y-3">

                                                    <FormLabel>Tag (Opsional)</FormLabel>

                                                    <div className="space-y-2">

                                                        <div className="flex gap-2">

                                                            <Input

                                                                value={newTagInput}

                                                                onChange={(e) => setNewTagInput(e.target.value)}

                                                                onKeyPress={handleKeyPress}

                                                                placeholder="Tekan Enter untuk menambah tag..."

                                                                maxLength={20}

                                                                disabled={isSubmitting}

                                                            />

                                                            <Button

                                                                type="button"

                                                                variant="outline"

                                                                onClick={handleAddTag}

                                                                disabled={!newTagInput.trim() || (field.value?.length || 0) >= 5 || isSubmitting}

                                                            >

                                                                <Plus className="h-4 w-4" />

                                                            </Button>

                                                        </div>

                                                        {field.value && field.value.length > 0 && (

                                                            <div className="flex flex-wrap gap-2">

                                                                {field.value.map((tag) => (

                                                                    <Badge key={tag} variant="secondary" className="gap-1">

                                                                        #{tag}

                                                                        <Button

                                                                            type="button"

                                                                            variant="ghost"

                                                                            size="sm"

                                                                            className="h-3 w-3 p-0 hover:bg-transparent"

                                                                            onClick={() => handleRemoveTag(tag)}

                                                                            disabled={isSubmitting}

                                                                        >

                                                                            {/* Removed X icon as per request */}

                                                                        </Button>

                                                                    </Badge>

                                                                ))}

                                                            </div>

                                                        )}

                                                        <div className="text-xs text-gray-500">

                                                            Maksimal 5 tag, gunakan tag yang relevan untuk memudahkan pencarian

                                                        </div>

                                                        <FormMessage />

                                                    </div>

                                                </FormItem>

                                            )}

                                        />

                                    )}

                                    <FormField

                                        control={form.control}

                                        name="thumbnail"

                                        render={({ field }) => (

                                            <FormItem>

                                                <FormControl>

                                                    <ThumbnailUpload value={field.value} onChange={field.onChange} disabled={isSubmitting} />

                                                </FormControl>

                                                <FormMessage />

                                            </FormItem>

                                        )}

                                    />

                                </CardContent>

                            </Card>



                            {/* Content */}

                            <Card className="relative">

                                <CardHeader>

                                    <CardTitle>Konten Diskusi *</CardTitle>

                                </CardHeader>

                                <CardContent>

                                    <Tabs value={activeTab} onValueChange={setActiveTab}>

                                        <TabsList className="absolute top-0 right-0">

                                            <TabsTrigger value="write">

                                                <Edit className="h-4 w-4 mr-2" />

                                                Tulis</TabsTrigger>

                                            <TabsTrigger value="preview">

                                                <Eye className="h-4 w-4 mr-2" />

                                                Preview

                                            </TabsTrigger>

                                        </TabsList>

                                        <TabsContent value="write" className="space-y-4">

                                            <FormField

                                                control={form.control}

                                                name="content"

                                                render={({ field }) => (

                                                    <FormItem>

                                                        <FormControl>

                                                            <Textarea

                                                                ref={setCombinedTextareaRef} // Use the combined ref here 

                                                                placeholder="Tulis konten diskusi Anda di sini... Anda dapat menggunakan Markdown untuk formatting. Drop gambar di sini untuk mengunggah."

                                                                className={`min-h-[300px] resize-none ${isDragOver ? 'border-2 border-blue-500 bg-blue-50' : ''}`}

                                                                maxLength={5000}

                                                                disabled={isSubmitting}

                                                                onDrop={handleDropOnTextarea}

                                                                onDragOver={handleDragOverOnTextarea}

                                                                onDragLeave={handleDragLeaveOnTextarea} // Add drag leave handler 

                                                                onPaste={handlePasteOnTextarea} // Handle paste event 

                                                                {...field} // This will now correctly spread other field props but not conflict with ref 

                                                            />

                                                        </FormControl>

                                                        <div className="flex justify-between text-sm text-gray-500">

                                                            <span>Mendukung Markdown formatting</span>

                                                            <span>{field.value?.length || 0}/5000</span>

                                                        </div>

                                                        <FormMessage />

                                                    </FormItem>

                                                )}

                                            />

                                            {/* Custom Media Uploader and Preview */}

                                            <div className="mt-6">

                                                <h4 className="font-medium mb-3">Upload Gambar (Opsional)</h4>

                                                <CustomMediaUploader disabled={isUploadDisabled} />

                                                {!isUploadDisabled && (

                                                    <p className="text-xs text-gray-500 text-center mt-2">

                                                        Anda dapat mengunggah {MAX_MEDIA_FILES - mediaFiles.length} gambar lagi.

                                                    </p>

                                                )}

                                                {mediaFiles.length > 0 && (

                                                    <>

                                                        <h4 className="font-medium mb-3 mt-6">Pratinjau Gambar</h4>

                                                        <ScrollArea className="w-full whitespace-nowrap rounded-md border">

                                                            <div className="flex w-max space-x-4 p-4">

                                                                {mediaFiles.slice(0, MAX_MEDIA_FILES).map((media) => (

                                                                    <div key={media.id} className="relative group w-[150px] h-[150px] flex-shrink-0">

                                                                        <CustomMediaPreview mediaFile={media} />

                                                                        {/* Removed Button X */}

                                                                    </div>

                                                                ))}

                                                            </div>

                                                            <ScrollBar orientation="horizontal" />

                                                        </ScrollArea>

                                                    </>

                                                )}

                                            </div>

                                        </TabsContent>

                                        <TabsContent value="preview">

                                            <div className="min-h-[300px] p-4 border rounded-lg bg-gray-50 dark:bg-neutral-800">

                                                {form.watch("content") ? (

                                                    <div className="prose prose-sm max-w-none dark:prose-invert">

                                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{form.watch("content")}</ReactMarkdown>

                                                    </div>

                                                ) : (

                                                    <p className="text-gray-500 italic">Tidak ada konten untuk di-preview</p>

                                                )}

                                            </div>

                                        </TabsContent>

                                    </Tabs>

                                </CardContent>

                            </Card>

                        </div>



                        {/* Sidebar */}

                        <div className="space-y-6 lg:sticky lg:top-8 h-fit">

                            {" "}

                            {/* Added sticky and top-8 */}

                            {/* Type Info */}

                            {selectedType && (

                                <Card>

                                    <CardHeader>

                                        <CardTitle className="text-lg flex items-center gap-2">

                                            {(() => {

                                                const TypeIcon = typeIcons[selectedType.icon as keyof typeof typeIcons] || Plus // Default icon 

                                                return <TypeIcon className="h-5 w-5" />

                                            })()}

                                            {selectedType.name}

                                        </CardTitle>

                                    </CardHeader>

                                    <CardContent>

                                        <p className="text-sm text-gray-600 mb-3">{selectedType.description}</p>

                                        <div className="space-y-2 text-xs">

                                            <div className="flex items-center justify-between">

                                                <span>Solusi dapat ditandai:</span>

                                                <Badge variant={selectedType.allowSolution ? "default" : "secondary"}>

                                                    {selectedType.allowSolution ? "Ya" : "Tidak"}

                                                </Badge>

                                            </div>

                                            <div className="flex items-center justify-between">

                                                <span>Tag dapat digunakan:</span>

                                                <Badge variant={selectedType.allowTags ? "default" : "secondary"}>

                                                    {selectedType.allowTags ? "Ya" : "Tidak"}

                                                </Badge>

                                            </div>

                                        </div>

                                    </CardContent>

                                </Card>

                            )}

                            {/* Category Info */}

                            {selectedCategory && (

                                <Card>

                                    <CardHeader>

                                        <CardTitle className="text-lg flex items-center gap-2">

                                            {(() => {

                                                const CategoryIcon = categoryIcons[selectedCategory.id as keyof typeof categoryIcons] || Plus // Default icon 

                                                return <CategoryIcon className="h-5 w-5" />

                                            })()}

                                            {selectedCategory.name}

                                        </CardTitle>

                                    </CardHeader>

                                    <CardContent>

                                        <p className="text-sm text-gray-600 dark:text-gray-400 ">{selectedCategory.description}</p>

                                    </CardContent>

                                </Card>

                            )}

                            {/* Guidelines */}

                            <Card>

                                <CardHeader>

                                    <CardTitle className="text-lg">Panduan Posting</CardTitle>

                                </CardHeader>

                                <CardContent className="space-y-3 text-sm">

                                    <div className="space-y-2">

                                        <h4 className="font-medium">Tips untuk diskusi yang baik:</h4>

                                        <ul className="space-y-1 text-gray-600 dark:text-gray-400 list-disc list-inside">

                                            <li>Gunakan judul yang jelas dan deskriptif</li>

                                            <li>Berikan konteks yang cukup dalam konten</li>

                                            <li>Gunakan tag yang relevan</li>

                                            <li>Sertakan screenshot jika diperlukan</li>

                                            <li>Bersikap sopan dan konstruktif</li>

                                        </ul>

                                    </div>



                                    {selectedType?.id === "pertanyaan" && (

                                        <div className="space-y-2">

                                            <h4 className="font-medium">Khusus untuk pertanyaan:</h4>

                                            <ul className="space-y-1 text-gray-600 list-disc list-inside">

                                                <li>Jelaskan masalah dengan detail</li>

                                                <li>Sebutkan apa yang sudah dicoba</li>

                                                <li>Sertakan spesifikasi sistem jika relevan</li>

                                                <li>Tandai jawaban terbaik sebagai solusi</li>

                                            </ul>

                                        </div>

                                    )}

                                </CardContent>

                            </Card>

                            {/* Submit Button */}

                            <Card>

                                <CardContent className="p-4">

                                    <Button

                                        type="submit"

                                        className="w-full"

                                        disabled={isSubmitting} // Form validation is handled automatically by react-hook-form 

                                    >

                                        {isSubmitting ? (

                                            <>

                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                                                Memposting...

                                            </>

                                        ) : (

                                            <>

                                                <Send className="mr-2 h-4 w-4" />

                                                Publikasikan Diskusi

                                            </>

                                        )}

                                    </Button>

                                    <div className="text-xs text-gray-500 text-center mt-2">

                                        Dengan mempublikasikan, Anda menyetujui aturan komunitas

                                    </div>

                                </CardContent>

                            </Card>

                        </div>

                    </div>

                </form>

            </Form>

        </div>

    )

}



// /forum/[id]/page.tsx 



"use client"



import { useState, useEffect, useRef, useCallback, useMemo } from "react"

import { useRouter, useParams } from "next/navigation"

import { Button } from "@/components/ui/button"

import { Card, CardContent, CardHeader } from "@/components/ui/card"

import { Badge } from "@/components/ui/badge"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import { Separator } from "@/components/ui/separator"

import { ScrollArea } from "@/components/ui/scroll-area"

import { Skeleton } from "@/components/ui/skeleton"

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

import { toast } from "sonner"

import { MediaViewer } from "@/components/forum/media-viewer"

import { MarkdownEditor } from "@/components/forum/markdown-editor"

import ReactMarkdown from "react-markdown"

import remarkGfm from "remark-gfm"

import { Input } from "@/components/ui/input"

import {

    ArrowLeft,

    MessageSquare,

    Heart,

    MoreHorizontal,

    Send,

    X,

    Eye,

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

import { cn } from "@/lib/utils" // Import cn for conditional class names 



// Types (copying from previous block to ensure full context) 

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



interface ProcessedForumReply extends ForumReply {

    children: ProcessedForumReply[]

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



const CURRENT_USER = "CurrentUser" // Simulating current user 

const IS_ADMIN = true // Simulating admin status 



const COMMENT_TRUNCATE_LIMIT = 500 // Characters limit for comments 

const NESTED_REPLIES_DISPLAY_COUNT = 0 // Default to 0 nested replies shown 



// Utility functions (copying to ensure full context) 

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

            console.error("Failed tosave user state:", error)

        }

    }

}



// Function to build reply tree from flat list 

const buildReplyTree = (replies: ForumReply[]): ProcessedForumReply[] => {

    const map = new Map<string, ProcessedForumReply>()

    const roots: ProcessedForumReply[] = []



    replies.forEach((reply) => {

        map.set(reply.id, { ...reply, children: [] })

    })



    replies.forEach((reply) => {

        const processedReply = map.get(reply.id)!

        if (reply.parentId) {

            const parent = map.get(reply.parentId)

            if (parent) {

                parent.children.push(processedReply)

            } else {

                roots.push(processedReply)

            }

        } else {

            roots.push(processedReply)

        }

    })



    map.forEach((value) => {

        value.children.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

    })



    return roots.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

}



// Helper to flatten the tree back to a list for easier addition 

const flattenReplies = (replies: ProcessedForumReply[]): ForumReply[] => {

    let flat: ForumReply[] = []

    replies.forEach((reply) => {

        const { children, ...rest } = reply

        flat.push(rest)

        if (children && children.length > 0) {

            flat = flat.concat(flattenReplies(children))

        }

    })

    return flat

}



// Helper function to update solution status in the nested tree 

const updateSolutionStatusInTree = (

    reply: ProcessedForumReply,

    targetReplyId: string,

    newStatus: boolean,

): ProcessedForumReply => {

    const updatedReply = { ...reply }

    if (reply.id === targetReplyId) {

        updatedReply.isSolution = newStatus

    }

    updatedReply.children = updatedReply.children.map((child) =>

        updateSolutionStatusInTree(child, targetReplyId, newStatus),

    )

    return updatedReply

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



// Skeleton Components (copying to ensure full context) 

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

                    <div className="text-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">

                        <Skeleton className="h-8 w-12 mx-auto mb-1" />

                        <Skeleton className="h-3 w-8 mx-auto" />

                    </div>

                    <div className="text-center p-3 bg-gray-50 dark:bg-zinc-700 rounded-lg">

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



// Components (copying to ensure full context) 

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

    reply,

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

    userReactions,

    replyReactions,

}: {

    onSelect: (key: string) => void

    userReactions: string[]

    replyReactions: ReactionMap

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

                {EMOJI_REACTIONS.map((reaction) => {

                    const count = replyReactions[reaction.key]?.length || 0

                    const isActive = userReactions.includes(reaction.key)

                    return (

                        <button

                            key={reaction.key}

                            onClick={() => onSelect(reaction.key)}

                            className={cn(

                                "p-2 hover:bg-gray-100 rounded text-lg transition-colors flex items-center gap-1",

                                isActive && "bg-blue-100 text-blue-600", // Highlight if active 

                            )}

                            title={reaction.label}

                        >

                            {reaction.emoji}

                            {count > 0 && <span className="text-xs font-medium">{count}</span>}

                        </button>

                    )

                })}

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

                height={500}

                width={500}

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

                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" onClick={onShare}>

                    <Share2 className="h-4 w-4 mr-2" />

                    Bagikan Post

                </Button>

                <Button variant="outline" size="sm" className="w-full justify-start bg-transparent" onClick={onNewPost}>

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



interface ReplyItemProps {

    reply: ProcessedForumReply

    postAuthor: string

    onVote: (replyId: string, voteType: "up" | "down") => void

    onReaction: (replyId: string, reactionKey: string) => void

    onMarkAsSolution: (replyId: string, isCurrentlySolution: boolean) => void

    onCommentAction: (replyId: string, action: string) => void

    userState: UserState

    onSubmitReply: (content: string, mediaFiles: File[], parentId?: string) => Promise<void>

    isSubmittingReply: boolean

    isNested?: boolean

}



const ReplyItem = ({

    reply,

    postAuthor,

    onVote,

    onReaction,

    onMarkAsSolution,

    onCommentAction,

    userState,

    onSubmitReply,

    isSubmittingReply,

    isNested = false,

}: ReplyItemProps) => {

    const [isInlineReplyExpanded, setIsInlineReplyExpanded] = useState(false)

    const [inlineReplyContent, setInlineReplyContent] = useState<string>(reply.author ? `@${reply.author} ` : "")

    const [inlineReplyMedia, setInlineReplyMedia] = useState<File[]>([])

    const inlineReplyTextareaRef = useRef<HTMLTextAreaElement>(null)



    // State for content truncation 

    const [isContentExpanded, setIsContentExpanded] = useState(false)

    const showReadMore = reply.content.length > COMMENT_TRUNCATE_LIMIT



    // State for showing/hiding nested children (default to false) 

    const [showNestedReplies, setShowNestedReplies] = useState(false)



    const isReplyAuthor = reply.author === CURRENT_USER

    const isUpvoted = userState.votes[reply.id] === "up"

    const isDownvoted = userState.votes[reply.id] === "down"



    const handleReplySubmit = async () => {

        if (!inlineReplyContent.trim()) return

        await onSubmitReply(inlineReplyContent, inlineReplyMedia, reply.id)

        setInlineReplyContent(reply.author ? `@${reply.author} ` : "")

        setInlineReplyMedia([])

        setIsInlineReplyExpanded(false)

    }



    useEffect(() => {

        if (isInlineReplyExpanded && inlineReplyTextareaRef.current) {

            inlineReplyTextareaRef.current.focus()

            const length = inlineReplyTextareaRef.current.value.length

            inlineReplyTextareaRef.current.setSelectionRange(length, length)

        }

    }, [isInlineReplyExpanded])



    const mediaPreviews = useMemo(() => {

        return inlineReplyMedia.map((file) => ({

            url: URL.createObjectURL(file),

            filename: file.name,

        }))

    }, [inlineReplyMedia])



    // Content to display based on truncation state 

    const displayedContent = isContentExpanded

        ? reply.content

        : reply.content.slice(0, COMMENT_TRUNCATE_LIMIT) + (showReadMore ? "..." : "")



    // Determine which children to display (only if showNestedReplies is true) 

    const displayedChildren = showNestedReplies ? reply.children : []



    const replyBody = (

        <div className="flex gap-3">

            {/* Vote buttons (only for non-nested replies) */}

            {!isNested && (

                <div className="flex flex-col items-center gap-1 mr-2">

                    <Button

                        variant={isUpvoted ? "default" : "ghost"}

                        size="sm"

                        className="h-8 w-8 p-0"

                        onClick={() => onVote(reply.id, "up")}

                    >

                        <ChevronUp className="h-4 w-4" />

                    </Button>

                    <span className="text-sm font-medium text-center min-w-[2rem]">{reply.upvotes - reply.downvotes}</span>

                    <Button

                        variant={isDownvoted ? "default" : "ghost"}

                        size="sm"

                        className="h-8 w-8 p-0"

                        onClick={() => onVote(reply.id, "down")}

                    >

                        <ChevronDown className="h-4 w-4" />

                    </Button>

                </div>

            )}



            <div className="flex-1">

                <div className="flex items-center justify-between mb-2">

                    <div className="flex items-center gap-2 w-full">



                        {

                            isNested ? (

                                <div className="flex space-x-2 items-center min-w-sm border-t-[1px] w-full border-gray-200 dark:border-zinc-800">

                                    <Avatar className="h-7 w-7 border border-gray-300 -left-[30px] top-0"> {/* Smaller size and lighter border */}

                                        <AvatarImage src={reply.avatar || "/placeholder.svg"} />

                                        <AvatarFallback className="bg-gray-100 text-gray-600">{reply.author[0]}</AvatarFallback> {/* Different fallback style */}

                                    </Avatar>

                                    <div className="flex items-center space-x-2 absolute left-28">

                                        <div>

                                            <span className="font-medium">{reply.author}</span>

                                            <span className="text-sm text-gray-500">{formatTimeAgo(reply.createdAt)}

                                            </span>

                                        </div>

                                    </div>

                                </div>

                            ) : (

                                <div className="flex space-x-2 items-center justify-center">

                                    <Avatar className="h-9 w-9 border-2 border-blue-400"> {/* Added larger size and blue border */}

                                        <AvatarImage src={reply.avatar || "/placeholder.svg"} />

                                        <AvatarFallback className="bg-blue-200 text-blue-800 font-semibold">{reply.author[0]}</AvatarFallback> {/* Different fallback style */}

                                    </Avatar>

                                    <span className="font-medium">{reply.author}</span>

                                    <span className="text-sm text-gray-500">{formatTimeAgo(reply.createdAt)}</span>

                                </div>

                            )

                        }

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

                        isAuthor={isReplyAuthor || false}

                        onAction={(action) => onCommentAction(reply.id, action)}

                    />

                </div>



                <div className={

                    isNested ? (

                        "prose prose-sm max-w-none dark:prose-invert"

                    ) : (

                        "prose prose-sm max-w-none dark:prose-invert mb-2"

                    )

                }>

                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayedContent}</ReactMarkdown>

                    {showReadMore && (

                        <Button variant="link" onClick={() => setIsContentExpanded(!isContentExpanded)} className="p-0 h-auto">

                            {isContentExpanded ? "Sembunyikan" : "Baca Selengkapnya"}

                        </Button>

                    )}

                </div>



                {reply.media && reply.media.length > 0 && (

                    <div className="mb-3">

                        <MediaViewer media={reply.media} />

                    </div>

                )}



                {/* Reactions and Solution Button (only for non-nested replies) */}

                {!isNested && (

                    <div className="flex items-center gap-2 text-sm">

                        {/* Popover for adding new reactions */}

                        <EmojiReactionPopover

                            onSelect={(reactionKey) => onReaction(reply.id, reactionKey)}

                            userReactions={userState.reactions[reply.id] || []}

                            replyReactions={reply.reactions || {}}

                        />

                        {(postAuthor === CURRENT_USER || IS_ADMIN) && (

                            <Button

                                variant="ghost"

                                size="sm"

                                onClick={() => onMarkAsSolution(reply.id, reply.isSolution || false)}

                                className={`h-6 px-2 text-xs ${reply.isSolution ? "text-green-600 hover:text-red-700" : "text-gray-600 hover:text-green-700"}`}

                            >

                                {reply.isSolution ? (

                                    <>

                                        <X className="h-3 w-3 mr-1" />

                                        Batalkan Solusi

                                    </>

                                ) : (

                                    <>

                                        <CheckCircle className="h-3 w-3 mr-1" />

                                        Tandai Solusi

                                    </>

                                )}

                            </Button>

                        )}

                        {/* Display existing reactions */}

                        {EMOJI_REACTIONS.map((reaction) => {

                            const count = reply.reactions?.[reaction.key]?.length || 0

                            const isActive = userState.reactions[reply.id]?.includes(reaction.key)

                            if (count === 0 && !isActive) return null // Only show if there's a count or user has reacted 



                            return (

                                <Button

                                    key={reaction.key}

                                    variant="outline" // Use outline variant for display 

                                    size="sm"

                                    className={cn(

                                        "h-6 px-2 text-xs flex items-center gap-1",

                                        isActive && "bg-blue-100 text-blue-600 border-blue-200", // Highlight if active 

                                    )}

                                    onClick={() => onReaction(reply.id, reaction.key)} // Make them clickable to toggle 

                                >

                                    {reaction.emoji}

                                    {count > 0 && <span className="font-medium">{count}</span>}

                                </Button>

                            )

                        })}

                    </div>

                )}



                {/* Nested replies (children) - conditional rendering based on showNestedReplies */}

                {reply.children && reply.children.length > 0 && (

                    <div className="ml-4 mt-4 space-y-4 border-l pl-4">

                        {showNestedReplies &&

                            displayedChildren.map((childReply) => (

                                <ReplyItem

                                    key={childReply.id}

                                    reply={childReply}

                                    postAuthor={postAuthor}

                                    onVote={onVote}

                                    onReaction={onReaction}

                                    onMarkAsSolution={onMarkAsSolution}

                                    onCommentAction={onCommentAction}

                                    userState={userState}

                                    onSubmitReply={onSubmitReply}

                                    isSubmittingReply={isSubmittingReply}

                                    isNested={true}

                                />

                            ))}

                        <Button

                            variant="link"

                            size="sm"

                            onClick={() => setShowNestedReplies(!showNestedReplies)}

                            className="w-full justify-start pl-0 text-sm font-medium"

                        >

                            {showNestedReplies ? (

                                <>

                                    <ChevronUp className="h-4 w-4 mr-2" />

                                    Sembunyikan Balasan ({reply.children.length})

                                </>

                            ) : (

                                <>

                                    <ChevronDown className="h-4 w-4 mr-2" />

                                    Lihat Balasan ({reply.children.length})

                                </>

                            )}

                        </Button>

                    </div>

                )}



                {/* Inline Reply Input (only for non-nested replies) */}

                {!isNested && (

                    <div className="mt-4 border-t pt-4">

                        <div className="flex items-start gap-3">

                            <div className="flex-1">

                                {!isInlineReplyExpanded ? (

                                    <div className="flex items-center gap-2 w-full">

                                        <Input

                                            // placeholder={`Balas @${reply.author}...`} 

                                            value={inlineReplyContent}

                                            onChange={(e) => setInlineReplyContent(e.target.value)}

                                            onFocus={() => setIsInlineReplyExpanded(true)}

                                            className="flex-1"

                                            disabled={isSubmittingReply}

                                        />

                                        <Button

                                            size="sm"

                                            onClick={handleReplySubmit}

                                            disabled={!inlineReplyContent.trim() || isSubmittingReply}

                                            className="shrink-0"

                                        >

                                            {isSubmittingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}

                                            <span className="sr-only">Kirim</span>

                                        </Button>

                                    </div>

                                ) : (

                                    <div className="space-y-3">

                                        <MarkdownEditor

                                            // textareaRef={inlineReplyTextareaRef} 

                                            value={inlineReplyContent}

                                            onChange={setInlineReplyContent}

                                            onMediaFilesChange={setInlineReplyMedia}

                                            mediaPreviews={mediaPreviews}

                                            // placeholder={`Balas @${reply.author}...`} 

                                            rows={3}

                                            disabled={isSubmittingReply}

                                            showMediaInput={true}

                                        // allowFullScreen={false} // This prop is now removed from MarkdownEditor 

                                        />

                                        <div className="flex items-center justify-between">

                                            <div className="text-xs text-gray-500">Tekan Ctrl+Enter untuk mengirim cepat</div>

                                            <div className="flex gap-2">

                                                <Button

                                                    variant="outline"

                                                    size="sm"

                                                    onClick={() => {

                                                        setIsInlineReplyExpanded(false)

                                                        setInlineReplyContent(reply.author ? `@${reply.author} ` : "")

                                                        setInlineReplyMedia([])

                                                    }}

                                                    disabled={isSubmittingReply}

                                                >

                                                    Batal

                                                </Button>

                                                <Button

                                                    size="sm"

                                                    onClick={handleReplySubmit}

                                                    disabled={!inlineReplyContent.trim() || isSubmittingReply}

                                                >

                                                    {isSubmittingReply ? (

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

                                )}

                            </div>

                        </div>

                    </div>

                )}

            </div>

        </div>

    )



    return isNested ? (

        replyBody

    ) : (

        <Card

            id={`comment-${reply.id}`}

            className={`${reply.isSolution ? "border-green-200 border-2 bg-green-50/50 dark:bg-green-50/0" : ""}`}

        >

            <CardContent className="p-4">{replyBody}</CardContent>

        </Card>

    )

}



// Main component 

export default function ForumDetailPage() {

    const params = useParams()

    const router = useRouter()

    const { userState, updateUserState } = useUserState()



    // State 

    const [post, setPost] = useState<ForumPost | null>(null)

    const [replies, setReplies] = useState<ProcessedForumReply[]>([])

    const [newReply, setNewReply] = useState("")

    const [selectedMedia, setSelectedMedia] = useState<File[]>([])

    const [loading, setLoading] = useState(true)

    const [loadingComments, setLoadingComments] = useState(false)

    const [submittingReply, setSubmittingReply] = useState(false)

    const [views, setViews] = useState(0)



    const mainReplyTextareaRef = useRef<HTMLTextAreaElement>(null)



    // Computed values 

    const isPostAuthor = post?.author === CURRENT_USER

    const isLiked = post ? userState.votes[`post-${post.id}`] === "up" : false

    const isBookmarked = post ? userState.bookmarks.includes(post.id) : false



    const mainCommentMediaPreviews = useMemo(() => {

        return selectedMedia.map((file) => ({

            url: URL.createObjectURL(file),

            filename: file.name,

        }))

    }, [selectedMedia])



    // Load data 

    useEffect(() => {

        const loadData = async () => {

            try {

                setLoading(true)

                const postId = params.id as string



                await new Promise((resolve) => setTimeout(resolve, 1200))



                const foundPost = forumPostsData.find((p) => p.id === postId)



                if (foundPost) {

                    setPost(foundPost as ForumPost)

                    setViews(Math.floor(Math.random() * 1000) + 100)



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

                    setReplies(buildReplyTree(transformedReplies))

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



    // Handlers 

    const handleSubmitReply = useCallback(

        async (content: string, mediaFiles: File[], parentId?: string) => {

            if (submittingReply) return



            if (!content.trim()) return



            try {

                setSubmittingReply(true)



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

                    isSolution: false,

                }



                setReplies((prevReplies) => {

                    const flatReplies = flattenReplies(prevReplies)

                    flatReplies.push(reply)

                    return buildReplyTree(flatReplies)

                })



                if (!parentId && post) {

                    setPost((prev) => (prev ? { ...prev, replies: prev.replies + 1 } : null))

                }



                toast("Komentar berhasil", { description: "Komentar Anda telah ditambahkan" })

            } catch (error) {

                console.error(error)

                toast("Error", { description: "Gagal menambahkan komentar" })

            } finally {

                setSubmittingReply(false)

                if (!parentId) {

                    setNewReply("")

                    setSelectedMedia([])

                }

            }

        },

        [submittingReply, post],

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



            setReplies((prev) => prev.map((rootReply) => updateVoteStatusInTree(rootReply, replyId, currentVote, newVote)))



            toast("Vote berhasil", {

                description: `Anda telah ${newVote === "up" ? "upvote" : newVote === "down" ? "downvote" : "membatalkan vote"}`,

            })

        },

        [userState.votes, updateUserState],

    )



    const updateVoteStatusInTree = (

        reply: ProcessedForumReply,

        targetReplyId: string,

        currentVote: "up" | "down" | null,

        newVote: "up" | "down" | null,

    ): ProcessedForumReply => {

        let updatedReply = { ...reply }

        if (reply.id === targetReplyId) {

            let upvotes = reply.upvotes

            let downvotes = reply.downvotes



            if (currentVote === "up") upvotes--

            if (currentVote === "down") downvotes--

            if (newVote === "up") upvotes++

            if (newVote === "down") downvotes++



            updatedReply = { ...reply, upvotes, downvotes }

        }

        updatedReply.children = updatedReply.children.map((child) =>

            updateVoteStatusInTree(child, targetReplyId, currentVote, newVote),

        )

        return updatedReply

    }



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

                prev.map((rootReply) => updateReactionStatusInTree(rootReply, replyId, reactionKey, hasReacted)),

            )



            toast("Reaksi berhasil", {

                description: `Anda telah ${hasReacted ? "menghapus" : "menambahkan"} reaksi`,

            })

        },

        [userState.reactions, updateUserState],

    )



    const updateReactionStatusInTree = (

        reply: ProcessedForumReply,

        targetReplyId: string,

        reactionKey: string,

        hasReacted: boolean,

    ): ProcessedForumReply => {

        let updatedReply = { ...reply }

        if (reply.id === targetReplyId) {

            const updatedReactions = { ...reply.reactions }

            if (hasReacted) {

                updatedReactions[reactionKey] = updatedReactions[reactionKey].filter((user) => user !== CURRENT_USER)

            } else {

                updatedReactions[reactionKey] = [...(updatedReactions[reactionKey] || []), CURRENT_USER]

            }

            updatedReply = { ...reply, reactions: updatedReactions }

        }

        updatedReply.children = updatedReply.children.map((child) =>

            updateReactionStatusInTree(child, targetReplyId, reactionKey, hasReacted),

        )

        return updatedReply

    }



    const handleMarkAsSolution = useCallback(

        (replyId: string, isCurrentlySolution: boolean) => {

            toast.promise(

                new Promise((resolve) => {

                    setTimeout(() => {

                        setReplies((prev) => {

                            const updatedReplies = prev.map((rootReply) =>

                                updateSolutionStatusInTree(rootReply, replyId, !isCurrentlySolution),

                            )

                            return updatedReplies

                        })



                        setPost((prevPost) => {

                            if (!prevPost) return null

                            const allRepliesFlat = flattenReplies(replies)

                            const anySolution = allRepliesFlat.some((r) => (r.id === replyId ? !isCurrentlySolution : r.isSolution))

                            return { ...prevPost, isResolved: anySolution }

                        })



                        resolve(null)

                    }, 500)

                }),

                {

                    loading: isCurrentlySolution ? "Membatalkan solusi..." : "Menandai solusi...",

                    success: (

                        <div>

                            <span className="font-semibold">{isCurrentlySolution ? "Solusi Dibatalkan!" : "Solusi Ditandai!"}</span>

                            <p className="text-sm text-gray-500 mt-1">

                                {isCurrentlySolution

                                    ? "Komentar tidak lagi ditandai sebagai solusi."

                                    : "Komentar ini telah ditandai sebagai solusi."}

                            </p>

                        </div>

                    ),

                    error: "Gagal memperbarui status solusi.",

                },

            )

        },

        [replies],

    )



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

        [post, router, handleBookmark],

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

                            setReplies((prev) => {

                                const flat = flattenReplies(prev).filter((r) => r.id !== replyId)

                                return buildReplyTree(flat)

                            })

                            toast("Komentar dihapus", { description: "Komentar berhasil dihapus" })

                        }

                        break

                }

            } catch (error) {

                console.error(error)

                toast.error("Error", { description: "Gagal melakukan aksi" })

            }

        },

        [post],

    )



    // Keyboard shortcuts 

    useEffect(() => {

        const handleKeyDown = (event: KeyboardEvent) => {

            // Ensure the event is from the main reply MarkdownEditor only 

            const isMainEditorFocused = mainReplyTextareaRef.current === document.activeElement



            if (isMainEditorFocused && (event.ctrlKey || event.metaKey) && event.key === "Enter") {

                if (newReply.trim()) {

                    event.preventDefault() // Prevent new line in textarea 

                    handleSubmitReply(newReply, selectedMedia)

                }

            }



            if ((event.ctrlKey || event.metaKey) && event.key === "b") {

                event.preventDefault()

                handleBookmark()

            }

        }



        document.addEventListener("keydown", handleKeyDown)

        return () => document.removeEventListener("keydown", handleKeyDown)

    }, [newReply, selectedMedia, handleBookmark, handleSubmitReply])



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

        <div className={`container mx-auto px-4 py-8 max-w-7xl`}>

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



            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Content */}

                <div className="col-span-2 space-y-6">

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

                                <span className="font-semibold">

                                    Komentar {loadingComments ? "" : `(${flattenReplies(replies).length})`}

                                </span>

                            </div>

                        </CardHeader>

                        <CardContent>

                            {/* Comments List */}

                            <ScrollArea>

                                <div className="space-y-4">

                                    {loadingComments ? (

                                        Array.from({ length: 3 }).map((_, i) => <CommentSkeleton key={i} />)

                                    ) : replies.length > 0 ? (

                                        replies.map((reply) => (

                                            <ReplyItem

                                                key={reply.id}

                                                reply={reply}

                                                postAuthor={post?.author || ""}

                                                onVote={handleVote}

                                                onReaction={handleReaction}

                                                onMarkAsSolution={handleMarkAsSolution}

                                                onCommentAction={handleCommentAction}

                                                userState={userState}

                                                onSubmitReply={handleSubmitReply}

                                                isSubmittingReply={submittingReply}

                                            />

                                        ))

                                    ) : (

                                        <div className="text-center py-12">

                                            <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />

                                            <h3 className="text-lg font-medium mb-2">Belum ada komentar</h3>

                                            <p className="text-gray-600">Jadilah yang pertama memberikan komentar!</p>

                                        </div>

                                    )}

                                </div>

                                {/* NEW LOCATION: New Reply Form is now here, outside the comments card */}

                                {!loading && (

                                    <div className="mt-6">

                                        <div className="flex items-start gap-3">

                                            <div className="flex-1">

                                                <MarkdownEditor

                                                    // textareaRef={mainReplyTextareaRef} 

                                                    value={newReply}

                                                    onChange={setNewReply}

                                                    onMediaFilesChange={setSelectedMedia}

                                                    mediaPreviews={mainCommentMediaPreviews}

                                                    placeholder="Tulis komentar Anda..."

                                                    rows={6}

                                                    disabled={submittingReply}

                                                    showMediaInput={true}

                                                />

                                                <div className="flex items-center justify-between mt-3">

                                                    <div className="text-xs text-gray-500">Tekan Ctrl+Enter untuk mengirim cepat</div>

                                                    <Button

                                                        onClick={() => handleSubmitReply(newReply, selectedMedia)}

                                                        disabled={!newReply.trim() || submittingReply}

                                                    >

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

                            </ScrollArea>

                        </CardContent>

                    </Card>



                </div>



                {/* Right Sidebar */}

                <div className="hidden lg:block space-y-6 lg:sticky lg:top-[87px] h-fit">

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



// /components/forum/markdown-editor.tsx 

"use client"



import type React from "react"

import { useState, useCallback } from "react" // Added useRef 

import { Textarea } from "@/components/ui/textarea"

import { Button } from "@/components/ui/button"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import ReactMarkdown from "react-markdown"

import remarkGfm from "remark-gfm"

import { X, Link } from "lucide-react" // Renamed Image to ImageIcon 

import { ImageUploadButton } from "./image-upload-button"

import { toast } from "sonner"

import Image from "next/image"



interface MarkdownEditorProps {

    value: string

    onChange: (value: string) => void

    onMediaFilesChange?: (files: File[]) => void

    placeholder?: string

    rows?: number

    disabled?: boolean

    showMediaInput?: boolean

    mediaPreviews?: { url: string; filename: string }[]

    className?: string

    textareaRef?: React.RefObject<HTMLTextAreaElement>

}



export function MarkdownEditor({

    value,

    onChange,

    onMediaFilesChange,

    placeholder = "Tulis di sini...",

    rows = 4,

    disabled = false,

    showMediaInput = true,

    mediaPreviews = [],

    className,

    textareaRef,

}: MarkdownEditorProps) {

    const [activeTab, setActiveTab] = useState("write")



    const handlePaste = useCallback(

        (event: React.ClipboardEvent<HTMLTextAreaElement>) => {

            const items = event.clipboardData?.items

            if (items) {

                for (const item of Array.from(items)) {

                    if (item.type.startsWith("image/") && onMediaFilesChange) {

                        const file = item.getAsFile()

                        if (file) {

                            onMediaFilesChange([file])

                            toast.info(`Gambar ${file.name} ditempelkan!`)

                            event.preventDefault()

                        }

                    }

                }

            }

        },

        [onMediaFilesChange],

    )



    const handleImageUpload = useCallback(

        (files: File[]) => {

            if (onMediaFilesChange) {

                onMediaFilesChange(files)

            }

        },

        [onMediaFilesChange],

    )



    const handleRemoveMedia = useCallback(

        (indexToRemove: number) => {

            if (onMediaFilesChange) {

                // Assuming mediaPreviews only contains one item for simplicity. 

                // If it can contain multiple, this logic needs adjustment. 

                onMediaFilesChange([]) // Clear all media 

                toast.info("Gambar dihapus.")

            }

        },

        [onMediaFilesChange],

    )



    const handleInsertImageLink = useCallback(() => {

        const markdownLink = "![Deskripsi Gambar](https://example.com/your-image.jpg)\n"

        const currentCursorPosition = textareaRef?.current?.selectionStart || value.length

        const newValue = value.substring(0, currentCursorPosition) + markdownLink + value.substring(currentCursorPosition)

        onChange(newValue)



        // Optional: Focus and set cursor after insertion 

        setTimeout(() => {

            if (textareaRef?.current) {

                const newCursorPosition = currentCursorPosition + markdownLink.length

                textareaRef.current.focus()

                textareaRef.current.setSelectionRange(newCursorPosition, newCursorPosition)

            }

        }, 0)



        toast.info("Markdown link gambar ditambahkan.")

    }, [value, onChange, textareaRef])



    return (

        <div

            className={` 

       relative border rounded-md overflow-hidden bg-gray-100 dark:bg-zinc-900 

       ${className || ""} 

     `}

        >

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col">

                <div className="flex items-center justify-between border-b p-2 flex-shrink-0">

                    <TabsList className="grid w-fit grid-cols-2 h-8">

                        <TabsTrigger value="write" className="h-6 text-xs">

                            Tulis

                        </TabsTrigger>

                        <TabsTrigger value="preview" className="h-6 text-xs">

                            Review

                        </TabsTrigger>

                    </TabsList>

                    <div className="flex items-center gap-2">

                        {showMediaInput && (

                            <>

                                <Button

                                    type="button"

                                    variant="ghost"

                                    size="icon"

                                    onClick={handleInsertImageLink}

                                    disabled={disabled}

                                    className="h-8 w-8 text-gray-500 hover:text-gray-700"

                                    title="Masukkan link gambar Markdown"

                                >

                                    <Link className="h-4 w-4" />

                                    <span className="sr-only">Masukkan link gambar Markdown</span>

                                </Button>

                                <ImageUploadButton onFilesSelect={handleImageUpload} disabled={disabled} />

                            </>

                        )}

                    </div>

                </div>



                <TabsContent value="write" className="p-4 mt-0 border-none flex-grow">

                    <Textarea

                        ref={textareaRef}

                        placeholder={placeholder}

                        value={value}

                        onChange={(e) => onChange(e.target.value)}

                        rows={rows}

                        className="resize-none border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-sm h-full min-h-[100px]"

                        disabled={disabled}

                        onPaste={handlePaste}

                    />

                </TabsContent>



                <TabsContent value="preview" className="p-4 mt-0 border-none flex-grow">

                    <div className="prose prose-sm max-w-none dark:prose-invert overflow-y-auto max-h-[400px]">

                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{value || "_Tidak ada konten untuk direview_"}</ReactMarkdown>

                    </div>

                </TabsContent>

            </Tabs>



            {/* Moved media previews outside of tabs content */}

            {mediaPreviews && mediaPreviews.length > 0 && (

                <div className="border-t p-4">

                    <p className="text-sm font-medium mb-2">Media Terlampir:</p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">

                        {mediaPreviews.map((media, index) => (

                            <div key={index} className="relative aspect-video rounded-md overflow-hidden border">

                                <Image

                                    src={media.url || "/placeholder.svg"}

                                    alt={`Preview ${media.filename}`}

                                    layout="fill"

                                    objectFit="cover"

                                />

                                {!disabled && (

                                    <Button

                                        variant="destructive"

                                        size="icon"

                                        className="absolute top-1 right-1 h-6 w-6 rounded-full opacity-80 hover:opacity-100"

                                        onClick={() => handleRemoveMedia(index)}

                                        disabled={disabled}

                                    >

                                        <X className="h-3 w-3" />

                                        <span className="sr-only">Hapus gambar</span>

                                    </Button>

                                )}

                            </div>

                        ))}

                    </div>

                </div>

            )}

        </div>

    )

}



// components/forum/media-viewer.tsx (No changes from previous iteration) 

"use client"

import { useState } from "react"

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"

import { Button } from "@/components/ui/button"

import { Expand, Play } from "lucide-react" // Removed X 

import Image from "next/image"



interface MediaItem {

    type: "image" | "video"

    url: string

    thumbnail?: string

}



interface MediaViewerProps {

    media: MediaItem[]

    className?: string

}



export function MediaViewer({ media, className = "" }: MediaViewerProps) {

    const [selectedIndex, setSelectedIndex] = useState(0)

    const [isOpen, setIsOpen] = useState(false)



    if (!media || media.length === 0) return null



    const currentMedia = media[selectedIndex]



    const MediaPreview = ({ item, index }: { item: MediaItem; index: number }) => (

        <div

            className="relative group cursor-pointer"

            onClick={() => {

                setSelectedIndex(index)

                setIsOpen(true)

            }}

        >

            <div className="relative overflow-hidden rounded-lg">

                {item.type === "image" ? (

                    <Image

                        height="500"

                        width="500"

                        src={item.url || "/placeholder.svg"}

                        alt={`Media ${index + 1}`}

                        className="w-full h-48 object-cover transition-transform group-hover:scale-105"

                    />

                ) : (

                    <div className="relative">

                        <video src={item.url} className="w-full h-48 object-cover" poster={item.thumbnail} />

                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">

                            <Play className="h-12 w-12 text-white" />

                        </div>

                    </div>

                )}



                {/* Expand Icon */}

                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">

                    <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0">

                        <Expand className="h-4 w-4 text-white" />

                    </Button>

                </div>

            </div>

        </div>

    )



    const FullScreenMedia = () => (

        <div className="relative w-full h-full flex items-center justify-center bg-black">

            {currentMedia.type === "image" ? (

                <Image

                    height="500"

                    width="500"

                    src={currentMedia.url || "/placeholder.svg"}

                    alt="Full size media"

                    className="max-w-full max-h-full object-contain"

                />

            ) : (

                <video src={currentMedia.url} className="max-w-full max-h-full object-contain" controls autoPlay />

            )}



            {/* Close Button */}

            <Button

                variant="ghost"

                size="sm"

                className="absolute top-4 right-4 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white"

                onClick={() => setIsOpen(false)}

            >

                {/* Removed X icon as per request */}

            </Button>



            {/* Navigation for multiple media */}

            {media.length > 1 && (

                <>

                    <Button

                        variant="ghost"

                        size="sm"

                        className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white"

                        onClick={() => setSelectedIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1))}

                    >

                        ←

                    </Button>

                    <Button

                        variant="ghost"

                        size="sm"

                        className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-black/50 hover:bg-black/70 text-white"

                        onClick={() => setSelectedIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0))}

                    >

                        →

                    </Button>



                    {/* Media Counter */}

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">

                        {selectedIndex + 1} / {media.length}

                    </div>

                </>

            )}

        </div>

    )



    return (

        <div className={className}>

            {media.length === 1 ? (

                <MediaPreview item={media[0]} index={0} />

            ) : (

                <div className="grid grid-cols-2 gap-2">

                    {media.slice(0, 4).map((item, index) => (

                        <div key={index} className="relative">

                            <MediaPreview item={item} index={index} />

                            {index === 3 && media.length > 4 && (

                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">

                                    <span className="text-white font-medium">+{media.length - 4}</span>

                                </div>

                            )}

                        </div>

                    ))}

                </div>

            )}



            {/* Full Screen Dialog */}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>

                <DialogTitle className="hidden">

                </DialogTitle>

                <DialogContent className="max-w-none max-h-none w-screen h-screen p-0 border-0 bg-black">

                    <FullScreenMedia />

                </DialogContent>

            </Dialog>

        </div>

    )

}



// /components/forum/image-upload-button.tsx 



"use client"



import type React from "react"

import { useRef, useState } from "react"

import { Button } from "@/components/ui/button"

import { ImageIcon, Loader2 } from "lucide-react"

import { toast } from "sonner"



interface ImageUploadButtonProps {

    onFilesSelect: (files: File[]) => void

    disabled?: boolean

    maxSize?: number // in MB 

}



export function ImageUploadButton({ onFilesSelect, disabled = false, maxSize = 5 }: ImageUploadButtonProps) {

    const fileInputRef = useRef<HTMLInputElement>(null)

    const [isLoading, setIsLoading] = useState(false)



    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {

        const files = event.target.files

        if (!files || files.length === 0) return



        setIsLoading(true)

        const validFiles: File[] = []



        for (const file of Array.from(files)) {

            if (!file.type.startsWith("image/")) {

                toast.error(`File ${file.name} bukan gambar.`)

                continue

            }

            if (file.size > maxSize * 1024 * 1024) {

                toast.error(`File ${file.name} terlalu besar (maks ${maxSize}MB).`)

                continue

            }

            validFiles.push(file)

        }



        if (validFiles.length > 0) {

            onFilesSelect(validFiles)

        }

        setIsLoading(false)

        event.target.value = "" // Clear input so same file can be selected again 

    }



    return (

        <>

            <Button

                type="button"

                variant="ghost"

                size="icon"

                onClick={() => fileInputRef.current?.click()}

                disabled={disabled || isLoading}

                className="h-8 w-8 text-gray-500 hover:text-gray-700"

            >

                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}

                <span className="sr-only">Unggah Gambar</span>

            </Button>

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

        </>

    )

}



// components/forum/thumbnail-upload.tsx (No changes from previous iteration) 

"use client"



import type React from "react"

import { useState, useRef, useCallback } from "react"

import { Button } from "@/components/ui/button"

import { Card, CardContent } from "@/components/ui/card"

import { Label } from "@/components/ui/label"

import { Progress } from "@/components/ui/progress"

import { ImageIcon, Loader2, Check, Camera, FileImage } from "lucide-react"

import { toast } from "sonner"

import Image from "next/image"



interface ThumbnailUploadProps {

    value?: string

    onChange: (url: string | undefined) => void

    disabled?: boolean

}



export function ThumbnailUpload({ value, onChange, disabled = false }: ThumbnailUploadProps) {

    const [uploading, setUploading] = useState(false)

    const [progress, setProgress] = useState(0)

    const [dragActive, setDragActive] = useState(false)

    const fileInputRef = useRef<HTMLInputElement>(null)

    const cameraInputRef = useRef<HTMLInputElement>(null)



    const simulateUpload = useCallback(

        async (file: File) => {

            setUploading(true)

            setProgress(0)



            // Simulate upload progress 

            for (let i = 0; i <= 100; i += 10) {

                await new Promise((resolve) => setTimeout(resolve, 100))

                setProgress(i)

            }



            // Create object URL for preview (in real app, this would be the uploaded URL) 

            const url = URL.createObjectURL(file)

            onChange(url)

            setUploading(false)

            setProgress(0)



            toast.success("Upload berhasil", {

                description: "Thumbnail berhasil diupload",

            })

        },

        [onChange],

    )



    const handleFile = useCallback(

        async (file: File) => {

            if (!file.type.startsWith("image/")) {

                toast.error("File tidak valid", {

                    description: "Hanya file gambar yang diperbolehkan",

                })

                return

            }



            if (file.size > 5 * 1024 * 1024) {

                // 5MB limit 

                toast.error("File terlalu besar", {

                    description: "Ukuran file maksimal 5MB",

                })

                return

            }



            await simulateUpload(file)

        },

        [simulateUpload],

    )



    const handleDrop = useCallback(

        (e: React.DragEvent) => {

            e.preventDefault()

            setDragActive(false)



            if (disabled || uploading) return



            const files = e.dataTransfer.files

            if (files.length > 0) {

                handleFile(files[0])

            }

        },

        [disabled, uploading, handleFile],

    )



    const handleDragOver = useCallback(

        (e: React.DragEvent) => {

            e.preventDefault()

            if (!disabled && !uploading) {

                setDragActive(true)

            }

        },

        [disabled, uploading],

    )



    const handleDragLeave = useCallback((e: React.DragEvent) => {

        e.preventDefault()

        setDragActive(false)

    }, [])



    const handleFileInput = useCallback(

        (e: React.ChangeEvent<HTMLInputElement>) => {

            const files = e.target.files

            if (files && files.length > 0) {

                handleFile(files[0])

            }

            // Reset input 

            e.target.value = ""

        },

        [handleFile],

    )



    // Removed removeThumbnail function and its associated UI (X button) 



    return (

        <div className="space-y-3">

            <Label>Thumbnail (Opsional)</Label>



            {value ? (

                <Card className="overflow-hidden">

                    <div className="relative">

                        <Image height="500" width="500" src={value || "/placeholder.svg"} alt="Thumbnail preview" className="w-full h-48 object-cover" />



                        {uploading && (

                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">

                                <div className="text-center text-white">

                                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />

                                    <div className="text-sm">{progress}%</div>

                                    <Progress value={progress} className="w-32 mt-2" />

                                </div>

                            </div>

                        )}



                        {!uploading && (

                            <div className="absolute top-2 left-2">

                                <div className="bg-green-500 text-white rounded-full p-1">

                                    <Check className="h-4 w-4" />

                                </div>

                            </div>

                        )}

                    </div>



                    <CardContent className="p-3">

                        <p className="text-sm text-gray-600">Thumbnail akan ditampilkan sebagai gambar utama post</p>

                    </CardContent>

                </Card>

            ) : (

                <div

                    className={` 

             border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 

             ${dragActive ? "border-blue-400 bg-blue-50" : "border-gray-300 hover:border-gray-400"} 

             ${disabled || uploading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"} 

           `}

                    onDrop={handleDrop}

                    onDragOver={handleDragOver}

                    onDragLeave={handleDragLeave}

                    onClick={() => !disabled && !uploading && fileInputRef.current?.click()}

                >

                    <div className="space-y-3">

                        <div className="flex justify-center">

                            <div className="p-3 bg-gray-100 rounded-full">

                                <ImageIcon className="h-6 w-6 text-gray-600" />

                            </div>

                        </div>



                        <div>

                            <p className="font-medium text-gray-700">Upload Thumbnail</p>

                            <p className="text-sm text-gray-500 mt-1">Drag & drop atau klik untuk memilih gambar</p>

                            <p className="text-xs text-gray-400 mt-1">Format: JPG, PNG, GIF, WebP (Maks. 5MB)</p>

                        </div>



                        <div className="flex justify-center gap-2">

                            <Button

                                type="button"

                                variant="outline"

                                size="sm"

                                onClick={(e) => {

                                    e.stopPropagation()

                                    fileInputRef.current?.click()

                                }}

                                disabled={disabled || uploading}

                            >

                                <FileImage className="h-4 w-4 mr-2" />

                                Pilih File

                            </Button>



                            <Button

                                type="button"

                                variant="outline"

                                size="sm"

                                onClick={(e) => {

                                    e.stopPropagation()

                                    cameraInputRef.current?.click()

                                }}

                                disabled={disabled || uploading}

                            >

                                <Camera className="h-4 w-4 mr-2" />

                                Kamera

                            </Button>

                        </div>

                    </div>

                </div>

            )}



            {/* Hidden file inputs */}

            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileInput} className="hidden" />



            <input

                ref={cameraInputRef}

                type="file"

                accept="image/*"

                capture="environment"

                onChange={handleFileInput}

                className="hidden"

            />

        </div>

    )

}



// /app/api/upload-auth/route.ts 

import { NextResponse } from "next/server";

import { getUploadAuthParams } from "@imagekit/next/server";

import { auth } from "../../../../auth";



export async function GET() {

    const session = await auth(); // Dapatkan sesi pengguna dari Auth.js 



    if (!session?.user?.id) { // Memastikan user login dan memiliki ID 

        return NextResponse.json({ error: "Unauthorized: User not authenticated." }, { status: 401 });

    }



    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_PUBLIC_KEY) {

        console.error("Missing ImageKit environment variables.");

        return NextResponse.json({ error: "Server configuration error: ImageKit keys not set." }, { status: 500 });

    }



    const { token, expire, signature } = getUploadAuthParams({

        privateKey: process.env.IMAGEKIT_PRIVATE_KEY,

        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,

        // Optional: Anda bisa menggunakan userId sebagai bagian dari token atau di properti lain 

        // token: session.user.id, 

    });



    return NextResponse.json({ token, expire, signature, publicKey: process.env.IMAGEKIT_PUBLIC_KEY });

}



// components/imagekit/image-uploader.tsx 

"use client";



import * as React from "react";

import { useRef, useState, useCallback, useEffect } from "react"; // Tambahkan useEffect 

import { Camera, Save, X, Loader2, Trash2 } from "lucide-react";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { cn } from "@/lib/utils"; // Pastikan Anda memiliki utility cn (dari shadcn-ui install) 

import {

    ImageKitAbortError,

    ImageKitInvalidRequestError,

    ImageKitServerError,

    ImageKitUploadNetworkError,

    upload,

} from "@imagekit/next";



// Props untuk komponen ImageUploader 

interface ImageUploaderProps {

    userId: string; // ID pengguna yang terkait dengan gambar ini (penting untuk nama file dan validasi) 

    currentImageUrl: string | null | undefined; // URL gambar saat ini (dari DB). Bisa null/undefined 

    onImageUrlChange: (newUrl: string | null) => Promise<void>; // Callback saat URL gambar berubah (null untuk hapus) 

    folderPath: string; // Path folder di ImageKit (misal: "user-avatars", "user-banners", "forum-thumbnails") 

    fileNamePrefix: string; // Prefix nama file (misal: "avatar", "banner", "forum-thumb") 

    imageAlt: string; // Alt text untuk gambar 

    disabled?: boolean; // Menonaktifkan semua interaksi jika true 

    type: "avatar" | "banner" | "general"; // Tipe uploader untuk styling & ukuran 



    // Props opsional untuk dimensi gambar (jika Anda ingin menggunakannya untuk ImageKit.Image) 

    width?: number;

    height?: number;

}



export function ImageUploader({

    userId,

    currentImageUrl,

    onImageUrlChange,

    folderPath,

    fileNamePrefix,

    imageAlt,

    disabled = false,

    type,

}: ImageUploaderProps) {

    const fileInputRef = useRef<HTMLInputElement>(null);

    const [previewUrl, setPreviewUrl] = useState<string | null>(null); // URL preview lokal (blob URL atau URL dari IK) 

    const [fileToUpload, setFileToUpload] = useState<File | null>(null); // File yang akan diunggah 

    const [isUploading, setIsUploading] = useState(false); // Status upload API 

    const [progress, setProgress] = useState(0); // Progress upload 



    // Sinkronkan previewUrl dengan currentImageUrl saat komponen dimuat atau currentImageUrl berubah, 

    // hanya jika tidak ada file yang sedang di-preview/upload secara lokal. 

    useEffect(() => {

        if (!fileToUpload && currentImageUrl !== previewUrl) {

            setPreviewUrl(currentImageUrl || null);

        }

    }, [currentImageUrl, fileToUpload, previewUrl]);



    // Fungsi untuk mendapatkan parameter otentikasi dari API Route 

    const authenticator = useCallback(async () => {

        try {

            const response = await fetch("/api/upload-auth"); // Memanggil API auth ImageKit 

            if (!response.ok) {

                const errorText = await response.text();

                throw new Error(`Authentication request failed: ${response.status} ${errorText}`);

            }

            const data = await response.json();

            return { signature: data.signature, expire: data.expire, token: data.token, publicKey: data.publicKey };

        } catch (error) {

            console.error("Authentication error for ImageKit:", error);

            toast.error("Gagal mendapatkan otentikasi upload.");

            throw error;

        }

    }, []);



    // Handler saat file dipilih dari input 

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {

        const file = event.target.files?.[0];

        if (file) {

            // Validasi tipe dan ukuran file 

            if (!file.type.startsWith("image/")) {

                toast.error("File tidak valid", { description: "Hanya gambar yang diperbolehkan." });

                return;

            }

            if (file.size > 5 * 1024 * 1024) { // Maksimal 5MB 

                toast.error("Ukuran file terlalu besar", { description: "Maksimal ukuran file adalah 5MB." });

                return;

            }

            setFileToUpload(file);

            setPreviewUrl(URL.createObjectURL(file)); // Buat URL lokal untuk preview langsung 

            setProgress(0); // Reset progress 

        }

    }, []);



    // Memicu klik pada input file tersembunyi 

    const handleUploadButtonClick = useCallback(() => {

        if (fileInputRef.current) {

            fileInputRef.current.click();

        }

    }, []);



    // Handler saat tombol "Simpan" ditekan untuk mengunggah gambar 

    const handleSave = useCallback(async () => {

        if (!fileToUpload) return; // Tidak ada file untuk diunggah 



        setIsUploading(true);

        try {

            const authParams = await authenticator(); // Dapatkan parameter otentikasi 



            // Buat nama file unik dan terstruktur 

            const now = new Date();

            const year = now.getFullYear();

            const month = (now.getMonth() + 1).toString().padStart(2, '0');

            const day = now.getDate().toString().padStart(2, '0');

            const hours = now.getHours().toString().padStart(2, '0');

            const minutes = now.getMinutes().toString().padStart(2, '0');

            const seconds = now.getSeconds().toString().padStart(2, '0');

            const randomString = Math.random().toString(36).substring(2, 8); // String acak pendek 



            // const originalFileNameWithoutExt = fileToUpload.name.split('.').slice(0, -1).join('.'); 

            const fileExtension = fileToUpload.name.split('.').pop();



            const uniqueFileName = `${fileNamePrefix}${userId}-${year}${month}${day}-${hours}${minutes}${seconds}-${randomString}.${fileExtension}`;





            const uploadResponse = await upload({

                publicKey: authParams.publicKey,

                fileName: uniqueFileName,

                file: fileToUpload,

                folder: folderPath, // Gunakan folderPath prop 

                signature: authParams.signature,

                token: authParams.token,

                expire: authParams.expire,

                onProgress: (event) => {

                    setProgress((event.loaded / event.total) * 100);

                },

                // Opsi tambahan untuk menimpa file dengan nama yang sama jika ada 

                useUniqueFileName: false, // Kita buat nama file unik sendiri 

                overwriteFile: true, // Timpa jika ada file dengan nama yang sama di folder 

            });



            if (uploadResponse.url) {

                // Panggil callback ke parent dengan URL baru yang diunggah 

                await onImageUrlChange(uploadResponse.url);



                setFileToUpload(null); // Bersihkan file yang menunggu upload 

                // setPreviewUrl(uploadResponse.url); // Preview akan disinkronkan oleh useEffect dari currentImageUrl 

                toast.success("Gambar berhasil diunggah dan disimpan!");

            } else {

                throw new Error("URL gambar tidak ditemukan dari respons upload.");

            }

        } catch (error) {

            console.error("Upload failed:", error);

            if (error instanceof ImageKitAbortError) toast.error("Upload dibatalkan.");

            else if (error instanceof ImageKitInvalidRequestError) toast.error(`Permintaan upload tidak valid: ${error.message}`);

            else if (error instanceof ImageKitUploadNetworkError) toast.error(`Kesalahan jaringan saat upload: ${error.message}`);

            else if (error instanceof ImageKitServerError) toast.error(`Kesalahan server ImageKit: ${error.message}`);

            else toast.error(`Gagal mengunggah gambar: ${error instanceof Error ? error.message : String(error)}`);

        } finally {

            setIsUploading(false);

            setProgress(0);

            if (fileInputRef.current) {

                fileInputRef.current.value = ""; // Bersihkan nilai input file 

            }

        }

    }, [fileToUpload, authenticator, onImageUrlChange, folderPath, fileNamePrefix, userId]);





    // Handler saat tombol "Batal" ditekan (mengembalikan ke gambar asli) 

    const handleCancel = useCallback(() => {

        if (previewUrl && previewUrl.startsWith('blob:')) {

            URL.revokeObjectURL(previewUrl); // Bersihkan URL objek lokal 

        }

        setFileToUpload(null);

        setPreviewUrl(currentImageUrl || null); // Kembali ke URL gambar asli 

        setProgress(0);

    }, [previewUrl, currentImageUrl]);



    // Handler saat tombol "Hapus" ditekan 

    const handleDelete = useCallback(async () => {

        // Panggil callback ke parent dengan null untuk menghapus gambar dari DB 

        await onImageUrlChange(null);

        setPreviewUrl(null); // Bersihkan preview lokal 

        setFileToUpload(null); // Bersihkan file yang menunggu upload 

        setProgress(0);

        if (fileInputRef.current) {

            fileInputRef.current.value = "";

        }

        toast.success("Gambar berhasil dihapus!");

    }, [onImageUrlChange]);



    // Render komponen gambar berdasarkan tipe (avatar, banner, general) 

    const renderImage = () => {

        const srcToDisplay = previewUrl || currentImageUrl || "/placeholder.svg"; // Fallback placeholder 



        if (type === "avatar") {

            return (

                <Avatar className="h-32 w-32 border-4 border-background">

                    <AvatarImage src={srcToDisplay} alt={imageAlt} className="object-cover" />

                    <AvatarFallback className="text-2xl">{imageAlt.slice(0, 2).toUpperCase()}</AvatarFallback>

                </Avatar>

            );

        } else if (type === "banner") {

            return (

                <div

                    className="h-48 w-full rounded-t-lg bg-gray-200 dark:bg-gray-700 bg-cover bg-center flex items-center justify-center text-muted-foreground"

                    style={{ backgroundImage: `url(${srcToDisplay})` }}

                >

                    {(!srcToDisplay || srcToDisplay === "/placeholder.svg") && (

                        <span className="text-sm">No Banner Image</span>

                    )}

                </div>

            );

        } else { // general type or others 

            return (

                <div

                    className={cn(

                        "relative w-full h-48 bg-muted flex items-center justify-center overflow-hidden rounded-md",

                    )}

                >

                    {srcToDisplay && srcToDisplay !== "/placeholder.svg" ? (

                        <img src={srcToDisplay} alt={imageAlt} className="object-cover w-full h-full" />

                    ) : (

                        <span className="text-sm text-muted-foreground">No Image</span>

                    )}

                </div>

            );

        }

    };



    // Tentukan apakah tombol Camera, Simpan, dan Batal harus ditampilkan 

    const showSaveCancelButtons = fileToUpload !== null;

    const showUploadButton = !showSaveCancelButtons;

    const showDeleteButton = (currentImageUrl || previewUrl) && !isUploading; // Tampilkan tombol hapus jika ada gambar 



    return (

        <div className="relative group w-full">

            {/* Input file tersembunyi */}

            <input

                type="file"

                ref={fileInputRef}

                onChange={handleFileSelect}

                accept="image/*"

                className="hidden"

                disabled={disabled || isUploading}

            />



            {/* Tampilan gambar (Avatar/Banner/General) */}

            {renderImage()}



            {/* Overlay untuk tombol Simpan/Batal/Hapus */}

            <div className={cn(

                "absolute top-4 right-4 flex gap-2 z-10",

                type === "avatar" ? "bottom-6 -right-36 top-auto translate-y-1/4 translate-x-1/4 opacity-90 group-hover:opacity-100" : "opacity-90 group-hover:opacity-100", // Posisi overlay berbeda untuk avatar 

                "transition-opacity"

            )}>

                {showSaveCancelButtons ? (

                    <>

                        <Button

                            type="button"

                            variant="default"

                            size="sm"

                            onClick={handleSave}

                            disabled={isUploading || disabled}

                            className="flex items-center gap-1 cursor-pointer"

                        >

                            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}

                            {isUploading ? `${Math.round(progress)}%` : "Simpan"}

                        </Button>

                        <Button

                            type="button"

                            variant="outline"

                            size="sm"

                            className="cursor-pointer"

                            onClick={handleCancel}

                            disabled={isUploading || disabled}

                        >

                            <X className="h-4 w-4" /> Batal

                        </Button>

                    </>

                ) : showDeleteButton && !disabled ? ( // Tampilkan Hapus jika ada gambar & tidak disable & tidak ada fileToUpload 

                    <Button

                        type="button"

                        variant="destructive"

                        size="sm"

                        onClick={handleDelete}

                        disabled={disabled}

                        className={cn(

                            "flex items-center gap-1 rounded-full cursor-pointer",

                            type === "avatar" ? "absolute -bottom-7 right-44 translate-y-1/4 -translate-x-1/4" : "absolute top-0 right-36 rounded-md" // Posisi hapus avatar 

                        )}

                    >

                        <Trash2 className="h-2 w-2" /> {type === "avatar" ? "" : "Hapus"}

                    </Button>

                ) : null}

            </div>



            {/* Tombol Kamera (untuk memicu pemilihan file) - hanya muncul jika tidak ada file yang menunggu disimpan */}

            {showUploadButton && !disabled && (

                <Button

                    type="button"

                    variant="secondary"

                    size="sm"

                    onClick={handleUploadButtonClick}

                    disabled={disabled || isUploading}

                    className={cn(

                        "absolute top-4 right-4 z-10 cursor-pointer", // Default position for banner and general 

                        type === "avatar" ? "bottom-2 right-1 top-auto rounded-full h-8 w-8 p-0" : "", // Specific position for avatar 

                        type === "banner" ? "top-4 right-4" : "", // Specific position for banner 

                        "opacity-90 group-hover:opacity-100 transition-opacity" // Hidden by default, show on group hover 

                    )}

                >

                    <Camera className={cn("h-4 w-4", type === "avatar" ? "" : "mr-2")} />

                    {type !== "avatar" && "Ubah Gambar"}

                </Button>

            )}

        </div>

    );

}



// /auth.ts 

import NextAuth from "next-auth";

import CredentialsProvider from "next-auth/providers/credentials";

import GoogleProvider from "next-auth/providers/google";

import GitHubProvider from "next-auth/providers/github";

import { compare } from "bcrypt";

import { login, loginWithGithub, loginWithGoogle } from "@/lib/firebase/service";

import type { User } from "@/types/types";

import type {

    Account,

    DefaultSession,

    Profile,

} from "@auth/core/types";



// Extend the NextAuth session types to include our custom user properties 

// dan secara eksplisit menghapus 'image' bawaan NextAuth 

declare module "next-auth" {

    interface Session {

        user: {

            id: string;

            username: string;

            email: string;

            role: "admin" | "user";

            loginType: "email" | "github" | "google";

            avatar: string; // Properti avatar kustom yang diinginkan 

            dailyTokens: number;

            maxDailyTokens: number;

            lastResetDate: string;

            totalUsage: number;

        } & Omit<DefaultSession["user"], "image" | "name">; // Hapus 'image' dan 'name' bawaan 

    }



    interface JWT {

        id: string;

        username: string;

        email: string;

        role: "admin" | "user";

        loginType: "email" | "github" | "google";

        avatar: string; // Properti avatar kustom yang diinginkan 

        dailyTokens: number;

        maxDailyTokens: number;

        lastResetDate: string;

        totalUsage: number;

        // Hapus properti 'image' bawaan dari JWT jika Anda tidak ingin menyimpannya sama sekali 

        // image?: string; // Jika Anda tetap ingin ada di JWT tapi tidak di session.user 

    }

}



// Helper to get today's date in YYYY-MM-DD format for token reset logic 

function getTodayDateString(): string {

    const today = new Date();

    const year = today.getFullYear();

    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    const day = today.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;

}





export const { handlers, auth, signIn, signOut } = NextAuth({

    providers: [

        CredentialsProvider({

            type: "credentials",

            name: "credentials",

            credentials: {

                email: { label: "Email", type: "email" },

                password: { label: "Password", type: "password" },

            },

            async authorize(credentials) {

                const { email, password } = credentials as {

                    email: string;

                    password: string;

                };

                const userFromDb = await login({ email });



                if (userFromDb && userFromDb.password) {

                    const passwordConfirm = await compare(password, userFromDb.password);

                    if (passwordConfirm) {

                        const { password, ...userWithoutPassword } = userFromDb;

                        return userWithoutPassword as User;

                    }

                }

                return null;

            }

        }),

        GoogleProvider({

            clientId: process.env.AUTH_GOOGLE_ID! as string,

            clientSecret: process.env.AUTH_GOOGLE_SECRET! as string,

            profile(profile: Record<string, any>) {

                return {

                    id: profile.sub,

                    email: profile.email,

                    name: profile.name,

                    image: profile.picture, // Google's profile picture URL 

                };

            },

        }),

        GitHubProvider({

            clientId: process.env.GITHUB_CLIENT_ID! as string,

            clientSecret: process.env.GITHUB_CLIENT_SECRET! as string,

            profile(profile: Record<string, any>) {

                return {

                    id: String(profile.id),

                    email: profile.email,

                    name: profile.name || profile.login,

                    image: profile.avatar_url, // GitHub's avatar URL 

                };

            },

        }),

    ],

    session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },

    secret: process.env.AUTH_SECRET,

    callbacks: {

        async jwt({ token, account, profile, user }) {

            let dbUser: User | null = null;



            if (account?.provider === "credentials") {

                if (user) {

                    dbUser = user as User;

                }

            } else if (account?.provider === "google") {

                const googleProfile = profile as Profile & { picture?: string };

                dbUser = await loginWithGoogle({

                    email: googleProfile.email!,

                    name: googleProfile.name,

                    image: googleProfile.picture || null,

                });



            } else if (account?.provider === "github") {

                const githubProfile = profile as Profile & { avatar_url?: string };

                const userEmail = githubProfile.email || `${githubProfile.name?.replace(/\s/g, '').toLowerCase() || Math.random().toString(36).substring(7)}@github.com`;



                dbUser = await loginWithGithub({

                    email: userEmail,

                    name: githubProfile.name,

                    image: githubProfile.avatar_url || null,

                });

            } else if (token.email) {

                const userFromDb = await login({ email: token.email as string });

                if (userFromDb) {

                    dbUser = userFromDb as User;

                }

            }



            if (dbUser) {

                token.id = dbUser.id;

                token.username = dbUser.username;

                token.email = dbUser.email;

                token.role = dbUser.role;

                token.loginType = dbUser.loginType;

                token.avatar = dbUser.avatar; // Ini adalah properti avatar kustom kita 

                // Hapus properti 'image' bawaan NextAuth dari JWT jika ada 

                // Ini penting jika 'image' di token masih muncul meskipun Anda tidak menyetelnya. 

                delete token.image; // <--- Hapus properti 'image' di sini 



                token.dailyTokens = dbUser.dailyTokens;

                token.maxDailyTokens = dbUser.maxDailyTokens;

                token.lastResetDate = dbUser.lastResetDate;

                token.totalUsage = dbUser.totalUsage;

            }

            return token;

        },

        async session({ session, token }) {

            if (session.user && token) {

                session.user.id = token.id as string;

                session.user.username = token.username as string;

                session.user.email = token.email as string;

                session.user.role = token.role as "admin" | "user";

                session.user.loginType = token.loginType as "email" | "github" | "google";

                session.user.avatar = token.avatar as string; // Gunakan properti avatar kustom dari token 

                // Hapus properti 'image' dan 'name' bawaan dari session.user 

                // Karena kita sudah mendefinisikan 'username' dan 'avatar' secara eksplisit 

                // dan ingin mereka menjadi satu-satunya sumber kebenaran. 

                // Property 'name' juga bawaan NextAuth, bisa dihapus jika 'username' sudah cukup. 

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment 

                // @ts-ignore 

                delete session.user.image; // <--- Hapus properti 'image' di sini 

                // eslint-disable-next-line @typescript-eslint/ban-ts-comment 

                // @ts-ignore 

                delete session.user.name; // <--- Hapus properti 'name' bawaan jika Anda hanya ingin 'username' 



                session.user.dailyTokens = token.dailyTokens as number;

                session.user.maxDailyTokens = token.maxDailyTokens as number;

                session.user.lastResetDate = token.lastResetDate as string;

                session.user.totalUsage = token.totalUsage as number;



                const todayDate = getTodayDateString();

                if (session.user.lastResetDate !== todayDate) {

                    session.user.dailyTokens = session.user.maxDailyTokens;

                    session.user.lastResetDate = todayDate;

                }

            }

            return session;

        }

    },

    pages: {

        signIn: "/login"

    }

});



// /lib/firebase/firebase-client.ts 



// Import the functions you need from the SDKs you need 

import { getApp, getApps, initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore"

// TODO: Add SDKs for Firebase products that you want to use 

// https://firebase.google.com/docs/web/setup#available-libraries 



// Your web app's Firebase configuration 

const firebaseConfig = {

    apiKey: process.env.NEXT_PUBLIC_API_KEY as string,

    authDomain: process.env.NEXT_PUBLIC_AUTH_DOMAIN as string,

    databaseURL: process.env.NEXT_PUBLIC_DATABASE_URL as string,

    projectId: process.env.NEXT_PUBLIC_PROJECT_ID as string,

    storageBucket: process.env.NEXT_PUBLIC_STORAGE_BUCKET as string,

    messagingSenderId: process.env.NEXT_PUBLIC_MESSAGING_SENDER_ID as string,

    appId: process.env.NEXT_PUBLIC_APP_ID as string,

};



// Initialize Firebase 

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const clientDb = getFirestore(app);



export { clientDb };



// /lib/firebase/service.ts 

import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";

import { clientDb } from "./firebase-client";

import bcrypt from "bcrypt";

import type { User } from "@/types/types"; // Sesuaikan path jika berbeda 



// Constants for default user data 

const DEFAULT_MAX_DAILY_TOKENS = 10; // Contoh nilai default 

const DEFAULT_BIO = "Halo! Saya pengguna baru DailyCheckIt.";

const DEFAULT_AVATAR_URL = ""; // Atau "/placeholder.svg" jika Anda menggunakannya sebagai default di DB 



// Helper function to get today's date in YYYY-MM-DD format 

function getTodayDateString(): string {

    const today = new Date();

    const year = today.getFullYear();

    const month = (today.getMonth() + 1).toString().padStart(2, '0');

    const day = today.getDate().toString().padStart(2, '0');

    return `${year}-${month}-${day}`;

}



export async function getRetriveData(collectionName: string) {

    const snapshot = await getDocs(collection(clientDb, collectionName));

    const data = snapshot.docs.map((doc) => ({

        id: doc.id,

        ...doc.data(),

    })) as User[];

    return data;

}



export async function retriveDataById(collectionName: string, id: string) {

    const snapshot = await getDoc(doc(clientDb, collectionName, id));

    if (snapshot.exists()) {

        return { id: snapshot.id, ...snapshot.data() } as User;

    }

    return null;

}



export async function register(

    data: {

        username: string;

        email: string;

        password: string;

    }

) {

    const usersCollectionRef = collection(clientDb, "users");

    const q = query(usersCollectionRef, where("email", "==", data.email));

    const snapshot = await getDocs(q);



    if (!snapshot.empty) {

        return { status: false, statusCode: 400, message: "Email sudah terdaftar." };

    }



    const hashedPassword = await bcrypt.hash(data.password, 10);

    const now = new Date().toISOString();

    const todayDate = getTodayDateString();



    const newUser: Omit<User, 'id'> = {

        username: data.username,

        email: data.email,

        role: "user",

        loginType: "email",

        avatar: DEFAULT_AVATAR_URL, // Default avatar kosong untuk registrasi email 

        bio: DEFAULT_BIO,

        banner: "",

        location: "",

        phone: "",

        website: "",

        github: "",

        twitter: "",

        linkedin: "",

        instagram: "",

        createdAt: now,

        updatedAt: now,

        lastLogin: now,

        dailyTokens: DEFAULT_MAX_DAILY_TOKENS,

        maxDailyTokens: DEFAULT_MAX_DAILY_TOKENS,

        lastResetDate: todayDate,

        totalUsage: 0,

        password: hashedPassword,

    };



    try {

        await addDoc(usersCollectionRef, newUser);

        return { status: true, statusCode: 201, message: "Pendaftaran berhasil!" };

    } catch (error) {

        console.error("Firebase registration error:", error);

        return { status: false, statusCode: 500, message: "Pendaftaran gagal. Silakan coba lagi." };

    }

}



export async function login(data: { email: string }): Promise<User & { password?: string } | null> {

    const usersCollectionRef = collection(clientDb, "users");

    const q = query(usersCollectionRef, where("email", "==", data.email));

    const snapshot = await getDocs(q);



    if (snapshot.empty) {

        return null; // User not found 

    }



    const userDoc = snapshot.docs[0];

    const userData = userDoc.data();



    return { id: userDoc.id, ...userData } as User & { password?: string };

}



// Fungsi utama untuk menangani login OAuth (Google, GitHub) 

async function handleOAuthLogin(email: string, name: string, loginType: User['loginType'], avatarUrl: string | null | undefined): Promise<User> {

    const usersCollectionRef = collection(clientDb, "users");

    const q = query(usersCollectionRef, where("email", "==", email));

    const snapshot = await getDocs(q);

    const now = new Date().toISOString();

    const todayDate = getTodayDateString();



    let user: User;



    if (!snapshot.empty) {

        // Pengguna sudah ada, perbarui datanya 

        const userDoc = snapshot.docs[0];

        const existingData = userDoc.data() as User;



        const updateData: Partial<User> = {

            username: name || existingData.username, // Gunakan nama baru jika tersedia 

            lastLogin: now,

            updatedAt: now,

            loginType: loginType, // Perbarui tipe login jika mungkin berbeda 

        };



        // --- PERBAIKAN LOGIKA AVATAR DI SINI --- 

        // Hanya perbarui avatar jika: 

        // 1. Avatar yang ada di DB adalah URL default kita (misalnya, string kosong). 

        // 2. Atau, jika avatar yang ada di DB sama persis dengan avatar dari penyedia OAuth. 

        // Ini mencegah penimpaan avatar kustom yang diunggah pengguna. 

        const isExistingAvatarDefault = existingData.avatar === DEFAULT_AVATAR_URL;

        const isExistingAvatarFromProvider = existingData.avatar === avatarUrl; // Cek jika avatar yang ada sama dengan yang dari provider 



        if (avatarUrl !== undefined && (isExistingAvatarDefault || isExistingAvatarFromProvider)) {

            // Jika avatarUrl disediakan Oauth DAN (avatar di DB default ATAU sama dengan yang dari provider) 

            updateData.avatar = avatarUrl || DEFAULT_AVATAR_URL; // Timpa dengan yang dari provider (atau default kosong jika null) 

        }

        // Jika avatarUrl adalah undefined, atau jika avatar yang ada di DB BUKAN default DAN BUKAN dari provider yang sama, 

        // maka kita tidak akan menimpa avatar di DB. 

        // --- AKHIR PERBAIKAN LOGIKA AVATAR --- 





        // Tangani reset token harian jika hari sudah berganti 

        if (existingData.lastResetDate !== todayDate) {

            updateData.dailyTokens = existingData.maxDailyTokens || DEFAULT_MAX_DAILY_TOKENS;

            updateData.lastResetDate = todayDate;

        }



        await updateDoc(doc(clientDb, "users", userDoc.id), updateData);

        user = { ...existingData, ...updateData };

    } else {

        // Pengguna baru, buat profil baru 

        const newUser: Omit<User, 'id'> = {

            username: name,

            email: email,

            role: "user",

            loginType: loginType,

            avatar: avatarUrl || DEFAULT_AVATAR_URL, // Gunakan avatar dari penyedia atau default kosong 

            bio: DEFAULT_BIO,

            banner: "",

            location: "",

            phone: "",

            website: "",

            github: "",

            twitter: "",

            linkedin: "",

            instagram: "",

            createdAt: now,

            updatedAt: now,

            lastLogin: now,

            dailyTokens: DEFAULT_MAX_DAILY_TOKENS,

            maxDailyTokens: DEFAULT_MAX_DAILY_TOKENS,

            lastResetDate: todayDate,

            totalUsage: 0,

        };

        const docRef = await addDoc(usersCollectionRef, newUser);

        user = { id: docRef.id, ...newUser };

    }

    return user;

}



export async function loginWithGoogle(data: { email: string; name?: string | null; image?: string | null }): Promise<User> {

    return handleOAuthLogin(data.email, data.name || data.email.split('@')[0], "google", data.image);

}



export async function loginWithGithub(data: { email: string; name?: string | null; image?: string | null }): Promise<User> {

    const userEmail = data.email || `${data.name?.replace(/\s/g, '').toLowerCase() || Math.random().toString(36).substring(7)}@github.com`;

    return handleOAuthLogin(userEmail, data.name || userEmail.split('@')[0], "github", data.image);

}



export async function updateUserTokens(userId: string, tokensUsed: number): Promise<{ status: boolean; message?: string }> {

    const userDocRef = doc(clientDb, "users", userId);

    const userDoc = await getDoc(userDocRef);



    if (!userDoc.exists()) {

        return { status: false, message: "Pengguna tidak ditemukan." };

    }



    const userData = userDoc.data() as User;

    const todayDate = getTodayDateString();



    let currentDailyTokens = userData.dailyTokens;

    let currentTotalUsage = userData.totalUsage;

    let lastResetDate = userData.lastResetDate;



    if (lastResetDate !== todayDate) {

        currentDailyTokens = userData.maxDailyTokens || DEFAULT_MAX_DAILY_TOKENS;

        lastResetDate = todayDate;

    }



    if (currentDailyTokens < tokensUsed) {

        return { status: false, message: "Token harian tidak mencukupi." };

    }



    currentDailyTokens -= tokensUsed;

    currentTotalUsage += tokensUsed;



    try {

        await updateDoc(userDocRef, {

            dailyTokens: currentDailyTokens,

            totalUsage: currentTotalUsage,

            lastResetDate: lastResetDate,

            updatedAt: new Date().toISOString(),

        });

        return { status: true, message: "Token berhasil diperbarui." };

    } catch (error) {

        console.error("Error updating user tokens:", error);

        return { status: false, message: "Gagal memperbarui token." };

    }

}



export async function updateUserProfile(userId: string, updatedFields: Partial<User>): Promise<{ status: boolean; message?: string }> {

    const userDocRef = doc(clientDb, "users", userId);

    try {

        const { ...fieldsToUpdate } = updatedFields;



        await updateDoc(userDocRef, {

            ...fieldsToUpdate,

            updatedAt: new Date().toISOString(),

        });

        return { status: true, message: "Profil berhasil diperbarui." };

    } catch (error) {

        console.error("Error updating user profile:", error);

        return { status: false, message: "Gagal memperbarui profil." };

    }

}

// /app/notifications/page.tsx 
"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Bell, Check, Trash2, CheckCheck, X, MessageSquare, Settings, AtSign, ThumbsUp } from "lucide-react"; // Hapus AlertCircle, ThumbsUp 
import { useRouter } from "next/navigation";

// --- Interface Notifikasi & Tipe Terkait (Semua di satu file) --- 
export type NotificationType =
    "forum_comment_on_post" | // Seseorang berkomentar di postingan Anda 
    "forum_reply_to_comment" | // Seseorang membalas komentar Anda 
    "forum_like_post" |      // Seseorang menyukai postingan Anda 
    "forum_mention" |         // Seseorang me-mention Anda 
    "system";                 // Notifikasi sistem (misal: pembaruan) 

export interface Notification {
    id: string;
    type: NotificationType; // Menggunakan tipe yang disederhanakan 
    title: string;
    message: string; // Pesan ringkas notifikasi 
    read: boolean;
    createdAt: string; // ISO string 

    // --- Fields khusus untuk notifikasi forum --- 
    link?: string; // URL relatif (e.g., /forum/post-id#comment-id) 
    actorId?: string; // ID pengguna yang melakukan aksi 
    actorUsername?: string; // Username pengguna yang melakukan aksi 
    postId?: string; // ID postingan forum terkait 
    postTitle?: string; // Judul postingan forum terkait (opsional) 
    commentId?: string; // ID komentar terkait 
    commentContentPreview?: string; // Preview singkat konten komentar (opsional) 
}

// --- Mock Data Notifikasi yang Diperbarui (sesuai tipe baru) --- 
const mockNotifications: Notification[] = [
    {
        id: "3",
        type: "forum_comment_on_post",
        title: "Komentar Baru",
        message: "Pengguna 'budi_hartono' berkomentar pada postingan Anda.",
        actorId: "user123",
        actorUsername: "budi_hartono",
        postId: "post123",
        postTitle: "Laptop Sering Overheat, Solusi?",
        commentId: "comment456",
        commentContentPreview: "Coba cek kipasnya, bersihkan debu.",
        read: false,
        createdAt: "2024-07-16T12:30:00Z", // Baru saja 
        link: "/forum/post123#comment456",
    },
    {
        id: "4",
        type: "forum_reply_to_comment",
        title: "Balasan Komentar Anda",
        message: "Pengguna 'siti_dewi' membalas komentar Anda di postingan 'Monitor Bergaris'.",
        actorId: "user456",
        actorUsername: "siti_dewi",
        postId: "post789",
        postTitle: "Monitor Bergaris, Perlu Ganti?",
        commentId: "reply101",
        commentContentPreview: "Terima kasih atas sarannya, saya akan coba.",
        read: false,
        createdAt: "2024-07-16T10:00:00Z", // Beberapa jam lalu 
        link: "/forum/post789#reply101",
    },
    {
        id: "5",
        type: "forum_like_post",
        title: "Postingan Disukai",
        message: "Pengguna 'agus_santoso' menyukai postingan Anda: 'Tips Membersihkan Komputer'.",
        actorId: "user789",
        actorUsername: "agus_santoso",
        postId: "postabc",
        postTitle: "Tips Membersihkan Komputer",
        read: false,
        createdAt: "2024-07-15T18:00:00Z", // Kemarin 
        link: "/forum/postabc",
    },
    {
        id: "6",
        type: "forum_mention",
        title: "Anda Disebutkan!",
        message: "Pengguna 'dian_lestari' menyebut Anda dalam komentar di postingan 'Rekomendasi Software Desain'.",
        actorId: "user000",
        actorUsername: "dian_lestari",
        postId: "postxyz",
        postTitle: "Rekomendasi Software Desain",
        commentId: "comment999",
        commentContentPreview: "@NamaAnda, apakah Anda punya pengalaman dengan Figma?",
        read: false,
        createdAt: "2024-07-14T09:00:00Z", // Dua hari lalu 
        link: "/forum/postxyz#comment999",
    },
    {
        id: "7",
        type: "system",
        title: "Pembaruan Sistem",
        message: "Sistem telah diperbarui dengan fitur keamanan baru.",
        read: true,
        createdAt: "2024-07-13T09:00:00Z", // Tiga hari lalu 
    },
    {
        id: "8",
        type: "forum_comment_on_post",
        title: "Komentar Baru Lainnya",
        message: "Pengguna 'test_user' berkomentar di postingan Anda 'Mencari Driver VGA Lawas'.",
        actorId: "testuser",
        actorUsername: "test_user",
        postId: "postdriver",
        postTitle: "Mencari Driver VGA Lawas",
        commentId: "commentdriver",
        commentContentPreview: "Coba cari di website resmi produsen kartu grafis.",
        read: true,
        createdAt: "2024-07-12T15:00:00Z", // 4 hari lalu 
        link: "/forum/postdriver#commentdriver",
    },
];

// --- Fungsi untuk mendapatkan ikon notifikasi --- 
const getNotificationIcon = (type: NotificationType) => {
    switch (type) {
        case "forum_comment_on_post":
        case "forum_reply_to_comment":
            return <MessageSquare className="h-4 w-4" />;
        case "forum_like_post":
            return <ThumbsUp className="h-4 w-4" />; // Icon untuk like post 
        case "forum_mention":
            return <AtSign className="h-4 w-4" />; // Icon untuk mention 
        case "system":
            return <Settings className="h-4 w-4" />;
        default:
            return <Bell className="h-4 w-4" />;
    }
};

// --- Fungsi untuk mendapatkan warna ikon notifikasi --- 
const getNotificationColor = (type: NotificationType): string => {
    switch (type) {
        case "forum_comment_on_post":
        case "forum_reply_to_comment":
        case "forum_mention":
            return "bg-purple-500";
        case "forum_like_post":
            return "bg-pink-500";
        case "system":
            return "bg-orange-500";
        default:
            return "bg-blue-500";
    }
};

export default function NotificationsPage() {
    // TODO: Ganti mockNotifications dengan fetching dari API sesuai user ID yang login 
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const [activeTab, setActiveTab] = useState<"all" | "unread" | "read">("all"); // Perbaiki tipe useState 

    const router = useRouter(); // Inisialisasi useRouter 

    const unreadCount = notifications.filter((n) => !n.read).length;
    const readCount = notifications.filter((n) => n.read).length;

    const filteredNotifications = notifications.filter((notification) => {
        if (activeTab === "unread") return !notification.read;
        if (activeTab === "read") return notification.read;
        return true;
    });

    // --- Action Handlers --- 

    // Menandai notifikasi sebagai sudah dibaca 
    const markAsRead = useCallback((id: string) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
        toast.success("Notifikasi ditandai sebagai sudah dibaca");
        // TODO: Panggil API untuk update status read di backend (misal: /api/notifications/[id]/mark-read) 
    }, []);

    // Menandai semua notifikasi sebagai sudah dibaca 
    const markAllAsRead = useCallback(() => {
        toast("Tandai Semua Sebagai Dibaca", {
            description: "Apakah Anda yakin ingin menandai semua notifikasi sebagai sudah dibaca?",
            action: {
                label: "Konfirmasi",
                onClick: () => {
                    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
                    toast.success("Semua notifikasi ditandai sebagai sudah dibaca");
                    // TODO: Panggil API untuk update status read semua notifikasi di backend (misal: /api/notifications/mark-all-read) 
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        });
    }, []);

    // Menghapus notifikasi individu 
    const deleteNotification = useCallback((id: string) => {
        const notificationToDelete = notifications.find((n) => n.id === id);
        if (!notificationToDelete) return;

        toast("Hapus Notifikasi", {
            description: "Apakah Anda yakin ingin menghapus notifikasi ini?",
            action: {
                label: "Hapus",
                onClick: () => {
                    setNotifications((prev) => prev.filter((n) => n.id !== id));
                    toast.success("Notifikasi berhasil dihapus");
                    // TODO: Panggil API untuk menghapus notifikasi di backend (misal: /api/notifications/[id]) 
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        });
    }, [notifications]); // notifications sebagai dependensi untuk memastikan notif yang dihapus benar 

    // Menghapus semua notifikasi 
    const clearAllNotifications = useCallback(() => {
        toast("Hapus Semua Notifikasi", {
            description: "Apakah Anda yakin ingin menghapus semua notifikasi? Tindakan ini tidak dapat dibatalkan.",
            action: {
                label: "Hapus Semua",
                onClick: () => {
                    setNotifications([]);
                    toast.success("Semua notifikasi berhasil dihapus");
                    // TODO: Panggil API untuk menghapus semua notifikasi di backend (misal: /api/notifications/clear-all) 
                },
            },
            cancel: {
                label: "Batal",
                onClick: () => toast.dismiss(),
            },
        });
    }, []);

    // Fungsi untuk memformat tanggal (tetap sama) 
    const formatDate = useCallback((dateString: string): string => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

        if (diffInHours < 1) return "Baru saja";
        if (diffInHours < 24) return `${diffInHours} jam yang lalu`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} hari yang lalu`;

        return date.toLocaleDateString("id-ID", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    }, []);

    // --- Handler saat notifikasi diklik --- 
    const handleNotificationClick = useCallback((notification: Notification) => {
        // Tandai sebagai dibaca saat diklik 
        if (!notification.read) {
            markAsRead(notification.id);
        }

        // Arahkan pengguna berdasarkan tipe notifikasi dan link 
        if (notification.link) {
            router.push(notification.link);
        } else if (notification.type === "forum_comment_on_post" && notification.postId) {
            router.push(`/forum/${notification.postId}${notification.commentId ? `#comment-${notification.commentId}` : ''}`); // Pastikan ID komentar unik 
        } else if (notification.type === "forum_reply_to_comment" && notification.postId && notification.commentId) {
            router.push(`/forum/${notification.postId}#comment-${notification.commentId}`);
        } else if (notification.type === "forum_like_post" && notification.postId) {
            router.push(`/forum/${notification.postId}`);
        } else if (notification.type === "forum_mention" && notification.postId) {
            router.push(`/forum/${notification.postId}${notification.commentId ? `#comment-${notification.commentId}` : ''}`);
        }
        else {
            toast.info("Tidak ada tautan untuk notifikasi ini.");
        }
    }, [router, markAsRead]);

    return (
        <div className="mx-2 md:mx-4 py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Notifikasi</h1>
                    <p className="text-muted-foreground">Kelola notifikasi dan pemberitahuan Anda</p>
                </div>
                <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                        <Button onClick={markAllAsRead} variant="outline" size="sm">
                            <CheckCheck className="h-4 w-4 mr-2" />
                            Tandai Semua Dibaca
                        </Button>
                    )}
                    {notifications.length > 0 && (
                        <Button onClick={clearAllNotifications} variant="outline" size="sm">
                            <Trash2 className="h-4 w-4 mr-2" />
                            Hapus Semua
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notifikasi
                        {unreadCount > 0 && <Badge variant="destructive">{unreadCount}</Badge>}
                    </CardTitle>
                    <CardDescription>
                        {notifications.length === 0 ? "Tidak ada notifikasi" : `${notifications.length} total notifikasi`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="all">Semua ({notifications.length})</TabsTrigger>
                            <TabsTrigger value="unread">Belum Dibaca ({unreadCount})</TabsTrigger>
                            <TabsTrigger value="read">Sudah Dibaca ({readCount})</TabsTrigger>
                        </TabsList>

                        <TabsContent value={activeTab} className="mt-6">
                            {filteredNotifications.length === 0 ? (
                                <div className="text-center py-12">
                                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                    <h3 className="text-lg font-medium mb-2">Tidak ada notifikasi</h3>
                                    <p className="text-muted-foreground">
                                        {activeTab === "unread"
                                            ? "Semua notifikasi sudah dibaca"
                                            : activeTab === "read"
                                                ? "Belum ada notifikasi yang dibaca"
                                                : "Belum ada notifikasi untuk ditampilkan"}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`flex items-start space-x-4 p-4 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${!notification.read ? "bg-muted/50 border-primary/20" : "bg-background"}`}
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <div className={`p-2 rounded-full text-white ${getNotificationColor(notification.type)}`}>
                                                {getNotificationIcon(notification.type)}
                                            </div>

                                            <div className="flex-1 space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-medium flex items-center gap-2">
                                                        {notification.title}
                                                        {!notification.read && <div className="h-2 w-2 bg-primary rounded-full" />}
                                                    </h4>
                                                    <div className="flex items-center space-x-2">
                                                        {!notification.read && (
                                                            <Button onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                        <Button onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }} variant="ghost" size="sm" className="h-7 w-7 p-0">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {notification.message}
                                                    {(notification.type === "forum_comment_on_post" ||
                                                        notification.type === "forum_reply_to_comment" ||
                                                        notification.type === "forum_mention") &&
                                                        notification.commentContentPreview && (
                                                            <span className="ml-1 italic">{notification.commentContentPreview}</span>
                                                        )}
                                                </p>
                                                <p className="text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}

// app/forum/bookmarks/page.tsx 
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Bookmark,
    Search,
    MoreHorizontal,
    Trash2,
    ExternalLink,
    Share2,
    Copy,
    ArrowLeft,
    Heart,
    MessageSquare,
    CheckCircle,
    ImageIcon, // Gunakan ImageIcon dari lucide-react 
    Calendar,
    BookmarkX,
    Grid3X3,
    List,
    LucideIcon, // Impor LucideIcon untuk tipe ikon 
} from "lucide-react";
import { toast } from "sonner";
import Image from "next/image"; // Impor komponen Image dari Next.js 

// Import date-fns 
import { formatDistanceToNowStrict } from 'date-fns';
import { id } from 'date-fns/locale'; // Impor locale Bahasa Indonesia 

// Asumsi `cn` utility tersedia dari shadcn/ui atau diimplementasikan secara lokal 
const cn = (...classNames: (string | undefined)[]) => classNames.filter(Boolean).join(' ');

// --- Definisi Tipe Internal (Semua dalam satu file) --- 

// Tipe untuk representasi file media yang diunggah 
interface ForumMedia {
    id?: string;
    type: "image" | "video" | "document";
    filename: string;
    size: number;
    url: string; // URL publik dari media yang diunggah 
    thumbnailUrl?: string;
}

// Tipe untuk Post Forum 
interface ForumPost {
    id: string;
    title: string;
    description: string;
    content: string;
    author: string;
    authorId: string;
    avatar: string; // URL avatar pengguna (sekarang placeholder lokal) 
    category: string; // Harus sesuai dengan CategoryType 
    type: string;
    tags: string[];
    timestamp: string; // ISO 8601 string 
    likes: number;
    likedBy: string[];
    replies: number;
    views: number;
    isResolved: boolean;
    solutionId?: string;
    isPinned: boolean;
    isArchived: boolean;
    thumbnail?: string; // URL thumbnail (sekarang placeholder lokal) 
    media?: ForumMedia[];
}

// Tipe untuk Balasan/Komentar Forum (minimal untuk referensi jika dibutuhkan) 
interface ForumReply {
    id: string;
    content: string;
    author: string;
    authorId: string;
    avatar: string;
    createdAt: string;
    upvotes: number;
    downvotes: number;
    upvotedBy?: string[];
    downvotedBy?: string[];
    parentId?: string;
    mentions?: string[];
    isSolution?: boolean;
    reactions?: { [key: string]: string[] };
    media?: ForumMedia[];
    isEdited?: boolean;
    editedAt?: string;
}

// Tipe data kategori forum 
type CategoryType =
    | "Hardware"
    | "Software"
    | "Network"
    | "Gaming"
    | "Diagnosa"
    | "Lainnya"
    | "all"; // Tambahkan 'all' untuk filter 

// Definisi untuk objek kategori (seperti dari data/forum-categories.json) 
interface ForumCategory {
    id: string; // Menggunakan 'id' sebagai nilai unik 
    name: string; // Nama tampilan 
    description?: string; // Deskripsi opsional 
    color?: string; // Warna opsional (misal: Tailwind CSS class) 
    icon?: string; // Nama ikon Lucide (e.g., "Monitor", "Cpu") 
}

// Mapping ikon untuk kategori (menggunakan string key yang bisa di-map ke LucideIcon) 
// Ini adalah simulasi dari apa yang biasanya diimpor dari file utilitas. 
const categoryIconsMap: Record<string, LucideIcon> = {
    Hardware: ImageIcon, // Contoh: Anda bisa menggantinya dengan Monitor, Cpu, dll. 
    Software: ImageIcon,
    Network: ImageIcon,
    Gaming: ImageIcon,
    Diagnosa: ImageIcon,
    Lainnya: ImageIcon,
    all: ImageIcon, // Default untuk 'all' 
};

// Fungsi helper untuk mendapatkan ikon kategori (simulasi dari lib/utils/forum) 
const getCategoryIcon = (categoryId: string): LucideIcon => {
    return categoryIconsMap[categoryId] || ImageIcon; // Fallback ke ImageIcon 
};

// Kelas gradient untuk styling visual (diambil dari lib/utils/forum) 
const gradientClasses = [
    "bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500",
    "bg-gradient-to-br from-green-400 via-blue-500 to-purple-600",
    "bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500",
    "bg-gradient-to-br from-purple-400 via-pink-500 to-red-500",
    "bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500",
    "bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600",
];

// Tipe khusus untuk post yang di-bookmark 
interface BookmarkedPost extends ForumPost {
    bookmarkedAt: string; // Waktu saat post di-bookmark 
    bookmarkNote?: string; // Catatan opsional untuk bookmark 
}

// --- Data Dummy (Static) --- 
// Contoh data post forum dummy dengan URL gambar lokal placeholder 
const dummyForumPostsData: ForumPost[] = [
    {
        id: "post1",
        title: "Cara Memperbaiki Koneksi Wi-Fi yang Lambat",
        description: "Panduan langkah demi langkah untuk mengatasi masalah kecepatan Wi-Fi.",
        content: "Detail lengkap tentang diagnosa dan perbaikan Wi-Fi.",
        author: "TeknisiJago",
        authorId: "user123",
        avatar: "/placeholder.svg", // Placeholder lokal 
        category: "Network",
        type: "tutorial",
        tags: ["wifi", "jaringan", "troubleshooting"],
        timestamp: "2025-07-20T10:00:00Z",
        likes: 25,
        likedBy: ["user456", "user789"],
        replies: 10,
        views: 1200,
        isResolved: false,
        isPinned: false,
        isArchived: false,
        thumbnail: "/placeholder.svg", // Placeholder lokal 
        media: [
            { id: "media1", type: "image", filename: "wifi-step1.jpg", size: 100000, url: "/placeholder.svg" } // Placeholder lokal 
        ]
    },
    {
        id: "post2",
        title: "Perbandingan Terbaru CPU Intel vs AMD untuk Gaming 2025",
        description: "Analisis mendalam CPU terbaik untuk pengalaman gaming.",
        content: "Detail perbandingan performa, harga, dan fitur.",
        author: "GamingPro",
        authorId: "user456",
        avatar: "/placeholder.svg",
        category: "Hardware",
        type: "review",
        tags: ["cpu", "gaming", "intel", "amd"],
        timestamp: "2025-07-18T14:30:00Z",
        likes: 88,
        likedBy: ["user123", "user789", "user001"],
        replies: 35,
        views: 5500,
        isResolved: false,
        isPinned: false,
        isArchived: false,
        thumbnail: "/placeholder.svg",
        media: [
            { id: "media2", type: "image", filename: "cpu-graph.png", size: 200000, url: "/placeholder.svg" }
        ]
    },
    {
        id: "post3",
        title: "Pertanyaan: Laptop sering Blue Screen, ini lognya",
        description: "Minta bantuan diagnosa BSOD pada laptop baru saya.",
        content: "Setelah update Windows, laptop saya sering BSOD. Ini screenshot log error.",
        author: "MisteriKomputer",
        authorId: "user789",
        avatar: "/placeholder.svg",
        category: "Diagnosa",
        type: "pertanyaan",
        tags: ["windows", "bsod", "error"],
        timestamp: "2025-07-15T08:00:00Z",
        likes: 12,
        likedBy: ["user123"],
        replies: 5,
        views: 800,
        isResolved: true,
        solutionId: "reply101",
        isPinned: false,
        isArchived: false,
        thumbnail: "/placeholder.svg",
    },
    {
        id: "post4",
        title: "Pengalaman Menggunakan Linux untuk Pengembangan Web",
        description: "Berbagi pengalaman migrasi ke Linux dari Windows untuk coding.",
        content: "Tantangan dan keuntungan beralih ke lingkungan pengembangan berbasis Linux.",
        author: "KodeSantuy",
        authorId: "user001",
        avatar: "/placeholder.svg",
        category: "Software",
        type: "pengalaman",
        tags: ["linux", "webdev", "pengembangan"],
        timestamp: "2025-07-10T11:00:00Z",
        likes: 45,
        likedBy: ["user123", "user456", "user789", "user002"],
        replies: 20,
        views: 2500,
        isResolved: false,
        isPinned: false,
        isArchived: false,
        thumbnail: "/placeholder.svg",
    },
    {
        id: "post5",
        title: "Tutorial: Mengoptimalkan Performa SSD Anda",
        description: "Tips dan trik untuk menjaga SSD tetap cepat dan awet.",
        content: "Panduan untuk TRIM, over-provisioning, dan hal lainnya.",
        author: "PakarPenyimpanan",
        authorId: "user002",
        avatar: "/placeholder.svg",
        category: "Hardware",
        type: "tutorial",
        tags: ["ssd", "optimasi", "penyimpanan"],
        timestamp: "2025-07-01T09:00:00Z",
        likes: 30,
        likedBy: ["user456"],
        replies: 8,
        views: 1800,
        isResolved: false,
        isPinned: false,
        isArchived: false,
        thumbnail: "/placeholder.svg",
    },
    {
        id: "post6",
        title: "Merakit PC Gaming Low Budget Tapi High Performance",
        description: "Panduan lengkap merakit PC gaming dengan budget terbatas namun performa maksimal.",
        content: "Memilih komponen, perakitan, dan tips optimasi untuk PC gaming hemat.",
        author: "BudgetGamer",
        authorId: "user100",
        avatar: "/placeholder.svg",
        category: "Hardware",
        type: "tutorial",
        tags: ["pc-rakitan", "gaming", "budget"],
        timestamp: "2025-06-25T16:00:00Z",
        likes: 70,
        likedBy: ["user123", "user456", "user789", "user001", "user002"],
        replies: 40,
        views: 7000,
        isResolved: false,
        isPinned: true,
        isArchived: false,
        thumbnail: "/placeholder.svg",
    },
    {
        id: "post7",
        title: "Tips Produktivitas Menggunakan WSL2 di Windows",
        description: "Integrasi Linux di Windows untuk alur kerja pengembangan yang lebih efisien.",
        content: "Cara setup WSL2, integrasi VS Code, dan tips umum.",
        author: "DevOpsBuddy",
        authorId: "user101",
        avatar: "/placeholder.svg",
        category: "Software",
        type: "tips",
        tags: ["wsl2", "windows", "linux", "devops"],
        timestamp: "2025-06-20T09:00:00Z",
        likes: 55,
        likedBy: ["user001", "user123"],
        replies: 15,
        views: 3000,
        isResolved: false,
        isPinned: false,
        isArchived: false,
        thumbnail: "/placeholder.svg",
    },
];

// Kategori forum statis (simulasi dari data/forum-categories.json) 
const FORUM_CATEGORIES_STATIC: ForumCategory[] = [
    { id: "Hardware", name: "Hardware", description: "Diskusi seputar komponen fisik komputer." },
    { id: "Software", name: "Software", description: "Pembahasan tentang aplikasi, sistem operasi, dan programming." },
    { id: "Network", name: "Network", description: "Masalah dan solusi terkait jaringan komputer dan internet." },
    { id: "Gaming", name: "Gaming", description: "Diskusi tentang game, hardware gaming, dan komunitas gamer." },
    { id: "Diagnosa", name: "Diagnosa", description: "Bantuan dan solusi untuk masalah teknis atau error sistem." },
    { id: "Lainnya", name: "Lainnya", description: "Topik lain yang tidak termasuk kategori di atas." },
];

// --- Helper Functions (Diambil dari lib/utils/forum dan di-inline di sini) --- 

// Fungsi format waktu menggunakan date-fns 
const getTimeAgo = (timestamp: string): string => {
    try {
        const date = new Date(timestamp);
        if (isNaN(date.getTime())) {
            return "Tanggal tidak valid";
        }
        return formatDistanceToNowStrict(date, { addSuffix: true, locale: id });
    } catch (error) {
        console.error("Error formatting time with date-fns:", error);
        return "Tanggal tidak valid";
    }
};

// Fungsi getRandomGradient (dari lib/utils/forum) 
const getRandomGradient = (id: string): string => {
    const gradients = [
        "bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500",
        "bg-gradient-to-br from-green-400 via-blue-500 to-purple-600",
        "bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500",
        "bg-gradient-to-br from-purple-400 via-pink-500 to-red-500",
        "bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500",
        "bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600",
    ];
    // Pastikan ID hanya berisi digit untuk Number.parseInt 
    const numericId = id.replace(/\D/g, '');
    const index = numericId ? Number.parseInt(numericId, 10) % gradients.length : 0; // Fallback to 0 if ID is empty after clean 
    return gradients[index];
};


// --- Komponen Utama BookmarksPage --- 
export default function BookmarksPage() {
    const [bookmarkedPosts, setBookmarkedPosts] = useState<BookmarkedPost[]>([]);
    const [filteredPosts, setFilteredPosts] = useState<BookmarkedPost[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [sortBy, setSortBy] = useState("bookmark-newest");
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
    const [loading, setLoading] = useState(true);
    const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set());
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [postToDelete, setPostToDelete] = useState<string | null>(null); // Untuk penghapusan tunggal 
    const [bulkDeleteMode, setBulkDeleteMode] = useState(false);

    const router = useRouter();

    // Load bookmarked posts from localStorage (simulasi) 
    useEffect(() => {
        const loadBookmarks = () => {
            try {
                // Simulasi data bookmark yang tersimpan di localStorage 
                // Ini akan diisi pertama kali jika belum ada penanda inisialisasi dummy 
                const initialDummyBookmarks = [
                    { postId: "post1", bookmarkedAt: "2025-07-21T15:30:00Z", bookmarkNote: "Sangat berguna untuk Wi-Fi rumah!" },
                    { postId: "post3", bookmarkedAt: "2025-07-20T10:00:00Z", bookmarkNote: "Log BSOD untuk referensi." },
                    { postId: "post4", bookmarkedAt: "2025-07-19T08:45:00Z", bookmarkNote: "Coba terapkan tips Linux ini." },
                    { postId: "post5", bookmarkedAt: "2025-07-17T20:15:00Z", bookmarkNote: "Optimasi SSD penting!" },
                    { postId: "post6", bookmarkedAt: "2025-07-22T09:00:00Z", bookmarkNote: "PC rakitan impian!" }, // Bookmark terbaru 
                    { postId: "post7", bookmarkedAt: "2025-07-22T09:00:00Z", bookmarkNote: "WSL2!" }, // Bookmark terbaru 
                ];

                // Jika belum ada data dummy bookmark di localStorage, inisialisasi. 
                // Ini untuk memastikan data dummy selalu ada saat halaman dimuat pertama kali 
                // atau jika localStorage browser dibersihkan. 
                let storedBookmarks = JSON.parse(localStorage.getItem("forumBookmarks") || "[]");
                if (storedBookmarks.length === 0 && localStorage.getItem("forumBookmarksDummyInit") !== "true") {
                    storedBookmarks = initialDummyBookmarks;
                    localStorage.setItem("forumBookmarks", JSON.stringify(storedBookmarks));
                    localStorage.setItem("forumBookmarksDummyInit", "true");
                }

                // Gabungkan post yang dibookmark dengan data post dummy lengkap 
                const hydratedBookmarkedPosts: BookmarkedPost[] = storedBookmarks
                    .map((bookmark: { postId: string; bookmarkedAt: string; bookmarkNote?: string }) => {
                        const post = dummyForumPostsData.find((p) => p.id === bookmark.postId);
                        return post ? { ...post, bookmarkedAt: bookmark.bookmarkedAt, bookmarkNote: bookmark.bookmarkNote } : null;
                    })
                    .filter(Boolean) as BookmarkedPost[];

                setBookmarkedPosts(hydratedBookmarkedPosts);
            } catch (error) {
                console.error("Error loading bookmarks from localStorage:", error);
                toast.error("Gagal memuat bookmark", {
                    description: "Terjadi kesalahan saat mengakses data lokal.",
                });
            } finally {
                setLoading(false);
            }
        };

        loadBookmarks();
    }, []); // Efek ini hanya berjalan sekali saat komponen dimuat 

    // Filter dan sort posts setiap kali bookmarkedPosts atau parameter filter/sort berubah 
    useEffect(() => {
        let currentFilteredPosts = [...bookmarkedPosts];

        // Filter pencarian 
        if (searchQuery) {
            const queryLower = searchQuery.toLowerCase();
            currentFilteredPosts = currentFilteredPosts.filter(
                (post) =>
                    post.title.toLowerCase().includes(queryLower) ||
                    post.description.toLowerCase().includes(queryLower) || // Juga cari di deskripsi 
                    post.content.toLowerCase().includes(queryLower) ||
                    post.author.toLowerCase().includes(queryLower) ||
                    post.tags.some((tag) => tag.toLowerCase().includes(queryLower)) ||
                    post.bookmarkNote?.toLowerCase().includes(queryLower) ||
                    post.category.toLowerCase().includes(queryLower) // Juga cari di kategori 
            );
        }

        // Filter kategori 
        if (selectedCategory !== "all") {
            currentFilteredPosts = currentFilteredPosts.filter((post) => post.category === selectedCategory);
        }

        // Sorting 
        currentFilteredPosts.sort((a, b) => {
            switch (sortBy) {
                case "bookmark-newest":
                    return new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime();
                case "bookmark-oldest":
                    return new Date(a.bookmarkedAt).getTime() - new Date(b.bookmarkedAt).getTime();
                case "post-newest":
                    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
                case "post-oldest":
                    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
                case "most-liked":
                    return b.likes - a.likes;
                case "most-replies":
                    return b.replies - a.replies;
                case "title-asc":
                    return a.title.localeCompare(b.title);
                case "title-desc":
                    return b.title.localeCompare(a.title);
                default:
                    return 0;
            }
        });

        setFilteredPosts(currentFilteredPosts);
    }, [bookmarkedPosts, searchQuery, selectedCategory, sortBy]);

    // Fungsi untuk menghapus satu bookmark (baik dari dialog atau aksi card) 
    const removeBookmark = useCallback((postId: string) => {
        try {
            // Ambil bookmark saat ini dari localStorage 
            const storedBookmarks = JSON.parse(localStorage.getItem("forumBookmarks") || "[]");
            // Filter bookmark yang akan dihapus 
            const updatedStoredBookmarks = storedBookmarks.filter((b: { postId: string }) => b.postId !== postId);
            // Simpan kembali ke localStorage 
            localStorage.setItem("forumBookmarks", JSON.stringify(updatedStoredBookmarks));

            // Perbarui state lokal `bookmarkedPosts` 
            setBookmarkedPosts((prev) => prev.filter((p) => p.id !== postId));
            // Hapus post dari `selectedPosts` jika sedang dalam mode bulk delete 
            setSelectedPosts((prev) => {
                const newSet = new Set(prev);
                newSet.delete(postId);
                return newSet;
            });

            toast.success("Bookmark dihapus", {
                description: "Post telah dihapus dari bookmark Anda.",
            });
        } catch (error) {
            console.error("Error removing bookmark:", error);
            toast.error("Gagal menghapus bookmark", {
                description: "Terjadi kesalahan saat menghapus bookmark.",
            });
        }
    }, []);

    // Fungsi untuk menghapus bookmark yang dipilih secara massal 
    const handleBulkDelete = useCallback(() => {
        try {
            // Ambil bookmark saat ini dari localStorage 
            const storedBookmarks = JSON.parse(localStorage.getItem("forumBookmarks") || "[]");
            // Filter bookmark yang akan dihapus berdasarkan `selectedPosts` 
            const updatedStoredBookmarks = storedBookmarks.filter((b: { postId: string }) => !selectedPosts.has(b.postId));
            // Simpan kembali ke localStorage 
            localStorage.setItem("forumBookmarks", JSON.stringify(updatedStoredBookmarks));

            // Perbarui state lokal `bookmarkedPosts` 
            setBookmarkedPosts((prev) => prev.filter((p) => !selectedPosts.has(p.id)));
            setSelectedPosts(new Set()); // Bersihkan semua pilihan 
            setBulkDeleteMode(false); // Keluar dari mode bulk delete 

            toast.success("Bookmark dihapus", {
                description: `${selectedPosts.size} bookmark telah dihapus.`,
            });
        } catch (error) {
            console.error("Error bulk deleting bookmarks:", error);
            toast.error("Gagal menghapus bookmark", {
                description: "Terjadi kesalahan saat menghapus bookmark secara massal.",
            });
        }
    }, [selectedPosts]);

    // Handler untuk berbagai aksi pada post bookmark (lihat, share, hapus) 
    const handlePostAction = useCallback(
        async (postId: string, action: string) => {
            const post = bookmarkedPosts.find((p) => p.id === postId);
            if (!post) return;

            try {
                switch (action) {
                    case "remove-bookmark":
                        setPostToDelete(postId); // Set post yang akan dihapus (untuk dialog konfirmasi) 
                        setShowDeleteDialog(true); // Tampilkan dialog konfirmasi 
                        break;
                    case "share-link":
                        await navigator.clipboard.writeText(`${window.location.origin}/forum/${postId}`);
                        toast.success("Link disalin", { description: "Link post telah disalin ke clipboard." });
                        break;
                    case "share-external":
                        window.open(`${window.location.origin}/forum/${postId}`, "_blank");
                        break;
                    case "download":
                        // Implementasi fungsi download media (jika ada media di post) 
                        if (post.media && post.media.length > 0) {
                            post.media.forEach((media, index) => {
                                const link = document.createElement("a");
                                link.href = media.url; // URL media (sekarang placeholder lokal) 
                                link.download = `media-${post.id}-${index + 1}.${media.type === "image" ? "jpg" : "mp4"}`;
                                link.target = "_blank"; // Buka di tab baru untuk download 
                                document.body.appendChild(link); // Diperlukan untuk Firefox 
                                link.click();
                                document.body.removeChild(link);
                            });
                            toast.info("Download dimulai", { description: "Media sedang diunduh." });
                        } else {
                            toast.info("Tidak ada media", { description: "Post ini tidak memiliki media untuk diunduh." });
                        }
                        break;
                    case "view-post":
                        router.push(`/forum/${postId}`); // Navigasi ke halaman detail post 
                        break;
                }
            } catch (error) {
                console.error("Error handling post action:", error);
                toast.error("Gagal melakukan aksi", {
                    description: "Terjadi kesalahan saat melakukan aksi.",
                });
            }
        },
        [bookmarkedPosts, router],
    );

    // Fungsi untuk toggle pilihan post (untuk mode bulk delete) 
    const togglePostSelection = useCallback((postId: string) => {
        setSelectedPosts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    }, []);

    // Fungsi untuk memilih semua post yang difilter 
    const selectAllPosts = useCallback(() => {
        setSelectedPosts(new Set(filteredPosts.map((p) => p.id)));
    }, [filteredPosts]);

    // Fungsi untuk membersihkan semua pilihan 
    const clearSelection = useCallback(() => {
        setSelectedPosts(new Set());
    }, []);

    // Menghitung statistik kategori berdasarkan bookmark yang ada 
    const getCategoryStats = useMemo(() => {
        const statsMap = new Map<string, { value: string; label: string; count: number; }>();
        // Inisialisasi dengan kategori statis dan hitungan 0 
        FORUM_CATEGORIES_STATIC.forEach(cat => {
            statsMap.set(cat.id, { value: cat.id, label: cat.name, count: 0 });
        });

        // Hitung post yang dibookmark per kategori 
        bookmarkedPosts.forEach(post => {
            if (statsMap.has(post.category)) {
                statsMap.get(post.category)!.count++;
            } else {
                // Jika ada kategori di post yang tidak ada di data statis, tambahkan. 
                // Ini penting jika data dummy Anda tidak 100% cocok dengan FORUM_CATEGORIES_STATIC. 
                statsMap.set(post.category, { value: post.category, label: post.category, count: 1 });
            }
        });

        const allCategoriesStats = Array.from(statsMap.values());

        // Tambahkan "Semua Kategori" sebagai opsi pertama 
        allCategoriesStats.unshift({
            value: "all",
            label: "Semua Kategori",
            count: bookmarkedPosts.length,
        });

        return allCategoriesStats;
    }, [bookmarkedPosts]);

    // Menghitung statistik cepat (total bookmark, kategori unik, bookmark minggu ini, bookmark terselesaikan) 
    const getQuickStats = useMemo(() => {
        const totalBookmarks = bookmarkedPosts.length;
        const categoriesCount = new Set(bookmarkedPosts.map((p) => p.category)).size;
        const thisWeekBookmarks = bookmarkedPosts.filter((p) => {
            const bookmarkDate = new Date(p.bookmarkedAt);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7); // Kurangi 7 hari dari tanggal sekarang 
            return bookmarkDate >= weekAgo;
        }).length;
        const resolvedBookmarks = bookmarkedPosts.filter((p) => p.isResolved).length;

        return { totalBookmarks, categoriesCount, thisWeekBookmarks, resolvedBookmarks };
    }, [bookmarkedPosts]);

    const stats = getQuickStats; // Alias untuk kemudahan penggunaan 

    // Tampilkan skeleton loader saat loading 
    if (loading) {
        return <BookmarksSkeleton />;
    }

    // Tampilkan pesan khusus jika tidak ada bookmark sama sekali setelah loading 
    if (bookmarkedPosts.length === 0 && !searchQuery && selectedCategory === "all") {
        return (
            <div className="container mx-auto px-4 py-8 max-w-7xl">
                <Card className="text-center py-12">
                    <CardContent>
                        <BookmarkX className="h-20 w-20 text-gray-400 mx-auto mb-6" />
                        <h3 className="text-2xl font-bold mb-4">Belum Ada Bookmark Tersimpan</h3>
                        <p className="text-gray-600 mb-6">
                            Mulai bookmark post yang menarik bagi Anda dari forum untuk disimpan di sini.
                        </p>
                        <Button onClick={() => router.push("/forum")}>Jelajahi Forum</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            {/* Header Halaman */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="sm" onClick={() => router.back()} className="shrink-0">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Kembali
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
                            <Bookmark className="h-8 w-8 text-blue-600" />
                            Bookmark Saya
                        </h1>
                        <p className="text-gray-600">Koleksi post yang telah Anda simpan</p>
                    </div>
                </div>

                {/* Kontrol Mode Bulk Delete (ditempatkan lebih dekat ke daftar post) */}
                <div className="flex-grow flex justify-end items-center gap-2 md:order-last md:justify-start lg:justify-end">
                    {bulkDeleteMode && (
                        <>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={selectAllPosts}
                                disabled={selectedPosts.size === filteredPosts.length}
                            >
                                Pilih Semua
                            </Button>
                            <Button variant="outline" size="sm" onClick={clearSelection} disabled={selectedPosts.size === 0}>
                                Batal Pilih
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)} disabled={selectedPosts.size === 0}>
                                <Trash2 className="h-4 w-4 mr-2" />
                                Hapus ({selectedPosts.size})
                            </Button>
                        </>
                    )}
                    <Button
                        variant={bulkDeleteMode ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                            setBulkDeleteMode(!bulkDeleteMode);
                            setSelectedPosts(new Set()); // Bersihkan pilihan saat toggle mode 
                        }}
                    >
                        {bulkDeleteMode ? "Selesai" : "Kelola"}
                    </Button>
                </div>
            </div>

            {/* Statistik Cepat */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.totalBookmarks}</div>
                        <div className="text-sm text-gray-600">Total Bookmark</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.categoriesCount}</div>
                        <div className="text-sm text-gray-600">Kategori Unik</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.thisWeekBookmarks}</div>
                        <div className="text-sm text-gray-600">Bookmark Minggu Ini</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">{stats.resolvedBookmarks}</div>
                        <div className="text-sm text-gray-600">Yang Terselesaikan</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Kolom Kiri: Konten Utama (Filter dan Daftar Post) */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Filter dan Kontrol Tampilan */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4">
                                {/* Pencarian dan Toggle Tampilan */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1">
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <Input
                                                placeholder="Cari bookmark..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={viewMode === "grid" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setViewMode("grid")}
                                        >
                                            <Grid3X3 className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant={viewMode === "list" ? "default" : "outline"}
                                            size="sm"
                                            onClick={() => setViewMode("list")}
                                        >
                                            <List className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Filter Kategori dan Urutkan Berdasarkan */}
                                <div className="flex flex-col md:flex-row gap-4">
                                    <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                        <SelectTrigger className="w-full md:w-48">
                                            <SelectValue placeholder="Filter Kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getCategoryStats.map((category) => (
                                                <SelectItem key={category.value} value={category.value}>
                                                    {category.label} ({category.count})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select value={sortBy} onValueChange={setSortBy}>
                                        <SelectTrigger className="w-full md:w-48">
                                            <SelectValue placeholder="Urutkan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bookmark-newest">Bookmark Terbaru</SelectItem>
                                            <SelectItem value="bookmark-oldest">Bookmark Terlama</SelectItem>
                                            <SelectItem value="post-newest">Post Terbaru</SelectItem>
                                            <SelectItem value="post-oldest">Post Terlama</SelectItem>
                                            <SelectItem value="most-liked">Paling Disukai</SelectItem>
                                            <SelectItem value="most-replies">Paling Banyak Balasan</SelectItem>
                                            <SelectItem value="title-asc">Judul A-Z</SelectItem>
                                            <SelectItem value="title-desc">Judul Z-A</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Daftar Post Bookmark */}
                    {filteredPosts.length > 0 ? (
                        <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
                            {filteredPosts.map((post) => (
                                <BookmarkCard
                                    key={post.id}
                                    post={post}
                                    viewMode={viewMode}
                                    isSelected={selectedPosts.has(post.id)}
                                    bulkDeleteMode={bulkDeleteMode}
                                    onToggleSelection={() => togglePostSelection(post.id)}
                                    onAction={handlePostAction}
                                />
                            ))}
                        </div>
                    ) : (
                        // Pesan jika tidak ada bookmark yang cocok dengan filter/pencarian 
                        <Card>
                            <CardContent className="p-8 text-center">
                                <BookmarkX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium mb-2">
                                    {searchQuery || selectedCategory !== "all" ? "Tidak ada bookmark ditemukan" : "Belum ada bookmark"}
                                </h3>
                                <p className="text-gray-600 mb-4">
                                    {searchQuery || selectedCategory !== "all"
                                        ? "Coba ubah filter atau kata kunci pencarian Anda."
                                        : "Mulai bookmark post yang menarik bagi Anda dari forum untuk disimpan di sini."}
                                </p>
                                <Button onClick={() => router.push("/forum")}>Jelajahi Forum</Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Kolom Kanan: Sidebar (Kategori & Bookmark Terbaru) */}
                <div className="lg:col-span-1 space-y-6">
                    {/* Card Kategori */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Kategori</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {getCategoryStats.map((category) => (
                                <button
                                    key={category.value}
                                    onClick={() => setSelectedCategory(category.value)}
                                    className={cn(
                                        "w-full text-left p-3 rounded-lg transition-all duration-200",
                                        selectedCategory === category.value ? "bg-blue-100 text-blue-800 shadow-sm" : "hover:bg-gray-100"
                                    )}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">{category.label}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {category.count}
                                        </Badge>
                                    </div>
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Card Bookmark Terbaru */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Bookmark Terbaru</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <ScrollArea className="h-64">
                                {bookmarkedPosts.slice(0, 10).sort((a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime()).map((post) => ( // Urutkan terbaru 
                                    <div
                                        key={post.id}
                                        className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors mb-2"
                                        onClick={() => router.push(`/forum/${post.id}`)}
                                    >
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src={post.avatar || "/placeholder.svg"} />
                                            <AvatarFallback className="text-xs">{post.author[0]}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-medium line-clamp-2">{post.title}</p>
                                            <p className="text-xs text-gray-500">Bookmark: {getTimeAgo(post.bookmarkedAt)}</p>
                                        </div>
                                    </div>
                                ))}
                                {bookmarkedPosts.length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">Tidak ada bookmark terbaru.</p>
                                )}
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialog Konfirmasi Hapus Bookmark */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Hapus Bookmark</AlertDialogTitle>
                        <AlertDialogDescription>
                            Apakah Anda yakin ingin menghapus{" "}
                            {selectedPosts.size > 0 ? `${selectedPosts.size} bookmark ini` : "bookmark ini"}? Tindakan ini tidak dapat
                            dibatalkan.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (selectedPosts.size > 0) {
                                    handleBulkDelete(); // Panggil bulk delete jika ada yang terpilih 
                                } else if (postToDelete) {
                                    removeBookmark(postToDelete); // Panggil single delete 
                                }
                                setPostToDelete(null); // Bersihkan post yang akan dihapus 
                                setShowDeleteDialog(false); // Tutup dialog 
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            Hapus
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}


// --- Komponen BookmarkCard --- 
// Ini adalah komponen kustom yang mirip dengan PostCard tetapi disesuaikan untuk halaman bookmark. 
interface BookmarkCardProps {
    post: BookmarkedPost;
    viewMode: "grid" | "list";
    isSelected: boolean;
    bulkDeleteMode: boolean;
    onToggleSelection: () => void;
    onAction: (postId: string, action: string) => void;
}

function BookmarkCard({ post, viewMode, isSelected, bulkDeleteMode, onToggleSelection, onAction }: BookmarkCardProps) {
    const hasMedia = post.media && post.media.length > 0;
    const thumbnail = hasMedia && post.media[0].url ? post.media[0].url : null; // Pastikan URL thumbnail ada 


    // Tampilan List 
    if (viewMode === "list") {
        return (
            <Card className={cn(
                "hover:shadow-md transition-all duration-300",
                isSelected ? "ring-2 ring-blue-500" : ""
            )}>
                <CardContent className="p-4">
                    <div className="flex gap-4">
                        {/* Checkbox untuk Bulk Delete */}
                        {bulkDeleteMode && (
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={onToggleSelection}
                                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        {/* Thumbnail Post */}
                        <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
                            {thumbnail ? (
                                <Image
                                    src={thumbnail}
                                    alt={post.title}
                                    className="w-full h-full object-cover"
                                    width={80}
                                    height={80}
                                    sizes="80px" // Tetapkan ukuran eksplisit untuk Next/Image 
                                />
                            ) : (
                                <div className={cn("w-full h-full flex items-center justify-center", getRandomGradient(post.id))}>
                                    <MessageSquare className="h-8 w-8 text-white/80" />
                                </div>
                            )}
                        </div>

                        {/* Konten Post (Judul, Penulis, Deskripsi, Statistik) */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                    <h3
                                        className="font-semibold text-lg line-clamp-1 hover:text-blue-600 cursor-pointer transition-colors"
                                        onClick={() => onAction(post.id, "view-post")} // Aksi lihat post 
                                    >
                                        {post.title}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                        <Avatar className="h-4 w-4">
                                            <AvatarImage src={post.avatar || "/placeholder.svg"} />
                                            <AvatarFallback className="text-xs">{post.author[0]}</AvatarFallback>
                                        </Avatar>
                                        <span>{post.author}</span>
                                        <span>•</span>
                                        <span>{getTimeAgo(post.timestamp)}</span>
                                    </div>
                                </div>

                                {/* Aksi pada Popover (List View) */}
                                <div className="shrink-0">
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-48" align="end">
                                            <div className="space-y-1">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start"
                                                    onClick={() => onAction(post.id, "view-post")}
                                                >
                                                    <ExternalLink className="h-4 w-4 mr-2" />
                                                    Lihat Post
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start"
                                                    onClick={() => onAction(post.id, "share-link")}
                                                >
                                                    <Copy className="h-4 w-4 mr-2" />
                                                    Salin Link
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start"
                                                    onClick={() => onAction(post.id, "share-external")}
                                                >
                                                    <Share2 className="h-4 w-4 mr-2" />
                                                    Bagikan
                                                </Button>
                                                <Separator />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                                                    onClick={() => onAction(post.id, "remove-bookmark")}
                                                >
                                                    <BookmarkX className="h-4 w-4 mr-2" />
                                                    Hapus Bookmark
                                                </Button>
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                </div>
                            </div>

                            <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.description}</p>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                        <Heart className="h-4 w-4" />
                                        {post.likes}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <MessageSquare className="h-4 w-4" />
                                        {post.replies}
                                    </span>
                                    {hasMedia && (
                                        <span className="flex items-center gap-1">
                                            <ImageIcon className="h-4 w-4" />
                                            {post.media!.length}
                                        </span>
                                    )}
                                </div>
                                <div className="text-xs text-gray-400">Bookmark: {getTimeAgo(post.bookmarkedAt)}</div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Tampilan Grid (Default) 
    return (
        <Card
            className={cn(
                "hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden",
                isSelected ? "ring-2 ring-blue-500" : ""
            )}
        >
            <div onClick={() => !bulkDeleteMode && onAction(post.id, "view-post")}> {/* Nonaktifkan klik view saat bulkDeleteMode aktif */}
                {/* Thumbnail Post */}
                <div className="relative h-48 overflow-hidden">
                    {thumbnail ? (
                        <Image
                            src={thumbnail}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            width={500}
                            height={500}
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        />
                    ) : (
                        <div className={cn("w-full h-full relative overflow-hidden flex items-center justify-center", getRandomGradient(post.id))}>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <MessageSquare className="h-16 w-16 text-white/80" />
                            </div>
                        </div>
                    )}

                    {/* Checkbox Pilihan (saat bulk delete mode) */}
                    {bulkDeleteMode && (
                        <div className="absolute top-3 left-3 z-10">
                            <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                    e.stopPropagation(); // Mencegah klik card saat checkbox diklik 
                                    onToggleSelection();
                                }}
                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 bg-white"
                            />
                        </div>
                    )}

                    {/* Badge Status (Kategori, Terselesaikan) */}
                    <div className={cn("absolute top-3 flex gap-2 z-10", bulkDeleteMode ? "right-3" : "left-3")}>
                        <Badge variant="secondary" className="bg-black/50 text-white border-0">
                            {post.category}
                        </Badge>
                        {post.isResolved && (
                            <Badge className="bg-green-600 text-white border-0">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Selesai
                            </Badge>
                        )}
                    </div>

                    {/* Indikator Media */}
                    {hasMedia && (
                        <div className="absolute bottom-3 left-3 z-10">
                            <Badge variant="secondary" className="bg-black/50 text-white border-0">
                                <ImageIcon className="h-3 w-3 mr-1" />
                                {post.media!.length}
                            </Badge>
                        </div>
                    )}

                    {/* Aksi Dropdown (Grid View) */}
                    {!bulkDeleteMode && (
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                            <Popover>
                                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                                    <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0">
                                        <MoreHorizontal className="h-4 w-4 text-white" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-48" align="end">
                                    <div className="space-y-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start"
                                            onClick={() => onAction(post.id, "view-post")}
                                        >
                                            <ExternalLink className="h-4 w-4 mr-2" />
                                            Lihat Post
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start"
                                            onClick={() => onAction(post.id, "share-link")}
                                        >
                                            <Copy className="h-4 w-4 mr-2" />
                                            Salin Link
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start"
                                            onClick={() => onAction(post.id, "share-external")}
                                        >
                                            <Share2 className="h-4 w-4 mr-2" />
                                            Bagikan
                                        </Button>
                                        <Separator />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
                                            onClick={() => onAction(post.id, "remove-bookmark")}
                                        >
                                            <BookmarkX className="h-4 w-4 mr-2" />
                                            Hapus Bookmark
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}
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
                </div>

                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                    {post.title}
                </h3>

                <p className="text-gray-600 text-sm line-clamp-3 mb-3">{post.description}</p> {/* Gunakan description */}

                {/* Tags */}
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

                {/* Statistik */}
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
                    </div>
                    <div className="text-xs text-gray-400">
                        <Calendar className="h-3 w-3 inline mr-1" />
                        {getTimeAgo(post.bookmarkedAt)}
                    </div>
                </div>
            </CardContent>

            <style jsx>{` 
                 @keyframes shimmer { 
                   0% { transform: translateX(-100%); } 
                   100% { transform: translateX(100%); } 
                 } 
                 .animate-shimmer { 
                   animation: shimmer 2s infinite; 
                 } 
             `}</style>
        </Card>
    );
}


// --- Bookmarks Skeleton Loader --- 
// Skeleton loader untuk tampilan halaman bookmark 
function BookmarksSkeleton() {
    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
                    <div>
                        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
                    </div>
                </div>
                <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4 text-center">
                            <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
                            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                    <Card className="mb-6">
                        <CardContent className="p-4">
                            <div className="flex flex-col gap-4">
                                <div className="flex gap-4">
                                    <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
                                    <div className="flex gap-2">
                                        <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                                        <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
                                    <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Card key={i} className="overflow-hidden">
                                <div className="h-48 bg-gray-200 animate-pulse" />
                                <CardContent className="p-4">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                                        <div className="flex-1">
                                            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" />
                                            <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                    </div>
                                    <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                                    <div className="space-y-2 mb-3">
                                        <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
                                        <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                    <div className="flex gap-2 mb-4">
                                        <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                                        <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                    <div className="flex justify-between items-center pt-3 border-t">
                                        <div className="flex gap-4">
                                            <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                                            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                        <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="p-3 rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
                                        <div className="h-5 w-8 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

untuk sekarang tolong buatkan tahapan pertama terlebih dahulu dan perlu saya tegaskan kembali untuk fitur fitur seperti filtered, input pencarian dan sejenisnya saya tidak ingin melakukan nya melalui service firebase / firestore karena terlalu sulit melainkan saya ingin mengambil semua datanya setelah itu sisi client menerima datanya dan pada sisi client melakukan sejenis filtered dan input pencarian dengan menggunakan seperti fuse.js & useState dari react untuk mengelolanya.


dan buatkan juga halaman baru untuk setiap pengguna yang berisi detail pengguna termasuk post forum nya selain email pada section di halaman "/users/profile/page.tsx" yang meng fetch data pengguna ke route api "/users/[id]/detail/route.ts" saya ingin kamu membuat halaman ini seperti halaman profile(mungkin kita bisa membuat component dengan multi props yang mendukung kedua halaman ini agar dapat digunakan masing - masing halaman dengan tampilan dan fiturnya masing - masing) yang kita buat sebelumnya namun dengan beberapa penyesuaian seperti tidak ada fitur untuk edit / hapus seperti halaman profile namun dengan penambahan bagian forum posts yang pengguna sendiri upload.berikut kode profile yang saya gunakan:

// /app/profile/page.tsx

"use client";

import { useState, useEffect, useCallback } from "react";

import { useSession } from "next-auth/react"; // Menggunakan useSession untuk mendapatkan ID pengguna yang login

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import {

    Dialog,

    DialogContent,

    DialogDescription,

    DialogFooter,

    DialogHeader,

    DialogTitle,

} from "@/components/ui/dialog";

import { toast } from "sonner";

import { Edit, Camera, MapPin, Phone, Globe, Github, Twitter, Linkedin, Instagram, Calendar, Mail, Loader2, Link } from "lucide-react";

import type { User } from "@/types/types"; // Pastikan path ini benar

import { ImageUploader } from "@/components/imagekit/ImageUploader";

import { Skeleton } from "@/components/ui/skeleton"; // Untuk efek loading

export default function ProfilePage() {

    const { data: session, status } = useSession(); // Ambil sesi pengguna

    const router = useRouter();



    const [user, setUser] = useState<User | null>(null); // State untuk data user yang ditampilkan

    const [isEditing, setIsEditing] = useState(false); // State untuk mode edit dialog

    const [editForm, setEditForm] = useState<Partial<User>>({}); // State untuk form edit

    const [isSaving, setIsSaving] = useState(false); // State saat proses simpan data

    const [initialLoading, setInitialLoading] = useState(true); // State untuk loading awal page



    // --- Fetch User Data (based on session ID) ---

    const fetchUserData = useCallback(async (userId: string) => {

        try {

            // Fetch data user dari API Route yang sudah ada: /api/users/[id]

            const response = await fetch(`/api/users/${userId}`);

            if (!response.ok) {

                const errorData = await response.json();

                throw new Error(errorData.error || "Gagal memuat data pengguna.");

            }

            const fetchedUser: User = await response.json();

            setUser(fetchedUser);

            setEditForm(fetchedUser); // Inisialisasi form edit dengan data yang diambil

            toast.success("Data profil berhasil dimuat.");

        } catch (error) {

            console.error("Error fetching user data:", error);

            toast.error(error instanceof Error ? error.message : "Gagal memuat profil.");

            setUser(null); // Bersihkan data user jika gagal

        } finally {

            setInitialLoading(false); // Selesai loading awal

        }

    }, []);



    useEffect(() => {

        if (status === "loading") return; // Tunggu sesi dimuat



        if (status === "unauthenticated") {

            router.push('/login'); // Redirect ke login jika belum terautentikasi

            return;

        }



        // Jika ada ID pengguna di sesi dan ini adalah loading awal, fetch data

        if (session?.user?.id && initialLoading) {

            fetchUserData(session.user.id);

        }

    }, [status, session, router, fetchUserData, initialLoading]);



    // Fungsi untuk memformat tanggal

    const formatDate = (dateString: string): string => {

        if (!dateString) return "N/A"; // Handle string tanggal kosong

        return new Date(dateString).toLocaleDateString("id-ID", {

            year: "numeric",

            month: "long",

            day: "numeric",

        });

    };



    // --- Save Profile Changes for Text Fields ---

    const handleSaveProfile = async () => {

        if (!user) return; // Tidak ada user untuk disimpan



        setIsSaving(true);

        try {

            // Kirim hanya field yang diubah atau yang relevan untuk update dari client

            const dataToUpdate: Partial<User> = {

                username: editForm.username,

                bio: editForm.bio,

                location: editForm.location,

                phone: editForm.phone,

                website: editForm.website,

                github: editForm.github,

                twitter: editForm.twitter,

                linkedin: editForm.linkedin,

                instagram: editForm.instagram,

                // avatar dan banner diupdate oleh ImageUploader secara terpisah

            };



            const response = await fetch(`/api/users/${user.id}`, { // Memanggil API update user

                method: 'PUT',

                headers: {

                    'Content-Type': 'application/json',

                },

                body: JSON.stringify(dataToUpdate),

            });



            if (!response.ok) {

                const errorData = await response.json();

                throw new Error(errorData.message || "Gagal memperbarui profil.");

            }



            // Perbarui state user lokal dengan data yang sudah diupdate dari form edit

            // Avatar dan banner akan disinkronkan secara terpisah oleh ImageUploader jika mereka diubah

            setUser(prevUser => ({ ...prevUser!, ...editForm })); // Update state lokal segera

            setIsEditing(false); // Tutup dialog

            toast.success("Profil berhasil diperbarui!");



        } catch (error) {

            console.error("Error saving profile:", error);

            toast.error(error instanceof Error ? error.message : "Gagal menyimpan perubahan profil.");

        } finally {

            setIsSaving(false);

        }

    };



    // --- Cancel Edit Dialog ---

    const handleCancelEdit = () => {

        setEditForm(user || {}); // Kembalikan form edit ke data user saat ini

        setIsEditing(false);

    };



    // --- Update Form Field for Dialog ---

    const updateFormField = useCallback(<K extends keyof Partial<User>>(field: K, value: Partial<User>[K]) => {

        setEditForm((prev) => ({ ...prev, [field]: value }));

    }, []);



    // --- Handle Image URL Changes from ImageUploader (untuk Avatar) ---

    const handleAvatarUrlChange = useCallback(async (newUrl: string | null) => {

        if (!user) return;

        try {

            // Kirim perubahan avatar ke API update user

            const response = await fetch(`/api/users/${user.id}`, {

                method: 'PUT',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ avatar: newUrl || "" }), // Kirim string kosong jika null untuk hapus

            });

            if (!response.ok) {

                const errorData = await response.json();

                throw new Error(errorData.message || "Gagal memperbarui avatar.");

            }

            setUser(prevUser => ({ ...prevUser!, avatar: newUrl || "" })); // Update state lokal

            toast.success("Avatar berhasil diperbarui!");

        } catch (error) {

            console.error("Error updating avatar:", error);

            toast.error(error instanceof Error ? error.message : "Gagal memperbarui avatar.");

        }

    }, [user]);



    // --- Handle Image URL Changes from ImageUploader (untuk Banner) ---

    const handleBannerUrlChange = useCallback(async (newUrl: string | null) => {

        if (!user) return;

        try {

            // Kirim perubahan banner ke API update user

            const response = await fetch(`/api/users/${user.id}`, {

                method: 'PUT',

                headers: { 'Content-Type': 'application/json' },

                body: JSON.stringify({ banner: newUrl || "" }), // Kirim string kosong jika null untuk hapus

            });

            if (!response.ok) {

                const errorData = await response.json();

                throw new Error(errorData.message || "Gagal memperbarui banner.");

            }

            setUser(prevUser => ({ ...prevUser!, banner: newUrl || "" })); // Update state lokal

            toast.success("Banner berhasil diperbarui!");

        } catch (error) {

            console.error("Error updating banner:", error);

            toast.error(error instanceof Error ? error.message : "Gagal memperbarui banner.");

        }

    }, [user]);





    // Tampilkan skeleton saat loading

    if (initialLoading || status === "loading" || !user) {

        return (

            <div className="mx-2 md:mx-4 py-6 space-y-6">

                <Skeleton className="h-8 w-1/3" />

                <div className="h-48 bg-gray-200 rounded-t-lg"></div>

                <div className="relative -mt-16 ml-6">

                    <Skeleton className="h-32 w-32 rounded-full border-4 border-background"></Skeleton>

                </div>

                <div className="pt-20 pb-6 px-6 space-y-2">

                    <Skeleton className="h-8 w-48"></Skeleton>

                    <Skeleton className="h-4 w-64"></Skeleton>

                    <Skeleton className="h-16 w-full"></Skeleton>

                </div>

                <div className="grid gap-6 md:grid-cols-2">

                    <Card><CardHeader><Skeleton className="h-6 w-40"></Skeleton></CardHeader><CardContent className="space-y-4"><Skeleton className="h-4 w-full"></Skeleton><Skeleton className="h-4 w-full"></Skeleton></CardContent></Card>

                    <Card><CardHeader><Skeleton className="h-6 w-40"></Skeleton></CardHeader><CardContent className="space-y-4"><Skeleton className="h-4 w-full"></Skeleton><Skeleton className="h-4 w-full"></Skeleton></CardContent></Card>

                </div>

            </div>

        );

    }



    return (

        <div className="mx-2 md:mx-4 py-6 space-y-6">

            <div className="flex items-center justify-between">

                <div>

                    <h1 className="text-3xl font-bold">Profil Saya</h1>

                    <p className="text-muted-foreground">Kelola informasi profil dan pengaturan akun Anda</p>

                </div>

                {session?.user?.id === user.id && ( // Hanya tampilkan tombol edit jika ini profil pengguna yang login

                    <Button onClick={() => setIsEditing(true)}>

                        <Edit className="h-4 w-4 mr-2" />

                        Edit Profil

                    </Button>

                )}

            </div>



            <Card className="py-0">

                <CardContent className="p-0">

                    <div className="relative">

                        {/* ImageUploader for Banner */}

                        <ImageUploader

                            userId={user.id} // Kirim ID pengguna untuk penamaan file

                            currentImageUrl={user.banner}

                            onImageUrlChange={handleBannerUrlChange}

                            folderPath="user-banners" // Folder di ImageKit

                            fileNamePrefix="banner" // Prefix nama file

                            imageAlt={`${user.username}'s banner`}

                            disabled={!session?.user?.id || session.user.id !== user.id} // Disable jika bukan user yang login

                            type="banner"

                        />

                        <div className="absolute -bottom-16 left-6">

                            {/* ImageUploader for Avatar */}

                            <ImageUploader

                                userId={user.id} // Kirim ID pengguna untuk penamaan file

                                currentImageUrl={user.avatar}

                                onImageUrlChange={handleAvatarUrlChange}

                                folderPath="user-avatars" // Folder di ImageKit

                                fileNamePrefix="avatar" // Prefix nama file

                                imageAlt={`${user.username}'s avatar`}

                                disabled={!session?.user?.id || session.user.id !== user.id} // Disable jika bukan user yang login

                                type="avatar"

                            />

                        </div>

                    </div>



                    <div className="pt-20 pb-6 px-6">

                        <div className="flex items-start justify-between">

                            <div>

                                <h2 className="text-2xl font-bold">{user.username}</h2>

                                <p className="text-muted-foreground flex items-center gap-1">

                                    <Mail className="h-4 w-4" />

                                    {user.email}

                                </p>

                                {user.bio && user.bio.trim() !== "" && <p className="mt-2 text-sm text-gray-700">{user.bio}</p>}

                            </div>

                        </div>

                    </div>

                </CardContent>

            </Card>



            <div className="grid gap-6 md:grid-cols-2">

                <Card>

                    <CardHeader>

                        <CardTitle>Informasi Dasar</CardTitle>

                        <CardDescription>Informasi dasar tentang akun Anda</CardDescription>

                    </CardHeader>

                    <CardContent className="space-y-4">

                        <div className="flex items-center gap-3">

                            <Calendar className="h-4 w-4 text-muted-foreground" />

                            <div>

                                <p className="text-sm font-medium">Bergabung</p>

                                <p className="text-sm text-muted-foreground">{formatDate(user.createdAt)}</p>

                            </div>

                        </div>



                        {user.location && user.location.trim() !== "" && (

                            <div className="flex items-center gap-3">

                                <MapPin className="h-4 w-4 text-muted-foreground" />

                                <div>

                                    <p className="text-sm font-medium">Lokasi</p>

                                    <p className="text-sm text-muted-foreground">{user.location}</p>

                                </div>

                            </div>

                        )}



                        {user.phone && user.phone.trim() !== "" && (

                            <div className="flex items-center gap-3">

                                <Phone className="h-4 w-4 text-muted-foreground" />

                                <div>

                                    <p className="text-sm font-medium">Telepon</p>

                                    <p className="text-sm text-muted-foreground">{user.phone}</p>

                                </div>

                            </div>

                        )}



                        {user.website && user.website.trim() !== "" && (

                            <div className="flex items-center gap-3">

                                <Link className="h-4 w-4 text-muted-foreground" />

                                <div>

                                    <p className="text-sm font-medium">Website</p>

                                    <a

                                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`}

                                        target="_blank"

                                        rel="noopener noreferrer"

                                        className="text-sm text-blue-600 hover:underline"

                                    >

                                        {user.website}

                                    </a>

                                </div>

                            </div>

                        )}

                    </CardContent>

                </Card>



                <Card>

                    <CardHeader>

                        <CardTitle>Media Sosial</CardTitle>

                        <CardDescription>Tautan ke profil media sosial Anda</CardDescription>

                    </CardHeader>

                    <CardContent className="space-y-4">

                        {user.github && user.github.trim() !== "" && (

                            <div className="flex items-center gap-3">

                                <Github className="h-4 w-4 text-muted-foreground" />

                                <div>

                                    <p className="text-sm font-medium">GitHub</p>

                                    <a

                                        href={`https://github.com/${user.github}`}

                                        target="_blank"

                                        rel="noopener noreferrer"

                                        className="text-sm text-blue-600 hover:underline"

                                    >

                                        @{user.github}

                                    </a>

                                </div>

                            </div>

                        )}



                        {user.twitter && user.twitter.trim() !== "" && (

                            <div className="flex items-center gap-3">

                                <Twitter className="h-4 w-4 text-muted-foreground" />

                                <div>

                                    <p className="text-sm font-medium">Twitter</p>

                                    <a

                                        href={`https://twitter.com/${user.twitter}`}

                                        target="_blank"

                                        rel="noopener noreferrer"

                                        className="text-sm text-blue-600 hover:underline"

                                    >

                                        @{user.twitter}

                                    </a>

                                </div>

                            </div>

                        )}



                        {user.linkedin && user.linkedin.trim() !== "" && (

                            <div className="flex items-center gap-3">

                                <Linkedin className="h-4 w-4 text-muted-foreground" />

                                <div>

                                    <p className="text-sm font-medium">LinkedIn</p>

                                    <a

                                        href={`https://linkedin.com/in/${user.linkedin}`}

                                        target="_blank"

                                        rel="noopener noreferrer"

                                        className="text-sm text-blue-600 hover:underline"

                                    >

                                        {user.linkedin}

                                    </a>

                                </div>

                            </div>

                        )}



                        {user.instagram && user.instagram.trim() !== "" && (

                            <div className="flex items-center gap-3">

                                <Instagram className="h-4 w-4 text-muted-foreground" />

                                <div>

                                    <p className="text-sm font-medium">Instagram</p>

                                    <a

                                        href={`https://instagram.com/${user.instagram}`}

                                        target="_blank"

                                        rel="noopener noreferrer"

                                        className="text-sm text-blue-600 hover:underline"

                                    >

                                        @{user.instagram}

                                    </a>

                                </div>

                            </div>

                        )}



                        {!user.github && !user.twitter && !user.linkedin && !user.instagram && (

                            <p className="text-sm text-muted-foreground">Belum ada tautan media sosial</p>

                        )}

                    </CardContent>

                </Card>

            </div>



            {/* Edit Profile Dialog */}

            {session?.user?.id === user.id && (

                <Dialog open={isEditing} onOpenChange={setIsEditing}>

                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">

                        <DialogHeader>

                            <DialogTitle>Edit Profil</DialogTitle>

                            <DialogDescription>Perbarui informasi profil Anda di sini</DialogDescription>

                        </DialogHeader>



                        <div className="grid gap-4 py-4">

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                <div className="space-y-2">

                                    <Label htmlFor="username">Username</Label>

                                    <Input

                                        id="username"

                                        value={editForm.username || ''}

                                        onChange={(e) => updateFormField("username", e.target.value)}

                                        disabled={isSaving}

                                    />

                                </div>

                                <div className="space-y-2">

                                    <Label htmlFor="email">Email</Label>

                                    <Input

                                        id="email"

                                        type="email"

                                        value={editForm.email || ''}

                                        disabled={true}

                                    />

                                    <p className="text-xs text-muted-foreground">Email tidak dapat diubah.</p>

                                </div>

                            </div>



                            <div className="space-y-2">

                                <Label htmlFor="bio">Bio</Label>

                                <Textarea

                                    id="bio"

                                    placeholder="Ceritakan tentang diri Anda..."

                                    value={editForm.bio || ''}

                                    onChange={(e) => updateFormField("bio", e.target.value)}

                                    rows={3}

                                    disabled={isSaving}

                                />

                            </div>



                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                                <div className="space-y-2">

                                    <Label htmlFor="location">Lokasi</Label>

                                    <Input

                                        id="location"

                                        placeholder="Kota, Negara"

                                        value={editForm.location || ''}

                                        onChange={(e) => updateFormField("location", e.target.value)}

                                        disabled={isSaving}

                                    />

                                </div>

                                <div className="space-y-2">

                                    <Label htmlFor="phone">Telepon</Label>

                                    <Input

                                        id="phone"

                                        placeholder="+62 xxx-xxxx-xxxx"

                                        value={editForm.phone || ''}

                                        onChange={(e) => updateFormField("phone", e.target.value)}

                                        disabled={isSaving}

                                    />

                                </div>

                            </div>



                            <div className="space-y-2">

                                <Label htmlFor="website">Website</Label>

                                <Input

                                    id="website"

                                    placeholder="https://example.com"

                                    value={editForm.website || ''}

                                    onChange={(e) => updateFormField("website", e.target.value)}

                                    disabled={isSaving}

                                />

                            </div>



                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

                                <div className="space-y-2">

                                    <Label htmlFor="github">GitHub</Label>

                                    <Input

                                        id="github"

                                        placeholder="username"

                                        value={editForm.github || ''}

                                        onChange={(e) => updateFormField("github", e.target.value)}

                                        disabled={isSaving}

                                    />

                                </div>

                                <div className="space-y-2">

                                    <Label htmlFor="twitter">Twitter</Label>

                                    <Input

                                        id="twitter"

                                        placeholder="username"

                                        value={editForm.twitter || ''}

                                        onChange={(e) => updateFormField("twitter", e.target.value)}

                                        disabled={isSaving}

                                    />

                                </div>

                                <div className="space-y-2">

                                    <Label htmlFor="linkedin">LinkedIn</Label>

                                    <Input

                                        id="linkedin"

                                        placeholder="username"

                                        value={editForm.linkedin || ''}

                                        onChange={(e) => updateFormField("linkedin", e.target.value)}

                                        disabled={isSaving}

                                    />

                                </div>

                                <div className="space-y-2">

                                    <Label htmlFor="instagram">Instagram</Label>

                                    <Input

                                        id="instagram"

                                        placeholder="username"

                                        value={editForm.instagram || ''}

                                        onChange={(e) => updateFormField("instagram", e.target.value)}

                                        disabled={isSaving}

                                    />

                                </div>

                            </div>

                        </div>



                        <DialogFooter>

                            <Button variant="outline" onClick={handleCancelEdit} disabled={isSaving}>

                                Batal

                            </Button>

                            <Button onClick={handleSaveProfile} disabled={isSaving}>

                                {isSaving ? (

                                    <>

                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />

                                        Menyimpan...

                                    </>

                                ) : (

                                    "Simpan Perubahan"

                                )}

                            </Button>

                        </DialogFooter>

                    </DialogContent>

                </Dialog>

            )}

        </div>

    );

}