// /app/api/forum/notifications/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth"; // Sesuaikan path sesuai struktur proyek Anda
import { markNotificationAsRead, deleteNotificationById } from "@/lib/firebase/service"; // Import getUserNotifications untuk verifikasi opsional

// PATCH: mark single read
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    // PENTING: Gunakan destructuring dengan await params untuk mengakses properti
    const { id: notificationId } = await params;

    try {
        // Opsi: Verifikasi apakah notifikasi ini milik pengguna yang login
        // Jika Anda ingin verifikasi ketat, uncomment bagian ini dan pastikan getUserNotifications berfungsi baik.
        // const notifications = await getUserNotifications(session.user.id);
        // const notificationExistsAndBelongsToUser = notifications.some(n => n.id === notificationId);
        // if (!notificationExistsAndBelongsToUser) {
        //     console.warn(`Attempt to modify unauthorized notification: ${notificationId} by user ${session.user.id}`);
        //     return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Not authorized to modify this notification." }, { status: 403 });
        // }

        const result = await markNotificationAsRead(notificationId);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message }, { status: 200 });
        } else {
            console.error(`Firestore service error (markNotificationAsRead failed) for ${notificationId}:`, result.message);
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error marking notification ${notificationId} as read (catch block):`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to mark notification as read.", error: (error instanceof Error) ? error.message : "Terjadi kesalahan yang tidak diketahui." }, { status: 500 });
    }
}

// DELETE: delete single
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const session = await auth();
    if (!session?.user?.id) {
        return NextResponse.json({ status: false, statusCode: 401, message: "Unauthorized: User not authenticated." }, { status: 401 });
    }

    // PENTING: Gunakan destructuring dengan await params untuk mengakses properti
    const { id: notificationId } = await params;

    try {
        // Opsi: Verifikasi apakah notifikasi ini milik pengguna yang login
        // const notifications = await getUserNotifications(session.user.id);
        // const notificationExistsAndBelongsToUser = notifications.some(n => n.id === notificationId);
        // if (!notificationExistsAndBelongsToUser) {
        //     console.warn(`Attempt to delete unauthorized notification: ${notificationId} by user ${session.user.id}`);
        //     return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Not authorized to delete this notification." }, { status: 403 });
        // }

        const result = await deleteNotificationById(notificationId);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message }, { status: 200 });
        } else {
            console.error(`Firestore service error (deleteNotificationById failed) for ${notificationId}:`, result.message);
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error deleting notification ${notificationId} (catch block):`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to delete notification.", error: (error instanceof Error) ? error.message : "Terjadi kesalahan yang tidak diketahui." }, { status: 500 });
    }
}