// /app/api/forum/posts/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { getForumPostById, updateForumPost, deleteForumPost } from "@/lib/firebase/service";
import { ForumPost } from "@/types/forum";

// GET: single post
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    const postId = await params.id;

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
    const session = await auth();
    // Middleware sudah memastikan session ada, tapi kita bisa tambahkan untuk type-safety
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: Session missing." }, { status: 401 });
    }

    const postId = await params.id;

    try {
        const body = await request.json();
        const existingPost = await getForumPostById(postId);

        if (!existingPost) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Post not found." }, { status: 404 });
        }

        // --- PEMERIKSAAN OTORISASI KETAT DI SINI ---
        // Hanya penulis postingan atau admin yang dapat memperbarui
        if (existingPost.authorId !== session.user.id && session.user.role !== "admin") {
            return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: You are not authorized to update this post." }, { status: 403 });
        }

        const updateData: Partial<ForumPost> = {
            title: body.title !== undefined ? body.title : existingPost.title, // Only update if provided
            description: body.description !== undefined ? body.description : existingPost.description,
            content: body.content !== undefined ? body.content : existingPost.content,
            type: body.type !== undefined ? body.type : existingPost.type,
            category: body.category !== undefined ? body.category : existingPost.category,
            tags: body.tags !== undefined ? (body.tags || []) : existingPost.tags,
            thumbnail: body.thumbnail === undefined ? null : body.thumbnail,
            media: body.media !== undefined ? (body.media || []) : existingPost.media,
            isResolved: typeof body.isResolved === 'boolean' ? body.isResolved : existingPost.isResolved,
            solutionReplyId: body.solutionReplyId === undefined ? null : body.solutionReplyId,
            // isPinned and isArchived can ONLY be changed by admin
            isPinned: typeof body.isPinned === 'boolean' && session.user.role === "admin" ? body.isPinned : existingPost.isPinned,
            isArchived: typeof body.isArchived === 'boolean' && session.user.role === "admin" ? body.isArchived : existingPost.isArchived,
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
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: Session missing." }, { status: 401 });
    }

    const postId = await params.id;

    try {
        const existingPost = await getForumPostById(postId);
        if (!existingPost) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Post not found." }, { status: 404 });
        }

        // --- PEMERIKSAAN OTORISASI KETAT DI SINI ---
        // Hanya penulis postingan atau admin yang dapat menghapus
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