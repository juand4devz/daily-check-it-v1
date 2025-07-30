// /app/api/forum/users/[id]/route.ts
// Pastikan Anda telah menghapus file app/api/forum/users/[username]/route.ts yang lama,
// atau telah mengubah namanya menjadi [id].

import { NextRequest, NextResponse } from "next/server";
import { getUserById, getForumPostsByAuthorId } from "@/lib/firebase/service"; // Import getUserById and getForumPostsByAuthorId

/**
 * Handles GET requests to retrieve a user's profile and their forum posts by user ID.
 * @param {NextRequest} request - The incoming Next.js request.
 * @param {object} params - Dynamic parameters from the URL.
 * @param {string} params.id - The ID of the user.
 * @returns {NextResponse} A JSON response containing user profile data and their posts, or an error.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    // PENTING: Sesuai dokumentasi Next.js terbaru, `params` di Route Handlers bersifat asinkron.
    // Kita harus meng-await `params` untuk mengakses propertinya dengan aman.
    const { id: userId } = await params; // Destructure `id` from awaited `params`

    if (!userId) {
        console.error("API Error: User ID is missing in request parameters.");
        return NextResponse.json({ status: false, statusCode: 400, message: "ID pengguna tidak valid." }, { status: 400 });
    }

    try {
        const user = await getUserById(userId); // Fetch user by ID from Firestore service

        if (!user) {
            console.warn(`API Warning: User with ID '${userId}' not found.`);
            return NextResponse.json({ status: false, statusCode: 404, message: "Pengguna tidak ditemukan." }, { status: 404 });
        }

        // Fetch forum posts created by this user
        const userPosts = await getForumPostsByAuthorId(user.id);

        // Destructure 'password' to exclude it from the public data payload
        // Ensure that your UserType includes 'password?: string;'
        const { ...userPublicData } = user;

        return NextResponse.json(
            {
                status: true,
                statusCode: 200,
                message: "Data pengguna dan postingan berhasil diambil.",
                data: {
                    user: userPublicData, // This object should now implicitly include 'banner' if it's part of UserType
                    posts: userPosts,
                },
            },
            { status: 200 }
        );
    } catch (error) {
        // Log the full error object for better debugging on the server side
        console.error(`API Error fetching user '${userId}' or their posts:`, error);

        // Provide a generic error message to the client, while logging details internally
        return NextResponse.json(
            {
                status: false,
                statusCode: 500,
                message: "Gagal mengambil data pengguna.",
                error: (error instanceof Error) ? error.message : "Terjadi kesalahan yang tidak diketahui."
            },
            { status: 500 }
        );
    }
}