CREATE TABLE "InquiryAccessToken" (
  "id" UUID NOT NULL,
  "inquiryId" UUID NOT NULL,
  "tokenHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "revokedAt" TIMESTAMP(3),
  "lastUsedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InquiryAccessToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "InquiryAccessToken_tokenHash_key" ON "InquiryAccessToken"("tokenHash");
CREATE INDEX "InquiryAccessToken_inquiryId_idx" ON "InquiryAccessToken"("inquiryId");
CREATE INDEX "InquiryAccessToken_expiresAt_idx" ON "InquiryAccessToken"("expiresAt");

ALTER TABLE "InquiryAccessToken" ADD CONSTRAINT "InquiryAccessToken_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "Inquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
