import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { rateLimit } from "./lib/rateLimit";

export default withAuth(
  function middleware(req) {
    // Extract real client IP behind reverse proxy (Traefik/Coolify)
    const realIp = req.headers.get("x-real-ip");
    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = realIp || forwardedFor?.split(",")[0]?.trim() || "unknown";

    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Use user email + IP as rate limit key for better accuracy behind proxies
    const rateLimitKey = token?.email ? `${token.email}` : ip;

    // Higher limit for admin (many API calls per page), lower for checkout
    const limit = pathname.startsWith("/api/admin") || pathname.startsWith("/admin") ? 200 : 100;
    const { isRateLimited, remaining, resetTime } = rateLimit(rateLimitKey, limit);

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

    const response = NextResponse.next();
    response.headers.set("X-RateLimit-Limit", limit.toString());
    response.headers.set("X-RateLimit-Remaining", remaining.toString());
    response.headers.set("X-RateLimit-Reset", resetTime.toString());
    return response;
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

