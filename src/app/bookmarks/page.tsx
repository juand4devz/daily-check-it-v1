// "use client"

// import { useState, useEffect, useMemo, useCallback } from "react"
// import { useRouter } from "next/navigation"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Badge } from "@/components/ui/badge"
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { Separator } from "@/components/ui/separator"
// import { ScrollArea } from "@/components/ui/scroll-area"
// import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog"
// import {
//   Bookmark,
//   Search,
//   MoreHorizontal,
//   Trash2,
//   ExternalLink,
//   Share2,
//   Copy,
//   ArrowLeft,
//   Heart,
//   MessageSquare,
//   CheckCircle,
//   ImageIcon,
//   Calendar,
//   BookmarkX,
//   Grid3X3,
//   List,
// } from "lucide-react"
// import { toast } from "sonner"
// import forumPostsData from "@/data/forum-posts.json"
// import type { ForumPost } from "@/types"
// import { getTimeAgo, getRandomGradient, FORUM_CATEGORIES } from "@/lib/utils/forum"

// interface BookmarkedPost extends ForumPost {
//   bookmarkedAt: string
//   bookmarkNote?: string
// }

// export default function BookmarksPage() {
//   const [bookmarkedPosts, setBookmarkedPosts] = useState<BookmarkedPost[]>([])
//   const [filteredPosts, setFilteredPosts] = useState<BookmarkedPost[]>([])
//   const [searchQuery, setSearchQuery] = useState("")
//   const [selectedCategory, setSelectedCategory] = useState("all")
//   const [sortBy, setSortBy] = useState("bookmark-newest")
//   const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
//   const [loading, setLoading] = useState(true)
//   const [selectedPosts, setSelectedPosts] = useState<Set<string>>(new Set())
//   const [showDeleteDialog, setShowDeleteDialog] = useState(false)
//   const [postToDelete, setPostToDelete] = useState<string | null>(null)
//   const [bulkDeleteMode, setBulkDeleteMode] = useState(false)
//   const router = useRouter()

//   // Load bookmarked posts from localStorage
//   useEffect(() => {
//     const loadBookmarks = () => {
//       try {
//         const bookmarks = JSON.parse(localStorage.getItem("forumBookmarks") || "[]")
//         const allPosts = [...JSON.parse(localStorage.getItem("forumPosts") || "[]"), ...forumPostsData]

//         const bookmarkedPosts = bookmarks
//           .map((bookmark: any) => {
//             const post = allPosts.find((p: ForumPost) => p.id === bookmark.postId)
//             return post ? { ...post, bookmarkedAt: bookmark.bookmarkedAt, bookmarkNote: bookmark.note } : null
//           })
//           .filter(Boolean)

//         setBookmarkedPosts(bookmarkedPosts)
//       } catch (error) {
//         console.error("Error loading bookmarks:", error)
//         toast({
//           title: "Error",
//           description: "Gagal memuat bookmark",
//           variant: "destructive",
//         })
//       } finally {
//         setLoading(false)
//       }
//     }

//     loadBookmarks()
//   }, [])

//   // Filter and sort posts
//   useEffect(() => {
//     let filtered = [...bookmarkedPosts]

//     // Search filter
//     if (searchQuery) {
//       const query = searchQuery.toLowerCase()
//       filtered = filtered.filter(
//         (post) =>
//           post.title.toLowerCase().includes(query) ||
//           post.content.toLowerCase().includes(query) ||
//           post.author.toLowerCase().includes(query) ||
//           post.tags.some((tag) => tag.toLowerCase().includes(query)) ||
//           post.bookmarkNote?.toLowerCase().includes(query),
//       )
//     }

//     // Category filter
//     if (selectedCategory !== "all") {
//       filtered = filtered.filter((post) => post.category === selectedCategory)
//     }

