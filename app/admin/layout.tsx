import Link from "next/link";
import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Home,
  Inbox,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  UsersRound
} from "lucide-react";
import { logout } from "@/app/login/actions";
import { AdminPageTitle } from "@/components/admin-page-title";
import { requireCurrentUser } from "@/lib/auth";
import {
  canManageProducts,
  roleLabels
} from "@/lib/permissions";
import type { CurrentUser } from "@/lib/auth";

const navigation: Array<{
  href: Route;
  label: string;
  icon: LucideIcon;
  visible?: (user: CurrentUser) => boolean;
}> = [
  { href: "/admin", label: "仪表盘", icon: LayoutDashboard },
  {
    href: "/admin/products",
    label: "产品",
    icon: Package,
    visible: (user) => canManageProducts(user.role)
  },
  { href: "/admin/inquiries", label: "询盘", icon: Inbox },
  { href: "/admin/customers", label: "客户", icon: UsersRound },
  { href: "/admin/settings", label: "设置", icon: Settings }
];

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireCurrentUser();
  const userInitial = user.name.trim().charAt(0).toUpperCase() || "U";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin">
          <span className="brand-mark">T</span>
          <span>TradePilot</span>
        </Link>
        <nav className="admin-nav" aria-label="后台导航">
          {navigation.filter((item) => !item.visible || item.visible(user)).map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href}>
                <Icon size={18} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="admin-main">
        <header className="admin-topbar">
          <AdminPageTitle />
          <div className="admin-topbar-actions">
            <Link className="topbar-site-logo" href="/" title="回到站点">
              <Home size={18} />
            </Link>
            <div className="admin-user-menu">
              <button className="admin-user-trigger" type="button" aria-label="用户菜单">
                <span>{userInitial}</span>
              </button>
              <div className="admin-user-dropdown">
                <div className="admin-user-meta">
                  <strong>{user.name}</strong>
                  <span>{roleLabels[user.role]}</span>
                  <small>{user.email}</small>
                </div>
                <form action={logout}>
                  <button className="dropdown-action" type="submit">
                    <LogOut size={16} />
                    退出登录
                  </button>
                </form>
              </div>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
