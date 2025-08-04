// /app/api/admin/reports/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../../auth";
import { updateReportStatus, deleteReport } from "@/lib/firebase/service";

// PATCH: Update report status (Admin only)
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
    // Pastikan untuk meng-await params sebelum mengakses propertinya
    const { id: reportId } = await params;

    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
        return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Only admins can update report status." }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { status } = body;

        if (!status || !["resolved", "dismissed"].includes(status)) {
            return NextResponse.json({ status: false, statusCode: 400, message: "Invalid status provided. Must be 'resolved' or 'dismissed'." }, { status: 400 });
        }

        const result = await updateReportStatus(reportId, status, session.user.id);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message }, { status: 200 });
        } else {
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error updating report ${reportId}:`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to update report status.", error: (error as Error).message }, { status: 500 });
    }
}

// DELETE: Delete a report (Admin only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    // Pastikan untuk meng-await params sebelum mengakses propertinya
    const { id: reportId } = await params;

    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
        return NextResponse.json({ status: false, statusCode: 403, message: "Forbidden: Only admins can delete reports." }, { status: 403 });
    }

    try {
        const result = await deleteReport(reportId);

        if (result.status) {
            return NextResponse.json({ status: true, statusCode: 200, message: result.message }, { status: 200 });
        } else {
            return NextResponse.json({ status: false, statusCode: 500, message: result.message }, { status: 500 });
        }
    } catch (error) {
        console.error(`API Error deleting report ${reportId}:`, error);
        return NextResponse.json({ status: false, statusCode: 500, message: "Failed to delete report.", error: (error as Error).message }, { status: 500 });
    }
}