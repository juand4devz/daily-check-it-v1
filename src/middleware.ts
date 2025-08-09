// middleware.ts
import { NextResponse } from 'next/server';

export function middleware() {
    return NextResponse.next(); // Tidak melakukan apa-apa, hanya meneruskan request
}

// Konfigurasi matcher kosong agar middleware tidak aktif di rute mana pun
export const config = {
    matcher: [],
};
