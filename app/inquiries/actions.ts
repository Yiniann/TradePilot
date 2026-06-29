"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getInquiryAccessFromCookie } from "@/lib/inquiry-access";
import { sendInquiryTeamNotificationEmail } from "@/lib/inquiry-email";
import { prisma } from "@/lib/db";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function addCustomerInquiryMessage(formData: FormData) {
  const inquiryId = readText(formData, "inquiryId");
  const body = readText(formData, "body");

  if (!inquiryId || !body || body.length > 5000) {
    return;
  }

  const access = await getInquiryAccessFromCookie(inquiryId);

  if (!access) {
    redirect("/inquiries/link-expired");
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: {
      id: inquiryId
    },
    select: {
      contact: {
        select: {
          name: true
        }
      },
      customer: {
        select: {
          id: true,
          name: true
        }
      },
      ownerId: true,
      subject: true
    }
  });

  if (!inquiry) {
    redirect("/inquiries/link-expired");
  }

  await prisma.$transaction(async (tx) => {
    await tx.inquiryMessage.create({
      data: {
        inquiryId,
        direction: "INBOUND",
        body
      }
    });
    await tx.inquiry.update({
      where: {
        id: inquiryId
      },
      data: {
        status: inquiry.ownerId ? "CUSTOMER_REPLIED" : "NEW"
      }
    });

    if (inquiry.customer?.id) {
      await tx.customer.update({
        where: {
          id: inquiry.customer.id
        },
        data: {
          updatedAt: new Date()
        }
      });
    }
  });

  let recipients = inquiry.ownerId
    ? await prisma.user.findMany({
        where: {
          id: inquiry.ownerId,
          status: "ACTIVE"
        },
        select: {
          email: true
        }
      })
    : [];

  if (recipients.length === 0) {
    recipients = await prisma.user.findMany({
        where: {
          role: {
            in: ["SUPER_ADMIN", "ADMIN"]
          },
          status: "ACTIVE"
        },
        select: {
          email: true
        }
      });
  }

  await sendInquiryTeamNotificationEmail({
    contactName: inquiry.contact?.name || "Website customer",
    customerName: inquiry.customer?.name || "Website customer",
    event: "CUSTOMER_REPLY",
    inquiryId,
    message: body,
    subject: inquiry.subject,
    to: recipients.map((recipient) => recipient.email)
  });

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath("/admin/customers");
  if (inquiry.customer?.id) {
    revalidatePath(`/admin/customers/${inquiry.customer.id}`);
  }
  revalidatePath(`/inquiries/${inquiryId}`);
  redirect(`/inquiries/${inquiryId}`);
}
