"use server";

import type { UserRole } from "@prisma/client";
import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  canAssignRole,
  canManageTargetUser,
  canManageUsers
} from "@/lib/permissions";

const userRoles: UserRole[] = ["SUPER_ADMIN", "ADMIN", "SALES", "VIEWER"];

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function readRole(formData: FormData) {
  const role = readText(formData, "role") as UserRole;
  return userRoles.includes(role) ? role : null;
}

async function requireUserManager() {
  const actor = await requireCurrentUser();

  if (!canManageUsers(actor.role)) {
    redirect("/admin");
  }

  return actor;
}

export async function createUser(formData: FormData) {
  const actor = await requireUserManager();
  const name = readText(formData, "name");
  const email = normalizeEmail(readText(formData, "email"));
  const password = String(formData.get("password") ?? "");
  const role = readRole(formData);

  if (!name || !email || !password || !role) {
    return;
  }

  if (!isValidEmail(email) || password.length < 8) {
    return;
  }

  if (!canAssignRole(actor.role, role)) {
    return;
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      role,
      passwordChangedAt: new Date()
    }
  });

  revalidatePath("/admin/users");
}

export async function updateUserRole(formData: FormData) {
  const actor = await requireUserManager();
  const userId = readText(formData, "userId");
  const role = readRole(formData);

  if (!userId || !role || !canAssignRole(actor.role, role)) {
    return;
  }

  const target = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      role: true
    }
  });

  if (!target || !canManageTargetUser(actor.role, target.role)) {
    return;
  }

  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      role
    }
  });

  revalidatePath("/admin/users");
}

export async function setUserStatus(formData: FormData) {
  const actor = await requireUserManager();
  const userId = readText(formData, "userId");
  const status = readText(formData, "status");

  if (!userId || (status !== "ACTIVE" && status !== "DISABLED")) {
    return;
  }

  if (userId === actor.id) {
    return;
  }

  const target = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      id: true,
      role: true
    }
  });

  if (!target || !canManageTargetUser(actor.role, target.role)) {
    return;
  }

  if (target.role === "SUPER_ADMIN" && status === "DISABLED") {
    const superAdminCount = await prisma.user.count({
      where: {
        role: "SUPER_ADMIN",
        status: "ACTIVE"
      }
    });

    if (superAdminCount <= 1) {
      return;
    }
  }

  await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      status
    }
  });

  if (status === "DISABLED") {
    await prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });
  }

  revalidatePath("/admin/users");
}
