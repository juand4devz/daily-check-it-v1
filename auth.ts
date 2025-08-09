// auth.ts
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GitHubProvider from "next-auth/providers/github";
import { compare } from "bcrypt";
import { login, loginWithGithub, loginWithGoogle } from "@/lib/firebase/service";
import type { User } from "@/types/types";
import type {
    // Account,
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
            role: "admin" | "user" | "banned";
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
        role: "admin" | "user" | "banned"; // Tambahkan 'banned' role di JWT juga
        loginType: "email" | "github" | "google";
        avatar: string; // Properti avatar kustom yang diinginkan
        dailyTokens: number;
        maxDailyTokens: number;
        lastResetDate: string;
        totalUsage: number;
        // Tidak perlu mendeklarasikan image?: string; di sini jika kita ingin menghapusnya sepenuhnya
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
                        // PERBAIKAN: Mengembalikan objek user yang lengkap, tidak hanya properti yang ada di `User` NextAuth bawaan.
                        const { ...userWithoutPassword } = userFromDb;
                        return userWithoutPassword; // Mengembalikan objek user lengkap tanpa password
                    }
                }
                return null;
            }
        }),
        GoogleProvider({
            clientId: process.env.AUTH_GOOGLE_ID as string,
            clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
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
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
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
                // Jika sudah ada token dan email, coba ambil dari DB untuk memastikan data terbaru
                const userFromDb = await login({ email: token.email as string });
                if (userFromDb) {
                    dbUser = userFromDb as User;
                }
            }

            if (dbUser) {
                token.id = dbUser.id;
                // PERBAIKAN: Perbarui semua properti token dengan data dari dbUser
                token.username = dbUser.username;
                token.email = dbUser.email;
                token.role = dbUser.role;
                token.loginType = dbUser.loginType;
                token.avatar = dbUser.avatar;
                token.dailyTokens = dbUser.dailyTokens;
                token.maxDailyTokens = dbUser.maxDailyTokens;
                token.lastResetDate = dbUser.lastResetDate;
                token.totalUsage = dbUser.totalUsage;
                token.isBanned = dbUser.isBanned;

                delete token.image; // Hapus properti `image` bawaan NextAuth
                delete token.name; // Hapus properti `name` bawaan NextAuth

                // Lakukan pengecekan token harian di sini juga
                const todayDate = getTodayDateString();
                if (dbUser.lastResetDate !== todayDate) {
                    token.dailyTokens = dbUser.maxDailyTokens;
                    token.lastResetDate = todayDate;
                }
            }
            return token;
        },
        async session({ session, token }) {
            // PERBAIKAN: Sesuaikan penyesuaian session agar sesuai dengan type yang sudah dideklarasikan
            if (session.user && token) {
                session.user.id = token.id as string;
                session.user.username = token.username as string;
                session.user.email = token.email as string;
                session.user.role = token.role as "admin" | "user" | "banned";
                session.user.loginType = token.loginType as "email" | "github" | "google";
                session.user.avatar = token.avatar as string;
                session.user.dailyTokens = token.dailyTokens as number;
                session.user.maxDailyTokens = token.maxDailyTokens as number;
                session.user.lastResetDate = token.lastResetDate as string;
                session.user.totalUsage = token.totalUsage as number;

                // Hapus properti bawaan yang tidak diperlukan lagi
                delete session.user.image;
                delete session.user.name;

                // Logic reset token harian
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