"use server";

import type { CustomerSource, CustomerStage } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  canAssignInquiry,
  canCreateCustomer,
  canViewOwnDataOnly
} from "@/lib/permissions";

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

function readStage(formData: FormData, fallback: CustomerStage = "NEW") {
  const stage = readText(formData, "stage") as CustomerStage;
  return customerStages.includes(stage) ? stage : fallback;
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
  const requestedOwnerId = readText(formData, "ownerId") || user.id;
  const ownerId = canAssignInquiry(user.role) ? requestedOwnerId : user.id;

  if (!name) {
    return;
  }

  const owner = await prisma.user.findFirst({
    where: {
      id: ownerId,
      status: "ACTIVE",
      role: {
        in: ["SUPER_ADMIN", "ADMIN", "SALES"]
      }
    },
    select: {
      id: true
    }
  });

  if (!owner) {
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
      ownerId: owner.id,
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

export async function updateCustomer(formData: FormData) {
  const user = await requireCurrentUser();
  const customerId = readText(formData, "customerId");

  if (!canCreateCustomer(user.role) || !customerId) {
    return;
  }

  const customer = await prisma.customer.findFirst({
    where: {
      id: customerId,
      deletedAt: null,
      ...(canViewOwnDataOnly(user.role) ? { ownerId: user.id } : {})
    },
    include: {
      contacts: {
        where: {
          deletedAt: null
        },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        take: 1
      }
    }
  });

  if (!customer) {
    return;
  }

  const name = readText(formData, "name");
  const requestedOwnerId = readText(formData, "ownerId");
  const ownerId = canAssignInquiry(user.role)
    ? requestedOwnerId || customer.ownerId
    : customer.ownerId;

  if (!name || !ownerId) {
    return;
  }

  const owner = await prisma.user.findFirst({
    where: {
      id: ownerId,
      status: "ACTIVE",
      role: {
        in: ["SUPER_ADMIN", "ADMIN", "SALES"]
      }
    },
    select: {
      id: true
    }
  });

  if (!owner) {
    return;
  }

  const contact = customer.contacts[0];
  const contactName = readText(formData, "contactName");
  const email = readText(formData, "email").toLowerCase();
  const phone = readText(formData, "phone");

  await prisma.$transaction(async (tx) => {
    await tx.customer.update({
      where: {
        id: customer.id
      },
      data: {
        country: readText(formData, "country") || null,
        name,
        note: readText(formData, "note") || null,
        ownerId: owner.id,
        stage: readStage(formData, customer.stage),
        website: readText(formData, "website") || null
      }
    });

    if (contact) {
      await tx.contact.update({
        where: {
          id: contact.id
        },
        data: {
          email: email || null,
          name: contactName || contact.name,
          phone: phone || null
        }
      });
    } else if (contactName) {
      await tx.contact.create({
        data: {
          customerId: customer.id,
          email: email || null,
          isPrimary: true,
          name: contactName,
          phone: phone || null
        }
      });
    }

    if (owner.id !== customer.ownerId) {
      await tx.inquiry.updateMany({
        where: {
          customerId: customer.id,
          status: {
            not: "CLOSED"
          }
        },
        data: {
          ownerId: owner.id
        }
      });
    }
  });

  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${customer.id}`);
  revalidatePath("/admin/inquiries");
  redirect(`/admin/customers/${customer.id}?saved=1`);
}
