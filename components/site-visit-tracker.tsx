"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const ignoredPrefixes = ["/admin", "/login", "/api", "/_next"];

export function SiteVisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (ignoredPrefixes.some((prefix) => pathname.startsWith(prefix))) {
      return;
    }

    const body = JSON.stringify({
      path: pathname
    });

    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/site-visits",
        new Blob([body], { type: "application/json" })
      );
      return;
    }

    void fetch("/api/site-visits", {
      method: "POST",
      body,
      headers: {
        "content-type": "application/json"
      },
      keepalive: true
    });
  }, [pathname]);

  return null;
}
