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

const inquiryStatuses: InquiryStatus[] = [
  "NEW",
  "ASSIGNED",
  "CUSTOMER_REPLIED",
  "REPLIED",
  "CLOSED"
];
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

async function deliverReplyEmail(input: {
  body: string;
  contactEmail: string;
  contactName: string;
  inquiryId: string;
  salesEmail: string;
  salesName: string;
  subject: string;
}) {
  try {
    const result = await sendInquiryReplyEmail({
      contactName: input.contactName,
      inquiryId: input.inquiryId,
      message: input.body,
      salesContact: {
        email: input.salesEmail,
        name: input.salesName
      },
      subject: input.subject,
      to: input.contactEmail
    });

    return result.delivered
      ? { delivered: true as const }
      : {
          delivered: false as const,
          error:
            result.reason === "NOT_CONFIGURED"
              ? "邮件未发送：请先完成 SMTP 设置"
              : "邮件发送失败，请稍后重试"
        };
  } catch (error) {
    console.error("Inquiry reply delivery failed:", error);
    return {
      delivered: false as const,
      error: "邮件发送失败，请稍后重试"
    };
  }
}

async function finishMessageDelivery(input: {
  customerId: string | null;
  delivered: boolean;
  deliveryError: string | null;
  inquiryId: string;
  messageId: string;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.inquiryMessage.update({
      where: {
        id: input.messageId
      },
      data: {
        deliveredAt: input.delivered ? new Date() : null,
        deliveryError: input.deliveryError,
        deliveryStatus: input.delivered ? "SENT" : "FAILED"
      }
    });

    if (!input.delivered) {
      return;
    }

    await tx.inquiry.updateMany({
      where: {
        id: input.inquiryId,
        status: {
          not: "CUSTOMER_REPLIED"
        }
      },
      data: {
        status: "REPLIED"
      }
    });

    if (input.customerId) {
      await tx.customer.updateMany({
        where: {
          id: input.customerId,
          stage: "NEW"
        },
        data: {
          stage: "CONTACTED"
        }
      });
      await tx.customer.update({
        where: {
          id: input.customerId
        },
        data: {
          updatedAt: new Date()
        }
      });
    }
  });
}

function revalidateInquiryPaths(inquiryId: string, customerId: string | null) {
  revalidatePath("/admin");
  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath("/admin/customers");
  if (customerId) {
    revalidatePath(`/admin/customers/${customerId}`);
  }
}

export async function addInquiryMessage(formData: FormData) {
  const user = await requireCurrentUser();
  const inquiryId = readText(formData, "inquiryId");
  const direction = readMessageDirection(formData);
  const body = readText(formData, "body");

  if (
    !canReplyInquiry(user.role) ||
    !inquiryId ||
    !direction ||
    !body ||
    body.length > 5000
  ) {
    return;
  }

  const existingInquiry = await prisma.inquiry.findUnique({
    where: {
      id: inquiryId
    },
    select: {
      customerId: true,
      contact: true,
      owner: true,
      ownerId: true,
      status: true,
      subject: true
    }
  });

  if (!existingInquiry) {
    return;
  }

  if (canViewOwnDataOnly(user.role) && existingInquiry.ownerId !== user.id) {
    return;
  }

  if (direction === "INTERNAL_NOTE") {
    await prisma.inquiryMessage.create({
      data: {
        inquiryId,
        direction,
        body,
        authorId: user.id
      }
    });

    revalidateInquiryPaths(inquiryId, existingInquiry.customerId);
    return;
  }

  const ownerId = existingInquiry.ownerId || user.id;
  const message = await prisma.$transaction(async (tx) => {
    const createdMessage = await tx.inquiryMessage.create({
      data: {
        inquiryId,
        direction: "OUTBOUND",
        body,
        authorId: user.id,
        deliveryStatus: existingInquiry.contact?.email ? "PENDING" : "FAILED",
        deliveryError: existingInquiry.contact?.email ? null : "联系人没有可用邮箱"
      }
    });

    await tx.inquiry.update({
      where: {
        id: inquiryId
      },
      data: {
        ownerId,
        status: existingInquiry.status === "NEW" ? "ASSIGNED" : undefined
      }
    });

    if (!existingInquiry.ownerId && existingInquiry.customerId) {
      await tx.customer.update({
        where: {
          id: existingInquiry.customerId
        },
        data: {
          ownerId
        }
      });

      await tx.inquiry.updateMany({
        where: {
          customerId: existingInquiry.customerId,
          status: {
            not: "CLOSED"
          }
        },
        data: {
          ownerId
        }
      });
    }

    return createdMessage;
  });

  if (!existingInquiry.contact?.email) {
    revalidateInquiryPaths(inquiryId, existingInquiry.customerId);
    return;
  }

  const delivery = await deliverReplyEmail({
    body,
    contactEmail: existingInquiry.contact.email,
    contactName: existingInquiry.contact.name,
    inquiryId,
    salesEmail: existingInquiry.owner?.email || user.email,
    salesName: existingInquiry.owner?.name || user.name,
    subject: existingInquiry.subject
  });

  await finishMessageDelivery({
    customerId: existingInquiry.customerId,
    delivered: delivery.delivered,
    deliveryError: delivery.delivered ? null : delivery.error,
    inquiryId,
    messageId: message.id
  });

  revalidateInquiryPaths(inquiryId, existingInquiry.customerId);
}

