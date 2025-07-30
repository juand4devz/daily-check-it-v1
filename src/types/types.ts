// types/types.ts
// import { User as NextAuthUser } from "next-auth"; // Import User dari next-auth untuk extend

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

// NEW: Tipe untuk Notifikasi
export type NotificationType =
    "forum_comment_on_post" |
    "forum_reply_to_comment" |
    "forum_like_post" |
    "forum_mention" |
    "forum_solution_marked" |
    "system";

export interface Notification {
    id: string; // Firestore document ID
    userId: string; // Recipient user ID
    type: NotificationType;
    title: string;
    message: string;
    read: boolean;
    createdAt: string; // ISO string

    link?: string | null; // URL relatif ke aplikasi (e.g., /forum/post-id#comment-id)
    actorId?: string | null; // ID dari user yang melakukan aksi
    actorUsername?: string | null; // Username dari user yang melakukan aksi
    postId?: string | null; // ID dari forum post terkait
    postTitle?: string | null; // Judul dari forum post terkait
    replyId?: string | null; // <-- PERBAIKAN: Tambahkan ini untuk ID balasan/komentar
    commentContentPreview?: string | null; // <-- PERBAIKAN: Tambahkan ini untuk pratinjau konten komentar
}

// NEW: Tipe untuk Bookmark
export interface Bookmark {
    id: string; // ID Bookmark (biasanya sama dengan postId)
    userId: string; // ID pengguna yang membookmark
    postId: string; // ID Post Forum yang dibookmark
    bookmarkedAt: string; // Waktu bookmark dibuat (ISO string)
    bookmarkNote?: string; // Catatan opsional dari pengguna
}

// --- Reporting Types ---
export type ReportEntityType = "forum_post" | "forum_reply" | "user";

export type ReportReason =
    | "spam"
    | "inappropriate_content" // Konten tidak pantas
    | "hate_speech" // Ujaran kebencian
    | "harassment" // Pelecehan
    | "misinformation" // Informasi palsu
    | "copyright_violation" // Pelanggaran hak cipta
    | "self_harm" // Melukai diri sendiri
    | "other_violation" // Pelanggaran lainnya
    | "impersonation" // Peniruan identitas (untuk pengguna)
    | "illegal_activity"; // Aktivitas ilegal

export interface Report {
    id: string; // Firestore document ID
    reporterId: string; // ID pengguna yang melaporkan
    reporterUsername: string; // Username pelapor (denormalisasi)
    reportType: ReportEntityType; // Jenis entitas yang dilaporkan
    entityId: string; // ID entitas yang dilaporkan (postId, replyId, userId)
    reason: ReportReason; // Alasan laporan (enum/literal)
    details?: string | null; // <-- PERBAIKAN: Tambahkan | null
    status: "pending" | "resolved" | "dismissed"; // Status laporan
    createdAt: string; // ISO string
    resolvedAt?: string | null; // <-- PERBAIKAN: Tambahkan | null
    resolvedBy?: string | null; // <-- PERBAIKAN: Tambahkan | null

    // Denormalized data for quick access in admin panel
    entityTitle?: string | null; // <-- PERBAIKAN: Tambahkan | null
    entityContentPreview?: string | null; // <-- PERBAIKAN: Tambahkan | null
    entityUsername?: string | null; // <-- PERBAIKAN: Tambahkan | null
    entityAuthorId?: string | null; // <-- PERBAIKAN: Tambahkan | null
    entityAuthorUsername?: string | null; // <-- PERBAIKAN: Tambahkan | null
    entityLink?: string | null; // <-- PERBAIKAN: Tambahkan | null
}

// Mapping reasons to more user-friendly labels (for dialog and display)
export const REPORT_REASONS_MAP: Record<ReportEntityType, { value: ReportReason; label: string; description: string }[]> = {
    "forum_post": [
        { value: "spam", label: "Spam", description: "Promosi tidak relevan atau berulang." },
        { value: "inappropriate_content", label: "Konten Tidak Pantas", description: "Mengandung pornografi, kekerasan, atau konten dewasa." },
        { value: "hate_speech", label: "Ujaran Kebencian", description: "Menyerang individu atau kelompok berdasarkan atribut tertentu." },
        { value: "misinformation", label: "Informasi Palsu", description: "Menyebarkan informasi yang tidak benar atau menyesatkan." },
        { value: "copyright_violation", label: "Pelanggaran Hak Cipta", description: "Menggunakan materi berhak cipta tanpa izin." },
        { value: "other_violation", label: "Pelanggaran Lainnya", description: "Melanggar aturan komunitas lainnya." },
    ],
    "forum_reply": [
        { value: "spam", label: "Spam", description: "Promosi tidak relevan atau berulang." },
        { value: "inappropriate_content", label: "Konten Tidak Pantas", description: "Mengandung pornografi, kekerasan, atau konten dewasa." },
        { value: "hate_speech", label: "Ujaran Kebencian", description: "Menyerang individu atau kelompok berdasarkan atribut tertentu." },
        { value: "harassment", label: "Pelecehan", description: "Mengancam atau mengintimidasi pengguna lain." },
        { value: "other_violation", label: "Pelanggaran Lainnya", description: "Melanggar aturan komunitas lainnya." },
    ],
    "user": [
        { value: "impersonation", label: "Peniruan Identitas", description: "Berpura-pura menjadi orang atau entitas lain." },
        { value: "harassment", label: "Pelecehan", description: "Mengancam atau mengintimidasi pengguna lain." },
        { value: "spam", label: "Spam (Pengguna)", description: "Pengguna secara konsisten memposting spam." },
        { value: "illegal_activity", label: "Aktivitas Ilegal", description: "Terlibat dalam aktivitas ilegal." },
        { value: "other_violation", label: "Pelanggaran Lainnya", description: "Melanggar aturan komunitas lainnya." },
    ]
};
