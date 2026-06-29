import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { updateCompanySettings } from "./actions";
import { requireCurrentUser } from "@/lib/auth";
import { canManageSystemSettings } from "@/lib/permissions";
import { getSiteSettings } from "@/lib/site-settings";

type CompanySettingsPageProps = {
  searchParams: Promise<{
    saved?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function CompanySettingsPage({ searchParams }: CompanySettingsPageProps) {
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
          <p className="eyebrow">Company Settings</p>
          <h2>企业信息</h2>
        </div>
        <Link className="secondary-link" href="/admin/settings">
          <ArrowLeft size={16} />
          返回设置
        </Link>
      </section>

      {query.saved === "1" ? <p className="success-note">企业信息已保存。</p> : null}

      <form action={updateCompanySettings} className="panel settings-detail-form">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Company</p>
            <h2>企业资料</h2>
          </div>
          <span>用于邮件品牌与页脚</span>
        </div>

        <div className="settings-form-grid">
          <label>
            <span>公司名称</span>
            <input
              defaultValue={settings?.companyName || "TradePilot"}
              name="companyName"
              required
            />
          </label>

          <label>
            <span>公司官网</span>
            <input
              defaultValue={settings?.companyWebsite || ""}
              name="companyWebsite"
              placeholder="https://www.example.com"
              type="url"
            />
          </label>

          <label>
            <span>联系邮箱</span>
            <input
              defaultValue={settings?.companyEmail || ""}
              name="companyEmail"
              placeholder="sales@example.com"
              type="email"
            />
          </label>

          <label>
            <span>联系电话</span>
            <input
              defaultValue={settings?.companyPhone || ""}
              name="companyPhone"
              placeholder="+86 000 0000 0000"
            />
          </label>

          <label className="settings-form-wide">
            <span>公司地址</span>
            <textarea
              defaultValue={settings?.companyAddress || ""}
              name="companyAddress"
              placeholder="填写公司办公或注册地址"
            />
          </label>
        </div>

        <div className="settings-form-actions">
          <span>保存后，邮件品牌和页脚立即使用新的企业信息。</span>
          <button className="primary-button" type="submit">
            <Save size={16} />
            保存企业信息
          </button>
        </div>
      </form>
    </main>
  );
}
