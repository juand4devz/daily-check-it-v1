// app/api/user-tokens/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { adminDb } from "@/lib/firebase/firebase-admin"; // Asumsi Anda punya ini
import type { User } from "@/types/types"; // Import User type

// Helper function to get today's date in YYYY-MM-DD format
function getTodayDateString(): string {
    const today = new Date();
    const wibOffset = 7 * 60; // WIB = UTC+7 hours
    const nowWIB = new Date(today.getTime() + wibOffset * 60 * 1000);
    const year = nowWIB.getFullYear();
    const month = (nowWIB.getMonth() + 1).toString().padStart(2, '0');
    const day = nowWIB.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// --- GET Request Handler ---
// Mengambil data token untuk pengguna yang sedang login
export async function GET() {
    const session = await auth(); // Dapatkan sesi pengguna

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: "Tidak terautentikasi." }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        const userDocRef = adminDb.collection("users").doc(userId);
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return NextResponse.json({ message: "Pengguna tidak ditemukan." }, { status: 404 });
        }

        const userData = userDoc.data() as User;

        // Logika Reset Token Harian (Server-Side)
        const todayDate = getTodayDateString();
        let currentDailyTokens = userData.dailyTokens;
        let lastResetDate = userData.lastResetDate;

        if (lastResetDate !== todayDate) {
            currentDailyTokens = userData.maxDailyTokens; // Reset ke max daily
            lastResetDate = todayDate;

            // Perbarui di database jika ada reset
            await userDocRef.update({
                dailyTokens: currentDailyTokens,
                lastResetDate: lastResetDate,
                updatedAt: new Date().toISOString(),
            });
        }

        // Kembalikan hanya data token yang relevan
        const tokenData = {
            userId: userData.id,
            username: userData.username,
            dailyTokens: currentDailyTokens,
            maxDailyTokens: userData.maxDailyTokens,
            lastResetDate: lastResetDate,
            totalUsage: userData.totalUsage,
        };

        return NextResponse.json(tokenData, { status: 200 });
    } catch (error) {
        console.error("Error fetching user tokens:", error);
        return NextResponse.json({ message: "Gagal mengambil data token pengguna." }, { status: 500 });
    }
}

// --- POST Request Handler ---
// Memperbarui data token pengguna (misalnya, mengurangi token setelah penggunaan)
export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: "Tidak terautentikasi." }, { status: 401 });
    }

    const { tokensUsed, action }: { tokensUsed?: number; action: "decrement" | "reset" } = await request.json();

    const userId = session.user.id;
    const userDocRef = adminDb.collection("users").doc(userId);

    try {
        const userDoc = await userDocRef.get();

        if (!userDoc.exists) {
            return NextResponse.json({ message: "Pengguna tidak ditemukan." }, { status: 404 });
        }

        const userData = userDoc.data() as User;
        let updatedDailyTokens = userData.dailyTokens;
        let updatedTotalUsage = userData.totalUsage;
        let updatedLastResetDate = userData.lastResetDate;

        const todayDate = getTodayDateString();

        // Lakukan reset token jika hari sudah berganti (sebelum aksi decrement/reset manual)
        if (updatedLastResetDate !== todayDate) {
            updatedDailyTokens = userData.maxDailyTokens;
            updatedLastResetDate = todayDate;
        }

        if (action === "decrement") {
            if (tokensUsed === undefined || tokensUsed <= 0) {
                return NextResponse.json({ message: "Jumlah token yang akan digunakan tidak valid." }, { status: 400 });
            }
            if (updatedDailyTokens < tokensUsed) {
                return NextResponse.json({ message: "Token harian tidak mencukupi." }, { status: 400 });
            }
            updatedDailyTokens -= tokensUsed;
            updatedTotalUsage += tokensUsed;
        } else if (action === "reset") {
            updatedDailyTokens = userData.maxDailyTokens;
            updatedTotalUsage = 0; // Reset total usage juga jika itu yang diinginkan
            updatedLastResetDate = todayDate;
        } else {
            return NextResponse.json({ message: "Aksi token tidak valid." }, { status: 400 });
        }

        await userDocRef.update({
            dailyTokens: updatedDailyTokens,
            totalUsage: updatedTotalUsage,
            lastResetDate: updatedLastResetDate,
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({
            message: "Token berhasil diperbarui.",
            dailyTokens: updatedDailyTokens,
            totalUsage: updatedTotalUsage,
            lastResetDate: updatedLastResetDate,
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating user tokens:", error);
        return NextResponse.json({ message: "Gagal memperbarui token pengguna." }, { status: 500 });
    }
}