import "server-only";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { AUTH_COOKIE_NAME } from "@/lib/auth-constants";
import { prisma } from "@/lib/db";

const DEFAULT_SESSION_DAYS = 7;
const REMEMBER_SESSION_DAYS = 30;

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  role: "SUPER_ADMIN" | "ADMIN" | "SALES" | "VIEWER";
};

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getExpiresAt(remember: boolean) {
  const days = remember ? REMEMBER_SESSION_DAYS : DEFAULT_SESSION_DAYS;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}

export async function hasAnyUser() {
  const count = await prisma.user.count();
  return count > 0;
}

export async function createSession(userId: string, remember: boolean) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(token);
  const expiresAt = getExpiresAt(remember);
  const requestHeaders = await headers();
  const ipAddress = requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim();
  const userAgent = requestHeaders.get("user-agent");

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      ipAddress,
      userAgent
    }
  });

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    expires: expiresAt,
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production"
  });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const session = await prisma.session.findUnique({
    where: {
      tokenHash: hashSessionToken(token)
    },
    include: {
      user: true
    }
  });

  if (!session || session.revokedAt || session.expiresAt <= new Date()) {
    return null;
  }

  if (session.user.status !== "ACTIVE") {
    return null;
  }

  if (
    session.user.passwordChangedAt &&
    session.user.passwordChangedAt > session.createdAt
  ) {
    return null;
  }

  await prisma.session.update({
    where: {
      id: session.id
    },
    data: {
      lastUsedAt: new Date()
    }
  });

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    role: session.user.role
  };
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (token) {
    await prisma.session.updateMany({
      where: {
        tokenHash: hashSessionToken(token),
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  cookieStore.delete(AUTH_COOKIE_NAME);
}
