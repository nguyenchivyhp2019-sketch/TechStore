import { NextResponse } from "next/server";

export function middleware(request) {
  const password = process.env.ADMIN_PASSWORD;
  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");

  if (password && scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    const given = decoded.slice(decoded.indexOf(":") + 1);
    if (given === password) return NextResponse.next();
  }

  return new NextResponse("Cần đăng nhập", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Admin Area"' },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
