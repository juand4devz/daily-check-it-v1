// /lib/firebase/service.ts
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    updateDoc,
    where,
    deleteDoc,
    runTransaction,
    orderBy,
    limit,
    writeBatch, // <--- Tambahkan ini
} from "firebase/firestore";
import { clientDb } from "./firebase-client";
import bcrypt from "bcrypt";
import type { Report, User, UserTokenData } from "@/types/types";
import type { ForumPost, ForumReply, ForumBookmark, Notification, EmojiReactionKey } from "@/types/forum"; // Import new types

// Constants for default user data
const DEFAULT_MAX_DAILY_TOKENS = 10;
const DEFAULT_BIO = "Halo! Saya pengguna baru DailyCheckIt.";
const DEFAULT_AVATAR_URL = ""; // A good default for new users

export function getTodayDateString(): string {
    const now = new Date();
    // Offset WIB adalah +7 jam dari UTC
    const wibOffset = 7 * 60 * 60 * 1000;
    const nowWIB = new Date(now.getTime() + wibOffset);
    const year = nowWIB.getUTCFullYear();
    const month = (nowWIB.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = nowWIB.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function isPast7AMWIB(): boolean {
    const now = new Date();
    const wibOffset = 7 * 60 * 60 * 1000;
    const nowWIB = new Date(now.getTime() + wibOffset);
    return nowWIB.getUTCHours() >= 7;
}

// --- NEW/UPDATED ADMIN SERVICE FUNCTIONS ---
// Mengambil semua pengguna (digunakan di admin panel)
export async function getAllUsers(): Promise<User[]> {
    try {
        const usersCollectionRef = collection(clientDb, "users");
        const snapshot = await getDocs(usersCollectionRef);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<User, 'id'>)
        }));
    } catch (error) {
        console.error("Error getting all users:", error);
        return [];
    }
}

// Memperbarui role atau status pengguna (digunakan di admin panel)
export async function updateUserAdminAction(userId: string, data: Partial<User> & { resetTokens?: boolean }): Promise<{ status: boolean; message: string }> {
    const userDocRef = doc(clientDb, "users", userId);
    try {
        const docSnapshot = await getDoc(userDocRef);
        if (!docSnapshot.exists()) {
            return { status: false, message: "Pengguna tidak ditemukan." };
        }

        const existingUser = docSnapshot.data() as User;
        const updateData: Partial<User> = { updatedAt: new Date().toISOString() };

        if (data.role !== undefined) updateData.role = data.role;
        if (data.isBanned !== undefined) updateData.isBanned = data.isBanned;

        if (data.resetTokens) {
            updateData.dailyTokens = existingUser.maxDailyTokens || DEFAULT_MAX_DAILY_TOKENS;
            updateData.totalUsage = 0;
            updateData.lastResetDate = getTodayDateString();
        }

        await updateDoc(userDocRef, updateData);
        return { status: true, message: "Pengguna berhasil diperbarui." };
    } catch (error) {
        console.error("Error updating user admin action:", error);
        return { status: false, message: `Gagal memperbarui pengguna: ${(error as Error).message}` };
    }
}

export async function manageUserTokens(
    userId: string,
    tokensUsed: number = 0,
    action: 'decrement' | 'reset' = 'decrement'
): Promise<{ status: boolean; message?: string; tokenData?: UserTokenData }> {
    const userDocRef = doc(clientDb, "users", userId);

    try {
        const result = await runTransaction(clientDb, async (transaction) => {
            const userDoc = await transaction.get(userDocRef);
            if (!userDoc.exists()) {
                throw new Error("Pengguna tidak ditemukan.");
            }

            const userData = userDoc.data() as User;
            const todayDateWIB = getTodayDateString();

            // Cek dan reset token harian secara transaksional
            let { dailyTokens, lastResetDate, totalUsage, maxDailyTokens = DEFAULT_MAX_DAILY_TOKENS } = userData;

            if (lastResetDate !== todayDateWIB && isPast7AMWIB()) {
                dailyTokens = maxDailyTokens;
                lastResetDate = todayDateWIB;
            }

            if (action === 'decrement') {
                if (dailyTokens < tokensUsed) {
                    throw new Error("Token harian tidak mencukupi.");
                }
                dailyTokens -= tokensUsed;
                totalUsage += tokensUsed;
            } else if (action === 'reset') {
                dailyTokens = maxDailyTokens;
                totalUsage = 0;
            }

            const updatedTokenData: UserTokenData = {
                id: userId,
                dailyTokens,
                maxDailyTokens,
                lastResetDate,
                totalUsage,
            };

            transaction.update(userDocRef, {
                dailyTokens,
                totalUsage,
                lastResetDate,
                updatedAt: new Date().toISOString(),
            });

            return updatedTokenData;
        });

        return { status: true, message: "Token berhasil diperbarui.", tokenData: result };
    } catch (error) {
        console.error("Error managing user tokens:", error);
        return { status: false, message: (error as Error).message };
    }
}

