// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin";
import type { User } from "@/types/types";

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- GET Request Handler --- (Tidak ada perubahan)
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "ID pengguna diperlukan." }, { status: 400 });
        }

        const docRef = adminDb.collection("users").doc(id);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
        }

        const userData = docSnapshot.data() as User;
        delete userData.password;
        return NextResponse.json({ ...userData, id: docSnapshot.id, });
    } catch (caughtError: unknown) {
        console.error(`Terjadi kesalahan saat mengambil data pengguna ${params.id}:`, caughtError);
        let errorMessage = "Gagal mengambil data pengguna dari database.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// --- PUT Request Handler --- (Penyesuaian untuk Reset Token)
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "ID pengguna diperlukan untuk pembaruan." }, { status: 400 });
        }

        const updatedFields: Partial<User> & { resetTokens?: boolean } = await request.json();
        const now = new Date().toISOString();

        const docRef = adminDb.collection("users").doc(id);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            return NextResponse.json({ error: "Pengguna tidak ditemukan untuk diperbarui." }, { status: 404 });
        }

        const existingUser = docSnapshot.data() as User;

        const allowedUpdateFields: Partial<User> = {};
        if (updatedFields.username !== undefined) allowedUpdateFields.username = updatedFields.username;
        if (updatedFields.role !== undefined) {
            if (updatedFields.role === "admin" || updatedFields.role === "user" || updatedFields.role === "banned") {
                allowedUpdateFields.role = updatedFields.role;
            } else {
                return NextResponse.json({ error: "Peran pengguna tidak valid." }, { status: 400 });
            }
        }
        if (updatedFields.bio !== undefined) allowedUpdateFields.bio = updatedFields.bio;
        if (updatedFields.banner !== undefined) allowedUpdateFields.banner = updatedFields.banner;
        if (updatedFields.location !== undefined) allowedUpdateFields.location = updatedFields.location;
        if (updatedFields.phone !== undefined) allowedUpdateFields.phone = updatedFields.phone;
        if (updatedFields.website !== undefined) allowedUpdateFields.website = updatedFields.website;
        if (updatedFields.github !== undefined) allowedUpdateFields.github = updatedFields.github;
        if (updatedFields.twitter !== undefined) allowedUpdateFields.twitter = updatedFields.twitter;
        if (updatedFields.linkedin !== undefined) allowedUpdateFields.linkedin = updatedFields.linkedin;
        if (updatedFields.instagram !== undefined) allowedUpdateFields.instagram = updatedFields.instagram;

        if (updatedFields.isBanned !== undefined) allowedUpdateFields.isBanned = updatedFields.isBanned;

        // --- Logika Reset Token Harian yang Diperbarui ---
        if (updatedFields.resetTokens === true) {
            allowedUpdateFields.dailyTokens = existingUser.maxDailyTokens || 0; // Reset daily ke max
            allowedUpdateFields.totalUsage = 0; // Reset total usage untuk periode ini ke 0
            allowedUpdateFields.lastResetDate = getTodayDateString(); // Set tanggal reset hari ini
        } else {
            // Jika tidak ada permintaan reset, tapi ada update token secara manual
            if (updatedFields.dailyTokens !== undefined) allowedUpdateFields.dailyTokens = updatedFields.dailyTokens;
            if (updatedFields.maxDailyTokens !== undefined) allowedUpdateFields.maxDailyTokens = updatedFields.maxDailyTokens;
            if (updatedFields.lastResetDate !== undefined) allowedUpdateFields.lastResetDate = updatedFields.lastResetDate;
            if (updatedFields.totalUsage !== undefined) allowedUpdateFields.totalUsage = updatedFields.totalUsage;
        }

        await docRef.update({
            ...allowedUpdateFields,
            updatedAt: now,
        });

        return NextResponse.json({ message: "Profil berhasil diperbarui." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error(`Terjadi kesalahan saat memperbarui pengguna ${params.id}:`, caughtError);
        let errorMessage = "Terjadi kesalahan server saat memperbarui profil.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// --- DELETE Request Handler --- (Tidak ada perubahan)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "ID pengguna diperlukan untuk penghapusan." }, { status: 400 });
        }

        const docRef = adminDb.collection("users").doc(id);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
        }

        await docRef.delete();

        return NextResponse.json({ message: "Pengguna berhasil dihapus secara permanen." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error(`Terjadi kesalahan saat menghapus pengguna ${params.id}:`, caughtError);
        let errorMessage = "Terjadi kesalahan server saat menghapus pengguna.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}