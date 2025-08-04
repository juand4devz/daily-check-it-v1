// /app/api/forum/posts/[id]/bookmarks/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";
import { toggleBookmark } from "@/lib/firebase/service";

// POST: toggle bookmark
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    // Menggunakan destructuring dan await untuk mengakses params.id
    const { id: postId } = await params;

    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        const result = await toggleBookmark(userId, postId);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message, bookmarked: result.bookmarked }, { status: 200 });
        } else {
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error toggling bookmark for post ${postId}:`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to toggle bookmark.", error: (error as Error).message }, { status: 500 });
    }
}