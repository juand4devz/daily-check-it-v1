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
