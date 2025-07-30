// /app/api/forum/posts/[id]/replies/[replyId]/react/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../../../auth";
import { toggleReplyReaction } from "@/lib/firebase/service";
import { EMOJI_REACTIONS, ForumReply, ForumPost, EmojiReactionKey } from "@/types/forum"; // Import EmojiReactionKey
import { retriveDataById, createNotification } from "@/lib/firebase/service";

// POST: add/remove reaction on reply (only one reaction per user per reply)
export async function POST(request: NextRequest, { params }: { params: { id: string; replyId: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    const { id: postId, replyId } = await params;

    if (!replyId || typeof replyId !== 'string' || replyId === 'false' || replyId === 'null') {
        console.error(`API Error: Invalid replyId parameter received in URL: ${replyId}`);
        return NextResponse.json({ status: false, statusCode: 400, message: "ID balasan tidak valid. Harap berikan ID balasan yang benar." }, { status: 400 });
    }

    const userId = session.user.id;
    let body;
    try {
        body = await request.json();
    } catch (e) {
        console.error("API Error: Failed to parse request body as JSON:", e);
        return NextResponse.json({ status: false, statusCode: 400, message: "Permintaan tidak valid: Body harus JSON." }, { status: 400 });
    }

    // PERUBAHAN PENTING: Menerima newReactionKey dan oldReactionKey dari body
    const { newReactionKey, oldReactionKey } = body as { newReactionKey: EmojiReactionKey | null; oldReactionKey: EmojiReactionKey | null };

    const validReactionKeys: readonly string[] = EMOJI_REACTIONS.map(r => r.key);

    // Validasi newReactionKey (jika ada)
    if (newReactionKey !== null && !validReactionKeys.includes(newReactionKey)) {
        console.error(`API Error: Invalid new reaction key provided: ${newReactionKey}`);
        return NextResponse.json({ status: false, statusCode: 400, message: "Kunci reaksi baru tidak valid." }, { status: 400 });
    }
    // Validasi oldReactionKey (jika ada)
    if (oldReactionKey !== null && !validReactionKeys.includes(oldReactionKey)) {
        console.error(`API Error: Invalid old reaction key provided: ${oldReactionKey}`);
        return NextResponse.json({ status: false, statusCode: 400, message: "Kunci reaksi lama tidak valid." }, { status: 400 });
    }

    try {
        // PERUBAHAN PENTING: Memanggil toggleReplyReaction dengan logika baru
        const result = await toggleReplyReaction(replyId, userId, newReactionKey, oldReactionKey);

        if (result.status) {
            const reply = await retriveDataById<ForumReply>("forumReplies", replyId);
            const post = await retriveDataById<ForumPost>("forumPosts", postId);

            const newEmoji = EMOJI_REACTIONS.find(r => r.key === newReactionKey)?.emoji;
            const oldEmoji = EMOJI_REACTIONS.find(r => r.key === oldReactionKey)?.emoji;

            // Kirim notifikasi jika ada reaksi baru atau perubahan reaksi
            if (reply && reply.authorId !== userId && post) {
                if (newReactionKey && newReactionKey !== oldReactionKey) { // Reaksi ditambahkan/diubah
                    await createNotification({
                        userId: reply.authorId,
                        type: "forum_comment_reaction",
                        title: `Komentar Anda Mendapatkan Reaksi Baru!`,
                        message: `${session.user.username} bereaksi dengan ${newEmoji} pada komentar Anda di postingan: "${post.title}".`,
                        link: `/forum/${postId}#comment-${replyId}`,
                        actorId: userId,
                        actorUsername: session.user.username,
                        postId: postId,
                        postTitle: post.title,
                        replyId: replyId,
                        commentContentPreview: reply.content.substring(0, Math.min(reply.content.length, 100)) + (reply.content.length > 100 ? "..." : ""),
                    });
                } else if (!newReactionKey && oldReactionKey) { // Reaksi dihapus (un-react)
                    await createNotification({
                        userId: reply.authorId,
                        type: "forum_comment_reaction", // Atau buat tipe notifikasi khusus "forum_comment_unreacted"
                        title: `Reaksi pada Komentar Anda Dihapus.`,
                        message: `${session.user.username} menghapus reaksi ${oldEmoji} pada komentar Anda di postingan: "${post.title}".`,
                        link: `/forum/${postId}#comment-${replyId}`,
                        actorId: userId,
                        actorUsername: session.user.username,
                        postId: postId,
                        postTitle: post.title,
                        replyId: replyId,
                        commentContentPreview: reply.content.substring(0, Math.min(reply.content.length, 100)) + (reply.content.length > 100 ? "..." : ""),
                    });
                }
            }

            return NextResponse.json({ status: true, statusCode: 200, message: result.message, newReactions: result.newReactions }, { status: 200 });
        } else {
            console.error("API Route Error (from service):", result.message);
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error toggling reaction for reply ${replyId} on post ${postId}:`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to toggle reaction.", error: (error instanceof Error) ? error.message : "Terjadi kesalahan yang tidak diketahui." }, { status: 500 });
    }
}