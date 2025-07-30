// /app/api/forum/posts/[id]/replies/[replyId]/solution/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../../../auth";
import { createNotification, getForumPostById, markReplyAsSolution, getForumRepliesByPostId } from "@/lib/firebase/service"; // Import getForumRepliesByPostId

export async function PATCH(request: NextRequest, { params }: { params: { id: string; replyId: string } }) {
    const session = await auth();
    // PENTING: Gunakan destructuring dengan await params untuk mengakses properti
    const { id: postId, replyId: replyIdParam } = await params;

    try {
        const body = await request.json();
        const { isSolution } = body;

        if (typeof isSolution !== 'boolean') {
            return NextResponse.json({ status: false, statusCode: 400, message: "Invalid 'isSolution' value. Must be boolean." }, { status: 400 });
        }

        const post = await getForumPostById(postId);
        if (!post) {
            return NextResponse.json({ status: false, statusCode: 404, message: "Post not found." }, { status: 404 });
        }

        // Authorization check: Only post author or admin can mark a solution
        if (post.authorId !== session?.user?.id && session?.user?.role !== "admin") {
            return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Only post author or admin can mark a solution." }, { status: 403 });
        }

        // Panggil service untuk memperbarui status solusi di Firestore
        const result = await markReplyAsSolution(replyIdParam, postId, isSolution); // Gunakan replyIdParam

        if (result.status) {
            // Notifikasi: Pastikan data reply yang digunakan sudah benar
            const allRepliesForPost = await getForumRepliesByPostId(postId); // Ambil semua balasan untuk post ini
            const reply = allRepliesForPost.find(r => r.id === replyIdParam); // Temukan balasan spesifik

            if (reply && post.authorId !== session?.user?.id) { // Notifikasi ke penulis post jika bukan dirinya
                await createNotification({
                    userId: post.authorId,
                    type: "forum_solution_marked",
                    title: isSolution ? "Komentar Anda Ditandai Sebagai Solusi!" : "Status Solusi Dibatalkan.",
                    message: `Komentar Anda di postingan &quot;${post.title}&quot; telah ${isSolution ? "ditandai" : "dibatalkan"} sebagai solusi.`,
                    link: `/forum/${postId}#comment-${replyIdParam}`,
                    actorId: session.user?.id,
                    actorUsername: session.user?.username,
                    postId: postId,
                    postTitle: post.title,
                    replyId: replyIdParam,
                    // PENTING: commentContentPreview harus dari konten REPLY, bukan post
                    commentContentPreview: reply.content.substring(0, Math.min(reply.content.length, 100)) + (reply.content.length > 100 ? "..." : ""),
                });
            }

            return NextResponse.json({ status: true, statusCode: 200, message: result.message }, { status: 200 });
        } else {
            console.error("API Route Error (from service):", result.message);
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error marking reply as solution for post ${postId} (catch block):`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to mark reply as solution.", error: (error instanceof Error) ? error.message : "Terjadi kesalahan yang tidak diketahui." }, { status: 500 });
    }
}