//     // Sort
//     filtered.sort((a, b) => {
//       switch (sortBy) {
//         case "bookmark-newest":
//           return new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime()
//         case "bookmark-oldest":
//           return new Date(a.bookmarkedAt).getTime() - new Date(b.bookmarkedAt).getTime()
//         case "post-newest":
//           return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
//         case "post-oldest":
//           return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
//         case "most-liked":
//           return b.likes - a.likes
//         case "most-replies":
//           return b.replies - a.replies
//         case "title-asc":
//           return a.title.localeCompare(b.title)
//         case "title-desc":
//           return b.title.localeCompare(a.title)
//         default:
//           return 0
//       }
//     })

//     setFilteredPosts(filtered)
//   }, [bookmarkedPosts, searchQuery, selectedCategory, sortBy])

//   const removeBookmark = useCallback((postId: string) => {
//     try {
//       const bookmarks = JSON.parse(localStorage.getItem("forumBookmarks") || "[]")
//       const updatedBookmarks = bookmarks.filter((b: any) => b.postId !== postId)
//       localStorage.setItem("forumBookmarks", JSON.stringify(updatedBookmarks))

//       setBookmarkedPosts((prev) => prev.filter((p) => p.id !== postId))
//       setSelectedPosts((prev) => {
//         const newSet = new Set(prev)
//         newSet.delete(postId)
//         return newSet
//       })

//       toast({
//         title: "Bookmark dihapus",
//         description: "Post telah dihapus dari bookmark",
//       })
//     } catch (error) {
//       console.error("Error removing bookmark:", error)
//       toast({
//         title: "Error",
//         description: "Gagal menghapus bookmark",
//         variant: "destructive",
//       })
//     }
//   }, [])

//   const handleBulkDelete = useCallback(() => {
//     try {
//       const bookmarks = JSON.parse(localStorage.getItem("forumBookmarks") || "[]")
//       const updatedBookmarks = bookmarks.filter((b: any) => !selectedPosts.has(b.postId))
//       localStorage.setItem("forumBookmarks", JSON.stringify(updatedBookmarks))

//       setBookmarkedPosts((prev) => prev.filter((p) => !selectedPosts.has(p.id)))
//       setSelectedPosts(new Set())
//       setBulkDeleteMode(false)

//       toast({
//         title: "Bookmark dihapus",
//         description: `${selectedPosts.size} bookmark telah dihapus`,
//       })
//     } catch (error) {
//       console.error("Error bulk deleting bookmarks:", error)
//       toast({
//         title: "Error",
//         description: "Gagal menghapus bookmark",
//         variant: "destructive",
//       })
//     }
//   }, [selectedPosts])

//   const handlePostAction = useCallback(
//     async (postId: string, action: string) => {
//       const post = bookmarkedPosts.find((p) => p.id === postId)
//       if (!post) return

//       try {
//         switch (action) {
//           case "remove-bookmark":
//             setPostToDelete(postId)
//             setShowDeleteDialog(true)
//             break
//           case "share-link":
//             await navigator.clipboard.writeText(`${window.location.origin}/forum/${postId}`)
//             toast({ title: "Link disalin", description: "Link post telah disalin ke clipboard" })
//             break
//           case "share-external":
//             window.open(`${window.location.origin}/forum/${postId}`, "_blank")
//             break
//           case "download":
//             // Implement download functionality
//             toast({ title: "Download", description: "Fitur download akan segera tersedia" })
//             break
//           case "view-post":
//             router.push(`/forum/${postId}`)
//             break
//         }
//       } catch (error) {
//         console.error("Error handling post action:", error)
//         toast({
//           title: "Error",
//           description: "Gagal melakukan aksi",
//           variant: "destructive",
//         })
//       }
//     },
//     [bookmarkedPosts, router],
//   )

//   const togglePostSelection = useCallback((postId: string) => {
//     setSelectedPosts((prev) => {
//       const newSet = new Set(prev)
//       if (newSet.has(postId)) {
//         newSet.delete(postId)
//       } else {
//         newSet.add(postId)
//       }
//       return newSet
//     })
//   }, [])

