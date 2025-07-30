// /app/api/forum/posts/[id]/like/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";
import { togglePostLike } from "@/lib/firebase/service";
import { createNotification } from "@/lib/firebase/service";
import { getForumPostById } from "@/lib/firebase/service"; // To get post details for notification

// POST: toggle like on post
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    const postId = params.id;
    const userId = session.user.id;

    try {
        const result = await togglePostLike(postId, userId);

        if (result.status) {
            // Fetch post to get authorId for notification
            const post = await getForumPostById(postId);
            if (post && post.authorId !== userId) { // Don't notify self-like
                await createNotification({
                    userId: post.authorId,
                    type: "forum_like_post",
                    title: result.liked ? "Postingan Anda Disukai!" : "Postingan Anda Tidak Lagi Disukai.",
                    message: `${session.user.username} ${result.liked ? "menyukai" : "membatalkan suka"} postingan Anda: "${post.title}".`,
                    link: `/forum/${postId}`,
                    actorId: userId,
                    actorUsername: session.user.username,
                    postId: postId,
                    postTitle: post.title,
                });
            }
            return NextResponse.json({ status: true, statusCode: 200, message: result.message, liked: result.liked, newLikeCount: result.newLikeCount }, { status: 200 });
        } else {
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error toggling like for post ${postId}:`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to toggle like.", error: (error as Error).message }, { status: 500 });
    }
}