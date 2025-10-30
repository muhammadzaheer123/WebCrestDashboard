import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";
// import { ensureOfficeGate } from "@/lib/ip";

const encoder = new TextEncoder();
const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("token")?.value;

  // if (path.startsWith("/api/auth/")) {
  //   const gate = ensureOfficeGate(req.headers);
  //   if (!gate.ok) {
  //     return NextResponse.json(
  //       {
  //         message: "Access restricted",
  //         details: "Authentication is only available from office network",
  //         ip: gate.ip,
  //         reason: gate.reason,
  //       },
  //       { status: 403 }
  //     );
  //   }
  // }

  if (path.startsWith("/admin") || path.startsWith("/dashboard")) {
    if (!token) return NextResponse.redirect(new URL("/login", req.url));
    try {
      const { payload } = await jwtVerify(token, encoder.encode(JWT_SECRET));
      const role = (payload as JWTPayload & { role?: string }).role;
      if (role !== "admin" && role !== "hr") {
        return NextResponse.redirect(new URL("/login", req.url));
      }
    } catch {
      return NextResponse.redirect(new URL("/login", req.url));
    }
  }

  if (path === "/login" && token) {
    try {
      const { payload } = await jwtVerify(token, encoder.encode(JWT_SECRET));
      const role = (payload as JWTPayload & { role?: string }).role;
      if (role === "admin" || role === "hr") {
        return NextResponse.redirect(new URL("/admin/dashboard", req.url));
      }
    } catch {
      // invalid/expired token → allow reaching /login
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/:path*", "/admin/:path*", "/dashboard/:path*", "/login"],
};