//   const selectAllPosts = useCallback(() => {
//     setSelectedPosts(new Set(filteredPosts.map((p) => p.id)))
//   }, [filteredPosts])

//   const clearSelection = useCallback(() => {
//     setSelectedPosts(new Set())
//   }, [])

//   const getCategoryStats = useMemo(() => {
//     const stats = FORUM_CATEGORIES.map((cat) => ({
//       ...cat,
//       count: bookmarkedPosts.filter((p) => p.category === cat.value).length,
//     }))

//     stats.unshift({
//       value: "all",
//       label: "Semua Kategori",
//       description: "Semua kategori",
//       count: bookmarkedPosts.length,
//     })

//     return stats
//   }, [bookmarkedPosts])

//   const getQuickStats = useMemo(() => {
//     const totalBookmarks = bookmarkedPosts.length
//     const categoriesCount = new Set(bookmarkedPosts.map((p) => p.category)).size
//     const thisWeekBookmarks = bookmarkedPosts.filter((p) => {
//       const bookmarkDate = new Date(p.bookmarkedAt)
//       const weekAgo = new Date()
//       weekAgo.setDate(weekAgo.getDate() - 7)
//       return bookmarkDate >= weekAgo
//     }).length
//     const resolvedBookmarks = bookmarkedPosts.filter((p) => p.isResolved).length

//     return { totalBookmarks, categoriesCount, thisWeekBookmarks, resolvedBookmarks }
//   }, [bookmarkedPosts])

//   const stats = getQuickStats

//   if (loading) {
//     return <BookmarksSkeleton />
//   }

//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
//         <div className="flex items-center gap-4">
//           <Button variant="ghost" size="sm" onClick={() => router.back()} className="shrink-0">
//             <ArrowLeft className="h-4 w-4 mr-2" />
//             Kembali
//           </Button>
//           <div>
//             <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
//               <Bookmark className="h-8 w-8 text-blue-600" />
//               Bookmark Saya
//             </h1>
//             <p className="text-gray-600">Koleksi post yang telah Anda simpan</p>
//           </div>
//         </div>

//         <div className="flex items-center gap-2">
//           {bulkDeleteMode && (
//             <>
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={selectAllPosts}
//                 disabled={selectedPosts.size === filteredPosts.length}
//               >
//                 Pilih Semua
//               </Button>
//               <Button variant="outline" size="sm" onClick={clearSelection} disabled={selectedPosts.size === 0}>
//                 Batal Pilih
//               </Button>
//               <Button variant="destructive" size="sm" onClick={handleBulkDelete} disabled={selectedPosts.size === 0}>
//                 <Trash2 className="h-4 w-4 mr-2" />
//                 Hapus ({selectedPosts.size})
//               </Button>
//             </>
//           )}
//           <Button
//             variant={bulkDeleteMode ? "default" : "outline"}
//             size="sm"
//             onClick={() => {
//               setBulkDeleteMode(!bulkDeleteMode)
//               setSelectedPosts(new Set())
//             }}
//           >
//             {bulkDeleteMode ? "Selesai" : "Kelola"}
//           </Button>
//         </div>
//       </div>

