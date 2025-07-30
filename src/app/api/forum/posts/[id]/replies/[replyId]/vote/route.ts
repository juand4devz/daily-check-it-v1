// /app/api/forum/posts/[id]/replies/[replyId]/vote/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../../../auth";
import { toggleReplyVote, getForumRepliesByPostId, createNotification, getForumPostById } from "@/lib/firebase/service";
import { EMOJI_REACTIONS } from "@/types/forum";

// POST: upvote/downvote reply
export async function POST(request: NextRequest, { params }: { params: { id: string; replyId: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    // PENTING: Gunakan destructuring dengan await params untuk mengakses properti
    const { id: postId, replyId: replyIdParam } = await params; // Ambil postId dan replyIdParam

    const userId = session.user.id;
    const body = await request.json();
    const { voteType } = body; // 'up' or 'down'

    if (!['up', 'down'].includes(voteType)) {
        return NextResponse.json({ status: false, statusCode: 400, message: "Invalid vote type. Must be 'up' or 'down'." }, { status: 400 });
    }

    try {
        const result = await toggleReplyVote(replyIdParam, userId, voteType); // Gunakan replyIdParam

        if (result.status) {
            // Fetch reply and post details for notification
            const replies = await getForumRepliesByPostId(postId); // Gunakan postId
            const reply = replies.find(r => r.id === replyIdParam); // Gunakan replyIdParam
            const post = await getForumPostById(postId); // Gunakan postId

            const messageAction = voteType === 'up' ? "menyukai" : "tidak menyukai";
            const emoji = EMOJI_REACTIONS.find(r => r.key === voteType)?.emoji || ''; // Dapatkan emoji yang sesuai

            if (reply && reply.authorId !== userId && post) { // Jangan notifikasi diri sendiri
                await createNotification({
                    userId: reply.authorId,
                    type: "forum_comment_on_post", // Pertimbangkan tipe notifikasi yang lebih spesifik seperti 'forum_vote_reply'
                    title: `Komentar Anda ${messageAction}!`,
                    message: `${session.user.username} ${messageAction} komentar Anda di postingan: &quot;${post.title}&quot; ${emoji ? `(${emoji})` : ""}.`,
                    link: `/forum/${postId}#comment-${replyIdParam}`,
                    actorId: userId,
                    actorUsername: session.user.username,
                    postId: postId,
                    postTitle: post.title,
                    replyId: replyIdParam,
                    commentContentPreview: reply.content.substring(0, Math.min(reply.content.length, 100)) + (reply.content.length > 100 ? "..." : ""),
                });
            }

            return NextResponse.json({ status: true, statusCode: 200, message: result.message, newUpvotes: result.newUpvotes, newDownvotes: result.newDownvotes }, { status: 200 });
        } else {
            console.error("API Route Error (from service):", result.message);
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error toggling vote for reply ${replyIdParam} on post ${postId}:`, error); // Gunakan replyIdParam dan postId
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to toggle vote.", error: (error instanceof Error) ? error.message : "Terjadi kesalahan yang tidak diketahui." }, { status: 500 });
    }
}