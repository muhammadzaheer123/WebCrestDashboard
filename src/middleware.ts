import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify, type JWTPayload } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error(
    "JWT_SECRET is missing. Add it to .env and restart the server.",
  );
}

const key = new TextEncoder().encode(JWT_SECRET);

type RolePayload = JWTPayload & { role?: string };

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const token = req.cookies.get("token")?.value;

  const isProtected =
    path.startsWith("/admin") || path.startsWith("/dashboard");

  // if (isProtected) {
  //   if (!token) {
  //     return NextResponse.redirect(new URL("/login", req.url));
  //   }

  //   try {
  //     const { payload } = await jwtVerify(token, key);
  //     const role = (payload as RolePayload).role;

  //     if (role !== "admin" && role !== "hr") {
  //       return NextResponse.redirect(new URL("/login", req.url));
  //     }
  //   } catch {
  //     return NextResponse.redirect(new URL("/login", req.url));
  //   }
  // }

  if (path === "/login" && token) {
    try {
      const { payload } = await jwtVerify(token, key);
      const role = (payload as RolePayload).role;

      if (role === "admin" || role === "hr") {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    } catch {}
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login"],
};
