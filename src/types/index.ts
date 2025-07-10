// src/types.ts
export interface Gejala {
    id: string; // Firestore document ID
    kode: string;
    nama: string;
    deskripsi: string;
    kategori: string;
    perangkat: string[]; // e.g., ["computer", "laptop"]
    mass_function: Record<string, number>; // e.g., { "KK1": 0.5, "KK2": 0.3, "uncertainty": 0.2 }
    gambar: string; // URL gambar
    createdAt?: string;
    updatedAt?: string;
}

export interface MassFunctionEntry {
    kerusakan: string; // Kode kerusakan (e.g., "KK1")
    value: number;
}

export interface Kerusakan {
    id: string; // Firestore document ID
    kode: string; // e.g., "KK1"
    nama: string; // e.g., "Layar Tidak Menyala"
    deskripsi: string;
    tingkat_kerusakan: "Ringan" | "Sedang" | "Berat";
    estimasi_biaya: string;
    waktu_perbaikan: string;
    prior_probability: number; // float between 0.01 and 0.50
    solusi: string; // Markdown formatted text
    gejala_terkait: string[]; // Array of Gejala codes (e.g., ["G1", "G5"])
    createdAt?: string;
    updatedAt?: string;
}

// Tipe untuk data yang digabungkan di halaman massscope
export interface CombinedMassFunctionData {
    gejalaId: string;
    gejalaKode: string;
    gejalaNama: string;
    kategori: string;
    kerusakanKode: string;
    kerusakanNama: string;
    value: number;
    uncertainty: number;
}

export interface DiagnosisResult {
    kode: string
    nama: string
    belief: number
    plausibility: number
    uncertainty: number
    solusi: string
    tingkat_kerusakan?: string
    estimasi_biaya?: string
    waktu_perbaikan?: string
    confidence_level: string
    contributing_symptoms: string[]
    mass_assignments: Record<string, number>
}

export interface StoredDiagnosisResult {
    input: string[]
    result: DiagnosisResult[]
    analysis: {
        accuracy_percentage: number
        dominant_category: string
        severity_level: string
    }
    timestamp: string
}

export interface ForumPost {
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
    isReported?: boolean
    reportCount?: number
    media?: MediaItem[]
    thumbnail?: string
}

export interface ForumReply {
    id: string
    postId?: string
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
    isReported?: boolean
    reportCount?: number
}

export interface MediaItem {
    type: "image" | "video"
    url: string
    thumbnail?: string
}

export interface ReactionMap {
    [key: string]: string[]
}

export interface User {
    id: string
    username: string
    email: string
    avatar?: string
    role: "admin" | "user"
    createdAt: string
    lastActive: string
    isActive: boolean
    stats?: {
        postsCount: number
        repliesCount: number
        likesReceived: number
    }
}

export interface MassFunctionEntry {
    kerusakan: string
    value: number
}

export interface ForumCategory {
    id: string
    name: string
    icon: string
    description?: string
}

export interface UserTokenData {
    userId: string
    username: string
    dailyTokens: number
    maxDailyTokens: number
    lastResetDate: string
    totalUsage: number
}

export interface APIResponse<T = unknown> {
    success: boolean
    data?: T
    error?: string
    message?: string
}

export interface DiagnosisAPIRequest {
    gejala: string[]
    perangkat?: string | null
}

export interface ChatMessage {
    id: string
    role: "user" | "assistant"
    content: string
    timestamp: Date
    image?: string
    model?: string
}
