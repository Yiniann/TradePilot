import { randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const visitorCookieName = "tradepilot_visitor_id";
const ignoredPrefixes = ["/admin", "/login", "/api", "/_next"];

function normalizePath(value: unknown) {
  const path = String(value ?? "").trim();

  if (!path.startsWith("/")) {
    return "/";
  }

  return path.slice(0, 300);
}

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as {
    path?: unknown;
  };
  const path = normalizePath(payload.path);

  if (ignoredPrefixes.some((prefix) => path.startsWith(prefix))) {
    return NextResponse.json({ ok: true });
  }

  const cookieStore = await cookies();
  let visitorId = cookieStore.get(visitorCookieName)?.value;

  if (!visitorId) {
    visitorId = randomUUID();
  }

  const requestHeaders = await headers();
  await prisma.siteVisit.create({
    data: {
      visitorId,
      path,
      referrer: requestHeaders.get("referer"),
      userAgent: requestHeaders.get("user-agent"),
      ipAddress: requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null
    }
  });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(visitorCookieName, visitorId, {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });

  return response;
}
