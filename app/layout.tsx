import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteVisitTracker } from "@/components/site-visit-tracker";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "TradePilot",
  description: "B2B independent site admin and inquiry workspace"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>
        {children}
        <SiteVisitTracker />
      </body>
    </html>
  );
}
