"use server";

import type { ProductStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageProducts } from "@/lib/permissions";
import { saveProductImage } from "@/lib/product-images";

const productStatuses: ProductStatus[] = ["DRAFT", "PUBLISHED", "ARCHIVED"];

type ProductVariantInput = {
  name?: unknown;
  sku?: unknown;
  priceTiers?: Array<{
    minQuantity?: unknown;
    maxQuantity?: unknown;
    unitPrice?: unknown;
    currency?: unknown;
  }>;
};

function readText(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function sanitizeProductHtml(value: string) {
  return value
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .slice(0, 200000)
    .trim();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function readStatus(formData: FormData) {
  const status = readText(formData, "status") as ProductStatus;
  return productStatuses.includes(status) ? status : "DRAFT";
}

async function requireProductManager() {
  const user = await requireCurrentUser();

  if (!canManageProducts(user.role)) {
    redirect("/admin");
  }

  return user;
}

async function uniqueSlug(baseSlug: string, currentProductId?: string) {
  let slug = baseSlug || `product-${Date.now()}`;
  let index = 2;

  while (true) {
    const existingProduct = await prisma.product.findUnique({ where: { slug } });

    if (!existingProduct || existingProduct.id === currentProductId) {
      break;
    }

    slug = `${baseSlug}-${index}`;
    index += 1;
  }

  return slug;
}

async function uniqueCategorySlug(baseSlug: string) {
  const normalizedBaseSlug = baseSlug || `category-${Date.now()}`;
  let slug = normalizedBaseSlug;
  let index = 2;

  while (await prisma.productCategory.findUnique({ where: { slug } })) {
    slug = `${normalizedBaseSlug}-${index}`;
    index += 1;
  }

  return slug;
}

async function resolveCategoryId(formData: FormData) {
  const categoryId = readText(formData, "categoryId");
  const newCategoryName = readText(formData, "newCategoryName");

  if (newCategoryName) {
    const existingCategory = await prisma.productCategory.findFirst({
      where: {
        name: newCategoryName
      }
    });

    if (existingCategory) {
      return existingCategory.id;
    }

    const slug = await uniqueCategorySlug(slugify(newCategoryName));
    const category = await prisma.productCategory.create({
      data: {
        name: newCategoryName,
        slug
      }
    });

    return category.id;
  }

  return categoryId || null;
}

function readPositiveInt(value: unknown) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

function readPrice(value: unknown) {
  const normalized = String(value ?? "").trim();
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) && numberValue >= 0 ? normalized : null;
}

function readVariants(formData: FormData) {
  const raw = readText(formData, "variantsJson");

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as ProductVariantInput[];

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((variant, variantIndex) => {
        const name = String(variant.name ?? "").trim();
        const sku = String(variant.sku ?? "").trim();
        const priceTiers = Array.isArray(variant.priceTiers)
          ? variant.priceTiers
              .map((tier, tierIndex) => {
                const minQuantity = readPositiveInt(tier.minQuantity);
                const maxQuantity = readPositiveInt(tier.maxQuantity);
                const unitPrice = readPrice(tier.unitPrice);
                const currency = String(tier.currency ?? "USD").trim().toUpperCase() || "USD";

                if (!minQuantity || !unitPrice) {
                  return null;
                }

                return {
                  minQuantity,
                  maxQuantity,
                  unitPrice,
                  currency: currency.slice(0, 8),
                  sortOrder: tierIndex
                };
              })
              .filter((tier) => tier !== null)
          : [];

        if (!name && !sku && priceTiers.length === 0) {
          return null;
        }

        return {
          name: name || sku || `SKU ${variantIndex + 1}`,
          sku: sku || null,
          sortOrder: variantIndex,
          priceTiers
        };
      })
      .filter((variant) => variant !== null);
  } catch {
    return [];
  }
}

export async function createProduct(formData: FormData) {
  await requireProductManager();
  const name = readText(formData, "name");

  if (!name) {
    return;
  }

  const providedSlug = slugify(readText(formData, "slug"));
  const slug = await uniqueSlug(providedSlug || slugify(name));
  const categoryId = await resolveCategoryId(formData);
  const cover = formData.get("coverImage");
  const coverImage = cover instanceof File ? await saveProductImage(cover) : null;
  const variants = readVariants(formData);

  await prisma.product.create({
    data: {
      name,
      slug,
      categoryId,
      sku: readText(formData, "sku") || null,
      summary: readText(formData, "summary") || null,
      description: readText(formData, "description") || null,
      detailHtml: sanitizeProductHtml(readText(formData, "detailHtml")) || null,
      priceNote: readText(formData, "priceNote") || null,
      status: readStatus(formData),
      coverImage,
      sortOrder: Number(readText(formData, "sortOrder")) || 0,
      variants: variants.length
        ? {
            create: variants.map((variant) => ({
              name: variant.name,
              sku: variant.sku,
              sortOrder: variant.sortOrder,
              priceTiers: variant.priceTiers.length
                ? {
                    create: variant.priceTiers
                  }
                : undefined
            }))
          }
        : undefined
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
  redirect("/admin/products");
}

export async function updateProduct(formData: FormData) {
  await requireProductManager();
  const productId = readText(formData, "productId");
  const name = readText(formData, "name");

  if (!productId || !name) {
    return;
  }

  const existingProduct = await prisma.product.findUnique({
    where: {
      id: productId
    },
    select: {
      id: true,
      slug: true,
      coverImage: true
    }
  });

  if (!existingProduct) {
    redirect("/admin/products");
  }

  const providedSlug = slugify(readText(formData, "slug"));
  const slug = await uniqueSlug(providedSlug || slugify(name), productId);
  const categoryId = await resolveCategoryId(formData);
  const cover = formData.get("coverImage");
  const uploadedCoverImage = cover instanceof File ? await saveProductImage(cover) : null;
  const variants = readVariants(formData);

  await prisma.$transaction(async (tx) => {
    await tx.productVariant.deleteMany({
      where: {
        productId
      }
    });

    await tx.product.update({
      where: {
        id: productId
      },
      data: {
        name,
        slug,
        categoryId,
        sku: readText(formData, "sku") || null,
        summary: readText(formData, "summary") || null,
        description: readText(formData, "description") || null,
        detailHtml: sanitizeProductHtml(readText(formData, "detailHtml")) || null,
        priceNote: readText(formData, "priceNote") || null,
        status: readStatus(formData),
        coverImage: uploadedCoverImage || existingProduct.coverImage,
        sortOrder: Number(readText(formData, "sortOrder")) || 0,
        variants: variants.length
          ? {
              create: variants.map((variant) => ({
                name: variant.name,
                sku: variant.sku,
                sortOrder: variant.sortOrder,
                priceTiers: variant.priceTiers.length
                  ? {
                      create: variant.priceTiers
                    }
                  : undefined
              }))
            }
          : undefined
      }
    });
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${productId}/edit`);
  revalidatePath("/products");
  revalidatePath(`/products/${existingProduct.slug}`);
  revalidatePath(`/products/${slug}`);
  redirect("/admin/products");
}

export async function updateProductStatus(formData: FormData) {
  await requireProductManager();
  const productId = readText(formData, "productId");
  const status = readStatus(formData);

  if (!productId) {
    return;
  }

  await prisma.product.update({
    where: {
      id: productId
    },
    data: {
      status
    }
  });

  revalidatePath("/admin/products");
  revalidatePath("/products");
}