// Menghapus pengguna secara permanen
export async function deleteUser(userId: string): Promise<{ status: boolean; message: string }> {
    const userDocRef = doc(clientDb, "users", userId);
    try {
        await deleteDoc(userDocRef);
        return { status: true, message: "Pengguna berhasil dihapus." };
    } catch (error) {
        console.error("Error deleting user:", error);
        return { status: false, message: `Gagal menghapus pengguna: ${(error as Error).message}` };
    }
}

// Fungsi untuk memeriksa dan mereset token harian secara otomatis
export async function checkAndResetDailyTokens(userId: string): Promise<{
    updated: boolean;
    tokenData: UserTokenData;
}> {
    const userDocRef = doc(clientDb, "users", userId);
    const result = { updated: false, tokenData: {} as UserTokenData };

    await runTransaction(clientDb, async (transaction) => {
        const userDoc = await transaction.get(userDocRef);

        if (!userDoc.exists()) {
            throw new Error("User not found.");
        }

        const userData = userDoc.data() as User;
        const todayDateWIB = getTodayDateString();

        let { dailyTokens, lastResetDate, totalUsage, maxDailyTokens = DEFAULT_MAX_DAILY_TOKENS } = userData;

        if (lastResetDate !== todayDateWIB && isPast7AMWIB()) {
            dailyTokens = maxDailyTokens;
            lastResetDate = todayDateWIB;
            result.updated = true;

            transaction.update(userDocRef, {
                dailyTokens,
                lastResetDate,
                updatedAt: new Date().toISOString(),
            });
        }

        result.tokenData = {
            id: userId,
            dailyTokens,
            maxDailyTokens,
            lastResetDate,
            totalUsage,
        };
    });

    return result;
}

export async function getRetriveData(collectionName: string) {
    const snapshot = await getDocs(collection(clientDb, collectionName));
    const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    }));
    return data;
}

export async function retriveDataById<T>(collectionName: string, id: string): Promise<T | null> {
    const snapshot = await getDoc(doc(clientDb, collectionName, id));
    if (snapshot.exists()) {
        return { id: snapshot.id, ...(snapshot.data() as T) } as T;
    }
    return null;
}

// --- NEW FUNCTION: Get User by ID ---
export async function getUserById(userId: string): Promise<User | null> {
    return retriveDataById<User>("users", userId);
}

export async function getForumReplyById(replyId: string): Promise<ForumReply | null> {
    return retriveDataById<ForumReply>("forumReplies", replyId);
}

