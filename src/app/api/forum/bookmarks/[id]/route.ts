// /app/api/forum/bookmarks/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { removeBookmark, getUserBookmarks } from "@/lib/firebase/service";

// DELETE: remove specific bookmark
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    const bookmarkId = params.id;
    const userId = session.user.id;

    try {
        // Optional: Verify this bookmark belongs to the user before deleting
        // This is a more robust check to prevent users from deleting others' bookmarks
        const userBookmarks = await getUserBookmarks(userId);
        const bookmarkToDelete = userBookmarks.find(b => b.id === bookmarkId);
        if (!bookmarkToDelete) {
            return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Not authorized to delete this bookmark." }, { status: 403 });
        }


        const result = await removeBookmark(bookmarkId);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message }, { status: 200 });
        } else {
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error deleting bookmark ${bookmarkId}:`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to delete bookmark.", error: (error as Error).message }, { status: 500 });
    }
}