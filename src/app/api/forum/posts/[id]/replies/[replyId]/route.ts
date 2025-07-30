// /app/api/forum/posts/[id]/replies/[replyId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../../auth"; // Sesuaikan path
import { updateForumReply, deleteForumReply, getForumRepliesByPostId } from "@/lib/firebase/service";
import { ForumReply } from "@/types/forum";

// PATCH: Update specific fields of a reply (e.g., content, isEdited)
export async function PATCH(request: NextRequest, { params }: { params: { id: string; replyId: string } }) {
    const session = await auth();
    // PENTING: Gunakan destructuring dengan await params
    const { id: postId, replyId: replyIdParam } = await params;

    try {
        const body = await request.json();
        const updateData: Partial<ForumReply> = {};

        if (body.content) updateData.content = body.content;
        if (body.media) updateData.media = body.media;

        // Fetch reply to check authorization
        const replies = await getForumRepliesByPostId(postId); // Gunakan postId
        const reply = replies.find(r => r.id === replyIdParam); // Gunakan replyIdParam

        if (!reply) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Reply not found." }, { status: 404 });
        }

        if (reply.authorId !== session?.user?.id && session?.user?.role !== "admin") {
            return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Not authorized to update this reply." }, { status: 403 });
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ status: false, statusCode: 400, message: "No valid fields provided for update." }, { status: 400 });
        }

        const result = await updateForumReply(replyIdParam, updateData); // Gunakan replyIdParam

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message }, { status: 200 });
        } else {
            console.error("API Route Error (from service):", result.message);
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error updating reply ${replyIdParam} for post ${postId}:`, error); // Gunakan replyIdParam dan postId
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to update reply.", error: (error instanceof Error) ? error.message : "Terjadi kesalahan yang tidak diketahui." }, { status: 500 });
    }
}

// DELETE: delete reply
export async function DELETE(request: NextRequest, { params }: { params: { id: string; replyId: string } }) {
    const session = await auth();
    // PENTING: Gunakan destructuring dengan await params
    const { id: postId, replyId: replyIdParam } = await params;

    try {
        // Fetch reply to check authorization
        const replies = await getForumRepliesByPostId(postId); // Gunakan postId
        const reply = replies.find(r => r.id === replyIdParam); // Gunakan replyIdParam

        if (!reply) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Reply not found." }, { status: 404 });
        }

        if (reply.authorId !== session?.user?.id && session?.user?.role !== "admin") {
            return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Not authorized to delete this reply." }, { status: 403 });
        }

        const result = await deleteForumReply(replyIdParam, postId); // Gunakan replyIdParam

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message }, { status: 200 });
        } else {
            console.error("API Route Error (from service):", result.message);
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error deleting reply ${replyIdParam} for post ${postId}:`, error); // Gunakan replyIdParam dan postId
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to delete reply.", error: (error instanceof Error) ? error.message : "Terjadi kesalahan yang tidak diketahui." }, { status: 500 });
    }
}