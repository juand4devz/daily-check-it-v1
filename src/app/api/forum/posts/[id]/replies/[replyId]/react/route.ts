// /app/api/forum/posts/[id]/replies/[replyId]/react/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../../../auth";
import { toggleReplyReaction, getForumRepliesByPostId, createNotification, getForumPostById } from "@/lib/firebase/service";
import { EMOJI_REACTIONS } from "@/types/forum";

// POST: add/remove reaction on reply
export async function POST(request: NextRequest, { params }: { params: { id: string; replyId: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    // PENTING: Gunakan destructuring dengan await params
    const { id: postId, replyId: replyIdParam } = await params;

    // --- PERBAIKAN: Validasi replyIdParam ---
    if (!replyIdParam || replyIdParam === 'false' || replyIdParam === 'null' || typeof replyIdParam !== 'string') {
        console.error(`API Error: Invalid replyId parameter received: ${replyIdParam}`);
        return NextResponse.json({ status: false, statusCode: 400, message: "ID balasan tidak valid. Harap berikan ID balasan yang benar." }, { status: 400 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { reactionKey } = body;

    // Validate reactionKey
    const validReactionKeys = EMOJI_REACTIONS.map(r => r.key);
    if (!validReactionKeys.includes(reactionKey)) {
        console.error(`API Error: Invalid reaction key provided: ${reactionKey}`);
        return NextResponse.json({ status: false, statusCode: 400, message: "Kunci reaksi tidak valid." }, { status: 400 });
    }

    try {
        const result = await toggleReplyReaction(replyIdParam, userId, reactionKey);

        if (result.status) {
            // Fetch reply and post details for notification
            const replies = await getForumRepliesByPostId(postId);
            const reply = replies.find(r => r.id === replyIdParam);
            const post = await getForumPostById(postId);

            const reactionAdded = result.newReactions[reactionKey]?.includes(userId);
            const emoji = EMOJI_REACTIONS.find(r => r.key === reactionKey)?.emoji;

            if (reply && reply.authorId !== userId && post && emoji) {
                await createNotification({
                    userId: reply.authorId,
                    type: "forum_comment_on_post", // Pertimbangkan untuk membuat tipe notifikasi yang lebih spesifik jika sering digunakan
                    title: `Komentar Anda Mendapatkan Reaksi Baru!`,
                    message: `${session.user.username} ${reactionAdded ? `bereaksi dengan ${emoji}` : `menghapus reaksi ${emoji}`} pada komentar Anda di postingan: &quot;${post.title}&quot; ${emoji ? `(${emoji})` : ""}.`,
                    link: `/forum/${postId}#comment-${replyIdParam}`,
                    actorId: userId,
                    actorUsername: session.user.username,
                    postId: postId,
                    postTitle: post.title,
                    replyId: replyIdParam,
                    commentContentPreview: reply.content.substring(0, Math.min(reply.content.length, 100)) + (reply.content.length > 100 ? "..." : ""),
                });
            }

            return NextResponse.json({ status: true, statusCode: 200, message: result.message, newReactions: result.newReactions }, { status: 200 });
        } else {
            console.error("API Route Error (from service):", result.message);
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error toggling reaction for reply ${replyIdParam} on post ${postId}:`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to toggle reaction.", error: (error instanceof Error) ? error.message : "Terjadi kesalahan yang tidak diketahui." }, { status: 500 });
    }
}