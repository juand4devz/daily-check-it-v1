// /lib/firebase/service.ts
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { clientDb } from "./firebase-client";
import bcrypt from "bcrypt";
import type { User } from "@/types/types"; // Sesuaikan path jika berbeda

// Constants for default user data
const DEFAULT_MAX_DAILY_TOKENS = 10; // Contoh nilai default
const DEFAULT_BIO = "Halo! Saya pengguna baru DailyCheckIt.";
const DEFAULT_AVATAR_URL = ""; // Atau "/placeholder.svg" jika Anda menggunakannya sebagai default di DB

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export async function getRetriveData(collectionName: string) {
    const snapshot = await getDocs(collection(clientDb, collectionName));
    const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
    })) as User[];
    return data;
}

export async function retriveDataById(collectionName: string, id: string) {
    const snapshot = await getDoc(doc(clientDb, collectionName, id));
    if (snapshot.exists()) {
        return { id: snapshot.id, ...snapshot.data() } as User;
    }
    return null;
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
        avatar: DEFAULT_AVATAR_URL, // Default avatar kosong untuk registrasi email
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

export async function login(data: { email: string }): Promise<User & { password?: string } | null> {
    const usersCollectionRef = collection(clientDb, "users");
    const q = query(usersCollectionRef, where("email", "==", data.email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return null; // User not found
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();

    return { id: userDoc.id, ...userData } as User & { password?: string };
}

// Fungsi utama untuk menangani login OAuth (Google, GitHub)
async function handleOAuthLogin(email: string, name: string, loginType: User['loginType'], avatarUrl: string | null | undefined): Promise<User> {
    const usersCollectionRef = collection(clientDb, "users");
    const q = query(usersCollectionRef, where("email", "==", email));
    const snapshot = await getDocs(q);
    const now = new Date().toISOString();
    const todayDate = getTodayDateString();

    let user: User;

    if (!snapshot.empty) {
        // Pengguna sudah ada, perbarui datanya
        const userDoc = snapshot.docs[0];
        const existingData = userDoc.data() as User;

        const updateData: Partial<User> = {
            username: name || existingData.username, // Gunakan nama baru jika tersedia
            lastLogin: now,
            updatedAt: now,
            loginType: loginType, // Perbarui tipe login jika mungkin berbeda
        };

        // --- PERBAIKAN LOGIKA AVATAR DI SINI ---
        // Hanya perbarui avatar jika:
        // 1. Avatar yang ada di DB adalah URL default kita (misalnya, string kosong).
        // 2. Atau, jika avatar yang ada di DB sama persis dengan avatar dari penyedia OAuth.
        //    Ini mencegah penimpaan avatar kustom yang diunggah pengguna.
        const isExistingAvatarDefault = existingData.avatar === DEFAULT_AVATAR_URL;
        const isExistingAvatarFromProvider = existingData.avatar === avatarUrl; // Cek jika avatar yang ada sama dengan yang dari provider

        if (avatarUrl !== undefined && (isExistingAvatarDefault || isExistingAvatarFromProvider)) {
            // Jika avatarUrl disediakan Oauth DAN (avatar di DB default ATAU sama dengan yang dari provider)
            updateData.avatar = avatarUrl || DEFAULT_AVATAR_URL; // Timpa dengan yang dari provider (atau default kosong jika null)
        }
        // Jika avatarUrl adalah undefined, atau jika avatar yang ada di DB BUKAN default DAN BUKAN dari provider yang sama,
        // maka kita tidak akan menimpa avatar di DB.
        // --- AKHIR PERBAIKAN LOGIKA AVATAR ---


        // Tangani reset token harian jika hari sudah berganti
        if (existingData.lastResetDate !== todayDate) {
            updateData.dailyTokens = existingData.maxDailyTokens || DEFAULT_MAX_DAILY_TOKENS;
            updateData.lastResetDate = todayDate;
        }

        await updateDoc(doc(clientDb, "users", userDoc.id), updateData);
        user = { ...existingData, ...updateData };
    } else {
        // Pengguna baru, buat profil baru
        const newUser: Omit<User, 'id'> = {
            username: name,
            email: email,
            role: "user",
            loginType: loginType,
            avatar: avatarUrl || DEFAULT_AVATAR_URL, // Gunakan avatar dari penyedia atau default kosong
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

export async function updateUserTokens(userId: string, tokensUsed: number): Promise<{ status: boolean; message?: string }> {
    const userDocRef = doc(clientDb, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
        return { status: false, message: "Pengguna tidak ditemukan." };
    }

    const userData = userDoc.data() as User;
    const todayDate = getTodayDateString();

    let currentDailyTokens = userData.dailyTokens;
    let currentTotalUsage = userData.totalUsage;
    let lastResetDate = userData.lastResetDate;

    if (lastResetDate !== todayDate) {
        currentDailyTokens = userData.maxDailyTokens || DEFAULT_MAX_DAILY_TOKENS;
        lastResetDate = todayDate;
    }

    if (currentDailyTokens < tokensUsed) {
        return { status: false, message: "Token harian tidak mencukupi." };
    }

    currentDailyTokens -= tokensUsed;
    currentTotalUsage += tokensUsed;

    try {
        await updateDoc(userDocRef, {
            dailyTokens: currentDailyTokens,
            totalUsage: currentTotalUsage,
            lastResetDate: lastResetDate,
            updatedAt: new Date().toISOString(),
        });
        return { status: true, message: "Token berhasil diperbarui." };
    } catch (error) {
        console.error("Error updating user tokens:", error);
        return { status: false, message: "Gagal memperbarui token." };
    }
}

export async function updateUserProfile(userId: string, updatedFields: Partial<User>): Promise<{ status: boolean; message?: string }> {
    const userDocRef = doc(clientDb, "users", userId);
    try {
        const { ...fieldsToUpdate } = updatedFields;

        await updateDoc(userDocRef, {
            ...fieldsToUpdate,
            updatedAt: new Date().toISOString(),
        });
        return { status: true, message: "Profil berhasil diperbarui." };
    } catch (error) {
        console.error("Error updating user profile:", error);
        return { status: false, message: "Gagal memperbarui profil." };
    }
}