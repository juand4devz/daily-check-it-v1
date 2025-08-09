// app/api/import-data/damages/route.ts

import { NextRequest, NextResponse } from "next/server";
import { importKerusakanData } from "@/lib/firebase/import-data";
import { ImportRequestBody, Kerusakan, ImportApiResponse } from "@/types/diagnose";

export async function POST(request: NextRequest) {
    try {
        const { data, replaceExisting }: ImportRequestBody<Kerusakan> =
            await request.json();

        // Memanggil fungsi layanan yang spesifik
        const result: ImportApiResponse = await importKerusakanData(data, replaceExisting);

        return NextResponse.json(result, {
            status: result.errors.length > 0 || result.warnings.length > 0 ? 202 : 200,
        });
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat import data kerusakan:", caughtError);
        let errorMessage = "Terjadi kesalahan server saat mengimpor data kerusakan.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