//       {/* Quick Stats */}
//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         <Card>
//           <CardContent className="p-4 text-center">
//             <div className="text-2xl font-bold text-blue-600">{stats.totalBookmarks}</div>
//             <div className="text-sm text-gray-600">Total Bookmark</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4 text-center">
//             <div className="text-2xl font-bold text-green-600">{stats.categoriesCount}</div>
//             <div className="text-sm text-gray-600">Kategori</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4 text-center">
//             <div className="text-2xl font-bold text-purple-600">{stats.thisWeekBookmarks}</div>
//             <div className="text-sm text-gray-600">Minggu Ini</div>
//           </CardContent>
//         </Card>
//         <Card>
//           <CardContent className="p-4 text-center">
//             <div className="text-2xl font-bold text-orange-600">{stats.resolvedBookmarks}</div>
//             <div className="text-sm text-gray-600">Terselesaikan</div>
//           </CardContent>
//         </Card>
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         {/* Main Content */}
//         <div className="lg:col-span-3 space-y-6">
//           {/* Filters and Controls */}
//           <Card>
//             <CardContent className="p-4">
//               <div className="flex flex-col gap-4">
//                 {/* Search and View Toggle */}
//                 <div className="flex flex-col md:flex-row gap-4">
//                   <div className="flex-1">
//                     <div className="relative">
//                       <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
//                       <Input
//                         placeholder="Cari bookmark..."
//                         value={searchQuery}
//                         onChange={(e) => setSearchQuery(e.target.value)}
//                         className="pl-10"
//                       />
//                     </div>
//                   </div>
//                   <div className="flex gap-2">
//                     <Button
//                       variant={viewMode === "grid" ? "default" : "outline"}
//                       size="sm"
//                       onClick={() => setViewMode("grid")}
//                     >
//                       <Grid3X3 className="h-4 w-4" />
//                     </Button>
//                     <Button
//                       variant={viewMode === "list" ? "default" : "outline"}
//                       size="sm"
//                       onClick={() => setViewMode("list")}
//                     >
//                       <List className="h-4 w-4" />
//                     </Button>
//                   </div>
//                 </div>

//                 {/* Filters */}
//                 <div className="flex flex-col md:flex-row gap-4">
//                   <Select value={selectedCategory} onValueChange={setSelectedCategory}>
//                     <SelectTrigger className="w-full md:w-48">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {getCategoryStats.map((category) => (
//                         <SelectItem key={category.value} value={category.value}>
//                           {category.label} ({category.count})
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>

//                   <Select value={sortBy} onValueChange={setSortBy}>
//                     <SelectTrigger className="w-full md:w-48">
//                       <SelectValue />
//                     </SelectTrigger>
//                     <SelectContent>
//                       <SelectItem value="bookmark-newest">Bookmark Terbaru</SelectItem>
//                       <SelectItem value="bookmark-oldest">Bookmark Terlama</SelectItem>
//                       <SelectItem value="post-newest">Post Terbaru</SelectItem>
//                       <SelectItem value="post-oldest">Post Terlama</SelectItem>
//                       <SelectItem value="most-liked">Paling Disukai</SelectItem>
//                       <SelectItem value="most-replies">Paling Banyak Balasan</SelectItem>
//                       <SelectItem value="title-asc">Judul A-Z</SelectItem>
//                       <SelectItem value="title-desc">Judul Z-A</SelectItem>
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           {/* Posts */}
//           {filteredPosts.length > 0 ? (
//             <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "space-y-4"}>
//               {filteredPosts.map((post) => (
//                 <BookmarkCard
//                   key={post.id}
//                   post={post}
//                   viewMode={viewMode}
//                   isSelected={selectedPosts.has(post.id)}
//                   bulkDeleteMode={bulkDeleteMode}
//                   onToggleSelection={() => togglePostSelection(post.id)}
//                   onAction={handlePostAction}
//                 />
//               ))}
//             </div>
//           ) : (
//             <Card>
//               <CardContent className="p-8 text-center">
//                 <BookmarkX className="h-12 w-12 text-gray-400 mx-auto mb-4" />
//                 <h3 className="text-lg font-medium mb-2">
//                   {searchQuery || selectedCategory !== "all" ? "Tidak ada bookmark ditemukan" : "Belum ada bookmark"}
//                 </h3>
//                 <p className="text-gray-600 mb-4">
//                   {searchQuery || selectedCategory !== "all"
//                     ? "Coba ubah filter atau kata kunci pencarian"
//                     : "Mulai bookmark post yang menarik untuk Anda"}
//                 </p>
//                 <Button onClick={() => router.push("/forum")}>Jelajahi Forum</Button>
//               </CardContent>
//             </Card>
//           )}
//         </div>

