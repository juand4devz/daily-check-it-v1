// /app/api/forum/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { getForumPostById, updateForumPost, deleteForumPost } from "@/lib/firebase/service";
import { ForumPost } from "@/types/forum";

// GET: single post
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    // Destructuring dan await params agar lebih ringkas
    const { id: postId } = await params;

    try {
        const post = await getForumPostById(postId);
        if (post) {
            return NextResponse.json({ status: true, statusCode: 200, message: "Post fetched successfully.", data: post }, { status: 200 });
        } else {
            return NextResponse.json({ status: false, statusCode: 404, message: "Post not found." }, { status: 404 });
        }
    } catch (error) {
        console.error(`API Error fetching post ${postId}:`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to fetch post.", error: (error as Error).message }, { status: 500 });
    }
}

// PATCH: Update specific fields of a post
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    // Destructuring dan await params
    const { id: postId } = await params;

    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: Session missing." }, { status: 401 });
    }

    try {
        const body = await request.json();
        const existingPost = await getForumPostById(postId);

        if (!existingPost) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Post not found." }, { status: 404 });
        }

        // --- PEMERIKSAAN OTORISASI KETAT DI SINI ---
        if (existingPost.authorId !== session.user.id && session.user.role !== "admin") {
            return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: You are not authorized to update this post." }, { status: 403 });
        }

        // Buat objek update hanya dengan properti yang diberikan di body
        const updateData: Partial<ForumPost> = {
            ...body,
            // Perbarui isPinned dan isArchived HANYA jika admin yang melakukannya
            ...(session.user.role !== "admin" && {
                isPinned: existingPost.isPinned,
                isArchived: existingPost.isArchived,
            }),
            // Pastikan media dan tags dihandle jika tidak ada
            tags: body.tags !== undefined ? (body.tags || []) : existingPost.tags,
            media: body.media !== undefined ? (body.media || []) : existingPost.media,
            // Thumbnail bisa diset null
            thumbnail: body.thumbnail === undefined ? existingPost.thumbnail : (body.thumbnail || null),
            // Update timestamp
            updatedAt: new Date().toISOString(),
        };

        const result = await updateForumPost(postId, updateData);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message }, { status: 200 });
        } else {
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error updating post ${postId}:`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to update post.", error: (error as Error).message }, { status: 500 });
    }
}

// DELETE: Delete a single post
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    // Destructuring dan await params
    const { id: postId } = await params;

    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: Session missing." }, { status: 401 });
    }

    try {
        const existingPost = await getForumPostById(postId);
        if (!existingPost) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Post not found." }, { status: 404 });
        }

        // --- PEMERIKSAAN OTORISASI KETAT DI SINI ---
        if (existingPost.authorId !== session.user.id && session.user.role !== "admin") {
            return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: You are not authorized to delete this post." }, { status: 403 });
        }

        const result = await deleteForumPost(postId);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message }, { status: 200 });
        } else {
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error deleting post ${postId}:`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to delete post.", error: (error as Error).message }, { status: 500 });
    }
}