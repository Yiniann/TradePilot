"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { canManageSystemSettings } from "@/lib/permissions";
import { prisma } from "@/lib/db";
import { SITE_SETTINGS_ID } from "@/lib/site-settings";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeAppUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export async function updateEmailSettings(formData: FormData) {
  const user = await requireCurrentUser();

  if (!canManageSystemSettings(user.role)) {
    redirect("/admin/settings");
  }

  const appUrl = normalizeAppUrl(readText(formData, "appUrl"));
  const smtpHost = readText(formData, "smtpHost");
  const smtpPort = Number.parseInt(readText(formData, "smtpPort"), 10);
  const smtpUser = readText(formData, "smtpUser");
  const smtpPassword = readText(formData, "smtpPassword");
  const smtpSecure = readText(formData, "smtpSecure") === "true";
  const emailFrom = readText(formData, "emailFrom");
  const emailReplyTo = readText(formData, "emailReplyTo");

  if (
    !appUrl ||
    !smtpHost ||
    !smtpUser ||
    !emailFrom ||
    !Number.isInteger(smtpPort) ||
    smtpPort < 1 ||
    smtpPort > 65535
  ) {
    return;
  }

  const existingSettings = await prisma.siteSettings.findUnique({
    where: {
      id: SITE_SETTINGS_ID
    },
    select: {
      smtpPassword: true
    }
  });

  if (!smtpPassword && !existingSettings?.smtpPassword) {
    return;
  }

  await prisma.siteSettings.upsert({
    where: {
      id: SITE_SETTINGS_ID
    },
    create: {
      id: SITE_SETTINGS_ID,
      appUrl,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      smtpSecure,
      emailFrom,
      emailReplyTo: emailReplyTo || null
    },
    update: {
      appUrl,
      smtpHost,
      smtpPort,
      smtpUser,
      smtpSecure,
      emailFrom,
      emailReplyTo: emailReplyTo || null,
      ...(smtpPassword ? { smtpPassword } : {})
    }
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/email");
  redirect("/admin/settings/email?saved=1");
}
