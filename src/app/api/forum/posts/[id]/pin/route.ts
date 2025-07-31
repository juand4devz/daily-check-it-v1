// /app/api/forum/posts/[id]/pin/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../../auth";
import {
    togglePostPinStatus,
    togglePostArchiveStatus,
    getUserById,
} from "@/lib/firebase/service";

// Tipe body dari request
interface PostActionRequestBody {
    action: "pin" | "archive";
    status: boolean;
}

// Tipe respons dari service
interface PostActionResponse {
    status: boolean;
    statusCode?: number;
    message: string;
}

// PATCH: Handle pin/archive status of a post
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
): Promise<NextResponse> {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json(
            {
                status: false,
                statusCode: 401,
                message: "Unauthorized: User not authenticated.",
            },
            { status: 401 }
        );
    }

    const postId = params.id;
    if (!postId || typeof postId !== "string") {
        return NextResponse.json(
            {
                status: false,
                statusCode: 400,
                message: "ID postingan tidak valid.",
            },
            { status: 400 }
        );
    }

    const userId = session.user.id;
    const user = await getUserById(userId);

    if (!user || user.role !== "admin") {
        return NextResponse.json(
            {
                status: false,
                statusCode: 403,
                message: "Forbidden: Only administrators can perform this action.",
            },
            { status: 403 }
        );
    }

    let body: PostActionRequestBody;

    try {
        body = await request.json();
    } catch (e) {
        console.error("API Error: Failed to parse request body as JSON:", e);
        return NextResponse.json(
            {
                status: false,
                statusCode: 400,
                message: "Permintaan tidak valid: Body harus JSON.",
            },
            { status: 400 }
        );
    }

    const { action, status: newStatus } = body;

    if (
        !action ||
        (action !== "pin" && action !== "archive") ||
        typeof newStatus !== "boolean"
    ) {
        return NextResponse.json(
            {
                status: false,
                statusCode: 400,
                message: "Aksi atau status tidak valid.",
            },
            { status: 400 }
        );
    }

    try {
        let result: PostActionResponse;

        if (action === "pin") {
            result = await togglePostPinStatus(postId, newStatus, userId);
        } else {
            result = await togglePostArchiveStatus(postId, newStatus, userId);
        }

        return NextResponse.json(
            {
                status: result.status,
                statusCode: result.statusCode ?? 200,
                message: result.message,
            },
            { status: result.status ? 200 : result.statusCode ?? 500 }
        );
    } catch (error) {
        console.error(
            `API Error handling post action (${action}) for post ${postId}:`,
            error
        );

        return NextResponse.json(
            {
                status: false,
                statusCode: 500,
                message: "Gagal melakukan aksi.",
                error:
                    error instanceof Error
                        ? error.message
                        : "Terjadi kesalahan yang tidak diketahui.",
            },
            { status: 500 }
        );
    }
}
