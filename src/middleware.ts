// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const authPaths = ["/", "/login", "/register"];
const forumPaths = ["/forum", "/forum-feed"];
const userPaths = [
    "/ai-assistance",
    "/bookmarks",
    "/diagnose",
    "/forum",
    "/forum-feed",
    "/notifications",
    "/profile",
];
const adminPaths = [
    "/admin",
    "/admin/damages",
    "/admin/discussion-forum",
    "/admin/massscope",
    "/admin/reports",
    "/admin/symptoms",
    "/admin/users",
];
const bannedPaths = ["/banned"];

// Tambahkan util untuk cek /users/[id]
function isUserDetailPage(pathname: string) {
    return /^\/users\/[^/]+$/.test(pathname);
}

// Utility untuk ngecek apakah path ada di daftar (termasuk subpath)
function matchPath(pathname: string, paths: string[]) {
    return paths.some(
        (p) => pathname === p || pathname.startsWith(p + "/")
    );
}

export async function middleware(req: NextRequest) {
    const token = await getToken({
        req,
        secret: process.env.AUTH_SECRET,
        secureCookie:
            process.env.NODE_ENV === "production" &&
            process.env.AUTH_URL?.startsWith("https"),
    });

    const { pathname } = req.nextUrl;
    const isLoggedIn = !!token;
    const role = token?.role;

    // ===== ROLE: BANNED =====
    if (role === "banned") {
        if (!matchPath(pathname, bannedPaths)) {
            return NextResponse.redirect(new URL("/banned", req.url));
        }
        return NextResponse.next();
    }

    // ===== ROLE: GUEST =====
    if (!isLoggedIn) {
        if (
            !matchPath(pathname, [...authPaths, ...forumPaths]) &&
            !isUserDetailPage(pathname)
        ) {
            return NextResponse.redirect(new URL("/login", req.url));
        }
        return NextResponse.next();
    }

    // ===== ROLE: USER =====
    if (role === "user") {
        if (
            !matchPath(pathname, userPaths) &&
            !isUserDetailPage(pathname)
        ) {
            return NextResponse.redirect(new URL("/profile", req.url));
        }
        return NextResponse.next();
    }

    // ===== ROLE: ADMIN =====
    if (role === "admin") {
        if (
            !matchPath(pathname, [...userPaths, ...adminPaths]) &&
            !isUserDetailPage(pathname)
        ) {
            return NextResponse.redirect(new URL("/profile", req.url));
        }
        return NextResponse.next();
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|gif)$).*)",
    ],
};
