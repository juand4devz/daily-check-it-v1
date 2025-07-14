// /api/register/route.ts
import { register } from "@/lib/firebase/service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    const { name, email, password } = await request.json(); // Destructure required fields

    // Panggil fungsi register dengan data yang sesuai
    const res = await register({ username: name, email, password });

    // Sesuaikan respons sesuai dengan struktur res dari fungsi register
    if (res.status) {
        return NextResponse.json({ message: res.message }, { status: res.statusCode });
    } else {
        return NextResponse.json({ message: res.message }, { status: res.statusCode });
    }
}