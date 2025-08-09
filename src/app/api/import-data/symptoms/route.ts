// app/api/import-data/symptoms/route.ts

import { NextRequest, NextResponse } from "next/server";
import { importGejalaData } from "@/lib/firebase/import-data";
import { ImportRequestBody, Gejala, ImportApiResponse } from "@/types/diagnose";

export async function POST(request: NextRequest) {
    try {
        const { data, replaceExisting }: ImportRequestBody<Gejala> =
            await request.json();

        // Memanggil fungsi layanan yang spesifik
        const result: ImportApiResponse = await importGejalaData(data, replaceExisting);

        return NextResponse.json(result, {
            status: result.errors.length > 0 || result.warnings.length > 0 ? 202 : 200,
        });
    } catch (caughtError: unknown) {
        console.error("Terjadi kesalahan saat import data gejala:", caughtError);
        let errorMessage = "Terjadi kesalahan server saat mengimpor data gejala.";
        if (caughtError instanceof Error) {
            errorMessage = caughtError.message;
        }
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