export async function register(
    data: {
        username: string;
        email: string;
        password: string;
    }
) {
    const usersCollectionRef = collection(clientDb, "users");
    const q = query(usersCollectionRef, where("email", "==", data.email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
        return { status: false, statusCode: 400, message: "Email sudah terdaftar." };
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const now = new Date().toISOString();
    const todayDate = getTodayDateString();

    const newUser: Omit<User, 'id'> = {
        username: data.username,
        email: data.email,
        role: "user",
        loginType: "email",
        avatar: DEFAULT_AVATAR_URL,
        bio: DEFAULT_BIO,
        banner: "",
        location: "",
        phone: "",
        website: "",
        github: "",
        twitter: "",
        linkedin: "",
        instagram: "",
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
        dailyTokens: DEFAULT_MAX_DAILY_TOKENS,
        maxDailyTokens: DEFAULT_MAX_DAILY_TOKENS,
        lastResetDate: todayDate,
        totalUsage: 0,
        password: hashedPassword,
    };

    try {
        await addDoc(usersCollectionRef, newUser);
        return { status: true, statusCode: 201, message: "Pendaftaran berhasil!" };
    } catch (error) {
        console.error("Firebase registration error:", error);
        return { status: false, statusCode: 500, message: "Pendaftaran gagal. Silakan coba lagi." };
    }
}

export async function login(data: { email: string }): Promise<User | null> {
    const usersCollectionRef = collection(clientDb, "users");
    const q = query(usersCollectionRef, where("email", "==", data.email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null; // User not found
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data() as User;

    // PERBAIKAN: Pastikan properti `username` ada dan diisi dari `username` di database.
    // Properti `avatar` juga harus diperiksa dan diisi dengan placeholder jika kosong.
    const userWithoutPassword = {
        ...userData,
        id: userDoc.id,
        username: userData.username, // Pastikan username diambil
        avatar: userData.avatar || "/placeholder.svg", // Gunakan placeholder jika avatar kosong
    };

    return userWithoutPassword;
}

async function handleOAuthLogin(email: string, name: string, loginType: User['loginType'], avatarUrl: string | null | undefined): Promise<User> {
    const usersCollectionRef = collection(clientDb, "users");
    const q = query(usersCollectionRef, where("email", "==", email));
    const snapshot = await getDocs(q);
    const now = new Date().toISOString();
    const todayDate = getTodayDateString();

    let user: User;

    if (!snapshot.empty) {
        const userDoc = snapshot.docs[0];
        const existingData = userDoc.data() as User;

        const updateData: Partial<User> = {
            username: name || existingData.username,
            lastLogin: now,
            updatedAt: now,
            loginType: loginType,
        };

        const isExistingAvatarDefault = existingData.avatar === DEFAULT_AVATAR_URL;
        const isExistingAvatarFromProvider = existingData.avatar === avatarUrl;

        if (avatarUrl !== undefined && (isExistingAvatarDefault || isExistingAvatarFromProvider)) {
            updateData.avatar = avatarUrl || DEFAULT_AVATAR_URL;
        }

        if (existingData.lastResetDate !== todayDate) {
            updateData.dailyTokens = existingData.maxDailyTokens || DEFAULT_MAX_DAILY_TOKENS;
            updateData.lastResetDate = todayDate;
        }

        await updateDoc(doc(clientDb, "users", userDoc.id), updateData);
        user = { ...existingData, ...updateData };
    } else {
        const newUser: Omit<User, 'id'> = {
            username: name,
            email: email,
            role: "user",
            loginType: loginType,
            avatar: avatarUrl || DEFAULT_AVATAR_URL,
            bio: DEFAULT_BIO,
            banner: "",
            location: "",
            phone: "",
            website: "",
            github: "",
            twitter: "",
            linkedin: "",
            instagram: "",
            createdAt: now,
            updatedAt: now,
            lastLogin: now,
            dailyTokens: DEFAULT_MAX_DAILY_TOKENS,
            maxDailyTokens: DEFAULT_MAX_DAILY_TOKENS,
            lastResetDate: todayDate,
            totalUsage: 0,
        };
        const docRef = await addDoc(usersCollectionRef, newUser);
        user = { id: docRef.id, ...newUser };
    }
    return user;
}

export async function loginWithGoogle(data: { email: string; name?: string | null; image?: string | null }): Promise<User> {
    return handleOAuthLogin(data.email, data.name || data.email.split('@')[0], "google", data.image);
}

export async function loginWithGithub(data: { email: string; name?: string | null; image?: string | null }): Promise<User> {
    const userEmail = data.email || `${data.name?.replace(/\s/g, '').toLowerCase() || Math.random().toString(36).substring(7)}@github.com`;
    return handleOAuthLogin(userEmail, data.name || userEmail.split('@')[0], "github", data.image);
}

export async function updateUserProfile(userId: string, updatedFields: Partial<User>): Promise<{ status: boolean; message?: string }> {
    const userDocRef = doc(clientDb, "users", userId);
    try {
        await updateDoc(userDocRef, {
            ...updatedFields,
            updatedAt: new Date().toISOString(),
        });
        return { status: true, message: "Profil berhasil diperbarui." };
    } catch (error) {
        console.error("Error updating user profile:", error);
        return { status: false, message: "Gagal memperbarui profil." };
    }
}

export async function createForumPost(postData: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'replies' | 'views' | 'isResolved' | 'isPinned' | 'isArchived'>): Promise<{ status: boolean; postId?: string; message: string }> {
    try {
        const postsCollectionRef = collection(clientDb, "forumPosts");
        const newPost: Omit<ForumPost, 'id'> = {
            ...postData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            likes: 0,
            likedBy: [],
            replies: 0,
            views: 0,
            isResolved: false,
            isPinned: false,
            isArchived: false,
        };
        const docRef = await addDoc(postsCollectionRef, newPost);
        return { status: true, postId: docRef.id, message: "Postingan forum berhasil dibuat." };
    } catch (error) {
        console.error("Error creating forum post:", error);
        return { status: false, message: "Gagal membuat postingan forum." };
    }
}

export async function getForumPosts(): Promise<ForumPost[]> {
    try {
        const postsCollectionRef = collection(clientDb, "forumPosts");
        const q = query(postsCollectionRef, orderBy("createdAt", "desc")); // Order by newest first
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<ForumPost, 'id'>)
        }));
    } catch (error) {
        console.error("Error getting forum posts:", error);
        return [];
    }
}

export async function getForumPostById(postId: string): Promise<ForumPost | null> {
    return retriveDataById<ForumPost>("forumPosts", postId);
}

export async function updateForumPost(postId: string, updateData: Partial<ForumPost>): Promise<{ status: boolean; message: string }> {
    try {
        const postRef = doc(clientDb, "forumPosts", postId);
        await updateDoc(postRef, { ...updateData, updatedAt: new Date().toISOString() });
        return { status: true, message: "Postingan forum berhasil diperbarui." };
    } catch (error) {
        console.error("Error updating forum post:", error);
        return { status: false, message: "Gagal memperbarui postingan forum." };
    }
}

export async function deleteForumPost(postId: string): Promise<{ status: boolean; message: string }> {
    try {
        await deleteDoc(doc(clientDb, "forumPosts", postId));
        // TODO: Also delete associated replies, likes, bookmarks, and notifications
        return { status: true, message: "Postingan forum berhasil dihapus." };
    } catch (error) {
        console.error("Error deleting forum post:", error);
        return { status: false, message: "Gagal menghapus postingan forum." };
    }
}

