// /middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from './auth';

// Paths yang memerlukan autentikasi
const protectedPaths = [
    '/forum/new',
    '/forum/[id]/edit', // Pattern for edit page
    '/api/forum/', // All forum API routes
    '/notifications',
    '/forum/bookmarks',
    // Tambahkan path lain yang perlu dilindungi di sini
];

// Paths yang mengizinkan anonim (tidak login) tapi akan redirect jika sudah login
const publicPathsIfLoggedIn = [
    '/login',
    '/register',
];

export async function middleware(request: NextRequest) {
    const session = await auth(); // Mendapatkan sesi pengguna

    const { pathname } = request.nextUrl;

    // 1. Tangani path yang harus dilindungi (memerlukan login)
    const isProtectedPath = protectedPaths.some(path => {
        // Handle dynamic segments like /forum/[id]/edit
        if (path.includes('[id]')) {
            const regex = new RegExp(`^${path.replace(/\[id\]/g, '[^/]+')}(/.*)?$`);
            return regex.test(pathname);
        }
        return pathname.startsWith(path);
    });

    if (isProtectedPath) {
        if (!session) {
            // Jika tidak ada sesi, redirect ke halaman login
            const url = new URL('/login', request.url);
            url.searchParams.set('callbackUrl', encodeURIComponent(pathname)); // Simpan URL asli untuk redirect setelah login
            return NextResponse.redirect(url);
        }
    }

    // 2. Tangani path yang seharusnya tidak diakses jika sudah login (redirect ke homepage atau dashboard)
    const isPublicPathIfLoggedIn = publicPathsIfLoggedIn.includes(pathname);
    if (isPublicPathIfLoggedIn && session) {
        return NextResponse.redirect(new URL('/', request.url)); // Redirect ke homepage atau dashboard
    }

    return NextResponse.next(); // Lanjutkan request jika tidak ada aturan yang cocok
}

// Konfigurasi matcher untuk middleware
export const config = {
    matcher: [
        /*
         * Mencocokkan semua path request kecuali:
         * - API routes (api/auth/*, api/upload-auth) yang diatur terpisah
         * - next/static files (_next/static)
         * - next/image files (_next/image)
         * - favicon.ico
         * - Dan path yang secara eksplisit tidak perlu di-match (misal: /)
         */
        '/((?!api/auth|api/upload-auth|_next/static|_next/image|favicon.ico|).*.)', // Match all paths except those starting with /api/auth or /_next or favicon.ico
        '/', // Ensure homepage is matched
    ],
};