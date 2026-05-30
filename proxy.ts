import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { rateLimit } from "./lib/rateLimit";

export default withAuth(
  function middleware(req) {
    const ip = req.ip || req.headers.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";
    
    // Default limit of 60 requests per minute for admin/checkout paths
    const limit = 60;
    const { isRateLimited, remaining, resetTime } = rateLimit(ip, limit);

    if (isRateLimited) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": resetTime.toString(),
          },
        }
      );
    }

    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;
    
    const isDevBypass = process.env.NODE_ENV === "development" && req.headers.get("x-bypass-auth") === "true";
    const role = isDevBypass ? "ADMIN" : (token?.role as string)?.toUpperCase();

    console.log(`[Middleware Debug] Path: ${pathname}, Role: ${role}, Token exists: ${!!token}, Bypass: ${isDevBypass}`);

    // Admin routes protection: must be ADMIN or STAFF
    if (pathname.startsWith("/admin")) {
      if (role !== "ADMIN" && role !== "STAFF") {
        // Redirect to a 403 Forbidden page or home page with access denied warning
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

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", resetTime.toString());
    return response;
  },
  {
    callbacks: {
      // Allow passing through to the middleware function if token exists or in dev bypass
      authorized: ({ token, req }) => {
        if (process.env.NODE_ENV === "development" && req.headers.get("x-bypass-auth") === "true") {
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

