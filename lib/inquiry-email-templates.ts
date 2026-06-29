export const DEFAULT_INQUIRY_RECEIVED_SUBJECT =
  "We received your inquiry: {{inquirySubject}}";

export const DEFAULT_INQUIRY_RECEIVED_BODY = `Hi {{contactName}},

We have received your inquiry and will reply as soon as possible.

{{message}}

Use the button below to view the conversation and continue replying.`;

export const DEFAULT_INQUIRY_REPLY_SUBJECT =
  "New reply: {{inquirySubject}}";

export const DEFAULT_INQUIRY_REPLY_BODY = `Hi {{contactName}},

{{salesName}} has replied to your inquiry.

{{message}}

Use the button below to view the complete conversation and continue replying.`;

export const INQUIRY_EMAIL_TEMPLATE_VARIABLES = [
  "{{contactName}}",
  "{{companyName}}",
  "{{inquirySubject}}",
  "{{message}}",
  "{{conversationUrl}}"
] as const;

export const INQUIRY_REPLY_EMAIL_TEMPLATE_VARIABLES = [
  ...INQUIRY_EMAIL_TEMPLATE_VARIABLES,
  "{{salesName}}",
  "{{salesEmail}}"
] as const;
