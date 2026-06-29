import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Eye, MailCheck, MessageSquareReply } from "lucide-react";
import { requireCurrentUser } from "@/lib/auth";
import { canManageSystemSettings } from "@/lib/permissions";
import { getSiteSettings } from "@/lib/site-settings";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  const [user, settings] = await Promise.all([requireCurrentUser(), getSiteSettings()]);

  if (!canManageSystemSettings(user.role)) {
    redirect("/admin/settings");
  }

  const templates = [
    {
      href: "/admin/settings/email-templates/inquiry-confirmation" as const,
      title: "询盘确认邮件",
      description: "客户提交询盘后自动发送，包含会话访问入口。",
      customized: Boolean(settings?.inquiryReceivedSubject && settings.inquiryReceivedBody),
      icon: MailCheck
    },
    {
      href: "/admin/settings/email-templates/inquiry-reply" as const,
      title: "业务回复邮件",
      description: "后台业务回复询盘后发送，携带回复内容和会话入口。",
      customized: Boolean(settings?.inquiryReplySubject && settings.inquiryReplyBody),
      icon: MessageSquareReply
    }
  ];

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Email Templates</p>
          <h2>邮件模板</h2>
        </div>
        <Link className="secondary-link" href="/admin/settings">
          <ArrowLeft size={16} />
          返回设置
        </Link>
      </section>

      <section className="email-template-list">
        {templates.map((template) => {
          const Icon = template.icon;

          return (
            <article className="email-template-item" key={template.href}>
              <div className="metric-icon">
                <Icon size={18} />
              </div>
              <div>
                <div className="email-template-item-heading">
                  <h2>{template.title}</h2>
                  <span>{template.customized ? "已自定义" : "默认模板"}</span>
                </div>
                <p>{template.description}</p>
              </div>
              <Link className="secondary-link" href={template.href}>
                <Eye size={16} />
                编辑与预览
              </Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}
