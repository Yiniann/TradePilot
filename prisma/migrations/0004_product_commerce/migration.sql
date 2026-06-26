ALTER TABLE "Product" ADD COLUMN "detailHtml" TEXT;

CREATE TABLE "ProductVariant" (
  "id" UUID NOT NULL,
  "productId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "sku" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProductPriceTier" (
  "id" UUID NOT NULL,
  "variantId" UUID NOT NULL,
  "minQuantity" INTEGER NOT NULL,
  "maxQuantity" INTEGER,
  "unitPrice" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductPriceTier_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductVariant_productId_idx" ON "ProductVariant"("productId");

CREATE INDEX "ProductVariant_sku_idx" ON "ProductVariant"("sku");

CREATE INDEX "ProductVariant_sortOrder_idx" ON "ProductVariant"("sortOrder");

CREATE INDEX "ProductPriceTier_variantId_idx" ON "ProductPriceTier"("variantId");

CREATE INDEX "ProductPriceTier_sortOrder_idx" ON "ProductPriceTier"("sortOrder");

ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductPriceTier" ADD CONSTRAINT "ProductPriceTier_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
