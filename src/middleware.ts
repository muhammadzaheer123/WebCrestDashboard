import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getClientIp, isOfficeNetwork } from "@/lib/ip-utils";

const PROTECTED_ROUTES = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/register",
];

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const ip = getClientIp(req);

  console.log("🔐 Middleware checking:", {
    path,
    ip,
    userAgent: req.headers.get("user-agent"),
    allHeaders: Object.fromEntries(req.headers.entries()),
  });

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    path.startsWith(route)
  );

  if (isProtectedRoute) {
    const isAllowed = isOfficeNetwork(ip);

    console.log("🔍 IP Check Result:", {
      ip,
      isAllowed,
      ALLOWED_IPS: process.env.ALLOWED_IPS,
    });

    if (!isAllowed) {
      console.log("🚫 Access denied for IP:", ip, "on route:", path);
      return NextResponse.json(
        {
          message: "Access restricted",
          details: "Authentication is only available from office network",
          ip: ip,
          allowedNetworks: process.env.ALLOWED_IPS,
        },
        { status: 403 }
      );
    }

    console.log("✅ Office network access granted for IP:", ip);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*"],
};
