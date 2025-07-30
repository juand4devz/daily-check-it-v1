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
    LucideIcon,
} from "lucide-react"

// Import Forum types from our centralized types/forum.ts
import {
    ForumPost,
    ForumReply,
    ForumMedia,
    ForumType,
    ForumCategory,
    EMOJI_REACTIONS,
    NotificationType,
} from "@/types/forum"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

export type { ForumPost, ForumReply, ForumMedia, ForumType, ForumCategory, EMOJI_REACTIONS, NotificationType };


export const FORUM_TYPES: ForumType[] = [
    {
        "id": "pertanyaan",
        "name": "Pertanyaan",
        "description": "Ajukan pertanyaan dan dapatkan solusi dari komunitas.",
        "icon": "help-circle",
        "color": "bg-blue-600",
        "allowSolution": true,
        "allowTags": true
    },
    {
        "id": "tutorial",
        "name": "Tutorial",
        "description": "Bagikan panduan langkah demi langkah tentang topik teknis.",
        "icon": "book-open",
        "color": "bg-green-600",
        "allowSolution": false,
        "allowTags": true
    },
    {
        "id": "pengalaman",
        "name": "Pengalaman",
        "description": "Ceritakan pengalaman Anda dalam dunia teknologi.",
        "icon": "user-check",
        "color": "bg-purple-600",
        "allowSolution": false,
        "allowTags": true
    },
    {
        "id": "berita",
        "name": "Berita & Diskusi",
        "description": "Diskusikan berita terbaru atau topik umum di bidang teknologi.",
        "icon": "newspaper",
        "color": "bg-orange-600",
        "allowSolution": false,
        "allowTags": true
    },
    {
        "id": "lainnya",
        "name": "Lainnya",
        "description": "Topik umum yang tidak masuk kategori spesifik.",
        "icon": "graduation-cap",
        "color": "bg-gray-600",
        "allowSolution": false,
        "allowTags": true
    }
];

export const FORUM_CATEGORIES: ForumCategory[] = [
    { "id": "hardware", "name": "Hardware", "description": "Diskusi seputar komponen fisik komputer.", "color": "bg-indigo-500", "icon": "hardware" },
    { "id": "software", "name": "Software", "description": "Pembahasan tentang aplikasi, sistem operasi, dan programming.", "color": "bg-teal-500", "icon": "software" },
    { "id": "network", "name": "Network", "description": "Masalah dan solusi terkait jaringan komputer dan internet.", "color": "bg-cyan-500", "icon": "network" },
    { "id": "gaming", "name": "Gaming", "description": "Diskusi tentang game, hardware gaming, dan komunitas gamer.", "color": "bg-red-500", "icon": "gaming" },
    { "id": "diagnosa", "name": "Diagnosa", "description": "Bantuan dan solusi untuk masalah teknis atau error sistem.", "color": "bg-yellow-500", "icon": "diagnosa" },
    { "id": "lainnya", "name": "Lainnya", "description": "Topik lain yang tidak termasuk kategori di atas.", "color": "bg-gray-500", "icon": "lainnya" }
];


export const typeIconsMap: { [key: string]: LucideIcon } = {
    "help-circle": HelpCircle,
    "book-open": BookOpen,
    "user-check": UserCheck,
    "graduation-cap": GraduationCap,
    newspaper: Newspaper,
};

export const categoryIconsMap: { [key: string]: LucideIcon } = {
    hardware: Monitor,
    software: Cpu,
    network: Wifi,
    gaming: Gamepad2,
    diagnosa: Stethoscope,
    lainnya: HelpCircle,
};

export function getTypeIcon(typeId: string): LucideIcon {
    const type = FORUM_TYPES.find((t) => t.id === typeId);
    const IconComponent = (type ? typeIconsMap[type.icon] : undefined) ?? HelpCircle;
    return IconComponent;
}

export function getCategoryIcon(categoryId: string): LucideIcon {
    const category = FORUM_CATEGORIES.find((c) => c.id === categoryId);
    const IconComponent = (category ? categoryIconsMap[category.icon] : undefined) ?? HelpCircle;
    return IconComponent;
}

export const gradientClasses = [
    "bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500",
    "bg-gradient-to-br from-green-400 via-blue-500 to-purple-600",
    "bg-gradient-to-br from-yellow-400 via-red-500 to-pink-500",
    "bg-gradient-to-br from-purple-400 via-pink-500 to-red-500",
    "bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500",
    "bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600",
];

export function getRandomGradient(id: string): string {
    const index = parseInt(id.replace(/\D/g, ''), 10) % gradientClasses.length;
    return gradientClasses[index];
}

export function getReadingTime(text: string): string {
    if (!text) {
        return "1 min read";
    }
    const wordsPerMinute = 250;
    const words = text.split(/\s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);

    if (minutes === 0) {
        return "Less than 1 min read";
    }
    return `${minutes} min read`;
}

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024;
export const MAX_MEDIA_FILES = 3;

