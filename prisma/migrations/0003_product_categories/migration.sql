CREATE TABLE "ProductCategory" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ProductCategory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Product" ADD COLUMN "categoryId" UUID;

CREATE UNIQUE INDEX "ProductCategory_slug_key" ON "ProductCategory"("slug");

CREATE INDEX "ProductCategory_sortOrder_idx" ON "ProductCategory"("sortOrder");

CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");

ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "ProductCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;
