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