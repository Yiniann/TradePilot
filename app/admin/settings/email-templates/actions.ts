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

async function requireTemplateManager() {
  const user = await requireCurrentUser();

  if (!canManageSystemSettings(user.role)) {
    redirect("/admin/settings");
  }

  return user;
}

export async function updateInquiryReceivedEmailTemplate(formData: FormData) {
  await requireTemplateManager();

  const subject = readText(formData, "subject");
  const body = readText(formData, "body");

  if (!subject || !body) {
    return;
  }

  await prisma.siteSettings.upsert({
    where: {
      id: SITE_SETTINGS_ID
    },
    create: {
      id: SITE_SETTINGS_ID,
      inquiryReceivedSubject: subject,
      inquiryReceivedBody: body
    },
    update: {
      inquiryReceivedSubject: subject,
      inquiryReceivedBody: body
    }
  });

  revalidatePath("/admin/settings/email-templates");
  revalidatePath("/admin/settings/email-templates/inquiry-confirmation");
  redirect("/admin/settings/email-templates/inquiry-confirmation?saved=1");
}

export async function updateInquiryReplyEmailTemplate(formData: FormData) {
  await requireTemplateManager();

  const subject = readText(formData, "subject");
  const body = readText(formData, "body");

  if (!subject || !body) {
    return;
  }

  await prisma.siteSettings.upsert({
    where: {
      id: SITE_SETTINGS_ID
    },
    create: {
      id: SITE_SETTINGS_ID,
      inquiryReplySubject: subject,
      inquiryReplyBody: body
    },
    update: {
      inquiryReplySubject: subject,
      inquiryReplyBody: body
    }
  });

  revalidatePath("/admin/settings/email-templates");
  revalidatePath("/admin/settings/email-templates/inquiry-reply");
  redirect("/admin/settings/email-templates/inquiry-reply?saved=1");
}