//         {/* Right Sidebar */}
//         <div className="lg:col-span-1 space-y-6">
//           {/* Categories */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Kategori</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-2">
//               {getCategoryStats.map((category) => (
//                 <button
//                   key={category.value}
//                   onClick={() => setSelectedCategory(category.value)}
//                   className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${selectedCategory === category.value ? "bg-blue-100 text-blue-800 shadow-sm" : "hover:bg-gray-100"
//                     }`}
//                 >
//                   <div className="flex items-center justify-between">
//                     <span className="text-sm font-medium">{category.label}</span>
//                     <Badge variant="secondary" className="text-xs">
//                       {category.count}
//                     </Badge>
//                   </div>
//                 </button>
//               ))}
//             </CardContent>
//           </Card>

//           {/* Recent Bookmarks */}
//           <Card>
//             <CardHeader>
//               <CardTitle className="text-lg">Bookmark Terbaru</CardTitle>
//             </CardHeader>
//             <CardContent className="space-y-3">
//               <ScrollArea className="h-64">
//                 {bookmarkedPosts.slice(0, 10).map((post) => (
//                   <div
//                     key={post.id}
//                     className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors mb-2"
//                     onClick={() => router.push(`/forum/${post.id}`)}
//                   >
//                     <Avatar className="h-6 w-6">
//                       <AvatarImage src={post.avatar || "/placeholder.svg"} />
//                       <AvatarFallback className="text-xs">{post.author[0]}</AvatarFallback>
//                     </Avatar>
//                     <div className="flex-1 min-w-0">
//                       <p className="text-xs font-medium line-clamp-2">{post.title}</p>
//                       <p className="text-xs text-gray-500">Bookmark: {getTimeAgo(post.bookmarkedAt)}</p>
//                     </div>
//                   </div>
//                 ))}
//               </ScrollArea>
//             </CardContent>
//           </Card>
//         </div>
//       </div>

//       {/* Delete Confirmation Dialog */}
//       <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Hapus Bookmark</AlertDialogTitle>
//             <AlertDialogDescription>
//               Apakah Anda yakin ingin menghapus bookmark ini? Tindakan ini tidak dapat dibatalkan.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel>Batal</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={() => {
//                 if (postToDelete) {
//                   removeBookmark(postToDelete)
//                   setPostToDelete(null)
//                 }
//                 setShowDeleteDialog(false)
//               }}
//               className="bg-red-600 hover:bg-red-700"
//             >
//               Hapus
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>
//     </div>
//   )
// }

// // Bookmark Card Component
// interface BookmarkCardProps {
//   post: BookmarkedPost
//   viewMode: "grid" | "list"
//   isSelected: boolean
//   bulkDeleteMode: boolean
//   onToggleSelection: () => void
//   onAction: (postId: string, action: string) => void
// }

// function BookmarkCard({ post, viewMode, isSelected, bulkDeleteMode, onToggleSelection, onAction }: BookmarkCardProps) {
//   const hasMedia = post.media && post.media.length > 0
//   const thumbnail = hasMedia ? post.media[0].url : null

//   if (viewMode === "list") {
//     return (
//       <Card className={`hover:shadow-md transition-all duration-300 ${isSelected ? "ring-2 ring-blue-500" : ""}`}>
//         <CardContent className="p-4">
//           <div className="flex gap-4">
//             {bulkDeleteMode && (
//               <div className="flex items-center">
//                 <input
//                   type="checkbox"
//                   checked={isSelected}
//                   onChange={onToggleSelection}
//                   className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
//                 />
//               </div>
//             )}

//             {/* Thumbnail */}
//             <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0">
//               {thumbnail ? (
//                 <img src={thumbnail || "/placeholder.svg"} alt={post.title} className="w-full h-full object-cover" />
//               ) : (
//                 <div className={`w-full h-full ${getRandomGradient(post.id)} flex items-center justify-center`}>
//                   <MessageSquare className="h-8 w-8 text-white/80" />
//                 </div>
//               )}
//             </div>

