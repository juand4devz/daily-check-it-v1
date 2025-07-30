// /app/api/forum/posts/[id]/views/route.ts
import { NextRequest, NextResponse } from "next/server";
import { incrementPostViewCount } from "@/lib/firebase/service";

// PATCH: increment view count
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    // PENTING: Sesuai dokumentasi Next.js 15, params di Route Handlers bersifat asinkron.
    // Kita harus meng-await params sebelum mengakses propertinya.
    const { id: postId } = await params; // PERBAIKAN: Gunakan destructuring dengan await params

    try {
        const result = await incrementPostViewCount(postId);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message, newViewCount: result.newViewCount }, { status: 200 });
        } else {
            console.error(`Failed to increment view count for post ${postId}: ${result.message}`);
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error incrementing views for post ${postId}:`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to increment view count.", error: (error as Error).message }, { status: 500 });
    }
}