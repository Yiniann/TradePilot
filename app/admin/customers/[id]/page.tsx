import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Globe,
  Mail,
  MessageSquare,
  Phone
} from "lucide-react";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewOwnDataOnly } from "@/lib/permissions";

const customerStageLabels = {
  NEW: "新客户",
  CONTACTED: "已联系",
  QUOTED: "已报价",
  WON: "已成交",
  LOST: "已流失"
} as const;

const customerSourceLabels = {
  WEBSITE: "官网询盘",
  MANUAL: "手动录入",
  EMAIL: "邮件",
  REFERRAL: "转介绍",
  OTHER: "其他"
} as const;

const inquiryStatusLabels = {
  NEW: "新询盘",
  ASSIGNED: "已分配",
  REPLIED: "已回复",
  CLOSED: "已关闭"
} as const;

const messageDirectionLabels = {
  INBOUND: "客户消息",
  OUTBOUND: "业务回复",
  INTERNAL_NOTE: "内部备注"
} as const;

type CustomerDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const customer = await prisma.customer.findFirst({
    where: {
      deletedAt: null,
      id,
      ...(canViewOwnDataOnly(user.role) ? { ownerId: user.id } : {})
    },
    include: {
      contacts: {
        where: {
          deletedAt: null
        },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }]
      },
      inquiries: {
        include: {
          contact: true,
          messages: {
            include: {
              author: true
            },
            orderBy: {
              createdAt: "desc"
            },
            take: 3
          },
          owner: true,
          product: true
        },
        orderBy: {
          receivedAt: "desc"
        }
      },
      owner: true
    }
  });

  if (!customer) {
    notFound();
  }

  const recentMessages = customer.inquiries
    .flatMap((inquiry) =>
      inquiry.messages.map((message) => ({
        ...message,
        inquiryId: inquiry.id,
        inquirySubject: inquiry.subject
      }))
    )
    .sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime())
    .slice(0, 8);
  const primaryContact = customer.contacts.find((contact) => contact.isPrimary);

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Customer Card</p>
          <h2>{customer.name}</h2>
        </div>
        <div className="tool-actions">
          <Link className="secondary-link" href="/admin/customers">
            <ArrowLeft size={16} />
            返回客户列表
          </Link>
        </div>
      </section>

      <section className="customer-profile-hero panel">
        <div>
          <div className="customer-avatar">
            <Building2 size={24} />
          </div>
          <div>
            <p className="eyebrow">客户概览</p>
            <h2>{customer.name}</h2>
            <div className="detail-meta">
              <span>{customer.country || "未填写国家/地区"}</span>
              <span>{customerSourceLabels[customer.source]}</span>
              <span>{customer.owner?.name ? `负责人 ${customer.owner.name}` : "未分配负责人"}</span>
            </div>
          </div>
        </div>
        <div className="customer-profile-stats">
          <div>
            <span>阶段</span>
            <strong className={`status-badge stage-${customer.stage.toLowerCase()}`}>
              {customerStageLabels[customer.stage]}
            </strong>
          </div>
          <div>
            <span>联系人</span>
            <strong>{customer.contacts.length}</strong>
          </div>
          <div>
            <span>询盘</span>
            <strong>{customer.inquiries.length}</strong>
          </div>
        </div>
      </section>

      <section className="customer-detail-layout">
        <div className="customer-detail-main">
          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Inquiries</p>
                <h2>询盘历史</h2>
              </div>
              <span>{customer.inquiries.length} 条</span>
            </div>

            {customer.inquiries.length > 0 ? (
              <div className="customer-inquiry-list">
                {customer.inquiries.map((inquiry) => (
                  <Link
                    className="customer-inquiry-item"
                    href={`/admin/inquiries/${inquiry.id}`}
                    key={inquiry.id}
                  >
                    <div>
                      <div className="inquiry-db-heading">
                        <strong>{inquiry.subject}</strong>
                        <span className={`status-badge inquiry-${inquiry.status.toLowerCase()}`}>
                          {inquiryStatusLabels[inquiry.status]}
                        </span>
                      </div>
                      <p>{inquiry.message}</p>
                      <div className="detail-meta">
                        <span>{inquiry.product?.name || "未关联产品"}</span>
                        <span>{inquiry.contact?.name || "未关联联系人"}</span>
                        <span>{inquiry.owner?.name ? `负责人 ${inquiry.owner.name}` : "未分配"}</span>
                      </div>
                    </div>
                    <small>{formatDateTime(inquiry.receivedAt)}</small>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="catalog-empty compact-empty">
                <h2>暂无询盘</h2>
                <p>这个客户还没有关联询盘。</p>
              </div>
            )}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Timeline</p>
                <h2>最近沟通</h2>
              </div>
              <span>{recentMessages.length} 条</span>
            </div>

            {recentMessages.length > 0 ? (
              <div className="customer-message-list">
                {recentMessages.map((message) => (
                  <Link
                    className={`customer-message-item ${message.direction.toLowerCase()}`}
                    href={`/admin/inquiries/${message.inquiryId}`}
                    key={message.id}
                  >
                    <div>
                      <strong>{messageDirectionLabels[message.direction]}</strong>
                      <span>{message.inquirySubject}</span>
                    </div>
                    <p>{message.body}</p>
                    <small>
                      {message.author?.name ||
                        (message.direction === "INBOUND" ? "客户" : "系统")}
                      {" · "}
                      {formatDateTime(message.createdAt)}
                    </small>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="catalog-empty compact-empty">
                <h2>暂无沟通记录</h2>
                <p>询盘消息和内部备注会汇总在这里。</p>
              </div>
            )}
          </section>
        </div>

        <aside className="customer-detail-sidebar">
          <section className="panel customer-sidebar-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Profile</p>
                <h2>客户资料</h2>
              </div>
            </div>
            <div className="customer-info-grid">
              <div>
                <span>公司名称</span>
                <strong>{customer.name}</strong>
              </div>
              <div>
                <span>国家/地区</span>
                <strong>{customer.country || "未填写"}</strong>
              </div>
              <div>
                <span>网站</span>
                {customer.website ? (
                  <a href={customer.website} rel="noreferrer" target="_blank">
                    <Globe size={14} />
                    {customer.website}
                  </a>
                ) : (
                  <strong>未填写</strong>
                )}
              </div>
              <div>
                <span>来源</span>
                <strong>{customerSourceLabels[customer.source]}</strong>
              </div>
              <div>
                <span>负责人</span>
                <strong>{customer.owner?.name || "未分配"}</strong>
              </div>
              <div>
                <span>创建时间</span>
                <strong>{formatDate(customer.createdAt)}</strong>
              </div>
            </div>
          </section>

          <section className="panel customer-sidebar-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Contacts</p>
                <h2>联系人</h2>
              </div>
              {primaryContact ? <span>主联系人：{primaryContact.name}</span> : null}
            </div>

            {customer.contacts.length > 0 ? (
              <div className="customer-contact-list">
                {customer.contacts.map((contact) => (
                  <article className="customer-contact-card" key={contact.id}>
                    <div>
                      <strong>{contact.name}</strong>
                      {contact.isPrimary ? <span>主联系人</span> : null}
                    </div>
                    {contact.email ? (
                      <span className="contact-line">
                        <Mail size={14} />
                        {contact.email}
                      </span>
                    ) : null}
                    {contact.phone ? (
                      <span className="contact-line">
                        <Phone size={14} />
                        {contact.phone}
                      </span>
                    ) : null}
                    {contact.note ? <p>{contact.note}</p> : null}
                  </article>
                ))}
              </div>
            ) : (
              <div className="catalog-empty compact-empty">
                <h2>暂无联系人</h2>
                <p>后续可以从客户编辑页补充联系人。</p>
              </div>
            )}
          </section>

          <section className="panel customer-sidebar-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Notes</p>
                <h2>客户备注</h2>
              </div>
              <MessageSquare size={16} />
            </div>
            <p className="customer-note-text">
              {customer.note || "暂无客户备注。后续可以在编辑客户时记录付款偏好、重点需求、合作风险等信息。"}
            </p>
          </section>
        </aside>
      </section>
    </main>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium"
  }).format(date);
}

function formatDateTime(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
