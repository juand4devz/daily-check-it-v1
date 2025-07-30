// /app/api/upload-auth/route.ts
import { NextResponse } from "next/server";
import { getUploadAuthParams } from "@imagekit/next/server";
import { auth } from "../../../../auth";

/**
 * Route Handler GET untuk menghasilkan parameter autentikasi upload ImageKit.io.
 * Ini harus dipanggil dari sisi klien untuk mendapatkan token yang aman.
 */
export async function GET() {
    const session = await auth(); // Dapatkan sesi pengguna dari NextAuth.js

    // Pastikan pengguna terautentikasi dan memiliki ID
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    // Pastikan variabel lingkungan ImageKit sudah diatur
    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_PUBLIC_KEY) {
        console.error("Missing ImageKit environment variables (IMAGEKIT_PRIVATE_KEY or IMAGEKIT_PUBLIC_KEY).");
        return NextResponse.json({ error: "Server configuration error: ImageKit keys not set." }, { status: 500 });
    }

    try {
        // Generate parameter autentikasi upload dari ImageKit SDK
        // Parameter seperti fileName, folder, dll. tidak dimasukkan di sini
        // karena itu akan ditentukan oleh klien saat upload, dan auth ini bersifat umum.
        const { token, expire, signature } = getUploadAuthParams({
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            // Anda bisa menambahkan userId ke token jika ingin melacak upload per pengguna di sisi ImageKit
            // token: session.user.id, // Ini adalah opsi, tidak wajib
        });

        // Kembalikan parameter autentikasi dan publicKey ke klien
        return NextResponse.json({ token, expire, signature, publicKey: process.env.IMAGEKIT_PUBLIC_KEY });
    } catch (error) {
        console.error("Error generating ImageKit upload auth params:", error);
        return NextResponse.json({ error: "Failed to generate upload authentication parameters." }, { status: 500 });
    }
}