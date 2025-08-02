// /app/api/user-tokens/route.ts

import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { checkAndResetDailyTokens, manageUserTokens } from "@/lib/firebase/service";

// --- GET Request Handler: Mendapatkan status token pengguna ---
export async function GET() {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: "Tidak terautentikasi." }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        const { tokenData } = await checkAndResetDailyTokens(userId);

        const responseData = {
            id: tokenData.id,
            dailyTokens: tokenData.dailyTokens,
            maxDailyTokens: tokenData.maxDailyTokens,
            lastResetDate: tokenData.lastResetDate,
            totalUsage: tokenData.totalUsage,
        };

        return NextResponse.json(responseData, { status: 200 });
    } catch (error) {
        console.error("Error fetching user tokens:", error);
        return NextResponse.json({ message: "Gagal mengambil data token pengguna." }, { status: 500 });
    }
}

// --- POST Request Handler: Mengelola token (mengurangi atau mereset) ---
export async function POST(request: NextRequest) {
    const session = await auth();

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ message: "Tidak terautentikasi." }, { status: 401 });
    }

    const body: { tokensUsed?: number; action: "decrement" | "reset" } = await request.json();
    const { tokensUsed, action } = body;

    const userId = session.user.id;

    try {
        if (action === 'decrement' && (!tokensUsed || tokensUsed <= 0)) {
            return NextResponse.json({ message: "Jumlah token yang akan digunakan tidak valid." }, { status: 400 });
        }

        const result = await manageUserTokens(userId, tokensUsed, action);

        if (!result.status || !result.tokenData) {
            return NextResponse.json({ message: result.message || "Aksi token gagal." }, { status: 400 });
        }

        // Kembalikan data token terbaru
        return NextResponse.json({
            message: result.message,
            ...result.tokenData,
        }, { status: 200 });

    } catch (error) {
        console.error("Error updating user tokens:", error);
        return NextResponse.json({ message: "Gagal memperbarui token pengguna." }, { status: 500 });
    }
}