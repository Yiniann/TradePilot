import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Send, ShieldCheck } from "lucide-react";
import { addCustomerInquiryMessage } from "../actions";
import { getInquiryAccessFromCookie } from "@/lib/inquiry-access";
import { prisma } from "@/lib/db";

const inquiryStatusLabels = {
  NEW: "已提交",
  ASSIGNED: "处理中",
  REPLIED: "已回复",
  CLOSED: "已结束"
} as const;

type PublicInquiryPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inquiry conversation | TradePilot",
  robots: {
    index: false,
    follow: false
  }
};

export default async function PublicInquiryPage({ params }: PublicInquiryPageProps) {
  const { id } = await params;
  const access = await getInquiryAccessFromCookie(id);

  if (!access) {
    redirect("/inquiries/link-expired");
  }

  const inquiry = await prisma.inquiry.findUnique({
    where: {
      id
    },
    include: {
      contact: true,
      customer: true,
      product: true,
      messages: {
        where: {
          direction: {
            in: ["INBOUND", "OUTBOUND"]
          }
        },
        include: {
          author: true
        },
        orderBy: {
          createdAt: "asc"
        }
      }
    }
  });

  if (!inquiry) {
    notFound();
  }

  const hasInboundMessage = inquiry.messages.some(
    (message) => message.direction === "INBOUND"
  );
  const messages = hasInboundMessage
    ? inquiry.messages
    : [
        {
          id: "original",
          direction: "INBOUND" as const,
          body: inquiry.message,
          author: null,
          createdAt: inquiry.receivedAt
        },
        ...inquiry.messages
      ];

  return (
    <main className="public-inquiry-page">
      <header className="public-inquiry-header">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span>
          <span>TradePilot</span>
        </Link>
        <span>
          <ShieldCheck size={16} />
          安全询盘会话
        </span>
      </header>

      <section className="public-inquiry-shell">
        <div className="public-inquiry-title">
          <div>
            <p className="eyebrow">Inquiry</p>
            <h1>{inquiry.subject}</h1>
            <p>{inquiry.customer?.name || inquiry.contact?.name || "Website customer"}</p>
          </div>
          <div>
            <span className={`status-badge inquiry-${inquiry.status.toLowerCase()}`}>
              {inquiryStatusLabels[inquiry.status]}
            </span>
            {inquiry.product?.status === "PUBLISHED" ? (
              <Link href={`/products/${inquiry.product.slug}`}>{inquiry.product.name}</Link>
            ) : null}
          </div>
        </div>

        <div className="public-inquiry-chat" aria-live="polite">
          {messages.map((message) => (
            <article
              className={`public-inquiry-message ${message.direction.toLowerCase()}`}
              key={message.id}
            >
              <div>
                <span>
                  {message.direction === "INBOUND"
                    ? inquiry.contact?.name || "客户"
                    : message.author?.name || "业务团队"}
                  {" · "}
                  {formatDate(message.createdAt)}
                </span>
                <p>{message.body}</p>
              </div>
            </article>
          ))}
        </div>

        <form action={addCustomerInquiryMessage} className="public-inquiry-composer">
          <input name="inquiryId" type="hidden" value={inquiry.id} />
          <label htmlFor="customer-reply">继续回复</label>
          <textarea
            id="customer-reply"
            maxLength={5000}
            name="body"
            placeholder="输入你的回复内容..."
            required
          />
          <div>
            <span>你的回复将发送给负责本次询盘的业务人员。</span>
            <button className="primary-button" type="submit">
              <Send size={16} />
              发送回复
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
