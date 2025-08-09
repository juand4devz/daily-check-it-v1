// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
import { auth } from '../auth';

const unprotectedRoutes = ['/login', '/register', '/']; // Halaman yang tidak memerlukan autentikasi

export async function middleware(request: NextRequest) {
    const session = await auth();
    const { pathname } = request.nextUrl;

    const isProtectedRoute = !unprotectedRoutes.includes(pathname);

    // Jika pengguna tidak punya sesi dan mencoba mengakses halaman yang dilindungi, redirect ke halaman login
    if (!session && isProtectedRoute) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('callbackUrl', pathname); // Simpan rute asli
        return NextResponse.redirect(loginUrl);
    }

    // Jika pengguna sudah login dan mencoba mengakses halaman login/register/beranda, redirect ke dashboard
    if (session && unprotectedRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL('/forum-feed', request.url));
    }

    return NextResponse.next();
}

// Matched untuk semua rute kecuali file statis
export const config = {
    matcher: [],
};