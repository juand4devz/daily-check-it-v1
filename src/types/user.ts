export interface User {
    id: string
    username: string
    email: string
    role: "admin" | "user"
    loginType: "email" | "github" | "google"
    avatar: string
    bio: string
    banner: string
    location: string
    phone: string
    website: string
    github: string
    twitter: string
    linkedin: string
    instagram: string
    createdAt: string
    updatedAt: string
    lastLogin: string
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
    isResolved?: boolean
    solutionId?: string
    isPinned?: boolean
    isArchived?: boolean
    thumbnail?: string
    media?: MediaItem[]
    views?: number
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
    reactions?: ReactionMap
    media?: MediaItem[]
    isEdited?: boolean
    editedAt?: string
    replies?: ForumReply[]
}

export interface MediaItem {
    type: "image" | "video"
    url: string
    thumbnail?: string
}

export interface ReactionMap {
    [key: string]: string[]
}

export interface Gejala {
    kode: string
    nama: string
    deskripsi: string
    kategori: string
    perangkat: string[]
    mass_function: Record<string, number>
    gambar: string
}

export interface Kerusakan {
    kode: string
    nama: string
    deskripsi: string
    tingkat_kerusakan: "Ringan" | "Sedang" | "Berat"
    estimasi_biaya: string
    waktu_perbaikan: string
    prior_probability: number
    solusi: string
    gejala_terkait: string[]
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
    mass_assignments: { [key: string]: number }
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
