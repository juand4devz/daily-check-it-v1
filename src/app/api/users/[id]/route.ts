import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getUserById, updateUserAdminAction, deleteUser } from "@/lib/firebase/service"; // Menggunakan service.ts
import type { User } from "@/types/types";

// Middleware untuk memeriksa admin (opsional, tapi sangat disarankan)
async function checkAdmin() {
    const session = await auth();
    if (!session || session.user?.role !== 'admin') {
        return {
            isAuthorized: false,
            response: NextResponse.json({ error: "Unauthorized: Access denied." }, { status: 403 })
        };
    }
    return { isAuthorized: true, response: null };
}

// --- GET Request Handler ---
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const authResult = await checkAdmin();
    if (!authResult.isAuthorized) {
        return authResult.response;
    }

    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "ID pengguna diperlukan." }, { status: 400 });
        }

        const user = await getUserById(id);
        if (!user) {
            return NextResponse.json({ error: "Pengguna tidak ditemukan." }, { status: 404 });
        }

        const { ...rest } = user;
        return NextResponse.json(rest);
    } catch (caughtError: unknown) {
        console.error(`Terjadi kesalahan saat mengambil data pengguna ${params.id}:`, caughtError);
        let errorMessage = "Gagal mengambil data pengguna dari database.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// --- PUT Request Handler ---
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const authResult = await checkAdmin();
    if (!authResult.isAuthorized) {
        return authResult.response;
    }

    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "ID pengguna diperlukan untuk pembaruan." }, { status: 400 });
        }

        const updatedFields: Partial<User> & { resetTokens?: boolean } = await request.json();
        const result = await updateUserAdminAction(id, updatedFields);

        if (!result.status) {
            return NextResponse.json({ error: result.message }, { status: 400 });
        }

        return NextResponse.json({ message: "Pengguna berhasil diperbarui." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error(`Terjadi kesalahan saat memperbarui pengguna ${params.id}:`, caughtError);
        let errorMessage = "Terjadi kesalahan server saat memperbarui profil.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}

// --- DELETE Request Handler ---
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const authResult = await checkAdmin();
    if (!authResult.isAuthorized) {
        return authResult.response;
    }

    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: "ID pengguna diperlukan untuk penghapusan." }, { status: 400 });
        }

        const result = await deleteUser(id);

        if (!result.status) {
            return NextResponse.json({ error: result.message }, { status: 404 });
        }

        return NextResponse.json({ message: "Pengguna berhasil dihapus secara permanen." }, { status: 200 });
    } catch (caughtError: unknown) {
        console.error(`Terjadi kesalahan saat menghapus pengguna ${params.id}:`, caughtError);
        let errorMessage = "Terjadi kesalahan server saat menghapus pengguna.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}