import Link from "next/link";
import { Mail, MessageSquare, Phone, UserRound } from "lucide-react";
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

type CustomerTableProps = {
  limit?: number;
};

export async function CustomerTable({ limit }: CustomerTableProps) {
  const user = await requireCurrentUser();
  const customerWhere = {
    deletedAt: null,
    ...(canViewOwnDataOnly(user.role) ? { ownerId: user.id } : {})
  };
  const customers = await prisma.customer.findMany({
    where: customerWhere,
    include: {
      contacts: {
        where: {
          deletedAt: null
        },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        take: 1
      },
      owner: true,
      inquiries: {
        orderBy: {
          receivedAt: "desc"
        },
        take: 1
      },
      _count: {
        select: {
          contacts: true,
          inquiries: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: limit
  });

  if (customers.length === 0) {
    return (
      <div className="catalog-empty compact-empty">
        <h2>暂无客户</h2>
        <p>新建客户或收到询盘后，客户资料会显示在这里。</p>
      </div>
    );
  }

  return (
    <div className="customer-list">
      <div className="customer-list-header">
        <span>客户</span>
        <span>阶段/来源</span>
        <span>最近询盘</span>
        <span>负责人</span>
        <span>创建时间</span>
      </div>
      {customers.map((customer) => {
        const contact = customer.contacts[0];
        const latestInquiry = customer.inquiries[0];

        return (
          <Link
            className="customer-list-row"
            href={`/admin/customers/${customer.id}`}
            key={customer.id}
          >
            <div className="entity-cell">
              <strong>{customer.name}</strong>
              <span>{customer.country || "未填写国家/地区"}</span>
              <div className="customer-contact-lines">
                {contact?.name ? (
                  <span className="contact-line">
                    <UserRound size={14} />
                    {contact.name}
                  </span>
                ) : null}
                {contact?.email ? (
                  <span className="contact-line">
                    <Mail size={14} />
                    {contact.email}
                  </span>
                ) : null}
                {contact?.phone ? (
                  <span className="contact-line">
                    <Phone size={14} />
                    {contact.phone}
                  </span>
                ) : null}
              </div>
            </div>
            <div className="muted-stack">
              <span className={`status-badge stage-${customer.stage.toLowerCase()}`}>
                {customerStageLabels[customer.stage]}
              </span>
              <small>{customerSourceLabels[customer.source]}</small>
            </div>
            <div className="muted-stack">
              <span className="contact-line">
                <MessageSquare size={14} />
                {customer._count.inquiries} 条询盘
              </span>
              <small>
                {latestInquiry
                  ? `${formatDate(latestInquiry.receivedAt)} / ${latestInquiry.subject}`
                  : "暂无询盘"}
              </small>
            </div>
            <div className="muted-stack">
              <span>{customer.owner?.name || "未分配"}</span>
              <small>{customer._count.contacts} 个联系人</small>
            </div>
            <span className="muted-text">{formatDate(customer.createdAt)}</span>
          </Link>
        );
      })}
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium"
  }).format(date);
}
