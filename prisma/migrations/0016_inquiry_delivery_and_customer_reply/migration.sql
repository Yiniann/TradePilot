ALTER TYPE "InquiryStatus" ADD VALUE IF NOT EXISTS 'CUSTOMER_REPLIED' BEFORE 'REPLIED';

CREATE TYPE "MessageDeliveryStatus" AS ENUM (
  'NOT_APPLICABLE',
  'PENDING',
  'SENT',
  'FAILED'
);

ALTER TABLE "InquiryMessage"
ADD COLUMN "deliveryStatus" "MessageDeliveryStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
ADD COLUMN "deliveryError" TEXT,
ADD COLUMN "deliveredAt" TIMESTAMP(3);

UPDATE "InquiryMessage"
SET
  "deliveryStatus" = 'SENT',
  "deliveredAt" = "createdAt"
WHERE "direction" = 'OUTBOUND';

CREATE INDEX "InquiryMessage_deliveryStatus_idx"
ON "InquiryMessage"("deliveryStatus");
