"use client";

import { usePathname } from "next/navigation";

const pageTitles = [
  {
    match: (pathname: string) => pathname === "/admin",
    eyebrow: "Dashboard",
    title: "仪表盘"
  },
  {
    match: (pathname: string) => pathname === "/admin/products/new",
    eyebrow: "Products",
    title: "新增产品"
  },
  {
    match: (pathname: string) =>
      pathname.startsWith("/admin/products/") && pathname.endsWith("/edit"),
    eyebrow: "Products",
    title: "编辑产品"
  },
  {
    match: (pathname: string) => pathname === "/admin/products",
    eyebrow: "Products",
    title: "产品管理"
  },
  {
    match: (pathname: string) => pathname === "/admin/inquiries",
    eyebrow: "Inquiries",
    title: "询盘管理"
  },
  {
    match: (pathname: string) => pathname === "/admin/customers/new",
    eyebrow: "Customers",
    title: "新建客户"
  },
  {
    match: (pathname: string) =>
      pathname.startsWith("/admin/customers/") && pathname !== "/admin/customers/new",
    eyebrow: "Customers",
    title: "客户卡片"
  },
  {
    match: (pathname: string) => pathname === "/admin/customers",
    eyebrow: "Customers",
    title: "客户管理"
  },
  {
    match: (pathname: string) => pathname === "/admin/settings",
    eyebrow: "Settings",
    title: "设置"
  },
  {
    match: (pathname: string) => pathname === "/admin/settings/inquiry-assignment",
    eyebrow: "Settings",
    title: "询盘分配设置"
  },
  {
    match: (pathname: string) => pathname === "/admin/users",
    eyebrow: "Team",
    title: "成员与角色"
  }
] as const;

export function AdminPageTitle() {
  const pathname = usePathname();
  const pageTitle =
    pageTitles.find((item) => item.match(pathname)) ?? pageTitles[0];

  return (
    <div>
      <p className="eyebrow">{pageTitle.eyebrow}</p>
      <h1>{pageTitle.title}</h1>
    </div>
  );
}
