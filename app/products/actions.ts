"use server";

import { redirect } from "next/navigation";
import {
  sendInquiryConfirmationEmail,
  sendInquiryTeamNotificationEmail
} from "@/lib/inquiry-email";
import { prisma } from "@/lib/db";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function createProductInquiry(formData: FormData) {
  const productId = readText(formData, "productId");
  const companyName = readText(formData, "companyName");
  const contactName = readText(formData, "contactName");
  const email = normalizeEmail(readText(formData, "email"));
  const phone = readText(formData, "phone");
  const message = readText(formData, "message");
  const selectedVariantImage = readText(formData, "selectedVariantImage");
  const selectedVariantName = readText(formData, "selectedVariantName");
  const selectedVariantSku = readText(formData, "selectedVariantSku");
  const selectedQuantity = readText(formData, "selectedQuantity");
  const selectedUnitPrice = readText(formData, "selectedUnitPrice");

  if (
    !productId ||
    !companyName ||
    !contactName ||
    !isEmail(email) ||
    !message ||
    message.length > 5000
  ) {
    return;
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: "PUBLISHED"
    },
    select: {
      id: true,
      name: true,
      slug: true
    }
  });

  if (!product) {
    return;
  }

  const enrichedMessage = [
    selectedVariantName || selectedVariantSku
      ? `Selected spec: ${selectedVariantName || "N/A"}${selectedVariantSku ? ` (${selectedVariantSku})` : ""}`
      : "",
    selectedQuantity ? `Quantity: ${selectedQuantity}` : "",
    selectedUnitPrice ? `Matched price: ${selectedUnitPrice}` : "",
    selectedVariantImage ? `Spec image: ${selectedVariantImage}` : "",
    message
  ]
    .filter(Boolean)
    .join("\n");

  const { inquiry } = await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtext(${email}))`;
    await tx.$queryRaw`SELECT "id" FROM "SiteSettings" WHERE "id" = 'default' FOR UPDATE`;

    const settings = await tx.siteSettings.findUnique({
      where: {
        id: "default"
      },
      select: {
        inquiryAssignmentMode: true,
        inquiryDefaultOwnerId: true,
        inquiryAssignableOwnerIds: true,
        inquiryRoundRobinCursor: true
      }
    });
    let defaultOwnerId: string | undefined;

    if (
      settings?.inquiryAssignmentMode === "DEFAULT_OWNER" &&
      settings.inquiryDefaultOwnerId
    ) {
      const defaultOwner = await tx.user.findFirst({
        where: {
          id: settings.inquiryDefaultOwnerId,
          status: "ACTIVE",
          role: {
            in: ["SUPER_ADMIN", "ADMIN", "SALES"]
          }
        },
        select: {
          id: true
        }
      });

      defaultOwnerId = defaultOwner?.id;
    }

    const existingContact = await tx.contact.findFirst({
      where: {
        deletedAt: null,
        email: {
          equals: email,
          mode: "insensitive"
        },
        customer: {
          deletedAt: null
        }
      },
      include: {
        customer: true
      },
      orderBy: {
        createdAt: "asc"
      }
    });
    const inheritedOwner = existingContact?.customer.ownerId
      ? await tx.user.findFirst({
          where: {
            id: existingContact.customer.ownerId,
            status: "ACTIVE",
            role: {
              in: ["SUPER_ADMIN", "ADMIN", "SALES"]
            }
          },
          select: {
            id: true
          }
        })
      : null;

    if (
      !inheritedOwner &&
      settings?.inquiryAssignmentMode === "ROUND_ROBIN" &&
      settings.inquiryAssignableOwnerIds.length > 0
    ) {
      const activeOwners = await tx.user.findMany({
        where: {
          id: {
            in: settings.inquiryAssignableOwnerIds
          },
          status: "ACTIVE",
          role: {
            in: ["SUPER_ADMIN", "ADMIN", "SALES"]
          }
        },
        select: {
          id: true
        }
      });
      const activeOwnerIds = new Set(activeOwners.map((owner) => owner.id));
      const assignableOwnerIds = settings.inquiryAssignableOwnerIds.filter((ownerId) =>
        activeOwnerIds.has(ownerId)
      );

      if (assignableOwnerIds.length > 0) {
        const cursorIndex = settings.inquiryRoundRobinCursor
          ? assignableOwnerIds.indexOf(settings.inquiryRoundRobinCursor)
          : -1;
        const nextOwnerId = assignableOwnerIds[
          (cursorIndex + 1) % assignableOwnerIds.length
        ];

        defaultOwnerId = nextOwnerId;

        await tx.siteSettings.update({
          where: {
            id: "default"
          },
          data: {
            inquiryRoundRobinCursor: nextOwnerId
          }
        });
      }
    }

    const contact = existingContact
      ? await tx.contact.update({
          where: {
            id: existingContact.id
          },
          data: {
            name: existingContact.name || contactName,
            phone: existingContact.phone || phone || null
          }
        })
      : await tx.contact.create({
          data: {
            customer: {
              create: {
                name: companyName,
                ownerId: defaultOwnerId,
                source: "WEBSITE",
                stage: "NEW"
              }
            },
            name: contactName,
            email,
            phone: phone || null,
            isPrimary: true
          }
        });

    const customerId = existingContact?.customerId || contact.customerId;
    const ownerId = inheritedOwner?.id || defaultOwnerId;

    if (
      ownerId &&
      existingContact &&
      existingContact.customer.ownerId !== ownerId
    ) {
      await tx.customer.update({
        where: {
          id: existingContact.customerId
        },
        data: {
          ownerId
        }
      });
    }

    if (existingContact) {
      await tx.customer.update({
        where: {
          id: existingContact.customerId
        },
        data: {
          updatedAt: new Date()
        }
      });
    }

    const inquiry = await tx.inquiry.create({
      data: {
        customerId,
        contactId: contact.id,
        ownerId,
        productId: product.id,
        subject: `Product inquiry: ${product.name}${
          selectedVariantSku ? ` / ${selectedVariantSku}` : ""
        }`,
        status: ownerId ? "ASSIGNED" : "NEW",
        source: "WEBSITE",
        priority: "MEDIUM",
        message: enrichedMessage,
        messages: {
          create: {
            direction: "INBOUND",
            body: enrichedMessage
          }
        }
      }
    });

    return { inquiry };
  });

  let notificationRecipients = inquiry.ownerId
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

  if (notificationRecipients.length === 0) {
    notificationRecipients = await prisma.user.findMany({
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

  const [confirmation] = await Promise.all([
    sendInquiryConfirmationEmail({
      contactName,
      inquiryId: inquiry.id,
      message: enrichedMessage,
      subject: inquiry.subject,
      to: email
    }),
    sendInquiryTeamNotificationEmail({
      contactName,
      customerName: companyName,
      event: "NEW_INQUIRY",
      inquiryId: inquiry.id,
      message: enrichedMessage,
      subject: inquiry.subject,
      to: notificationRecipients.map((recipient) => recipient.email)
    })
  ]);

  redirect(
    `/products/${product.slug}?sent=1&email=${confirmation.delivered ? "1" : "0"}`
  );
}
