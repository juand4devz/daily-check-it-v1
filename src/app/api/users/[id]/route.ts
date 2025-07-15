// app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/firebase-admin"; // Pastikan adminDb terimport
import type { User } from "@/types/types"; // Pastikan path ini benar

// --- GET Request Handler (untuk mengambil data pengguna berdasarkan ID) ---
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } } // params is directly available here
) {
    try {
        // Fix: Access id directly, or await params if needed.
        // For Route Handlers, params are usually unwrapped by Next.js,
        // but awaiting makes it explicit and removes the warning.
        const { id } = await params; // No need to await if params is already an object, but if warning persists, await.

        if (!id) { // This check should ideally not be needed if route is /[id]
            return NextResponse.json({ error: "ID pengguna diperlukan." }, { status: 400 });
        }

        const docRef = adminDb.collection("users").doc(id);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
        }

        const userData = docSnapshot.data() as User;
        delete userData.password; // Penting: Hapus properti sensitif seperti password sebelum mengirim ke client

        return NextResponse.json({ ...userData, id: docSnapshot.id });
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat mengambil data pengguna:", caughtError);
        let errorMessage = "Gagal mengambil data pengguna dari database.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// --- PUT Request Handler (untuk memperbarui data pengguna berdasarkan ID) ---
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params; // No need to await if params is already an object
        if (!id) {
            return NextResponse.json({ error: "ID pengguna diperlukan untuk pembaruan." }, { status: 400 });
        }

        const updatedData: Partial<User> = await request.json();
        const now = new Date().toISOString();

        const docRef = adminDb.collection("users").doc(id);
        const docSnapshot = await docRef.get();

        if (!docSnapshot.exists) {
            return NextResponse.json({ error: "Pengguna tidak ditemukan untuk diperbarui." }, { status: 404 });
        }

        const { ...fieldsToUpdate } = updatedData;

        await docRef.update({
            ...fieldsToUpdate,
            updatedAt: now,
        });

        return NextResponse.json({ message: "Profil berhasil diperbarui." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat memperbarui data pengguna:", caughtError);
        let errorMessage = "Terjadi kesalahan server saat memperbarui profil.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}