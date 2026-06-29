import "server-only";

import { prisma } from "@/lib/db";

export const SITE_SETTINGS_ID = "default";

export function getSiteSettings() {
  return prisma.siteSettings.findUnique({
    where: {
      id: SITE_SETTINGS_ID
    }
  });
}