//             {/* Content */}
//             <div className="flex-1 min-w-0">
//               <div className="flex items-start justify-between mb-2">
//                 <div className="flex-1">
//                   <h3
//                     className="font-semibold text-lg line-clamp-1 hover:text-blue-600 cursor-pointer transition-colors"
//                     onClick={() => onAction(post.id, "view-post")}
//                   >
//                     {post.title}
//                   </h3>
//                   <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
//                     <Avatar className="h-4 w-4">
//                       <AvatarImage src={post.avatar || "/placeholder.svg"} />
//                       <AvatarFallback className="text-xs">{post.author[0]}</AvatarFallback>
//                     </Avatar>
//                     <span>{post.author}</span>
//                     <span>•</span>
//                     <span>{getTimeAgo(post.timestamp)}</span>
//                   </div>
//                 </div>

//                 <div className="flex items-center gap-2">
//                   <Badge variant="secondary">{post.category}</Badge>
//                   {post.isResolved && (
//                     <Badge className="bg-green-600 text-white">
//                       <CheckCircle className="h-3 w-3 mr-1" />
//                       Selesai
//                     </Badge>
//                   )}

//                   <Popover>
//                     <PopoverTrigger asChild>
//                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
//                         <MoreHorizontal className="h-4 w-4" />
//                       </Button>
//                     </PopoverTrigger>
//                     <PopoverContent className="w-48" align="end">
//                       <div className="space-y-1">
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="w-full justify-start"
//                           onClick={() => onAction(post.id, "view-post")}
//                         >
//                           <ExternalLink className="h-4 w-4 mr-2" />
//                           Lihat Post
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="w-full justify-start"
//                           onClick={() => onAction(post.id, "share-link")}
//                         >
//                           <Copy className="h-4 w-4 mr-2" />
//                           Salin Link
//                         </Button>
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="w-full justify-start"
//                           onClick={() => onAction(post.id, "share-external")}
//                         >
//                           <Share2 className="h-4 w-4 mr-2" />
//                           Bagikan
//                         </Button>
//                         <Separator />
//                         <Button
//                           variant="ghost"
//                           size="sm"
//                           className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
//                           onClick={() => onAction(post.id, "remove-bookmark")}
//                         >
//                           <BookmarkX className="h-4 w-4 mr-2" />
//                           Hapus Bookmark
//                         </Button>
//                       </div>
//                     </PopoverContent>
//                   </Popover>
//                 </div>
//               </div>

//               <p className="text-gray-600 text-sm line-clamp-2 mb-3">{post.content}</p>

//               <div className="flex items-center justify-between">
//                 <div className="flex items-center gap-4 text-sm text-gray-500">
//                   <span className="flex items-center gap-1">
//                     <Heart className="h-4 w-4" />
//                     {post.likes}
//                   </span>
//                   <span className="flex items-center gap-1">
//                     <MessageSquare className="h-4 w-4" />
//                     {post.replies}
//                   </span>
//                   {hasMedia && (
//                     <span className="flex items-center gap-1">
//                       <ImageIcon className="h-4 w-4" />
//                       {post.media.length}
//                     </span>
//                   )}
//                 </div>
//                 <div className="text-xs text-gray-400">Bookmark: {getTimeAgo(post.bookmarkedAt)}</div>
//               </div>
//             </div>
//           </div>
//         </CardContent>
//       </Card>
//     )
//   }

//   // Grid view
//   return (
//     <Card
//       className={`hover:shadow-lg transition-all duration-300 cursor-pointer group overflow-hidden ${isSelected ? "ring-2 ring-blue-500" : ""}`}
//     >
//       <div onClick={() => onAction(post.id, "view-post")}>
//         {/* Thumbnail */}
//         <div className="relative h-48 overflow-hidden">
//           {thumbnail ? (
//             <img
//               src={thumbnail || "/placeholder.svg"}
//               alt={post.title}
//               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//             />
//           ) : (
//             <div className={`w-full h-full ${getRandomGradient(post.id)} relative overflow-hidden`}>
//               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
//               <div className="absolute inset-0 flex items-center justify-center">
//                 <MessageSquare className="h-16 w-16 text-white/80" />
//               </div>
//             </div>
//           )}

