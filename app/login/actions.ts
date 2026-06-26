"use server";

import { redirect } from "next/navigation";
import { compare, hash } from "bcryptjs";
import { createSession, hasAnyUser, revokeCurrentSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export type AuthFormState = {
  error?: string;
};

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function createInitialAdmin(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const existingUser = await hasAnyUser();

  if (existingUser) {
    return { error: "系统已完成初始化，请直接登录。" };
  }

  const name = readText(formData, "name");
  const email = normalizeEmail(readText(formData, "email"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!name || !email || !password || !confirmPassword) {
    return { error: "请填写完整的管理员信息。" };
  }

  if (!isValidEmail(email)) {
    return { error: "请输入有效的邮箱地址。" };
  }

  if (password.length < 8) {
    return { error: "密码至少需要 8 位。" };
  }

  if (password !== confirmPassword) {
    return { error: "两次输入的密码不一致。" };
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role: "SUPER_ADMIN",
      passwordChangedAt: new Date()
    }
  });

  await createSession(user.id, false);
  redirect("/admin");
}

export async function login(
  _previousState: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = normalizeEmail(readText(formData, "email"));
  const password = String(formData.get("password") ?? "");
  const remember = formData.get("remember") === "on";

  if (!email || !password) {
    return { error: "请输入邮箱和密码。" };
  }

  const user = await prisma.user.findUnique({
    where: {
      email
    }
  });

  if (!user || user.status !== "ACTIVE") {
    return { error: "邮箱或密码不正确。" };
  }

  const passwordMatches = await compare(password, user.passwordHash);

  if (!passwordMatches) {
    return { error: "邮箱或密码不正确。" };
  }

  await prisma.user.update({
    where: {
      id: user.id
    },
    data: {
      lastLoginAt: new Date()
    }
  });

  await createSession(user.id, remember);
  redirect("/admin");
}

export async function logout() {
  await revokeCurrentSession();
  redirect("/login");
}
