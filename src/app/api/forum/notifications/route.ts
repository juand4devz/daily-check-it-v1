// /app/api/forum/notifications/route.ts
import { NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { deleteUserNotifications, getUserNotifications, markAllUserNotificationsAsRead } from "@/lib/firebase/service";

// GET: all notifications for user
export async function GET() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        const notifications = await getUserNotifications(userId);
        return NextResponse.json({ status: true, statusCode: 200, message: "Notifications fetched successfully.", data: notifications }, { status: 200 });
    } catch (error) {
        console.error("API Error fetching notifications:", error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to fetch notifications.", error: (error as Error).message }, { status: 500 });
    }
}

// PATCH: mark all read
export async function PATCH() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        const result = await markAllUserNotificationsAsRead(userId);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message }, { status: 200 });
        } else {
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error("API Error marking all notifications as read:", error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to mark all notifications as read.", error: (error as Error).message }, { status: 500 });
    }
}

// DELETE: clear all notifications for a user
export async function DELETE() {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    try {
        const userId = session.user.id;
        const result = await deleteUserNotifications(userId);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message }, { status: 200 });
        } else {
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error("API Error deleting all user notifications:", error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to delete all user notifications.", error: (error as Error).message }, { status: 500 });
    }
}