//           {/* Selection checkbox */}
//           {bulkDeleteMode && (
//             <div className="absolute top-3 left-3">
//               <input
//                 type="checkbox"
//                 checked={isSelected}
//                 onChange={(e) => {
//                   e.stopPropagation()
//                   onToggleSelection()
//                 }}
//                 className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 bg-white"
//               />
//             </div>
//           )}

//           {/* Status Badges */}
//           <div className={`absolute top-3 ${bulkDeleteMode ? "right-3" : "left-3"} flex gap-2`}>
//             <Badge variant="secondary" className="bg-black/50 text-white border-0">
//               {post.category}
//             </Badge>
//             {post.isResolved && (
//               <Badge className="bg-green-600 text-white border-0">
//                 <CheckCircle className="h-3 w-3 mr-1" />
//                 Selesai
//               </Badge>
//             )}
//           </div>

//           {/* Media indicator */}
//           {hasMedia && (
//             <div className="absolute bottom-3 left-3">
//               <Badge variant="secondary" className="bg-black/50 text-white border-0">
//                 <ImageIcon className="h-3 w-3 mr-1" />
//                 {post.media.length}
//               </Badge>
//             </div>
//           )}

//           {/* Actions */}
//           {!bulkDeleteMode && (
//             <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
//               <Popover>
//                 <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
//                   <Button variant="secondary" size="sm" className="h-8 w-8 p-0 bg-black/50 hover:bg-black/70 border-0">
//                     <MoreHorizontal className="h-4 w-4 text-white" />
//                   </Button>
//                 </PopoverTrigger>
//                 <PopoverContent className="w-48" align="end">
//                   <div className="space-y-1">
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="w-full justify-start"
//                       onClick={() => onAction(post.id, "view-post")}
//                     >
//                       <ExternalLink className="h-4 w-4 mr-2" />
//                       Lihat Post
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="w-full justify-start"
//                       onClick={() => onAction(post.id, "share-link")}
//                     >
//                       <Copy className="h-4 w-4 mr-2" />
//                       Salin Link
//                     </Button>
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="w-full justify-start"
//                       onClick={() => onAction(post.id, "share-external")}
//                     >
//                       <Share2 className="h-4 w-4 mr-2" />
//                       Bagikan
//                     </Button>
//                     <Separator />
//                     <Button
//                       variant="ghost"
//                       size="sm"
//                       className="w-full justify-start text-red-600 hover:text-red-600 hover:bg-red-50"
//                       onClick={() => onAction(post.id, "remove-bookmark")}
//                     >
//                       <BookmarkX className="h-4 w-4 mr-2" />
//                       Hapus Bookmark
//                     </Button>
//                   </div>
//                 </PopoverContent>
//               </Popover>
//             </div>
//           )}
//         </div>

//         <CardContent className="p-4">
//           <div className="flex items-start gap-3 mb-3">
//             <Avatar className="h-8 w-8">
//               <AvatarImage src={post.avatar || "/placeholder.svg"} />
//               <AvatarFallback>{post.author[0]}</AvatarFallback>
//             </Avatar>
//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-medium">{post.author}</p>
//               <p className="text-xs text-gray-500">{getTimeAgo(post.timestamp)}</p>
//             </div>
//           </div>

//           <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
//             {post.title}
//           </h3>

//           <p className="text-gray-600 text-sm line-clamp-3 mb-3">{post.content}</p>

//           {/* Tags */}
//           {post.tags.length > 0 && (
//             <div className="flex flex-wrap gap-1 mb-4">
//               {post.tags.slice(0, 3).map((tag, index) => (
//                 <Badge key={index} variant="outline" className="text-xs">
//                   #{tag}
//                 </Badge>
//               ))}
//               {post.tags.length > 3 && (
//                 <Badge variant="outline" className="text-xs">
//                   +{post.tags.length - 3}
//                 </Badge>
//               )}
//             </div>
//           )}

