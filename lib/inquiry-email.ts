import "server-only";

import { createInquiryAccessLink } from "@/lib/inquiry-access";
import { sendTransactionalEmail } from "@/lib/email";
import { getSiteSettings } from "@/lib/site-settings";
import {
  DEFAULT_INQUIRY_RECEIVED_BODY,
  DEFAULT_INQUIRY_RECEIVED_SUBJECT,
  DEFAULT_INQUIRY_REPLY_BODY,
  DEFAULT_INQUIRY_REPLY_SUBJECT
} from "@/lib/inquiry-email-templates";

type InquiryEmailInput = {
  contactName: string;
  inquiryId: string;
  message: string;
  subject: string;
  to: string;
};

type SalesContact = {
  email: string;
  name: string;
};

type CompanyInfo = {
  address: string | null;
  email: string | null;
  name: string;
  phone: string | null;
  website: string | null;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTemplate(
  template: string,
  variables: Record<string, string>
) {
  return Object.entries(variables).reduce(
    (result, [key, value]) => result.replaceAll(`{{${key}}}`, value),
    template
  );
}

function getCompanyInfo(
  settings: Awaited<ReturnType<typeof getSiteSettings>>
): CompanyInfo {
  return {
    address: settings?.companyAddress || null,
    email: settings?.companyEmail || null,
    name: settings?.companyName || "TradePilot",
    phone: settings?.companyPhone || null,
    website: settings?.companyWebsite || null
  };
}

function renderCompanyText(company: CompanyInfo) {
  return [
    company.name,
    company.address,
    [company.email, company.phone].filter(Boolean).join(" | "),
    company.website
  ]
    .filter(Boolean)
    .join("\n");
}

function renderCompanyFooter(company: CompanyInfo) {
  const contactLine = [company.email, company.phone]
    .filter(Boolean)
    .map((value) => escapeHtml(value || ""))
    .join(" &nbsp;·&nbsp; ");
  const addressLine = company.address
    ? `<div style="margin-top:5px">${escapeHtml(company.address)}</div>`
    : "";
  const contactDetails = contactLine
    ? `<div style="margin-top:5px">${contactLine}</div>`
    : "";
  const websiteLink = company.website
    ? `<div style="margin-top:5px"><a href="${escapeHtml(company.website)}" style="color:#087f6b;text-decoration:none">${escapeHtml(company.website)}</a></div>`
    : "";

  return `
    <div style="border-top:1px solid #dce5e2;margin-top:28px;padding-top:18px;color:#6c7774;font-size:12px;line-height:1.6">
      <strong style="color:#34413e;font-size:13px">${escapeHtml(company.name)}</strong>
      ${addressLine}
      ${contactDetails}
      ${websiteLink}
    </div>
  `;
}

function renderSalesContact(salesContact: SalesContact) {
  return `
    <div style="background:#f7f9f8;border:1px solid #dce5e2;border-radius:6px;color:#52605d;font-size:13px;line-height:1.6;margin-top:20px;padding:12px">
      <div style="color:#34413e;font-weight:700;margin-bottom:4px">Your sales contact</div>
      <div>${escapeHtml(salesContact.name)}</div>
      <div><a href="mailto:${escapeHtml(salesContact.email)}" style="color:#087f6b;text-decoration:none">${escapeHtml(salesContact.email)}</a></div>
    </div>
  `;
}

function renderEmail(input: {
  body: string;
  buttonLabel: string;
  company: CompanyInfo;
  heading: string;
  salesContact?: SalesContact;
  url: string;
}) {
  const safeBody = escapeHtml(input.body).replaceAll("\n", "<br />");
  const salesBlock = input.salesContact
    ? renderSalesContact(input.salesContact)
    : "";

  return `
    <div style="background:#f3f6f5;padding:32px 16px;font-family:Arial,sans-serif;color:#17201f">
      <div style="max-width:620px;margin:0 auto;background:#ffffff;border:1px solid #dce5e2;border-top:4px solid #087f6b;border-radius:8px;padding:28px">
        <div style="margin-bottom:26px">
          <span style="display:inline-block;background:#087f6b;border-radius:6px;color:#ffffff;font-size:14px;font-weight:700;line-height:32px;text-align:center;width:32px">${escapeHtml(input.company.name.charAt(0).toUpperCase() || "T")}</span>
          <strong style="display:inline-block;color:#17201f;font-size:15px;margin-left:9px;vertical-align:middle">${escapeHtml(input.company.name)}</strong>
        </div>
        <h1 style="font-size:22px;line-height:1.35;margin:0 0 12px">${escapeHtml(input.heading)}</h1>
        <div style="font-size:14px;line-height:1.7;color:#52605d;margin-bottom:22px">${safeBody}</div>
        <a href="${escapeHtml(input.url)}" style="display:inline-block;background:#087f6b;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;border-radius:6px;padding:11px 18px">${escapeHtml(input.buttonLabel)}</a>
        ${salesBlock}
        <div style="background:#f7f9f8;border-radius:6px;color:#7a8582;font-size:12px;line-height:1.6;margin-top:22px;padding:10px 12px">This secure link provides access to the inquiry for 90 days. Please do not forward it.</div>
        ${renderCompanyFooter(input.company)}
      </div>
    </div>
  `;
}

export async function sendInquiryConfirmationEmail(input: InquiryEmailInput) {
  const [access, settings] = await Promise.all([
    createInquiryAccessLink(input.inquiryId),
    getSiteSettings()
  ]);
  const company = getCompanyInfo(settings);
  const variables = {
    companyName: company.name,
    contactName: input.contactName,
    conversationUrl: access.url,
    inquirySubject: input.subject,
    message: input.message
  };
  const emailSubject = renderTemplate(
    settings?.inquiryReceivedSubject || DEFAULT_INQUIRY_RECEIVED_SUBJECT,
    variables
  );
  const emailBody = renderTemplate(
    settings?.inquiryReceivedBody || DEFAULT_INQUIRY_RECEIVED_BODY,
    variables
  );

  return sendTransactionalEmail({
    to: input.to,
    subject: emailSubject,
    previewUrl: access.url,
    text: `${emailBody}\n\nView inquiry: ${access.url}\n\n${renderCompanyText(company)}`,
    html: renderEmail({
      body: emailBody,
      buttonLabel: "View inquiry",
      company,
      heading: emailSubject,
      url: access.url
    })
  });
}

export async function sendInquiryReplyEmail(input: InquiryEmailInput & {
  salesContact: SalesContact;
}) {
  const [access, settings] = await Promise.all([
    createInquiryAccessLink(input.inquiryId),
    getSiteSettings()
  ]);
  const company = getCompanyInfo(settings);
  const variables = {
    companyName: company.name,
    contactName: input.contactName,
    conversationUrl: access.url,
    inquirySubject: input.subject,
    message: input.message,
    salesEmail: input.salesContact.email,
    salesName: input.salesContact.name
  };
  const emailSubject = renderTemplate(
    settings?.inquiryReplySubject || DEFAULT_INQUIRY_REPLY_SUBJECT,
    variables
  );
  const emailBody = renderTemplate(
    settings?.inquiryReplyBody || DEFAULT_INQUIRY_REPLY_BODY,
    variables
  );
  const salesText = `Sales contact:\n${input.salesContact.name}\n${input.salesContact.email}`;

  return sendTransactionalEmail({
    to: input.to,
    subject: emailSubject,
    previewUrl: access.url,
    text: `${emailBody}\n\n${salesText}\n\nView and reply: ${access.url}\n\n${renderCompanyText(company)}`,
    html: renderEmail({
      body: emailBody,
      buttonLabel: "View and reply",
      company,
      heading: emailSubject,
      salesContact: input.salesContact,
      url: access.url
    })
  });
}
