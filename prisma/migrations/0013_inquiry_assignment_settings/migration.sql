ALTER TABLE "SiteSettings"
ADD COLUMN "inquiryAssignmentMode" TEXT NOT NULL DEFAULT 'UNASSIGNED',
ADD COLUMN "inquiryDefaultOwnerId" UUID;
