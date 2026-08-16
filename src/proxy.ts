import { NextRequest, NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const host = (request.headers.get("host") || "")
    .split(":")[0]
    .toLowerCase();

  const pathname = request.nextUrl.pathname;

  const registerHost = "register.mahamarathon.co.in";
  const dashboardHost = "dashboard.mahamarathon.co.in";
  const adminHost = "admin.mahamarathon.co.in";

  // REGISTER PORTAL
  if (host === registerHost) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/register";
      return NextResponse.rewrite(url);
    }

    if (
      pathname.startsWith("/dashboard") ||
      pathname.startsWith("/admin")
    ) {
      return NextResponse.redirect(
        new URL("https://register.mahamarathon.co.in", request.url)
      );
    }
  }

  // DASHBOARD PORTAL
  if (host === dashboardHost) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.rewrite(url);
    }

    if (
      pathname.startsWith("/register") ||
      pathname.startsWith("/admin")
    ) {
      return NextResponse.redirect(
        new URL("https://dashboard.mahamarathon.co.in", request.url)
      );
    }
  }

  // ADMIN PORTAL
  if (host === adminHost) {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }

    if (
      pathname.startsWith("/register") ||
      pathname.startsWith("/dashboard")
    ) {
      return NextResponse.redirect(
        new URL("https://admin.mahamarathon.co.in", request.url)
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};