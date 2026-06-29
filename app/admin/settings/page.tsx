import Link from "next/link";
import {
  Building2,
  FileText,
  Mail,
  ShieldCheck,
  UserCheck,
  UserCog
} from "lucide-react";
import { requireCurrentUser } from "@/lib/auth";
import {
  canManageInquiryAssignmentSettings,
  canManageSystemSettings,
  canManageUsers,
  roleLabels
} from "@/lib/permissions";

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
        {canManageSystemSettings(user.role) ? (
          <Link className="settings-card settings-card-link" href="/admin/settings/company">
            <div className="metric-icon">
              <Building2 size={18} />
            </div>
            <div>
              <p className="eyebrow">Company</p>
              <h2>企业信息</h2>
              <p>维护公司名称、官网和联系资料。</p>
            </div>
          </Link>
        ) : null}

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

        {canManageInquiryAssignmentSettings(user.role) ? (
          <Link className="settings-card settings-card-link" href="/admin/settings/inquiry-assignment">
            <div className="metric-icon">
              <UserCheck size={18} />
            </div>
            <div>
              <p className="eyebrow">Assignment</p>
              <h2>询盘分配设置</h2>
              <p>设置新询盘进入未分配池，或自动分配给默认负责人。</p>
            </div>
          </Link>
        ) : null}

        {canManageSystemSettings(user.role) ? (
          <Link className="settings-card settings-card-link" href="/admin/settings/email">
            <div className="metric-icon">
              <Mail size={18} />
            </div>
            <div>
              <p className="eyebrow">Email</p>
              <h2>邮件服务</h2>
              <p>配置 SMTP、询盘访问域名和回复邮箱。</p>
            </div>
          </Link>
        ) : null}

        {canManageSystemSettings(user.role) ? (
          <Link className="settings-card settings-card-link" href="/admin/settings/email-templates">
            <div className="metric-icon">
              <FileText size={18} />
            </div>
            <div>
              <p className="eyebrow">Templates</p>
              <h2>邮件模板</h2>
              <p>编辑询盘确认邮件和业务回复邮件。</p>
            </div>
          </Link>
        ) : null}

      </section>
    </main>
  );
}