export async function retryInquiryMessage(formData: FormData) {
  const user = await requireCurrentUser();
  const inquiryId = readText(formData, "inquiryId");
  const messageId = readText(formData, "messageId");

  if (!canReplyInquiry(user.role) || !inquiryId || !messageId) {
    return;
  }

  const message = await prisma.inquiryMessage.findFirst({
    where: {
      id: messageId,
      inquiryId,
      direction: "OUTBOUND",
      deliveryStatus: "FAILED"
    },
    include: {
      inquiry: {
        include: {
          contact: true,
          owner: true
        }
      }
    }
  });

  if (!message) {
    return;
  }

  if (
    canViewOwnDataOnly(user.role) &&
    message.inquiry.ownerId !== user.id
  ) {
    return;
  }

  if (!message.inquiry.contact?.email) {
    await prisma.inquiryMessage.update({
      where: {
        id: message.id
      },
      data: {
        deliveryError: "联系人没有可用邮箱"
      }
    });
    revalidateInquiryPaths(inquiryId, message.inquiry.customerId);
    return;
  }

  const claimed = await prisma.inquiryMessage.updateMany({
    where: {
      id: message.id,
      deliveryStatus: "FAILED"
    },
    data: {
      deliveryError: null,
      deliveryStatus: "PENDING"
    }
  });

  if (claimed.count === 0) {
    return;
  }

  const delivery = await deliverReplyEmail({
    body: message.body,
    contactEmail: message.inquiry.contact.email,
    contactName: message.inquiry.contact.name,
    inquiryId,
    salesEmail: message.inquiry.owner?.email || user.email,
    salesName: message.inquiry.owner?.name || user.name,
    subject: message.inquiry.subject
  });

  await finishMessageDelivery({
    customerId: message.inquiry.customerId,
    delivered: delivery.delivered,
    deliveryError: delivery.delivered ? null : delivery.error,
    inquiryId,
    messageId: message.id
  });
  revalidateInquiryPaths(inquiryId, message.inquiry.customerId);
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

  const inquiry = await prisma.$transaction(async (tx) => {
    const current = await tx.inquiry.findUnique({
      where: {
        id: inquiryId
      },
      select: {
        customerId: true,
        status: true
      }
    });

    if (!current) {
      return null;
    }

    await tx.inquiry.update({
      where: {
        id: inquiryId
      },
      data: {
        ownerId: assignee.id,
        status: ["CUSTOMER_REPLIED", "CLOSED"].includes(current.status)
          ? current.status
          : "ASSIGNED"
      }
    });

    if (current.customerId) {
      await tx.customer.update({
        where: {
          id: current.customerId
        },
        data: {
          ownerId: assignee.id
        }
      });
      await tx.inquiry.updateMany({
        where: {
          customerId: current.customerId,
          status: {
            not: "CLOSED"
          }
        },
        data: {
          ownerId: assignee.id
        }
      });
    }

    return current;
  });

  if (!inquiry) {
    return;
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
