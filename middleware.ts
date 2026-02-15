import { auth } from "@/auth";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    // Public routes
    const publicPaths = ["/login", "/api/auth"];
    const isPublic = publicPaths.some((path) => pathname.startsWith(path));

    if (isPublic) {
        return;
    }

    // Redirect unauthenticated users to login
    if (!isLoggedIn) {
        const loginUrl = new URL("/login", req.nextUrl.origin);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return Response.redirect(loginUrl);
    }

    // Admin-only routes
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
        const role = req.auth?.user?.role;
        if (role !== "admin") {
            const forbiddenUrl = new URL("/dashboard", req.nextUrl.origin);
            return Response.redirect(forbiddenUrl);
        }
    }
});

export const config = {
    matcher: [
        "/((?!_next/static|_next/image|favicon.ico|$).*)",
    ],
};
