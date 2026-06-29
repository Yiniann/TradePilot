ALTER TABLE "SiteSettings"
  ADD COLUMN "smtpHost" TEXT,
  ADD COLUMN "smtpPort" INTEGER NOT NULL DEFAULT 587,
  ADD COLUMN "smtpUser" TEXT,
  ADD COLUMN "smtpPassword" TEXT,
  ADD COLUMN "smtpSecure" BOOLEAN NOT NULL DEFAULT false,
  DROP COLUMN "resendApiKey";
