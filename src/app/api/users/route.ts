import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { getAllUsers } from "@/lib/firebase/service"; // Menggunakan service.ts

// Middleware untuk memeriksa admin (opsional, tapi sangat disarankan)
async function checkAdmin() {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        return {
            isAuthorized: false,
            response: NextResponse.json({ error: "Unauthorized: Access denied." }, { status: 403 })
        };
    }
    return { isAuthorized: true, response: null };
}

// --- GET Request Handler (untuk mengambil semua pengguna) ---
export async function GET() {
    const authResult = await checkAdmin();
    if (!authResult.isAuthorized) {
        return authResult.response;
    }

    try {
        const usersList = await getAllUsers();
        const cleanedUsers = usersList.map(user => {
            // Hapus properti sensitif seperti password sebelum mengirim ke client
            const { ...rest } = user;
            return rest;
        });

        return NextResponse.json(cleanedUsers);
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat mengambil daftar pengguna:", caughtError);
        let errorMessage = "Gagal mengambil daftar pengguna dari database.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}