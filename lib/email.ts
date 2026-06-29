import "server-only";

import nodemailer from "nodemailer";
import { getSiteSettings } from "@/lib/site-settings";

type TransactionalEmail = {
  html: string;
  previewUrl?: string;
  subject: string;
  text: string;
  to: string;
};

export async function sendTransactionalEmail(email: TransactionalEmail) {
  const settings = await getSiteSettings();
  const from = settings?.emailFrom;

  if (
    !settings?.smtpHost ||
    !settings.smtpPort ||
    !settings.smtpUser ||
    !settings.smtpPassword ||
    !from
  ) {
    if (process.env.NODE_ENV !== "production") {
      console.info(
        `[email disabled] ${email.subject} -> ${email.to}${
          email.previewUrl ? ` | ${email.previewUrl}` : ""
        }`
      );
    } else {
      console.error("Email delivery is disabled: SMTP settings are incomplete.");
    }

    return { delivered: false as const };
  }

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure: settings.smtpSecure,
    requireTLS: !settings.smtpSecure,
    auth: {
      user: settings.smtpUser,
      pass: settings.smtpPassword
    },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000
  });

  try {
    const result = await transporter.sendMail({
      from,
      to: email.to,
      replyTo: settings.emailReplyTo || undefined,
      subject: email.subject,
      html: email.html,
      text: email.text
    });

    return { delivered: true as const, providerId: result.messageId };
  } catch (error) {
    console.error("Email delivery failed:", error);
    return { delivered: false as const };
  }
}