export function validateFile(file: File, type: "thumbnail" | "media"): string | null {
    if (file.type.startsWith("image/")) {
        if (file.size > MAX_IMAGE_SIZE) {
            return `Gambar terlalu besar (maks ${MAX_IMAGE_SIZE / 1024 / 1024}MB)`;
        }
    } else if (file.type.startsWith("video/") && type === "media") {
        if (file.size > MAX_VIDEO_SIZE) {
            return `Video terlalu besar (maks ${MAX_VIDEO_SIZE / 1024 / 1024}MB)`;
        }
    } else {
        return "Format file tidak didukung";
    }
    return null;
}

export function generatePostUrl(postId: string): string {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/forum/${postId}`;
    }
    return `/forum/${postId}`;
}

export function generateCommentUrl(postId: string, commentId: string): string {
    if (typeof window !== 'undefined') {
        return `${window.location.origin}/forum/${postId}#comment-${commentId}`;
    }
    return `/forum/${postId}#comment-${commentId}`;
}

export async function copyToClipboard(text: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (error) {
        console.error("Error copying to clipboard:", error);
        return false;
    }
}

export function calculatePostStats(posts: ForumPost[]) {
    const totalPosts = posts.length;
    const totalReplies = posts.reduce((sum, post) => sum + post.replies, 0);
    const resolvedPosts = posts.filter((p) => p.isResolved).length;
    const today = new Date();
    const todayPosts = posts.filter((p) => {
        const postDate = new Date(p.createdAt);
        return postDate.toDateString() === today.toDateString();
    }).length;

    return {
        totalPosts,
        totalReplies,
        resolvedPosts,
        todayPosts,
        resolutionRate: totalPosts > 0 ? Math.round((resolvedPosts / totalPosts) * 100) : 0,
    };
}

export function getCategoryStats(posts: ForumPost[]) {
    const stats = FORUM_CATEGORIES.map((category) => ({
        value: category.id,
        label: category.name,
        count: posts.filter((p) => p.category === category.id).length,
    }));

    stats.unshift({
        value: "all",
        label: "Semua Kategori",
        count: posts.length,
    });

    return stats;
}

export interface FormErrors {
    [key: string]: string;
}

export function validatePostForm(data: {
    title: string;
    content: string;
    category: string;
    tags: string[];
    description: string;
}): FormErrors {
    const errors: FormErrors = {};

    if (!data.title.trim()) {
        errors.title = "Judul harus diisi";
    } else if (data.title.length < 10) {
        errors.title = "Judul minimal 10 karakter";
    } else if (data.title.length > 200) {
        errors.title = "Judul maksimal 200 karakter";
    }

    if (!data.description.trim()) {
        errors.description = "Deskripsi harus diisi";
    } else if (data.description.length < 10) {
        errors.description = "Deskripsi minimal 10 karakter";
    } else if (data.description.length > 300) {
        errors.description = "Deskripsi maksimal 300 karakter";
    }

    if (!data.content.trim()) {
        errors.content = "Konten harus diisi";
    } else if (data.content.length < 20) {
        errors.content = "Konten minimal 20 karakter";
    } else if (data.content.length > 5000) {
        errors.content = "Konten maksimal 5000 karakter";
    }

    if (!data.category) {
        errors.category = "Kategori harus dipilih";
    }

    if (data.tags) {
        if (data.tags.length > 5) {
            errors.tags = "Maksimal 5 tag dapat ditambahkan";
        }
        if (data.tags.some((tag) => tag.length > 20)) {
            errors.tags = "Setiap tag maksimal 20 karakter";
        }
    }

    return errors;
}

export function generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Helper function to build reply tree from flat list
export interface ProcessedForumReply extends ForumReply { // Perbaikan: Definisikan di sini dan ekspor
    children: ProcessedForumReply[];
}

export const buildReplyTree = (replies: ForumReply[]): ProcessedForumReply[] => {
    const map = new Map<string, ProcessedForumReply>();
    const roots: ProcessedForumReply[] = [];

    replies.forEach((reply) => {
        map.set(reply.id, { ...reply, children: [] });
    });

    replies.forEach((reply) => {
        const processedReply = map.get(reply.id)!;
        if (reply.parentId) {
            const parent = map.get(reply.parentId);
            if (parent) {
                parent.children.push(processedReply);
            } else {
                roots.push(processedReply);
            }
        } else {
            roots.push(processedReply);
        }
    });

    map.forEach((value) => {
        value.children.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

    return roots.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

export const flattenReplies = (replies: ProcessedForumReply[]): ForumReply[] => { // Perbaikan: Definisikan dan ekspor
    let flat: ForumReply[] = [];
    replies.forEach((reply) => {
        const { children, ...rest } = reply;
        flat.push(rest);
        if (children && children.length > 0) {
            flat = flat.concat(flattenReplies(children));
        }
    });
    return flat;
};

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