//           {/* Stats */}
//           <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t">
//             <div className="flex items-center gap-4">
//               <span className="flex items-center gap-1">
//                 <Heart className="h-4 w-4" />
//                 {post.likes}
//               </span>
//               <span className="flex items-center gap-1">
//                 <MessageSquare className="h-4 w-4" />
//                 {post.replies}
//               </span>
//             </div>
//             <div className="text-xs text-gray-400">
//               <Calendar className="h-3 w-3 inline mr-1" />
//               {getTimeAgo(post.bookmarkedAt)}
//             </div>
//           </div>
//         </CardContent>
//       </div>

//       <style jsx>{`
//         @keyframes shimmer {
//           0% { transform: translateX(-100%); }
//           100% { transform: translateX(100%); }
//         }
//         .animate-shimmer {
//           animation: shimmer 2s infinite;
//         }
//       `}</style>
//     </Card>
//   )
// }

// // Bookmarks Skeleton Loader
// function BookmarksSkeleton() {
//   return (
//     <div className="container mx-auto px-4 py-8 max-w-7xl">
//       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
//         <div className="flex items-center gap-4">
//           <div className="h-10 w-20 bg-gray-200 rounded animate-pulse" />
//           <div>
//             <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
//             <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
//           </div>
//         </div>
//         <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
//       </div>

//       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
//         {Array.from({ length: 4 }).map((_, i) => (
//           <Card key={i}>
//             <CardContent className="p-4 text-center">
//               <div className="h-8 w-12 bg-gray-200 rounded animate-pulse mx-auto mb-1" />
//               <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto" />
//             </CardContent>
//           </Card>
//         ))}
//       </div>

//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         <div className="lg:col-span-3">
//           <Card className="mb-6">
//             <CardContent className="p-4">
//               <div className="flex flex-col gap-4">
//                 <div className="flex gap-4">
//                   <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse" />
//                   <div className="flex gap-2">
//                     <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
//                     <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
//                   </div>
//                 </div>
//                 <div className="flex gap-4">
//                   <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
//                   <div className="h-10 w-48 bg-gray-200 rounded animate-pulse" />
//                 </div>
//               </div>
//             </CardContent>
//           </Card>

//           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//             {Array.from({ length: 6 }).map((_, i) => (
//               <Card key={i} className="overflow-hidden">
//                 <div className="h-48 bg-gray-200 animate-pulse" />
//                 <CardContent className="p-4">
//                   <div className="flex items-start gap-3 mb-3">
//                     <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
//                     <div className="flex-1">
//                       <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-1" />
//                       <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
//                     </div>
//                   </div>
//                   <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
//                   <div className="space-y-2 mb-3">
//                     <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
//                     <div className="h-4 w-2/3 bg-gray-200 rounded animate-pulse" />
//                   </div>
//                   <div className="flex gap-2 mb-4">
//                     <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
//                     <div className="h-5 w-12 bg-gray-200 rounded animate-pulse" />
//                   </div>
//                   <div className="flex justify-between items-center pt-3 border-t">
//                     <div className="flex gap-4">
//                       <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
//                       <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
//                     </div>
//                     <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
//                   </div>
//                 </CardContent>
//               </Card>
//             ))}
//           </div>
//         </div>

//         <div className="lg:col-span-1 space-y-6">
//           <Card>
//             <CardHeader>
//               <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
//             </CardHeader>
//             <CardContent className="space-y-2">
//               {Array.from({ length: 6 }).map((_, i) => (
//                 <div key={i} className="p-3 rounded-lg">
//                   <div className="flex items-center justify-between">
//                     <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
//                     <div className="h-5 w-8 bg-gray-200 rounded animate-pulse" />
//                   </div>
//                 </div>
//               ))}
//             </CardContent>
//           </Card>
//         </div>
//       </div>
//     </div>
//   )
// }
