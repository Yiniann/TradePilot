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

function normalizeOptionalUrl(value: string) {
  if (!value) {
    return null;
  }

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

export async function updateCompanySettings(formData: FormData) {
  const user = await requireCurrentUser();

  if (!canManageSystemSettings(user.role)) {
    redirect("/admin/settings");
  }

  const companyName = readText(formData, "companyName");
  const companyWebsiteInput = readText(formData, "companyWebsite");
  const companyWebsite = normalizeOptionalUrl(companyWebsiteInput);
  const companyEmail = readText(formData, "companyEmail");
  const companyPhone = readText(formData, "companyPhone");
  const companyAddress = readText(formData, "companyAddress");

  if (!companyName || (companyWebsiteInput && !companyWebsite)) {
    return;
  }

  await prisma.siteSettings.upsert({
    where: {
      id: SITE_SETTINGS_ID
    },
    create: {
      id: SITE_SETTINGS_ID,
      companyName,
      companyWebsite,
      companyEmail: companyEmail || null,
      companyPhone: companyPhone || null,
      companyAddress: companyAddress || null
    },
    update: {
      companyName,
      companyWebsite,
      companyEmail: companyEmail || null,
      companyPhone: companyPhone || null,
      companyAddress: companyAddress || null
    }
  });

  revalidatePath("/admin/settings/company");
  redirect("/admin/settings/company?saved=1");
}
