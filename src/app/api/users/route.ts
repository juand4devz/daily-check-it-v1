// app/api/users/route.ts
import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin";
import type { User } from "@/types/types";

// --- GET Request Handler (untuk mengambil semua pengguna) ---
export async function GET() {
    try {
        const snapshot = await adminDb.collection("users").get();
        const usersList: User[] = snapshot.docs.map((doc) => {
            const userData = doc.data() as User;
            delete userData.password; // Hapus properti password sebelum mengirim ke client
            return {
                ...userData,
                id: doc.id,
            };
        });

        // Filter out banned users from default view, or provide an option to show them
        // Untuk halaman admin, mungkin ingin melihat semua, jadi tidak ada filter awal di sini
        // Filter akan dilakukan di client-side users/page.tsx

        return NextResponse.json(usersList);
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat mengambil daftar pengguna:", caughtError);
        let errorMessage = "Gagal mengambil daftar pengguna dari database.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}