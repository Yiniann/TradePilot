import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { updateInquiryAssignmentSettings } from "./actions";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  canManageInquiryAssignmentSettings,
  roleLabels
} from "@/lib/permissions";
import { getSiteSettings } from "@/lib/site-settings";

type InquiryAssignmentSettingsPageProps = {
  searchParams: Promise<{
    saved?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function InquiryAssignmentSettingsPage({
  searchParams
}: InquiryAssignmentSettingsPageProps) {
  const [user, settings, assignees, query] = await Promise.all([
    requireCurrentUser(),
    getSiteSettings(),
    prisma.user.findMany({
      where: {
        status: "ACTIVE",
        role: {
          in: ["SUPER_ADMIN", "ADMIN", "SALES"]
        }
      },
      orderBy: [{ role: "asc" }, { createdAt: "asc" }]
    }),
    searchParams
  ]);

  if (!canManageInquiryAssignmentSettings(user.role)) {
    redirect("/admin/settings");
  }

  const assignmentMode = settings?.inquiryAssignmentMode || "UNASSIGNED";
  const assignableOwnerIds = new Set(settings?.inquiryAssignableOwnerIds || []);

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Inquiry Assignment</p>
          <h2>询盘分配设置</h2>
        </div>
        <Link className="secondary-link" href="/admin/settings">
          <ArrowLeft size={16} />
          返回设置
        </Link>
      </section>

      {query.saved === "1" ? <p className="success-note">询盘分配设置已保存。</p> : null}

      <form action={updateInquiryAssignmentSettings} className="panel settings-detail-form">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Assignment</p>
            <h2>新询盘默认分配</h2>
          </div>
          <span>已有客户优先继承客户负责人</span>
        </div>

        <div className="settings-form-grid">
          <label className="settings-form-wide">
            <span>未匹配客户的新询盘</span>
            <select name="inquiryAssignmentMode" defaultValue={assignmentMode}>
              <option value="UNASSIGNED">进入未分配池，由管理员手动分配</option>
              <option value="DEFAULT_OWNER">自动分配给默认负责人</option>
              <option value="ROUND_ROBIN">平均分配给可接询盘账号</option>
            </select>
            <small>如果询盘邮箱匹配到已有客户，会始终优先分配给该客户负责人。</small>
          </label>

          <label className="settings-form-wide">
            <span>默认负责人</span>
            <select
              name="inquiryDefaultOwnerId"
              defaultValue={settings?.inquiryDefaultOwnerId || ""}
            >
              <option value="">暂不选择</option>
              {assignees.map((assignee) => (
                <option key={assignee.id} value={assignee.id}>
                  {assignee.name} / {roleLabels[assignee.role]}
                </option>
              ))}
            </select>
            <small>仅当上方选择自动分配给默认负责人时生效。</small>
          </label>

          <div className="settings-form-wide settings-check-section">
            <span>可接询盘账号</span>
            <div className="settings-check-list">
              {assignees.map((assignee) => (
                <label key={assignee.id}>
                  <input
                    defaultChecked={assignableOwnerIds.has(assignee.id)}
                    name="inquiryAssignableOwnerIds"
                    type="checkbox"
                    value={assignee.id}
                  />
                  <span>{assignee.name}</span>
                  <small>{roleLabels[assignee.role]}</small>
                </label>
              ))}
            </div>
            <small>仅当选择平均分配时生效，系统会按勾选账号顺序循环分配新询盘。</small>
          </div>
        </div>

        <div className="settings-form-actions">
          <span>保存后，新的前台询盘会按这里的规则进入对应负责人账号。</span>
          <button className="primary-button" type="submit">
            <Save size={16} />
            保存分配设置
          </button>
        </div>
      </form>
    </main>
  );
}
