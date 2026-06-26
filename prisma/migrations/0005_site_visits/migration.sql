CREATE TABLE "SiteVisit" (
  "id" UUID NOT NULL,
  "visitorId" TEXT NOT NULL,
  "path" TEXT NOT NULL,
  "referrer" TEXT,
  "userAgent" TEXT,
  "ipAddress" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteVisit_visitorId_idx" ON "SiteVisit"("visitorId");

CREATE INDEX "SiteVisit_path_idx" ON "SiteVisit"("path");

CREATE INDEX "SiteVisit_createdAt_idx" ON "SiteVisit"("createdAt");
