// /app/api/forum/posts/[id]/replies/[replyId]/solution/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../../../auth";
import {
    createNotification,
    getForumPostById,
    markReplyAsSolution,
    getForumReplyById,
} from "@/lib/firebase/service";

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string; replyId: string } }
) {
    const session = await auth();
    const { id: postId, replyId: replyIdParam } = await params;

    if (!session?.user?.id) {
        return NextResponse.json(
            { status: false, message: "Unauthorized: User not authenticated." },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const {
            isSolution,
            userId: clientUserId,
            isPostAuthor: clientIsPostAuthor,
        } = body;

        if (typeof isSolution !== "boolean") {
            return NextResponse.json(
                { status: false, message: "Invalid 'isSolution' value. Must be boolean." },
                { status: 400 }
            );
        }

        if (clientUserId !== session.user.id) {
            return NextResponse.json(
                { status: false, message: "Forbidden: User ID mismatch." },
                { status: 403 }
            );
        }

        const post = await getForumPostById(postId);
        if (!post) {
            return NextResponse.json(
                { status: false, message: "Post not found." },
                { status: 404 }
            );
        }

        if (post.type !== "pertanyaan") {
            return NextResponse.json(
                {
                    status: false,
                    message: "Forbidden: Only posts of type 'pertanyaan' can have solutions marked.",
                },
                { status: 403 }
            );
        }

        if (post.authorId !== clientUserId || !clientIsPostAuthor) {
            return NextResponse.json(
                {
                    status: false,
                    message: "Unauthorized: Only the post author can mark a solution.",
                },
                { status: 403 }
            );
        }

        const result = await markReplyAsSolution(
            replyIdParam,
            postId,
            isSolution,
            session.user.id,
            clientIsPostAuthor
        );

        if (result.status) {
            const reply = await getForumReplyById(replyIdParam);

            if (reply && reply.authorId !== session.user.id) {
                await createNotification({
                    userId: reply.authorId,
                    type: "forum_solution_marked",
                    title: isSolution
                        ? "Balasan Anda Ditandai Sebagai Solusi!"
                        : "Status Solusi Dibatalkan.",
                    message: `Balasan Anda di postingan "${post.title}" telah ${isSolution ? "ditandai" : "dibatalkan"
                        } sebagai solusi oleh ${session.user.username}.`,
                    link: `/forum/${postId}#comment-${replyIdParam}`,
                    actorId: session.user.id,
                    actorUsername: session.user.username,
                    postId: postId,
                    postTitle: post.title,
                    replyId: replyIdParam,
                    commentContentPreview:
                        reply.content.substring(0, Math.min(reply.content.length, 100)) +
                        (reply.content.length > 100 ? "..." : ""),
                });
            }

            return NextResponse.json(
                { status: true, message: result.message },
                { status: 200 }
            );
        } else {
            console.error("API Route Error (from service):", result.message);
            return NextResponse.json(
                { status: false, message: result.message },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error(
            `API Error marking reply as solution for post ${postId} (catch block):`,
            error
        );
        return NextResponse.json(
            {
                status: false,
                message: "Failed to mark reply as solution.",
                error:
                    error instanceof Error
                        ? error.message
                        : "Terjadi kesalahan yang tidak diketahui.",
            },
            { status: 500 }
        );
    }
}
