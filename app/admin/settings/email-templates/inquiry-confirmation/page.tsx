import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { updateInquiryReceivedEmailTemplate } from "../actions";
import { EmailTemplateEditor } from "@/components/email-template-editor";
import { requireCurrentUser } from "@/lib/auth";
import { canManageSystemSettings } from "@/lib/permissions";
import { getSiteSettings } from "@/lib/site-settings";
import {
  DEFAULT_INQUIRY_RECEIVED_BODY,
  DEFAULT_INQUIRY_RECEIVED_SUBJECT
} from "@/lib/inquiry-email-templates";

type InquiryConfirmationTemplatePageProps = {
  searchParams: Promise<{
    saved?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function InquiryConfirmationTemplatePage({
  searchParams
}: InquiryConfirmationTemplatePageProps) {
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
          <h2>询盘确认邮件</h2>
        </div>
        <Link className="secondary-link" href="/admin/settings/email-templates">
          <ArrowLeft size={16} />
          返回模板列表
        </Link>
      </section>

      {query.saved === "1" ? <p className="success-note">询盘确认邮件已保存。</p> : null}

      <EmailTemplateEditor
        body={settings?.inquiryReceivedBody || DEFAULT_INQUIRY_RECEIVED_BODY}
        buttonLabel="View inquiry"
        company={{
          address: settings?.companyAddress,
          email: settings?.companyEmail,
          name: settings?.companyName || "TradePilot",
          phone: settings?.companyPhone,
          website: settings?.companyWebsite
        }}
        description="客户在前台提交询盘后自动发送。"
        saveAction={updateInquiryReceivedEmailTemplate}
        subject={settings?.inquiryReceivedSubject || DEFAULT_INQUIRY_RECEIVED_SUBJECT}
        title="询盘确认邮件"
      />
    </main>
  );
}
