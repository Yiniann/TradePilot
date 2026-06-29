import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { getSiteSettings } from "@/lib/site-settings";

export const INQUIRY_ACCESS_COOKIE_NAME = "tradepilot_inquiry_access";

const ACCESS_DAYS = 90;

function hashAccessToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function getAppUrl() {
  const settings = await getSiteSettings();
  return (settings?.appUrl || "http://localhost:3000").replace(/\/$/, "");
}

export async function createInquiryAccessLink(inquiryId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + ACCESS_DAYS * 24 * 60 * 60 * 1000);

  await prisma.inquiryAccessToken.create({
    data: {
      inquiryId,
      tokenHash: hashAccessToken(token),
      expiresAt
    }
  });

  const url = new URL("/inquiries/access", await getAppUrl());
  url.searchParams.set("token", token);

  return {
    expiresAt,
    token,
    url: url.toString()
  };
}

export async function validateInquiryAccessToken(token: string) {
  if (!token) {
    return null;
  }

  const access = await prisma.inquiryAccessToken.findUnique({
    where: {
      tokenHash: hashAccessToken(token)
    }
  });

  if (!access || access.revokedAt || access.expiresAt <= new Date()) {
    return null;
  }

  return access;
}

export async function getInquiryAccessFromCookie(inquiryId: string) {
  const cookieStore = await cookies();
  const token = cookieStore.get(INQUIRY_ACCESS_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const access = await validateInquiryAccessToken(token);
  return access?.inquiryId === inquiryId ? access : null;
}
