import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/features/admin/lib/session";

export const config = {
  matcher: ["/admin/:path*", "/api/upload"],
};

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLogin = pathname === "/admin";
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await verifySessionToken(token);

  if (isLogin) {
    if (session) return NextResponse.redirect(new URL("/admin/campaigns", request.url));
    return NextResponse.next();
  }

  if (!session) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  return NextResponse.next();
}
