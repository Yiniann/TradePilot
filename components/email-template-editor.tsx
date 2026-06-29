"use client";

import { useState } from "react";
import { Eye, Save } from "lucide-react";
import { INQUIRY_EMAIL_TEMPLATE_VARIABLES } from "@/lib/inquiry-email-templates";

type CompanyPreview = {
  address?: string | null;
  email?: string | null;
  name: string;
  phone?: string | null;
  website?: string | null;
};

type EmailTemplateEditorProps = {
  body: string;
  buttonLabel: string;
  company: CompanyPreview;
  description: string;
  saveAction: (formData: FormData) => void | Promise<void>;
  salesperson?: {
    email: string;
    name: string;
  };
  subject: string;
  templateVariables?: readonly string[];
  title: string;
};

const sampleVariables = {
  contactName: "Alex Johnson",
  conversationUrl: "https://example.com/inquiries/conversation",
  inquirySubject: "Product inquiry: Sample Product",
  message: "We are interested in 500 units. Please share the lead time and quotation.",
  salesEmail: "sales@example.com",
  salesName: "Cory Chen"
};

function renderTemplate(
  template: string,
  companyName: string,
  salesperson?: { email: string; name: string }
) {
  const variables = {
    ...sampleVariables,
    companyName,
    salesEmail: salesperson?.email || sampleVariables.salesEmail,
    salesName: salesperson?.name || sampleVariables.salesName
  };

  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    template
  );
}

export function EmailTemplateEditor({
  body: initialBody,
  buttonLabel,
  company,
  description,
  saveAction,
  salesperson,
  subject: initialSubject,
  templateVariables = INQUIRY_EMAIL_TEMPLATE_VARIABLES,
  title
}: EmailTemplateEditorProps) {
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const previewSubject = renderTemplate(subject, company.name, salesperson);
  const previewBody = renderTemplate(body, company.name, salesperson);

  return (
    <div className="template-editor-layout">
      <form action={saveAction} className="panel template-editor-form">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Template</p>
            <h2>{title}</h2>
          </div>
        </div>
        <p className="template-editor-description">{description}</p>

        <div className="template-variables" aria-label="可用模板变量">
          <span>可用变量</span>
          {templateVariables.map((variable) => (
            <code key={variable}>{variable}</code>
          ))}
        </div>

        <div className="template-editor-fields">
          <label>
            <span>邮件主题</span>
            <input
              name="subject"
              onChange={(event) => setSubject(event.target.value)}
              required
              value={subject}
            />
          </label>
          <label>
            <span>邮件正文</span>
            <textarea
              name="body"
              onChange={(event) => setBody(event.target.value)}
              required
              value={body}
            />
          </label>
        </div>

        <div className="settings-form-actions">
          <span>保存后，新发送的邮件立即使用此模板。</span>
          <button className="primary-button" type="submit">
            <Save size={16} />
            保存模板
          </button>
        </div>
      </form>

      <aside className="panel email-template-preview-panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Preview</p>
            <h2>邮件预览</h2>
          </div>
          <Eye size={17} />
        </div>

        <div className="email-preview-window">
          <div className="email-preview-card">
            <div className="email-preview-brand">
              <span>{company.name.charAt(0).toUpperCase() || "T"}</span>
              <strong>{company.name}</strong>
            </div>
            <h3>{previewSubject}</h3>
            <p className="email-preview-body">{previewBody}</p>
            <span className="email-preview-button">{buttonLabel}</span>
            {salesperson ? (
              <div className="email-preview-sales-contact">
                <strong>Your sales contact</strong>
                <span>{salesperson.name}</span>
                <span>{salesperson.email}</span>
              </div>
            ) : null}
            <p className="email-preview-security">
              This secure link provides access to the inquiry for 90 days. Please do not forward it.
            </p>
            <footer className="email-preview-footer">
              <strong>{company.name}</strong>
              {company.address ? <span>{company.address}</span> : null}
              {company.email || company.phone ? (
                <span>{[company.email, company.phone].filter(Boolean).join(" · ")}</span>
              ) : null}
              {company.website ? <span>{company.website}</span> : null}
            </footer>
          </div>
        </div>
      </aside>
    </div>
  );
}
