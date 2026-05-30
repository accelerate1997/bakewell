import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    const isDevBypass = process.env.NODE_ENV === "development" && req.headers.get("x-bypass-auth") === "true";
    const role = isDevBypass ? "ADMIN" : (token?.role as string)?.toUpperCase();

    // Admin routes protection: must be ADMIN or STAFF
    if (pathname.startsWith("/admin")) {
      if (role !== "ADMIN" && role !== "STAFF") {
        return NextResponse.redirect(new URL("/?error=AccessDenied", req.url));
      }

      // Staff cannot access users and settings
      if (role === "STAFF") {
        if (pathname.startsWith("/admin/users") || pathname.startsWith("/admin/settings")) {
          return NextResponse.redirect(new URL("/admin?error=Unauthorized", req.url));
        }
      }
    }

    // Admin API protection: must be ADMIN or STAFF
    if (pathname.startsWith("/api/admin")) {
      if (role !== "ADMIN" && role !== "STAFF") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      // Staff cannot access users and settings APIs
      if (role === "STAFF") {
        if (pathname.startsWith("/api/admin/users") || pathname.startsWith("/api/admin/settings")) {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (process.env.NODE_ENV === "development" && (req as NextRequest).headers.get("x-bypass-auth") === "true") {
          return true;
        }
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/checkout/:path*", "/api/admin/((?!upload).*)"],
};
