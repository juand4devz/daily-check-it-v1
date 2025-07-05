"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import {
    Search,
    MoreHorizontal,
    Edit,
    Trash2,
    Pin,
    Archive,
    Eye,
    MessageSquare,
    Heart,
    Flag,
    CheckCircle,
    Plus,
    Users,
    AlertTriangle,
} from "lucide-react"
import forumPostsData from "@/data/forum-posts.json"
import forumRepliesData from "@/data/forum-replies.json"
import forumCategoriesData from "@/data/forum-categories.json"

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
    views: number
    isResolved?: boolean
    isPinned?: boolean
    isArchived?: boolean
    isReported?: boolean
    reportCount?: number
}

interface ForumReply {
    id: string
    postId: string
    content: string
    author: string
    avatar: string
    createdAt: string
    upvotes: number
    downvotes: number
    isReported?: boolean
    reportCount?: number
    isSolution?: boolean
}

interface ForumStats {
    totalPosts: number
    totalReplies: number
    totalUsers: number
    activeToday: number
    reportedPosts: number
    reportedReplies: number
    resolvedPosts: number
    pinnedPosts: number
}

export default function AdminForumPage() {
    const [posts, setPosts] = useState<ForumPost[]>([])
    const [replies, setReplies] = useState<ForumReply[]>([])
    const [stats, setStats] = useState<ForumStats>({
        totalPosts: 0,
        totalReplies: 0,
        totalUsers: 0,
        activeToday: 0,
        reportedPosts: 0,
        reportedReplies: 0,
        resolvedPosts: 0,
        pinnedPosts: 0,
    })
    const [searchTerm, setSearchTerm] = useState("")
    const [filterCategory, setFilterCategory] = useState("all")
    const [filterStatus, setFilterStatus] = useState("all")
    const [selectedPost, setSelectedPost] = useState<ForumPost | null>(null)
    const [selectedReply, setSelectedReply] = useState<ForumReply | null>(null)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
    const [isReplyDialogOpen, setIsReplyDialogOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                // Simulate API delay
                await new Promise((resolve) => setTimeout(resolve, 1000))

                // Transform and enhance forum data
                const enhancedPosts = forumPostsData.map((post) => ({
                    ...post,
                    views: Math.floor(Math.random() * 1000) + 50,
                    isReported: Math.random() > 0.9,
                    reportCount: Math.random() > 0.9 ? Math.floor(Math.random() * 5) + 1 : 0,
                })) as ForumPost[]

                // Transform replies data
                const allReplies: ForumReply[] = []
                Object.entries(forumRepliesData).forEach(([postId, postReplies]) => {
                    ; (postReplies as any[]).forEach((reply) => {
                        allReplies.push({
                            ...reply,
                            postId,
                            upvotes: Math.floor(Math.random() * 20),
                            downvotes: Math.floor(Math.random() * 5),
                            isReported: Math.random() > 0.95,
                            reportCount: Math.random() > 0.95 ? Math.floor(Math.random() * 3) + 1 : 0,
                            isSolution: Math.random() > 0.8,
                        })
                    })
                })

                setPosts(enhancedPosts)
                setReplies(allReplies)

                // Calculate stats
                const newStats: ForumStats = {
                    totalPosts: enhancedPosts.length,
                    totalReplies: allReplies.length,
                    totalUsers: new Set([...enhancedPosts.map((p) => p.author), ...allReplies.map((r) => r.author)]).size,
                    activeToday: Math.floor(Math.random() * 50) + 20,
                    reportedPosts: enhancedPosts.filter((p) => p.isReported).length,
                    reportedReplies: allReplies.filter((r) => r.isReported).length,
                    resolvedPosts: enhancedPosts.filter((p) => p.isResolved).length,
                    pinnedPosts: enhancedPosts.filter((p) => p.isPinned).length,
                }
                setStats(newStats)
            } catch (error) {
                console.error("Error fetching forum data:", error)
                toast.error("Error", {
                    description: "Gagal memuat data forum",
                })
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handlePostAction = async (postId: string, action: string) => {
        try {
            const post = posts.find((p) => p.id === postId)
            if (!post) return

            switch (action) {
                case "edit":
                    setSelectedPost(post)
                    setIsEditDialogOpen(true)
                    break
                case "delete":
                    toast("Konfirmasi Hapus Post", {
                        description: `Apakah Anda yakin ingin menghapus post "${post.title}"?`,
                        action: {
                            label: "Hapus",
                            onClick: () => {
                                setPosts((prev) => prev.filter((p) => p.id !== postId))
                                toast.success("Post berhasil dihapus")
                            },
                        },
                        cancel: {
                            label: "Batal",
                            onClick: () => toast.dismiss(),
                        },
                    })
                    break
                case "pin":
                    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isPinned: !p.isPinned } : p)))
                    toast(post.isPinned ? "Post dilepas pin" : "Post dipasang pin", {
                        description: post.isPinned ? "Post tidak lagi dipasang di atas" : "Post dipasang di bagian atas forum",
                    })
                    break
                case "archive":
                    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isArchived: !p.isArchived } : p)))
                    toast(post.isArchived ? "Post dibuka arsip" : "Post diarsipkan", {
                        description: post.isArchived ? "Post kembali aktif" : "Post diarsipkan",
                    })
                    break
                case "resolve":
                    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isResolved: !p.isResolved } : p)))
                    toast(post.isResolved ? "Post dibuka kembali" : "Post ditandai selesai", {
                        description: post.isResolved ? "Post kembali aktif" : "Post ditandai sebagai selesai",
                    })
                    break
                case "clear-reports":
                    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, isReported: false, reportCount: 0 } : p)))
                    toast("Laporan dibersihkan", {
                        description: "Semua laporan untuk post ini telah dibersihkan",
                    })
                    break
            }
        } catch (error) {
            console.error("Error handling post action:", error)
            toast.error("Error", {
                description: "Gagal melakukan aksi",
            })
        }
    }

    const handleReplyAction = async (replyId: string, action: string) => {
        try {
            const reply = replies.find((r) => r.id === replyId)
            if (!reply) return

            switch (action) {
                case "edit":
                    setSelectedReply(reply)
                    setIsReplyDialogOpen(true)
                    break
                case "delete":
                    toast("Konfirmasi Hapus Komentar", {
                        description: "Apakah Anda yakin ingin menghapus komentar ini?",
                        action: {
                            label: "Hapus",
                            onClick: () => {
                                setReplies((prev) => prev.filter((r) => r.id !== replyId))
                                toast.success("Komentar berhasil dihapus")
                            },
                        },
                        cancel: {
                            label: "Batal",
                            onClick: () => toast.dismiss(),
                        },
                    })
                    break
                case "mark-solution":
                    setReplies((prev) => prev.map((r) => (r.id === replyId ? { ...r, isSolution: !r.isSolution } : r)))
                    toast(reply.isSolution ? "Solusi dibatalkan" : "Ditandai sebagai solusi", {
                        description: reply.isSolution ? "Komentar bukan lagi solusi" : "Komentar ditandai sebagai solusi",
                    })
                    break
                case "clear-reports":
                    setReplies((prev) => prev.map((r) => (r.id === replyId ? { ...r, isReported: false, reportCount: 0 } : r)))
                    toast("Laporan dibersihkan", {
                        description: "Semua laporan untuk komentar ini telah dibersihkan",
                    })
                    break
            }
        } catch (error) {
            console.error("Error handling reply action:", error)
            toast.error("Error", {
                description: "Gagal melakukan aksi",
            })
        }
    }

    const handleSavePost = async () => {
        try {
            if (!selectedPost) return

            setPosts((prev) => prev.map((p) => (p.id === selectedPost.id ? selectedPost : p)))

            setIsEditDialogOpen(false)
            setSelectedPost(null)

            toast("Post disimpan", {
                description: "Perubahan post berhasil disimpan",
            })
        } catch (error) {
            console.error("Error saving post:", error)
            toast.error("Error", {
                description: "Gagal menyimpan post",
            })
        }
    }

    const handleSaveReply = async () => {
        try {
            if (!selectedReply) return

            setReplies((prev) => prev.map((r) => (r.id === selectedReply.id ? selectedReply : r)))

            setIsReplyDialogOpen(false)
            setSelectedReply(null)

            toast("Komentar disimpan", {
                description: "Perubahan komentar berhasil disimpan",
            })
        } catch (error) {
            console.error("Error saving reply:", error)
            toast.error("Error", {
                description: "Gagal menyimpan komentar",
            })
        }
    }

    const filteredPosts = posts.filter((post) => {
        const matchesSearch =
            post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            post.author.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesCategory = filterCategory === "all" || post.category === filterCategory

        const matchesStatus =
            filterStatus === "all" ||
            (filterStatus === "resolved" && post.isResolved) ||
            (filterStatus === "unresolved" && !post.isResolved) ||
            (filterStatus === "pinned" && post.isPinned) ||
            (filterStatus === "archived" && post.isArchived) ||
            (filterStatus === "reported" && post.isReported)

        return matchesSearch && matchesCategory && matchesStatus
    })

    const filteredReplies = replies.filter((reply) => {
        const matchesSearch =
            reply.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            reply.author.toLowerCase().includes(searchTerm.toLowerCase())

        const matchesStatus =
            filterStatus === "all" ||
            (filterStatus === "solution" && reply.isSolution) ||
            (filterStatus === "reported" && reply.isReported)

        return matchesSearch && matchesStatus
    })

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Manajemen Forum</h1>
                    <p className="text-gray-600 mt-2">Kelola post dan komentar forum</p>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Buat Post Baru
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Post</p>
                                <p className="text-2xl font-bold">{stats.totalPosts}</p>
                            </div>
                            <MessageSquare className="h-8 w-8 text-blue-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Komentar</p>
                                <p className="text-2xl font-bold">{stats.totalReplies}</p>
                            </div>
                            <MessageSquare className="h-8 w-8 text-green-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Pengguna Aktif</p>
                                <p className="text-2xl font-bold">{stats.totalUsers}</p>
                            </div>
                            <Users className="h-8 w-8 text-purple-600" />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Laporan</p>
                                <p className="text-2xl font-bold text-red-600">{stats.reportedPosts + stats.reportedReplies}</p>
                            </div>
                            <AlertTriangle className="h-8 w-8 text-red-600" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card className="mb-6">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Cari post atau komentar..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Select value={filterCategory} onValueChange={setFilterCategory}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Kategori" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Kategori</SelectItem>
                                {forumCategoriesData.map((category) => (
                                    <SelectItem key={category.id} value={category.name}>
                                        {category.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger className="w-full md:w-48">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Status</SelectItem>
                                <SelectItem value="resolved">Selesai</SelectItem>
                                <SelectItem value="unresolved">Belum Selesai</SelectItem>
                                <SelectItem value="pinned">Dipasang Pin</SelectItem>
                                <SelectItem value="archived">Diarsipkan</SelectItem>
                                <SelectItem value="reported">Dilaporkan</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Main Content */}
            <Tabs defaultValue="posts" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="posts">Post ({filteredPosts.length})</TabsTrigger>
                    <TabsTrigger value="replies">Komentar ({filteredReplies.length})</TabsTrigger>
                    <TabsTrigger value="reports">Laporan ({stats.reportedPosts + stats.reportedReplies})</TabsTrigger>
                </TabsList>

                {/* Posts Tab */}
                <TabsContent value="posts">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Post</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Post</TableHead>
                                        <TableHead>Penulis</TableHead>
                                        <TableHead>Kategori</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Statistik</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredPosts.map((post) => (
                                        <TableRow key={post.id}>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <h4 className="font-medium line-clamp-1">{post.title}</h4>
                                                    <p className="text-sm text-gray-500 line-clamp-2 mt-1">{post.content}</p>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={post.avatar || "/placeholder.svg"} />
                                                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm">{post.author}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{post.category}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col gap-1">
                                                    {post.isResolved && (
                                                        <Badge className="bg-green-600 text-white text-xs">
                                                            <CheckCircle className="h-3 w-3 mr-1" />
                                                            Selesai
                                                        </Badge>
                                                    )}
                                                    {post.isPinned && (
                                                        <Badge className="bg-blue-600 text-white text-xs">
                                                            <Pin className="h-3 w-3 mr-1" />
                                                            Pinned
                                                        </Badge>
                                                    )}
                                                    {post.isArchived && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            <Archive className="h-3 w-3 mr-1" />
                                                            Arsip
                                                        </Badge>
                                                    )}
                                                    {post.isReported && (
                                                        <Badge variant="destructive" className="text-xs">
                                                            <Flag className="h-3 w-3 mr-1" />
                                                            Dilaporkan ({post.reportCount})
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm space-y-1">
                                                    <div className="flex items-center gap-1">
                                                        <Eye className="h-3 w-3" />
                                                        {post.views}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <Heart className="h-3 w-3" />
                                                        {post.likes}
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <MessageSquare className="h-3 w-3" />
                                                        {post.replies}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-gray-500">
                                                    {new Date(post.timestamp).toLocaleDateString("id-ID")}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-48">
                                                        <DropdownMenuItem onClick={() => handlePostAction(post.id, "edit")}>
                                                            <Edit className="h-4 w-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handlePostAction(post.id, "pin")}>
                                                            <Pin className="h-4 w-4 mr-2" />
                                                            {post.isPinned ? "Lepas Pin" : "Pin Post"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handlePostAction(post.id, "resolve")}>
                                                            <CheckCircle className="h-4 w-4 mr-2" />
                                                            {post.isResolved ? "Buka Kembali" : "Tandai Selesai"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handlePostAction(post.id, "archive")}>
                                                            <Archive className="h-4 w-4 mr-2" />
                                                            {post.isArchived ? "Buka Arsip" : "Arsipkan"}
                                                        </DropdownMenuItem>
                                                        {post.isReported && (
                                                            <DropdownMenuItem onClick={() => handlePostAction(post.id, "clear-reports")}>
                                                                <Flag className="h-4 w-4 mr-2" />
                                                                Bersihkan Laporan
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => handlePostAction(post.id, "delete")}
                                                            className="text-red-600 focus:text-red-600"
                                                        >
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Hapus
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Replies Tab */}
                <TabsContent value="replies">
                    <Card>
                        <CardHeader>
                            <CardTitle>Daftar Komentar</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Komentar</TableHead>
                                        <TableHead>Penulis</TableHead>
                                        <TableHead>Post</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Voting</TableHead>
                                        <TableHead>Tanggal</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReplies.map((reply) => {
                                        const relatedPost = posts.find((p) => p.id === reply.postId)
                                        return (
                                            <TableRow key={reply.id}>
                                                <TableCell>
                                                    <div className="max-w-xs">
                                                        <p className="text-sm line-clamp-3">{reply.content}</p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="h-6 w-6">
                                                            <AvatarImage src={reply.avatar || "/placeholder.svg"} />
                                                            <AvatarFallback>{reply.author[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-sm">{reply.author}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="max-w-xs">
                                                        <p className="text-sm font-medium line-clamp-1">
                                                            {relatedPost?.title || "Post tidak ditemukan"}
                                                        </p>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col gap-1">
                                                        {reply.isSolution && (
                                                            <Badge className="bg-green-600 text-white text-xs">
                                                                <CheckCircle className="h-3 w-3 mr-1" />
                                                                Solusi
                                                            </Badge>
                                                        )}
                                                        {reply.isReported && (
                                                            <Badge variant="destructive" className="text-xs">
                                                                <Flag className="h-3 w-3 mr-1" />
                                                                Dilaporkan ({reply.reportCount})
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm space-y-1">
                                                        <div className="text-green-600">↑ {reply.upvotes}</div>
                                                        <div className="text-red-600">↓ {reply.downvotes}</div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="text-sm text-gray-500">
                                                        {new Date(reply.createdAt).toLocaleDateString("id-ID")}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-48">
                                                            <DropdownMenuItem onClick={() => handleReplyAction(reply.id, "edit")}>
                                                                <Edit className="h-4 w-4 mr-2" />
                                                                Edit
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleReplyAction(reply.id, "mark-solution")}>
                                                                <CheckCircle className="h-4 w-4 mr-2" />
                                                                {reply.isSolution ? "Bukan Solusi" : "Tandai Solusi"}
                                                            </DropdownMenuItem>
                                                            {reply.isReported && (
                                                                <DropdownMenuItem onClick={() => handleReplyAction(reply.id, "clear-reports")}>
                                                                    <Flag className="h-4 w-4 mr-2" />
                                                                    Bersihkan Laporan
                                                                </DropdownMenuItem>
                                                            )}
                                                            <DropdownMenuSeparator />
                                                            <DropdownMenuItem
                                                                onClick={() => handleReplyAction(reply.id, "delete")}
                                                                className="text-red-600 focus:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4 mr-2" />
                                                                Hapus
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Reports Tab */}
                <TabsContent value="reports">
                    <div className="space-y-6">
                        {/* Reported Posts */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Post yang Dilaporkan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Post</TableHead>
                                            <TableHead>Penulis</TableHead>
                                            <TableHead>Jumlah Laporan</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {posts
                                            .filter((p) => p.isReported)
                                            .map((post) => (
                                                <TableRow key={post.id}>
                                                    <TableCell>
                                                        <div className="max-w-xs">
                                                            <h4 className="font-medium line-clamp-1">{post.title}</h4>
                                                            <p className="text-sm text-gray-500 line-clamp-2 mt-1">{post.content}</p>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <Avatar className="h-6 w-6">
                                                                <AvatarImage src={post.avatar || "/placeholder.svg"} />
                                                                <AvatarFallback>{post.author[0]}</AvatarFallback>
                                                            </Avatar>
                                                            <span className="text-sm">{post.author}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="destructive">{post.reportCount} laporan</Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(post.timestamp).toLocaleDateString("id-ID")}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                onClick={() => handlePostAction(post.id, "clear-reports")}
                                                            >
                                                                Bersihkan
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="destructive"
                                                                onClick={() => handlePostAction(post.id, "delete")}
                                                            >
                                                                Hapus
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>

                        {/* Reported Replies */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Komentar yang Dilaporkan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Komentar</TableHead>
                                            <TableHead>Penulis</TableHead>
                                            <TableHead>Post</TableHead>
                                            <TableHead>Jumlah Laporan</TableHead>
                                            <TableHead>Tanggal</TableHead>
                                            <TableHead>Aksi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {replies
                                            .filter((r) => r.isReported)
                                            .map((reply) => {
                                                const relatedPost = posts.find((p) => p.id === reply.postId)
                                                return (
                                                    <TableRow key={reply.id}>
                                                        <TableCell>
                                                            <div className="max-w-xs">
                                                                <p className="text-sm line-clamp-3">{reply.content}</p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                <Avatar className="h-6 w-6">
                                                                    <AvatarImage src={reply.avatar || "/placeholder.svg"} />
                                                                    <AvatarFallback>{reply.author[0]}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-sm">{reply.author}</span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="max-w-xs">
                                                                <p className="text-sm font-medium line-clamp-1">
                                                                    {relatedPost?.title || "Post tidak ditemukan"}
                                                                </p>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge variant="destructive">{reply.reportCount} laporan</Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="text-sm text-gray-500">
                                                                {new Date(reply.createdAt).toLocaleDateString("id-ID")}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex gap-2">
                                                                <Button
                                                                    size="sm"
                                                                    variant="outline"
                                                                    onClick={() => handleReplyAction(reply.id, "clear-reports")}
                                                                >
                                                                    Bersihkan
                                                                </Button>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    onClick={() => handleReplyAction(reply.id, "delete")}
                                                                >
                                                                    Hapus
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )
                                            })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Edit Post Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Post</DialogTitle>
                    </DialogHeader>
                    {selectedPost && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Judul</label>
                                <Input
                                    value={selectedPost.title}
                                    onChange={(e) =>
                                        setSelectedPost({
                                            ...selectedPost,
                                            title: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Konten</label>
                                <Textarea
                                    value={selectedPost.content}
                                    onChange={(e) =>
                                        setSelectedPost({
                                            ...selectedPost,
                                            content: e.target.value,
                                        })
                                    }
                                    rows={6}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Kategori</label>
                                <Select
                                    value={selectedPost.category}
                                    onValueChange={(value) =>
                                        setSelectedPost({
                                            ...selectedPost,
                                            category: value,
                                        })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {forumCategoriesData.map((category) => (
                                            <SelectItem key={category.id} value={category.name}>
                                                {category.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button onClick={handleSavePost}>Simpan</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Edit Reply Dialog */}
            <Dialog open={isReplyDialogOpen} onOpenChange={setIsReplyDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Edit Komentar</DialogTitle>
                    </DialogHeader>
                    {selectedReply && (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Konten</label>
                                <Textarea
                                    value={selectedReply.content}
                                    onChange={(e) =>
                                        setSelectedReply({
                                            ...selectedReply,
                                            content: e.target.value,
                                        })
                                    }
                                    rows={6}
                                />
                            </div>
                            <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setIsReplyDialogOpen(false)}>
                                    Batal
                                </Button>
                                <Button onClick={handleSaveReply}>Simpan</Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
