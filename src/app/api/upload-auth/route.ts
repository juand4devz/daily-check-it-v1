// app/api/upload-auth/route.ts
import { NextResponse } from "next/server";
import { getUploadAuthParams } from "@imagekit/next/server"; // Import dari SDK ImageKit Next.js server-side

export async function GET() {
    // --- Autentikasi Pengguna di Sini ---
    // Implementasikan logika Anda untuk memeriksa apakah pengguna telah login
    // atau memiliki izin untuk mengunggah.
    // Misalnya, Anda bisa mendapatkan sesi pengguna dari NextAuth:
    // const session = await auth(); // Jika Anda menggunakan NextAuth
    // if (!session?.user) {
    //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    // Atau cek token API internal, dll.
    // Untuk saat ini, kita anggap semua request boleh upload (untuk debugging/pengembangan)

    if (!process.env.IMAGEKIT_PRIVATE_KEY || !process.env.IMAGEKIT_PUBLIC_KEY) {
        console.error("Missing ImageKit environment variables.");
        return NextResponse.json({ error: "Server configuration error: ImageKit keys not set." }, { status: 500 });
    }

    // Menggunakan getUploadAuthParams dari ImageKit SDK
    const { token, expire, signature } = getUploadAuthParams({
        privateKey: process.env.IMAGEKIT_PRIVATE_KEY, // Ini HARUS di sisi server
        publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
        // expire: 3600, // Opsional: masa berlaku token dalam detik, maks 1 jam (default 1 jam)
        // token: "some_unique_id", // Opsional: token unik untuk melacak upload
    });

    return NextResponse.json({ token, expire, signature, publicKey: process.env.IMAGEKIT_PUBLIC_KEY });
}