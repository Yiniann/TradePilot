"use server";

import type { InquiryStatus, MessageDirection } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendInquiryReplyEmail } from "@/lib/inquiry-email";
import {
  canAssignInquiry,
  canReplyInquiry,
  canViewOwnDataOnly
} from "@/lib/permissions";

const inquiryStatuses: InquiryStatus[] = ["NEW", "ASSIGNED", "REPLIED", "CLOSED"];
const messageDirections: MessageDirection[] = ["OUTBOUND", "INTERNAL_NOTE"];

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function readInquiryStatus(formData: FormData) {
  const status = readText(formData, "status") as InquiryStatus;
  return inquiryStatuses.includes(status) ? status : null;
}

function readMessageDirection(formData: FormData) {
  const direction = readText(formData, "direction") as MessageDirection;
  return messageDirections.includes(direction) ? direction : null;
}

function readAssigneeId(formData: FormData) {
  return readText(formData, "ownerId");
}

async function syncCustomerOwner(customerId: string, ownerId: string) {
  await prisma.customer.update({
    where: {
      id: customerId
    },
    data: {
      ownerId
    }
  });

  await prisma.inquiry.updateMany({
    where: {
      customerId,
      status: {
        not: "CLOSED"
      }
    },
    data: {
      ownerId
    }
  });
}

export async function addInquiryMessage(formData: FormData) {
  const user = await requireCurrentUser();
  const inquiryId = readText(formData, "inquiryId");
  const direction = readMessageDirection(formData);
  const body = readText(formData, "body");

  if (!canReplyInquiry(user.role) || !inquiryId || !direction || !body) {
    return;
  }

  const existingInquiry = await prisma.inquiry.findUnique({
    where: {
      id: inquiryId
    },
    select: {
      customerId: true,
      ownerId: true
    }
  });

  if (!existingInquiry) {
    return;
  }

  if (canViewOwnDataOnly(user.role) && existingInquiry.ownerId !== user.id) {
    return;
  }

  let customerId: string | null = null;

  const inquiry = await prisma.$transaction(async (tx) => {
    await tx.inquiryMessage.create({
      data: {
        inquiryId,
        direction,
        body,
        authorId: user.id
      }
    });

    if (direction !== "OUTBOUND") {
      return null;
    }

    const ownerId = existingInquiry.ownerId || user.id;
    const updatedInquiry = await tx.inquiry.update({
      where: {
        id: inquiryId
      },
      data: {
        status: "REPLIED",
        ownerId
      },
      include: {
        contact: true
      }
    });

    customerId = updatedInquiry.customerId;

    if (!existingInquiry.ownerId && updatedInquiry.customerId) {
      await tx.customer.update({
        where: {
          id: updatedInquiry.customerId
        },
        data: {
          ownerId
        }
      });

      await tx.inquiry.updateMany({
        where: {
          customerId: updatedInquiry.customerId,
          status: {
            not: "CLOSED"
          }
        },
        data: {
          ownerId
        }
      });
    }

    return updatedInquiry;
  });

  if (direction === "OUTBOUND" && inquiry?.contact?.email) {
    await sendInquiryReplyEmail({
      contactName: inquiry.contact.name,
      inquiryId: inquiry.id,
      message: body,
      salesContact: {
        email: user.email,
        name: user.name
      },
      subject: inquiry.subject,
      to: inquiry.contact.email
    });
  }

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath("/admin/customers");
  if (customerId) {
    revalidatePath(`/admin/customers/${customerId}`);
  }
}

export async function assignInquiry(formData: FormData) {
  const user = await requireCurrentUser();
  const inquiryId = readText(formData, "inquiryId");
  const ownerId = readAssigneeId(formData);

  if (!canAssignInquiry(user.role) || !inquiryId || !ownerId) {
    return;
  }

  const assignee = await prisma.user.findFirst({
    where: {
      id: ownerId,
      role: {
        in: ["SUPER_ADMIN", "ADMIN", "SALES"]
      },
      status: "ACTIVE"
    },
    select: {
      id: true
    }
  });

  if (!assignee) {
    return;
  }

  const inquiry = await prisma.inquiry.update({
    where: {
      id: inquiryId
    },
    data: {
      ownerId: assignee.id,
      status: "ASSIGNED"
    },
    select: {
      customerId: true
    }
  });

  if (inquiry.customerId) {
    await syncCustomerOwner(inquiry.customerId, assignee.id);
  }

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath("/admin/customers");
  if (inquiry.customerId) {
    revalidatePath(`/admin/customers/${inquiry.customerId}`);
  }
}

export async function updateInquiryStatus(formData: FormData) {
  const user = await requireCurrentUser();
  const inquiryId = readText(formData, "inquiryId");
  const status = readInquiryStatus(formData);

  if (!canReplyInquiry(user.role) || !inquiryId || !status) {
    return;
  }

  const existingInquiry = await prisma.inquiry.findUnique({
    where: {
      id: inquiryId
    },
    select: {
      ownerId: true
    }
  });

  if (!existingInquiry) {
    return;
  }

  if (canViewOwnDataOnly(user.role) && existingInquiry.ownerId !== user.id) {
    return;
  }

  if (status !== "CLOSED") {
    return;
  }

  const inquiry = await prisma.inquiry.update({
    where: {
      id: inquiryId
    },
    data: {
      status
    },
    select: {
      customerId: true
    }
  });

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath("/admin/customers");
  if (inquiry.customerId) {
    revalidatePath(`/admin/customers/${inquiry.customerId}`);
  }
}
