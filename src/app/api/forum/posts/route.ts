// /app/api/forum/posts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { createForumPost, getForumPosts } from "@/lib/firebase/service";
import { ForumPost } from "@/types/forum";

// GET: all posts
export async function GET() {
    try {
        const posts = await getForumPosts();
        return NextResponse.json({ status: true, statusCode: 200, message: "Posts fetched successfully.", data: posts }, { status: 200 });
    } catch (error) {
        console.error("API Error fetching posts:", error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to fetch posts.", error: (error as Error).message }, { status: 500 });
    }
}

// POST: create new post
export async function POST(request: NextRequest) {
    const session = await auth();
    // --- PEMERIKSAAN SESI AWAL ---
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    try {
        const body = await request.json();
        const safeThumbnail = body.thumbnail === undefined ? null : body.thumbnail;

        const newPostData: Omit<ForumPost, 'id' | 'createdAt' | 'updatedAt' | 'likes' | 'likedBy' | 'replies' | 'views' | 'isResolved' | 'isPinned' | 'isArchived'> = {
            title: body.title,
            description: body.description,
            content: body.content,
            authorId: session.user.id,
            authorUsername: session.user.username,
            authorAvatar: session.user.avatar || "/placeholder.svg",
            category: body.category,
            type: body.type,
            tags: body.tags || [],
            thumbnail: safeThumbnail,
            media: body.media || [],
        };

        const result = await createForumPost(newPostData);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 201, message: result.message, postId: result.postId }, { status: 201 });
        } else {
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error("API Error creating post:", error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to create post.", error: (error as Error).message }, { status: 500 });
    }
}