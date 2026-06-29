import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { updateInquiryReplyEmailTemplate } from "../actions";
import { EmailTemplateEditor } from "@/components/email-template-editor";
import { requireCurrentUser } from "@/lib/auth";
import { canManageSystemSettings } from "@/lib/permissions";
import { getSiteSettings } from "@/lib/site-settings";
import {
  DEFAULT_INQUIRY_REPLY_BODY,
  DEFAULT_INQUIRY_REPLY_SUBJECT,
  INQUIRY_REPLY_EMAIL_TEMPLATE_VARIABLES
} from "@/lib/inquiry-email-templates";

type InquiryReplyTemplatePageProps = {
  searchParams: Promise<{
    saved?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function InquiryReplyTemplatePage({
  searchParams
}: InquiryReplyTemplatePageProps) {
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
          <p className="eyebrow">Email Template</p>
          <h2>业务回复邮件</h2>
        </div>
        <Link className="secondary-link" href="/admin/settings/email-templates">
          <ArrowLeft size={16} />
          返回模板列表
        </Link>
      </section>

      {query.saved === "1" ? <p className="success-note">业务回复邮件已保存。</p> : null}

      <EmailTemplateEditor
        body={settings?.inquiryReplyBody || DEFAULT_INQUIRY_REPLY_BODY}
        buttonLabel="View and reply"
        company={{
          address: settings?.companyAddress,
          email: settings?.companyEmail,
          name: settings?.companyName || "TradePilot",
          phone: settings?.companyPhone,
          website: settings?.companyWebsite
        }}
        description="后台业务保存客户回复后自动发送。"
        saveAction={updateInquiryReplyEmailTemplate}
        salesperson={{
          email: user.email,
          name: user.name
        }}
        subject={settings?.inquiryReplySubject || DEFAULT_INQUIRY_REPLY_SUBJECT}
        templateVariables={INQUIRY_REPLY_EMAIL_TEMPLATE_VARIABLES}
        title="业务回复邮件"
      />
    </main>
  );
}
