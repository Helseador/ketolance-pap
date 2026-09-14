import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "pap_session";

export async function proxy(request: NextRequest) {
  const token = request.cookies.get(COOKIE)?.value;
  const isDashboard = request.nextUrl.pathname.startsWith("/dashboard");
  const isLogin = request.nextUrl.pathname.startsWith("/login");

  if (!isDashboard && !isLogin) return NextResponse.next();

  const secret = process.env.AUTH_SECRET;
  if (!secret) return NextResponse.next();

  let valid = false;
  if (token) {
    try {
      await jwtVerify(token, new TextEncoder().encode(secret));
      valid = true;
    } catch {
      valid = false;
    }
  }

  if (isDashboard && !valid) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  if (isLogin && valid) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
