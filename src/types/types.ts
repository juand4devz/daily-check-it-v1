export interface User {
    id: string; // Firestore document ID
    username: string;
    email: string;
    password?: string;
    role: "admin" | "user";
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

    // Properti token dari UserTokenData, digabung ke User
    dailyTokens: number;
    maxDailyTokens: number; // Misalnya, 1000 token per hari
    lastResetDate: string; // Tanggal terakhir reset token (ISO string, hanya tanggal YYYY-MM-DD)
    totalUsage: number; // Total token yang sudah digunakan sepanjang waktu
}