export async function togglePostLike(postId: string, userId: string): Promise<{ status: boolean; liked: boolean; newLikeCount: number; message: string }> {
    const postRef = doc(clientDb, "forumPosts", postId);

    try {
        const result = await runTransaction(clientDb, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists()) {
                throw new Error("Post not found.");
            }

            const postData = postDoc.data() as ForumPost;
            let likedBy = postData.likedBy || [];
            let newLikeCount = postData.likes;
            let liked = false;

            if (likedBy.includes(userId)) {
                // Unlike
                likedBy = likedBy.filter(id => id !== userId);
                newLikeCount--;
                liked = false;
            } else {
                // Like
                likedBy.push(userId);
                newLikeCount++;
                liked = true;
            }

            transaction.update(postRef, {
                likedBy: likedBy,
                likes: newLikeCount,
                updatedAt: new Date().toISOString(),
            });

            return { liked, newLikeCount };
        });

        return { status: true, ...result, message: result.liked ? "Post disukai." : "Like dibatalkan." };

    } catch (error: any) {
        console.error("Error toggling post like:", error);
        return { status: false, liked: false, newLikeCount: 0, message: error.message || "Gagal mengubah status like." };
    }
}

export async function incrementPostViewCount(postId: string): Promise<{ status: boolean; newViewCount: number; message: string }> {
    const postRef = doc(clientDb, "forumPosts", postId);

    try {
        const result = await runTransaction(clientDb, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists()) {
                throw new Error("Post not found.");
            }

            const postData = postDoc.data() as ForumPost;
            const newViewCount = (postData.views || 0) + 1;

            transaction.update(postRef, {
                views: newViewCount,
                updatedAt: new Date().toISOString(),
            });

            return { newViewCount };
        });

        return { status: true, ...result, message: "Jumlah views berhasil diperbarui." };
    } catch (error: any) {
        console.error("Error incrementing post view count:", error);
        return { status: false, newViewCount: 0, message: error.message || "Gagal memperbarui jumlah views." };
    }
}

export async function togglePostPinStatus(postId: string, isPinned: boolean, userId: string): Promise<{ status: boolean; message: string }> {
    const postRef = doc(clientDb, "forumPosts", postId);
    try {
        // Fetch user to check role (assuming isAdmin check is already done in API route, but good to double check)
        const userDoc = await getDoc(doc(clientDb, "users", userId));
        if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
            return { status: false, message: "Unauthorized: Only admins can pin posts." };
        }

        await updateDoc(postRef, {
            isPinned: isPinned,
            updatedAt: new Date().toISOString(),
        });
        return { status: true, message: isPinned ? "Postingan berhasil di-pin." : "Pin postingan berhasil dilepas." };
    } catch (error) {
        console.error(`Error toggling pin status for post ${postId}:`, error);
        return { status: false, message: `Gagal mengubah status pin: ${(error as Error).message}` };
    }
}

export async function togglePostArchiveStatus(postId: string, isArchived: boolean, userId: string): Promise<{ status: boolean; message: string }> {
    // For now, this feature is just a placeholder
    const userDoc = await getDoc(doc(clientDb, "users", userId));
    if (!userDoc.exists() || userDoc.data()?.role !== 'admin') {
        return { status: false, message: "Unauthorized: Only admins can archive posts." };
    }
    // In a real application, you would update the 'isArchived' field in Firestore here.
    // For now, we return a success message indicating it's a future feature.
    console.log(`Admin ${userId} attempted to archive post ${postId}. Feature is pending implementation.`);
    return { status: true, message: "Fitur arsip akan datang!" };
}

export async function createForumReply(replyData: Omit<ForumReply, 'id' | 'createdAt' | 'updatedAt' | 'upvotes' | 'downvotes' | 'upvotedBy' | 'downvotedBy' | 'isSolution' | 'isEdited' | 'reactions'>): Promise<{ status: boolean; replyId?: string; message: string }> {
    try {
        const repliesCollectionRef = collection(clientDb, "forumReplies");
        const newReply: Omit<ForumReply, 'id'> = {
            ...replyData,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            upvotes: 0,
            downvotes: 0,
            upvotedBy: [],
            downvotedBy: [],
            isSolution: false,
            isEdited: false,
            reactions: {},
        };
        const docRef = await addDoc(repliesCollectionRef, newReply);

        const postRef = doc(clientDb, "forumPosts", replyData.postId);
        await runTransaction(clientDb, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (postDoc.exists()) {
                const currentRepliesCount = postDoc.data()?.replies || 0;
                transaction.update(postRef, {
                    replies: currentRepliesCount + 1,
                    updatedAt: new Date().toISOString(),
                });
            }
        });


        return { status: true, replyId: docRef.id, message: "Balasan forum berhasil dibuat." };
    } catch (error) {
        console.error("Error creating forum reply:", error);
        return { status: false, message: "Gagal membuat balasan forum." };
    }
}

