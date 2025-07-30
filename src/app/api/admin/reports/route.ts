// /app/api/admin/reports/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { createReport, getReports, getForumPostById, getForumRepliesByPostId, getUserById } from "@/lib/firebase/service";
import { Report, ReportEntityType } from "@/types/types";

// POST: Create a new report
export async function POST(request: NextRequest) {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.username) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { reportType, entityId, reason, details, postIdForReply, // Ambil postIdForReply dari body
            entityTitle, entityContentPreview, entityUsername, entityAuthorId, entityAuthorUsername } = body;

        // Validasi dasar
        if (!reportType || !entityId || !reason) {
            console.error("API Error: Missing required fields in report payload.");
            return NextResponse.json({ status: false, statusCode: 400, message: "Missing required fields (reportType, entityId, reason)." }, { status: 400 });
        }

        const validReportTypes: ReportEntityType[] = ["forum_post", "forum_reply", "user"];
        if (!validReportTypes.includes(reportType)) {
            console.error(`API Error: Invalid report type provided: ${reportType}`);
            return NextResponse.json({ status: false, statusCode: 400, message: "Invalid report type." }, { status: 400 });
        }

        console.log("Menerima payload di API:", body);

        // Inisialisasi variabel dengan nilai default null
        let finalEntityTitle: string | null = entityTitle || null;
        let finalEntityContentPreview: string | null = entityContentPreview || null;
        let finalEntityUsername: string | null = entityUsername || null;
        let finalEntityAuthorId: string | null = entityAuthorId || null;
        let finalEntityAuthorUsername: string | null = entityAuthorUsername || null;
        let finalEntityLink: string | null = null;


        switch (reportType) {
            case "forum_post":
                const post = await getForumPostById(entityId);
                if (post) {
                    finalEntityTitle = post.title;
                    finalEntityAuthorId = post.authorId;
                    finalEntityAuthorUsername = post.authorUsername;
                    finalEntityLink = `/forum/${entityId}`;
                } else {
                    console.error(`API Error: Reported post not found with ID: ${entityId}`);
                    return NextResponse.json({ status: false, statusCode: 404, message: "Reported post not found." }, { status: 404 });
                }
                break;
            case "forum_reply":
                if (!postIdForReply) {
                    console.error(`API Error: postIdForReply is missing for forum_reply report. entityId: ${entityId}`);
                    return NextResponse.json({ status: false, statusCode: 400, message: "Missing postIdForReply for forum_reply report." }, { status: 400 });
                }

                const allRepliesForPost = await getForumRepliesByPostId(postIdForReply);
                const reply = allRepliesForPost.find(r => r.id === entityId);

                if (reply) {
                    finalEntityContentPreview = reply.content.substring(0, Math.min(reply.content.length, 100)) + (reply.content.length > 100 ? "..." : "");
                    finalEntityAuthorId = reply.authorId;
                    finalEntityAuthorUsername = reply.authorUsername;
                    finalEntityLink = `/forum/${reply.postId}#comment-${entityId}`;
                    const parentPost = await getForumPostById(reply.postId);
                    if (parentPost) finalEntityTitle = parentPost.title;
                } else {
                    console.error(`API Error: Reported reply not found with ID: ${entityId} under post ID: ${postIdForReply}`);
                    return NextResponse.json({ status: false, statusCode: 404, message: "Reported reply not found." }, { status: 404 });
                }
                break;
            case "user":
                const user = await getUserById(entityId);
                if (user) {
                    finalEntityUsername = user.username;
                    finalEntityLink = `/profile/${entityId}`;
                } else {
                    console.error(`API Error: Reported user not found with ID: ${entityId}`);
                    return NextResponse.json({ status: false, statusCode: 404, message: "Reported user not found." }, { status: 404 });
                }
                break;
        }

        const newReportData: Omit<Report, 'id' | 'createdAt' | 'status' | 'resolvedAt' | 'resolvedBy'> = {
            reporterId: session.user.id,
            reporterUsername: session.user.username,
            reportType: reportType,
            entityId: entityId,
            reason: reason,
            details: details || null,
            entityTitle: finalEntityTitle,
            entityContentPreview: finalEntityContentPreview,
            entityUsername: finalEntityUsername,
            entityAuthorId: finalEntityAuthorId,
            entityAuthorUsername: finalEntityAuthorUsername,
            entityLink: finalEntityLink,
        };

        const result = await createReport(newReportData);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 201, message: result.message, reportId: result.reportId }, { status: 201 });
        } else {
            console.error("Firestore service error (createReport failed):", result.message); // Logging lebih detail
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error("API Error creating report (catch block):", error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to create report.", error: (error as Error).message }, { status: 500 });
    }
}


// GET: Get all reports (Admin only)
export async function GET(request: NextRequest) {
    const session = await auth();
    // PENTING: Periksa peran admin di sini juga
    if (!session?.user?.id || session.user.role !== "admin") {
        return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Only admins can view reports." }, { status: 403 });
    }

    const searchParams = request.nextUrl.searchParams;
    const statusFilter = searchParams.get('status') as "pending" | "resolved" | "dismissed" | "all" || "all";

    try {
        console.log(`API GET /admin/reports: Fetching reports with status filter: ${statusFilter}`); // Debugging API GET
        const reports = await getReports(statusFilter);
        return NextResponse.json({ status: true, statusCode: 200, message: "Reports fetched successfully.", data: reports }, { status: 200 });
    } catch (error) {
        // PENTING: Log error Firebase secara langsung untuk debugging
        if (error instanceof Error && 'code' in error && typeof (error as any).code === 'string') {
            console.error(`API Error fetching reports (FirebaseError: ${(error as any).code}):`, error);
        } else {
            console.error("API Error fetching reports (catch block):", error);
        }
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to fetch reports.", error: (error as Error).message }, { status: 500 });
    }
}