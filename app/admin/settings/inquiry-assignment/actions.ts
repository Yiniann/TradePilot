"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageInquiryAssignmentSettings } from "@/lib/permissions";
import { SITE_SETTINGS_ID } from "@/lib/site-settings";

const assignmentModes = ["UNASSIGNED", "DEFAULT_OWNER", "ROUND_ROBIN"] as const;

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readAssignmentMode(formData: FormData) {
  const mode = readText(formData, "inquiryAssignmentMode");
  return assignmentModes.includes(mode as (typeof assignmentModes)[number])
    ? (mode as (typeof assignmentModes)[number])
    : "UNASSIGNED";
}

function readAssignableOwnerIds(formData: FormData) {
  return formData
    .getAll("inquiryAssignableOwnerIds")
    .map((value) => String(value).trim())
    .filter(Boolean);
}

export async function updateInquiryAssignmentSettings(formData: FormData) {
  const user = await requireCurrentUser();

  if (!canManageInquiryAssignmentSettings(user.role)) {
    redirect("/admin/settings");
  }

  const inquiryAssignmentMode = readAssignmentMode(formData);
  const requestedOwnerId = readText(formData, "inquiryDefaultOwnerId");
  const requestedAssignableOwnerIds = readAssignableOwnerIds(formData);
  let inquiryDefaultOwnerId: string | null = null;
  let inquiryAssignableOwnerIds: string[] = [];

  const requestedIds = [
    requestedOwnerId,
    ...requestedAssignableOwnerIds
  ].filter(Boolean);
  const assignableOwners = requestedIds.length > 0
    ? await prisma.user.findMany({
        where: {
          id: {
            in: requestedIds
          },
          status: "ACTIVE",
          role: {
            in: ["SUPER_ADMIN", "ADMIN", "SALES"]
          }
        },
        select: {
          id: true
        }
      })
    : [];
  const validOwnerIds = new Set(assignableOwners.map((owner) => owner.id));

  if (inquiryAssignmentMode === "DEFAULT_OWNER") {
    if (!requestedOwnerId || !validOwnerIds.has(requestedOwnerId)) {
      return;
    }

    inquiryDefaultOwnerId = requestedOwnerId;
  }

  if (inquiryAssignmentMode === "ROUND_ROBIN") {
    inquiryAssignableOwnerIds = requestedAssignableOwnerIds.filter(
      (ownerId, index, ids) => validOwnerIds.has(ownerId) && ids.indexOf(ownerId) === index
    );

    if (inquiryAssignableOwnerIds.length === 0) {
      return;
    }
  }

  await prisma.siteSettings.upsert({
    where: {
      id: SITE_SETTINGS_ID
    },
    create: {
      id: SITE_SETTINGS_ID,
      inquiryAssignmentMode,
      inquiryDefaultOwnerId,
      inquiryAssignableOwnerIds,
      inquiryRoundRobinCursor: null
    },
    update: {
      inquiryAssignmentMode,
      inquiryDefaultOwnerId,
      inquiryAssignableOwnerIds,
      inquiryRoundRobinCursor: inquiryAssignmentMode === "ROUND_ROBIN" ? undefined : null
    }
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin/settings/inquiry-assignment");
  redirect("/admin/settings/inquiry-assignment?saved=1");
}