export async function getForumRepliesByPostId(postId: string): Promise<ForumReply[]> {
    try {
        const repliesCollectionRef = collection(clientDb, "forumReplies");
        const q = query(repliesCollectionRef, where("postId", "==", postId), orderBy("createdAt", "asc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<ForumReply, 'id'>)
        }));
    } catch (error) {
        console.error("Error getting forum replies:", error);
        return [];
    }
}

export async function updateForumReply(replyId: string, updateData: Partial<ForumReply>): Promise<{ status: boolean; message: string }> {
    try {
        const replyRef = doc(clientDb, "forumReplies", replyId);
        await updateDoc(replyRef, { ...updateData, updatedAt: new Date().toISOString(), isEdited: true });
        return { status: true, message: "Balasan forum berhasil diperbarui." };
    } catch (error) {
        console.error("Error updating forum reply:", error);
        return { status: false, message: "Gagal memperbarui balasan forum." };
    }
}

export async function deleteForumReply(replyId: string, postId: string): Promise<{ status: boolean; message: string }> {
    try {
        await runTransaction(clientDb, async (transaction) => {
            const replyDocRef = doc(clientDb, "forumReplies", replyId);
            const postRef = doc(clientDb, "forumPosts", postId);

            const replyDoc = await transaction.get(replyDocRef);
            if (!replyDoc.exists()) {
                throw new Error("Reply not found.");
            }

            const postDoc = await transaction.get(postRef);
            if (postDoc.exists()) {
                const currentRepliesCount = postDoc.data()?.replies || 0;
                transaction.update(postRef, {
                    replies: Math.max(0, currentRepliesCount - 1),
                    updatedAt: new Date().toISOString(),
                });
            }
            transaction.delete(replyDocRef);
        });

        return { status: true, message: "Balasan forum berhasil dihapus." };
    } catch (error) {
        console.error("Error deleting forum reply:", error);
        return { status: false, message: "Gagal menghapus balasan forum." };
    }
}

export async function toggleReplyVote(replyId: string, userId: string, voteType: "up" | "down"): Promise<{ status: boolean; newUpvotes: number; newDownvotes: number; message: string }> {
    const replyRef = doc(clientDb, "forumReplies", replyId);

    try {
        const result = await runTransaction(clientDb, async (transaction) => {
            const replyDoc = await transaction.get(replyRef);
            if (!replyDoc.exists()) {
                throw new Error("Reply not found.");
            }

            const replyData = replyDoc.data() as ForumReply;
            let upvotedBy = replyData.upvotedBy || [];
            let downvotedBy = replyData.downvotedBy || [];
            let newUpvotes = replyData.upvotes;
            let newDownvotes = replyData.downvotes;

            const wasUpvotedByUser = upvotedBy.includes(userId);
            const wasDownvotedByUser = downvotedBy.includes(userId);

            if (voteType === "up") {
                if (wasUpvotedByUser) {
                    // Already upvoted, so un-upvote
                    upvotedBy = upvotedBy.filter(id => id !== userId);
                    newUpvotes--;
                } else {
                    // Upvote
                    upvotedBy.push(userId);
                    newUpvotes++;
                    if (wasDownvotedByUser) { // If previously downvoted, remove downvote
                        downvotedBy = downvotedBy.filter(id => id !== userId);
                        newDownvotes--;
                    }
                }
            } else { // voteType === "down"
                if (wasDownvotedByUser) {
                    // Already downvoted, so un-downvote
                    downvotedBy = downvotedBy.filter(id => id !== userId);
                    newDownvotes--;
                } else {
                    // Downvote
                    downvotedBy.push(userId);
                    newDownvotes++;
                    if (wasUpvotedByUser) { // If previously upvoted, remove upvote
                        upvotedBy = upvotedBy.filter(id => id !== userId);
                        newUpvotes--;
                    }
                }
            }

            transaction.update(replyRef, {
                upvotedBy: upvotedBy,
                downvotedBy: downvotedBy,
                upvotes: newUpvotes,
                downvotes: newDownvotes,
                updatedAt: new Date().toISOString(),
            });

            return { newUpvotes, newDownvotes };
        });

        return { status: true, ...result, message: "Vote berhasil diperbarui." };
    } catch (error: any) {
        console.error("Error toggling reply vote:", error);
        return { status: false, newUpvotes: 0, newDownvotes: 0, message: error.message || "Gagal mengubah status vote." };
    }
}

