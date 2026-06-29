import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { updateEmailSettings } from "./actions";
import { requireCurrentUser } from "@/lib/auth";
import { canManageSystemSettings } from "@/lib/permissions";
import { getSiteSettings } from "@/lib/site-settings";

type EmailSettingsPageProps = {
  searchParams: Promise<{
    saved?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EmailSettingsPage({ searchParams }: EmailSettingsPageProps) {
  const [user, settings, query] = await Promise.all([
    requireCurrentUser(),
    getSiteSettings(),
    searchParams
  ]);

  if (!canManageSystemSettings(user.role)) {
    redirect("/admin/settings");
  }

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Email Settings</p>
          <h2>邮件服务</h2>
        </div>
        <Link className="secondary-link" href="/admin/settings">
          <ArrowLeft size={16} />
          返回设置
        </Link>
      </section>

      {query.saved === "1" ? <p className="success-note">邮件服务设置已保存。</p> : null}

      <form action={updateEmailSettings} className="panel settings-detail-form">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Delivery</p>
            <h2>SMTP 邮件配置</h2>
          </div>
          <span>{settings?.smtpPassword ? "SMTP 密码已配置" : "尚未配置 SMTP 密码"}</span>
        </div>

        <div className="settings-form-grid">
          <label className="settings-form-wide">
            <span>站点地址</span>
            <input
              defaultValue={settings?.appUrl || "http://localhost:3000"}
              name="appUrl"
              placeholder="https://www.example.com"
              required
              type="url"
            />
            <small>用于生成客户邮件中的询盘访问链接。</small>
          </label>

          <label>
            <span>SMTP 主机</span>
            <input
              defaultValue={settings?.smtpHost || ""}
              name="smtpHost"
              placeholder="smtp.example.com"
              required
            />
          </label>

          <label>
            <span>SMTP 端口</span>
            <input
              defaultValue={settings?.smtpPort || 587}
              max={65535}
              min={1}
              name="smtpPort"
              required
              type="number"
            />
          </label>

          <label>
            <span>SMTP 账号</span>
            <input
              autoComplete="username"
              defaultValue={settings?.smtpUser || ""}
              name="smtpUser"
              placeholder="inquiries@example.com"
              required
            />
          </label>

          <label>
            <span>连接加密</span>
            <select defaultValue={settings?.smtpSecure ? "true" : "false"} name="smtpSecure">
              <option value="false">STARTTLS（通常为 587）</option>
              <option value="true">SSL/TLS（通常为 465）</option>
            </select>
          </label>

          <label className="settings-form-wide">
            <span>SMTP 密码</span>
            <input
              autoComplete="new-password"
              name="smtpPassword"
              placeholder={settings?.smtpPassword ? "已配置，留空则不修改" : "输入邮箱密码或授权码"}
              type="password"
            />
          </label>

          <label>
            <span>发件人</span>
            <input
              defaultValue={settings?.emailFrom || ""}
              name="emailFrom"
              placeholder="TradePilot <inquiries@example.com>"
              required
            />
          </label>

          <label>
            <span>回复邮箱</span>
            <input
              defaultValue={settings?.emailReplyTo || ""}
              name="emailReplyTo"
              placeholder="sales@example.com"
              type="email"
            />
          </label>
        </div>

        <div className="settings-form-actions">
          <span>配置保存后，下一封询盘邮件立即使用新设置。</span>
          <button className="primary-button" type="submit">
            <Save size={16} />
            保存设置
          </button>
        </div>
      </form>
    </main>
  );
}
