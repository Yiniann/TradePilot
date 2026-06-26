"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function createProductInquiry(formData: FormData) {
  const productId = readText(formData, "productId");
  const productSlug = readText(formData, "productSlug");
  const companyName = readText(formData, "companyName");
  const contactName = readText(formData, "contactName");
  const email = normalizeEmail(readText(formData, "email"));
  const phone = readText(formData, "phone");
  const message = readText(formData, "message");
  const selectedVariantName = readText(formData, "selectedVariantName");
  const selectedVariantSku = readText(formData, "selectedVariantSku");
  const selectedQuantity = readText(formData, "selectedQuantity");
  const selectedUnitPrice = readText(formData, "selectedUnitPrice");

  if (!productId || !productSlug || !companyName || !contactName || !email || !message) {
    return;
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      status: "PUBLISHED"
    },
    select: {
      id: true,
      name: true
    }
  });

  if (!product) {
    return;
  }

  const customer = await prisma.customer.create({
    data: {
      name: companyName,
      source: "WEBSITE",
      stage: "NEW"
    }
  });

  const contact = await prisma.contact.create({
    data: {
      customerId: customer.id,
      name: contactName,
      email,
      phone: phone || null,
      isPrimary: true
    }
  });

  const enrichedMessage = [
    selectedVariantName || selectedVariantSku
      ? `Selected SKU: ${selectedVariantName || "N/A"}${selectedVariantSku ? ` (${selectedVariantSku})` : ""}`
      : "",
    selectedQuantity ? `Quantity: ${selectedQuantity}` : "",
    selectedUnitPrice ? `Matched price: ${selectedUnitPrice}` : "",
    message
  ]
    .filter(Boolean)
    .join("\n");

  await prisma.inquiry.create({
    data: {
      customerId: customer.id,
      contactId: contact.id,
      productId: product.id,
      subject: `Product inquiry: ${product.name}${
        selectedVariantSku ? ` / ${selectedVariantSku}` : ""
      }`,
      source: "WEBSITE",
      priority: "MEDIUM",
      message: enrichedMessage
    }
  });

  redirect(`/products/${productSlug}?sent=1`);
}