export async function toggleReplyReaction(
    replyId: string,
    userId: string,
    newReactionKey: EmojiReactionKey | null, // Reaction yang ingin ditetapkan (null jika un-react)
    oldReactionKey: EmojiReactionKey | null // Reaction yang sebelumnya dimiliki user (dari frontend)
): Promise<{ status: boolean; newReactions: { [key: string]: string[] }; message: string }> {
    const replyRef = doc(clientDb, "forumReplies", replyId);

    try {
        const result = await runTransaction(clientDb, async (transaction) => {
            const replyDoc = await transaction.get(replyRef);
            if (!replyDoc.exists()) {
                throw new Error("Reply not found.");
            }

            const replyData = replyDoc.data() as ForumReply;
            const reactions = replyData.reactions || {};

            let updatedReactions = { ...reactions };

            // 1. Hapus user dari oldReactionKey jika ada
            if (oldReactionKey && updatedReactions[oldReactionKey]) {
                updatedReactions[oldReactionKey] = updatedReactions[oldReactionKey].filter(id => id !== userId);
            }

            // 2. Tambahkan user ke newReactionKey jika newReactionKey diberikan
            if (newReactionKey) {
                // Inisialisasi array jika belum ada
                if (!updatedReactions[newReactionKey]) {
                    updatedReactions[newReactionKey] = [];
                }
                // Tambahkan user jika belum ada di array reaksi baru
                if (!updatedReactions[newReactionKey].includes(userId)) {
                    updatedReactions[newReactionKey].push(userId);
                }
            }

            transaction.update(replyRef, {
                reactions: updatedReactions,
                updatedAt: new Date().toISOString(),
            });

            return { newReactions: updatedReactions };
        });

        let message = "Reaksi berhasil diperbarui.";
        if (newReactionKey === null && oldReactionKey) {
            message = "Reaksi berhasil dihapus.";
        } else if (newReactionKey && newReactionKey === oldReactionKey) {
            message = "Reaksi tidak berubah (sudah ada).";
        } else if (newReactionKey) {
            message = "Reaksi berhasil ditambahkan.";
        }

        return { status: true, ...result, message: message };
    } catch (error: any) {
        console.error("Error toggling reply reaction:", error);
        return { status: false, newReactions: {}, message: error.message || "Gagal mengubah status reaksi." };
    }
}

export async function markReplyAsSolution(replyId: string, postId: string, isSolution: boolean, currentUserId: string, isCurrentUserAdmin: boolean): Promise<{ status: boolean; message: string }> {
    const postRef = doc(clientDb, "forumPosts", postId);
    const replyDocRef = doc(clientDb, "forumReplies", replyId);

    try {
        await runTransaction(clientDb, async (transaction) => {
            const postDoc = await transaction.get(postRef);
            if (!postDoc.exists()) {
                throw new Error("Post not found.");
            }

            const replyDoc = await transaction.get(replyDocRef);
            if (!replyDoc.exists()) {
                throw new Error("Reply not found.");
            }

            const postData = postDoc.data() as ForumPost;
            // Validasi di sini: Hanya post bertipe "pertanyaan" yang bisa ditandai solusi
            if (postData.type !== 'pertanyaan') {
                throw new Error("Forbidden: Only posts of type 'pertanyaan' can have solutions marked.");
            }

            // Validasi di sini: Hanya penulis post yang bisa menandai solusi
            if (postData.authorId !== currentUserId) { // Hapus !isAdmin untuk membatasi hanya penulis post
                throw new Error("Unauthorized: Only the post author can mark a solution.");
            }

            let currentSolutionReplyIds = postData.solutionReplyIds || [];
            let newIsResolved = false;

            if (isSolution) {
                if (!currentSolutionReplyIds.includes(replyId)) {
                    // Jika menandai sebagai solusi, hapus solusi lain jika hanya satu solusi diizinkan
                    // Saat ini Anda mengizinkan beberapa solusi dengan `currentSolutionReplyIds.push(replyId);`
                    // Jika Anda hanya ingin SATU solusi, Anda akan clear `currentSolutionReplyIds = [];`
                    currentSolutionReplyIds.push(replyId);
                }
                newIsResolved = true;
            } else {
                currentSolutionReplyIds = currentSolutionReplyIds.filter(id => id !== replyId);
                newIsResolved = currentSolutionReplyIds.length > 0;
            }

            transaction.update(replyDocRef, {
                isSolution: isSolution,
                updatedAt: new Date().toISOString(),
            });

            transaction.update(postRef, {
                solutionReplyIds: currentSolutionReplyIds,
                isResolved: newIsResolved,
                updatedAt: new Date().toISOString(),
            });
        });

        return { status: true, message: isSolution ? "Balasan ditandai sebagai solusi." : "Status solusi dibatalkan." };
    } catch (error: any) {
        console.error("Error marking reply as solution:", error);
        if (error.code) {
            console.error("Firebase error code:", error.code);
        }
        return { status: false, message: error.message || "Gagal memperbarui status solusi." };
    }
}

// --- BOOKMARKS API ---

