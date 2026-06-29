ALTER TABLE "SiteSettings"
ADD COLUMN "inquiryAssignableOwnerIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "inquiryRoundRobinCursor" UUID;
