"use server";

import type { CustomerSource, CustomerStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateCustomer } from "@/lib/permissions";

const customerStages: CustomerStage[] = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];
const customerSources: CustomerSource[] = [
  "WEBSITE",
  "MANUAL",
  "EMAIL",
  "REFERRAL",
  "OTHER"
];

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readStage(formData: FormData) {
  const stage = readText(formData, "stage") as CustomerStage;
  return customerStages.includes(stage) ? stage : "NEW";
}

function readSource(formData: FormData) {
  const source = readText(formData, "source") as CustomerSource;
  return customerSources.includes(source) ? source : "MANUAL";
}

export async function createCustomer(formData: FormData) {
  const user = await requireCurrentUser();

  if (!canCreateCustomer(user.role)) {
    redirect("/admin/customers");
  }

  const name = readText(formData, "name");
  const contactName = readText(formData, "contactName");
  const ownerId = readText(formData, "ownerId");

  if (!name) {
    return;
  }

  await prisma.customer.create({
    data: {
      name,
      stage: readStage(formData),
      source: readSource(formData),
      country: readText(formData, "country") || null,
      website: readText(formData, "website") || null,
      note: readText(formData, "note") || null,
      ownerId: ownerId || user.id,
      contacts: contactName
        ? {
            create: {
              name: contactName,
              email: readText(formData, "email").toLowerCase() || null,
              phone: readText(formData, "phone") || null,
              note: readText(formData, "contactNote") || null,
              isPrimary: true
            }
          }
        : undefined
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  redirect("/admin/customers");
}