export async function toggleBookmark(userId: string, postId: string): Promise<{ status: boolean; bookmarked: boolean; message: string }> {
    const bookmarksCollectionRef = collection(clientDb, "forumBookmarks");
    const q = query(bookmarksCollectionRef, where("userId", "==", userId), where("postId", "==", postId));

    try {
        const snapshot = await getDocs(q);
        const now = new Date().toISOString();

        if (!snapshot.empty) {
            // Jika bookmark sudah ada, hapus (unbookmark)
            await deleteDoc(snapshot.docs[0].ref);
            return { status: true, bookmarked: false, message: "Postingan dihapus dari bookmark." };
        } else {
            // Jika bookmark belum ada, tambahkan
            const newBookmark: Omit<ForumBookmark, 'id'> = {
                userId: userId,
                postId: postId,
                bookmarkedAt: now,
            };
            await addDoc(bookmarksCollectionRef, newBookmark);
            return { status: true, bookmarked: true, message: "Postingan ditambahkan ke bookmark." };
        }
    } catch (error) {
        console.error("Error toggling bookmark:", error);
        return { status: false, bookmarked: false, message: "Gagal mengubah status bookmark." };
    }
}

export async function getUserBookmarks(userId: string): Promise<ForumBookmark[]> {
    try {
        const bookmarksCollectionRef = collection(clientDb, "forumBookmarks");
        const q = query(bookmarksCollectionRef, where("userId", "==", userId), orderBy("bookmarkedAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<ForumBookmark, 'id'>)
        }));
    } catch (error) {
        console.error("Error getting user bookmarks:", error);
        return [];
    }
}

export async function removeBookmark(bookmarkId: string): Promise<{ status: boolean; message: string }> {
    try {
        await deleteDoc(doc(clientDb, "forumBookmarks", bookmarkId));
        return { status: true, message: "Bookmark berhasil dihapus." };
    } catch (error) {
        console.error("Error removing bookmark:", error);
        return { status: false, message: "Gagal menghapus bookmark." };
    }
}

export async function checkBookmarkStatus(userId: string, postId: string): Promise<boolean> {
    try {
        const bookmarksCollectionRef = collection(clientDb, "forumBookmarks");
        const q = query(bookmarksCollectionRef, where("userId", "==", userId), where("postId", "==", postId), limit(1));
        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error("Error checking bookmark status:", error);
        return false;
    }
}

// ### NOTIFICATIONS API

export async function createNotification(notificationData: Omit<Notification, 'id' | 'createdAt' | 'read'> & { mentionedUserIds?: string[] }): Promise<{ status: boolean; notificationId?: string; message: string }> {
    try {
        const notificationsCollectionRef = collection(clientDb, "notifications");
        const newNotificationBase: Omit<Notification, 'id'> = {
            ...notificationData,
            read: false,
            createdAt: new Date().toISOString(),
        };

        const notificationsToCreate = [];

        // Notifikasi utama (misal: komentar baru, like, solusi)
        notificationsToCreate.push(addDoc(notificationsCollectionRef, newNotificationBase));

        // Notifikasi untuk mentions
        if (notificationData.mentionedUserIds && notificationData.mentionedUserIds.length > 0) {
            for (const mentionedUserId of notificationData.mentionedUserIds) {
                const mentionNotification: Omit<Notification, 'id'> = {
                    ...newNotificationBase,
                    userId: mentionedUserId, // Penerima adalah pengguna yang di-mention
                    type: "forum_mention",
                    title: "Anda Disebutkan!",
                    message: `${notificationData.actorUsername} menyebut Anda dalam konteks terkait: "${notificationData.postTitle || notificationData.message}".`,
                    link: notificationData.link, // Link ke konten yang sama
                };
                notificationsToCreate.push(addDoc(notificationsCollectionRef, mentionNotification));
            }
        }

        await Promise.all(notificationsToCreate); // Kirim semua notifikasi secara paralel

        // Mengembalikan ID notifikasi utama (opsional, bisa disesuaikan)
        return { status: true, message: "Notifikasi berhasil dibuat." };
    } catch (error) {
        console.error("Error creating notification:", error);
        return { status: false, message: "Gagal membuat notifikasi." };
    }
}

export async function getUserNotifications(userId: string): Promise<Notification[]> {
    try {
        const notificationsCollectionRef = collection(clientDb, "notifications");
        const q = query(notificationsCollectionRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Notification, 'id'>)
        }));
    } catch (error) {
        console.error("Error getting user notifications:", error);
        return [];
    }
}

export async function markNotificationAsRead(notificationId: string): Promise<{ status: boolean; message: string }> {
    try {
        const notificationRef = doc(clientDb, "notifications", notificationId);
        await updateDoc(notificationRef, { read: true });
        return { status: true, message: "Notifikasi ditandai sebagai sudah dibaca." };
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return { status: false, message: "Gagal menandai notifikasi sebagai sudah dibaca." };
    }
}

