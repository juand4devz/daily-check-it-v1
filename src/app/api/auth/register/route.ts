// /api/register/route.ts
import { register } from "@/lib/firebase/service";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    // Perbaikan: Destrukturisasi `username`, bukan `name`.
    const { username, email, password } = await request.json();

    if (!username || !email || !password) {
        return NextResponse.json({ message: "Data tidak lengkap." }, { status: 400 });
    }

    // Panggil fungsi register dengan data yang sesuai
    const res = await register({ username, email, password });

    // Sesuaikan respons sesuai dengan struktur res dari fungsi register
    if (res.status) {
        return NextResponse.json({ message: res.message }, { status: res.statusCode });
    } else {
        return NextResponse.json({ message: res.message }, { status: res.statusCode });
    }
}