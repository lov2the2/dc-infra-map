import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
    const isLoggedIn = !!req.auth;
    const { pathname } = req.nextUrl;

    // Public routes
    const publicPaths = ["/login", "/api/auth", "/api-docs"];
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

    // Inject internal secret for Go service proxy routes
    const goServicePaths = [
        "/api/sites", "/api/regions", "/api/locations", "/api/racks",
        "/api/devices", "/api/device-types", "/api/manufacturers", "/api/tenants",
        "/api/dashboard",
        "/api/power", "/api/export",
        "/api/cables", "/api/interfaces", "/api/console-ports", "/api/front-ports",
        "/api/rear-ports", "/api/access-logs", "/api/equipment-movements",
        "/api/alerts", "/api/reports", "/api/audit-logs", "/api/import",
    ];
    if (isLoggedIn && goServicePaths.some((p) => pathname.startsWith(p))) {
        const headers = new Headers(req.headers);
        headers.set("x-internal-secret", process.env.X_INTERNAL_SECRET ?? "");
        return NextResponse.next({ request: { headers } });
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
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$|$).*)",
    ],
};