export async function markAllUserNotificationsAsRead(userId: string): Promise<{ status: boolean; message: string }> {
    try {
        const notificationsCollectionRef = collection(clientDb, "notifications");
        const q = query(notificationsCollectionRef, where("userId", "==", userId), where("read", "==", false));
        const snapshot = await getDocs(q);

        // --- PERBAIKAN: Menggunakan writeBatch(clientDb) ---
        const batch = writeBatch(clientDb);
        snapshot.docs.forEach(docSnap => {
            batch.update(docSnap.ref, { read: true });
        });
        await batch.commit();

        return { status: true, message: "Semua notifikasi ditandai sebagai sudah dibaca." };
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return { status: false, message: "Gagal menandai semua notifikasi sebagai sudah dibaca." };
    }
}

export async function deleteNotificationById(notificationId: string): Promise<{ status: boolean; message: string }> {
    try {
        await deleteDoc(doc(clientDb, "notifications", notificationId));
        return { status: true, message: "Notifikasi berhasil dihapus." };
    } catch (error) {
        console.error("Error deleting notification:", error);
        return { status: false, message: "Gagal menghapus notifikasi." };
    }
}

export async function deleteUserNotifications(userId: string): Promise<{ status: boolean; message: string }> {
    try {
        const notificationsCollectionRef = collection(clientDb, "notifications");
        const q = query(notificationsCollectionRef, where("userId", "==", userId));
        const snapshot = await getDocs(q);

        // --- PERBAIKAN: Menggunakan writeBatch(clientDb) ---
        const batch = writeBatch(clientDb);
        snapshot.docs.forEach(docSnap => {
            batch.delete(docSnap.ref);
        });
        await batch.commit();

        return { status: true, message: "Semua notifikasi pengguna berhasil dihapus." };
    } catch (error) {
        console.error("Error deleting all user notifications:", error);
        return { status: false, message: "Gagal menghapus semua notifikasi pengguna." };
    }
}

export async function createReport(reportData: Omit<Report, 'id' | 'createdAt' | 'status' | 'resolvedAt' | 'resolvedBy'>): Promise<{ status: boolean; reportId?: string; message: string }> {
    try {
        const reportsCollectionRef = collection(clientDb, "reports");
        const newReport: Omit<Report, 'id'> = {
            ...reportData,
            status: "pending",
            createdAt: new Date().toISOString(), // Use ISO string
        };
        const docRef = await addDoc(reportsCollectionRef, newReport);
        return { status: true, reportId: docRef.id, message: "Laporan berhasil dikirim." };
    } catch (error) {
        console.error("Error creating report:", error);
        return { status: false, message: "Gagal mengirim laporan." };
    }
}

export async function getReports(statusFilter?: "pending" | "resolved" | "dismissed" | "all"): Promise<Report[]> {
    try {
        const reportsCollectionRef = collection(clientDb, "reports");
        let q = query(reportsCollectionRef, orderBy("createdAt", "desc")); // Order by newest first

        if (statusFilter && statusFilter !== "all") {
            q = query(q, where("status", "==", statusFilter));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<Report, 'id'>)
        }));
    } catch (error) {
        console.error("Error getting reports:", error);
        return [];
    }
}

export async function getReportById(reportId: string): Promise<Report | null> {
    return retriveDataById<Report>("reports", reportId);
}

export async function updateReportStatus(reportId: string, status: "resolved" | "dismissed", adminId: string): Promise<{ status: boolean; message: string }> {
    try {
        const reportRef = doc(clientDb, "reports", reportId);
        await updateDoc(reportRef, {
            status: status,
            resolvedAt: new Date().toISOString(), // Use ISO string
            resolvedBy: adminId,
        });
        return { status: true, message: `Laporan berhasil ditandai sebagai ${status}.` };
    } catch (error) {
        console.error("Error updating report status:", error);
        return { status: false, message: "Gagal memperbarui status laporan." };
    }
}

export async function deleteReport(reportId: string): Promise<{ status: boolean; message: string }> {
    try {
        await deleteDoc(doc(clientDb, "reports", reportId));
        return { status: true, message: "Laporan berhasil dihapus." };
    } catch (error) {
        console.error("Error deleting report:", error);
        return { status: false, message: "Gagal menghapus laporan." };
    }
}

export async function getUserByUsername(username: string): Promise<User | null> {
    try {
        const usersCollectionRef = collection(clientDb, "users");
        const q = query(usersCollectionRef, where("username", "==", username), limit(1));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
            const userDoc = snapshot.docs[0];
            return { ...(userDoc.data() as User), id: userDoc.id } as User;
        }
        return null;
    } catch (error) {
        console.error("Error getting user by username:", error);
        return null;
    }
}

export async function getForumPostsByAuthorId(authorId: string): Promise<ForumPost[]> {
    try {
        const postsCollectionRef = collection(clientDb, "forumPosts");
        // PENTING: Pastikan ini memfilter berdasarkan 'authorId'
        const q = query(postsCollectionRef, where("authorId", "==", authorId), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...(doc.data() as Omit<ForumPost, 'id'>)
        }));
    } catch (error) {
        console.error(`Error getting forum posts by author ID ${authorId}:`, error);
        return [];
    }
}