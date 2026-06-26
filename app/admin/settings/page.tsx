import Link from "next/link";
import { ShieldCheck, UserCog } from "lucide-react";
import { requireCurrentUser } from "@/lib/auth";
import { canManageUsers, roleLabels } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireCurrentUser();

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>设置</h2>
        </div>
        <span className="muted-text">{roleLabels[user.role]}</span>
      </section>

      <section className="settings-grid">
        <article className="settings-card">
          <div className="metric-icon">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="eyebrow">Account</p>
            <h2>当前账号</h2>
            <p>{user.name} / {user.email}</p>
          </div>
        </article>

        {canManageUsers(user.role) ? (
          <Link className="settings-card settings-card-link" href="/admin/users">
            <div className="metric-icon">
              <UserCog size={18} />
            </div>
            <div>
              <p className="eyebrow">Team</p>
              <h2>成员与角色</h2>
              <p>管理后台账号、角色和启用状态。</p>
            </div>
          </Link>
        ) : null}
      </section>
    </main>
  );
}
