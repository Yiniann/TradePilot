"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getInquiryAccessFromCookie } from "@/lib/inquiry-access";
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
      ownerId: true
    }
  });

  if (!inquiry) {
    redirect("/inquiries/link-expired");
  }

  await prisma.$transaction([
    prisma.inquiryMessage.create({
      data: {
        inquiryId,
        direction: "INBOUND",
        body
      }
    }),
    prisma.inquiry.update({
      where: {
        id: inquiryId
      },
      data: {
        status: inquiry.ownerId ? "ASSIGNED" : "NEW"
      }
    })
  ]);

  revalidatePath("/admin/inquiries");
  revalidatePath(`/admin/inquiries/${inquiryId}`);
  revalidatePath(`/inquiries/${inquiryId}`);
  redirect(`/inquiries/${inquiryId}`);
}
