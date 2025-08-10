// /app/api/forum/posts/[id]/replies/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../auth"; // Sesuaikan path
import { createForumReply, getForumPostById, getForumRepliesByPostId, createNotification, getUserByUsername, retriveDataById } from "@/lib/firebase/service";
import { ForumReply } from "@/types/forum"; // PERBAIKAN: Import ForumReply dari types/forum.ts
import { NotificationType } from "@/types/types";

// GET: all replies for a post
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
    // PENTING: Gunakan destructuring dengan await params
    const { id: postId } = await params;

    try {
        const replies = await getForumRepliesByPostId(postId);
        return NextResponse.json({ status: true, statusCode: 200, message: "Replies fetched successfully.", data: replies }, { status: 200 });
    } catch (error) {
        console.error(`API Error fetching replies for post ${postId}:`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to fetch replies.", error: (error instanceof Error) ? error.message : "Terjadi kesalahan yang tidak diketahui." }, { status: 500 });
    }
}

// POST: add new reply
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.username) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    // PENTING: Gunakan destructuring dengan await params
    const { id: postId } = await params;
    try {
        const body = await request.json();
        const { content, parentId, mentionedUsernames, media } = body; // Ambil mentionedUsernames (array of strings)

        // Konversi mentioned usernames ke user IDs
        const mentionedUserIds: string[] = [];
        if (mentionedUsernames && Array.isArray(mentionedUsernames) && mentionedUsernames.length > 0) {
            const usersPromises = mentionedUsernames.map((username: string) => getUserByUsername(username));
            const resolvedUsers = await Promise.all(usersPromises);
            resolvedUsers.forEach(user => {
                if (user && user.id) {
                    mentionedUserIds.push(user.id);
                }
            });
        }

        const newReplyData: Omit<ForumReply, 'id' | 'createdAt' | 'updatedAt' | 'upvotes' | 'downvotes' | 'upvotedBy' | 'downvotedBy' | 'isSolution' | 'isEdited' | 'reactions'> = {
            postId: postId,
            content: content,
            authorId: session.user.id,
            authorUsername: session.user.username,
            authorAvatar: session.user.avatar || "",
            parentId: parentId || null,
            mentions: mentionedUserIds, // Simpan ID pengguna yang di-mention
            media: media || [],
        };

        const result = await createForumReply(newReplyData);

        if (result.status) {
            const post = await getForumPostById(postId);
            if (post) {
                // Kumpulkan semua user ID yang akan dinotifikasi untuk menghindari duplikasi
                const usersToNotify = new Set<string>();

                // 1. Notifikasi penulis postingan jika bukan yang membalas dan belum di-mention
                if (post.authorId !== session.user.id && !mentionedUserIds.includes(post.authorId)) {
                    usersToNotify.add(post.authorId);
                }

                // 2. Notifikasi penulis balasan induk jika ini balasan bersarang, bukan diri sendiri, dan belum di-mention
                let parentReplyAuthorId: string | null = null;
                if (parentId) {
                    const parentReply = await retriveDataById<ForumReply>("forumReplies", parentId);
                    if (parentReply) {
                        parentReplyAuthorId = parentReply.authorId;
                        if (parentReply.authorId !== session.user.id && !mentionedUserIds.includes(parentReply.authorId)) {
                            usersToNotify.add(parentReply.authorId);
                        }
                    }
                }

                // 3. Notifikasi pengguna yang disebutkan (mention)
                // Filter mentionedUserIds untuk mengecualikan penulis komentar, penulis post, dan penulis reply induk (jika sudah dinotifikasi)
                const distinctMentionedUserIds = mentionedUserIds.filter(id =>
                    id !== session.user.id && // Bukan diri sendiri
                    id !== post.authorId && // Bukan penulis post (jika sudah dinotifikasi via comment_on_post)
                    (parentReplyAuthorId ? id !== parentReplyAuthorId : true) // Bukan penulis reply induk (jika sudah dinotifikasi via reply_to_comment)
                );
                distinctMentionedUserIds.forEach(id => usersToNotify.add(id));


                // Kirim notifikasi ke setiap pengguna yang perlu dinotifikasi
                for (const userIdToNotify of Array.from(usersToNotify)) {
                    let notificationType: NotificationType;
                    let notificationTitle: string;
                    let notificationMessage: string;

                    if (userIdToNotify === post.authorId) {
                        notificationType = "forum_comment_on_post";
                        notificationTitle = "Komentar Baru!";
                        notificationMessage = `${session.user.username} mengomentari postingan Anda: &quot;${post.title}&quot;.`;
                    } else if (parentId && userIdToNotify === parentReplyAuthorId) {
                        notificationType = "forum_reply_to_comment";
                        notificationTitle = "Balasan Komentar Anda!";
                        notificationMessage = `${session.user.username} membalas komentar Anda di postingan: &quot;${post.title}&quot;.`;
                    } else if (mentionedUserIds.includes(userIdToNotify)) { // Ini adalah mention
                        notificationType = "forum_mention";
                        notificationTitle = "Anda Disebutkan!";
                        notificationMessage = `${session.user.username} menyebut Anda dalam komentar di postingan: &quot;${post.title}&quot;.`;
                    } else {
                        // Fallback, seharusnya tidak terjadi jika logika di atas benar
                        notificationType = "system";
                        notificationTitle = "Pemberitahuan Forum";
                        notificationMessage = `Ada aktivitas baru yang melibatkan Anda di postingan &quot;${post.title}&quot;.`;
                    }

                    await createNotification({
                        userId: userIdToNotify,
                        type: notificationType,
                        title: notificationTitle,
                        message: notificationMessage,
                        link: `/forum/${postId}#comment-${result.replyId}`,
                        actorId: session.user.id,
                        actorUsername: session.user.username,
                        postId: postId,
                        postTitle: post.title,
                        replyId: result.replyId,
                        commentContentPreview: content.substring(0, Math.min(content.length, 100)) + (content.length > 100 ? "..." : ""),
                    });
                }
            }

            return NextResponse.json({ status: true, statusCode: 201, message: result.message, replyId: result.replyId }, { status: 201 });
        } else {
            console.error("Firestore service error (createForumReply failed):", result.message);
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error creating reply for post ${postId} (catch block):`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to create reply.", error: (error instanceof Error) ? error.message : "Terjadi kesalahan yang tidak diketahui." }, { status: 500 });
    }
}