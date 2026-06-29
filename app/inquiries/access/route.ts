import { NextRequest, NextResponse } from "next/server";
import {
  INQUIRY_ACCESS_COOKIE_NAME,
  validateInquiryAccessToken
} from "@/lib/inquiry-access";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token") || "";
  const access = await validateInquiryAccessToken(token);

  if (!access) {
    return NextResponse.redirect(new URL("/inquiries/link-expired", request.url));
  }

  await prisma.inquiryAccessToken.update({
    where: {
      id: access.id
    },
    data: {
      lastUsedAt: new Date()
    }
  });

  const response = NextResponse.redirect(
    new URL(`/inquiries/${access.inquiryId}`, request.url)
  );
  response.cookies.set(INQUIRY_ACCESS_COOKIE_NAME, token, {
    expires: access.expiresAt,
    httpOnly: true,
    path: "/inquiries",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
  response.headers.set("Referrer-Policy", "no-referrer");

  return response;
}
