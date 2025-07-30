// /app/api/forum/bookmarks/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getUserBookmarks } from "@/lib/firebase/service";

// GET: all bookmarks for user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        const bookmarks = await getUserBookmarks(userId);
        return NextResponse.json({ status: true, statusCode: 200, message: "Bookmarks fetched successfully.", data: bookmarks }, { status: 200 });
    } catch (error) {
        console.error("API Error fetching bookmarks:", error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to fetch bookmarks.", error: (error as Error).message }, { status: 500 });
    }
}