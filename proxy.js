import { NextResponse } from "next/server";

export function proxy(request) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    return new NextResponse("401 Unauthorized", { status: 401 });
  }

  const header = request.headers.get("authorization") ?? "";
  const [scheme, encoded] = header.split(" ");

  if (scheme === "Basic" && encoded) {
    const decoded = atob(encoded);
    const [givenUser, givenPass] = decoded.split(":");
    if (givenUser === username && givenPass === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse("401 Unauthorized", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="DOOM Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*"],
};
