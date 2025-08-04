// /api/users/[id]/update/route.ts
import { NextResponse } from 'next/server';
import { auth } from '../../../../../../auth';
import { updateUserProfile } from '@/lib/firebase/service';

// Mengimpor Zod untuk validasi skema input
import { z } from 'zod';

// Skema Zod untuk validasi data yang masuk
const profileUpdateSchema = z.object({
    username: z.string().min(3, { message: "Username harus memiliki minimal 3 karakter." }).max(50, { message: "Username tidak boleh lebih dari 50 karakter." }).optional(),
    bio: z.string().max(255, { message: "Bio tidak boleh lebih dari 255 karakter." }).optional(),
    location: z.string().max(100, { message: "Lokasi tidak boleh lebih dari 100 karakter." }).optional(),
    phone: z.string().max(20, { message: "Nomor telepon tidak boleh lebih dari 20 karakter." }).optional(),
    website: z.string().url({ message: "Format website tidak valid." }).optional().or(z.literal('')),
    github: z.string().max(50).optional(),
    twitter: z.string().max(50).optional(),
    linkedin: z.string().max(50).optional(),
    instagram: z.string().max(50).optional(),
    avatar: z.string().url({ message: "URL avatar tidak valid." }).optional().or(z.literal('')),
    banner: z.string().url({ message: "URL banner tidak valid." }).optional().or(z.literal('')),
}).partial(); // `partial()` membuat semua field opsional

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth();
        const { id } = await params;

        // 1. Validasi Autentikasi dan Otorisasi
        if (!session || !session.user || session.user.id !== id) {
            return NextResponse.json({ message: "Tidak diotorisasi: Anda tidak memiliki izin untuk memperbarui profil ini." }, { status: 403 });
        }

        const body = await request.json();

        // 2. Validasi Input dengan Zod
        const validation = profileUpdateSchema.safeParse(body);
        if (!validation.success) {
            return NextResponse.json({
                message: "Validasi gagal.",
                errors: validation.error.formErrors.fieldErrors,
            }, { status: 400 });
        }

        const updatedFields = validation.data;

        // Hapus field yang memiliki nilai null atau string kosong agar tidak menimpa data yang tidak ingin diubah
        const cleanUpdatedFields = Object.fromEntries(
            Object.entries(updatedFields).filter(([value]) => value !== null && value !== '')
        );

        // 3. Panggil fungsi service untuk memperbarui profil di database
        const result = await updateUserProfile(id, cleanUpdatedFields);

        if (result.status) {
            return NextResponse.json({ message: "Profil berhasil diperbarui." }, { status: 200 });
        } else {
            return NextResponse.json({ message: result.message || "Gagal memperbarui profil." }, { status: 500 });
        }

    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ message: "Terjadi kesalahan server internal." }, { status: 500 });
    }
}