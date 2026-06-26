import { Mail, Phone } from "lucide-react";
import { prisma } from "@/lib/db";

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
  const customers = await prisma.customer.findMany({
    where: {
      deletedAt: null
    },
    include: {
      contacts: {
        where: {
          deletedAt: null
        },
        orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
        take: 1
      },
      owner: true,
      _count: {
        select: {
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
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>客户</th>
            <th>国家/来源</th>
            <th>阶段</th>
            <th>负责人</th>
            <th>询盘</th>
            <th>创建时间</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => {
            const contact = customer.contacts[0];

            return (
              <tr key={customer.id}>
                <td>
                  <div className="entity-cell">
                    <strong>{customer.name}</strong>
                    <span>{contact?.name || "未填写联系人"}</span>
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
                </td>
                <td>
                  <div className="muted-stack">
                    <span>{customer.country || "未填写"}</span>
                    <small>{customerSourceLabels[customer.source]}</small>
                  </div>
                </td>
                <td>
                  <span className={`status-badge stage-${customer.stage.toLowerCase()}`}>
                    {customerStageLabels[customer.stage]}
                  </span>
                </td>
                <td>{customer.owner?.name || "未分配"}</td>
                <td>{customer._count.inquiries}</td>
                <td>{formatDate(customer.createdAt)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium"
  }).format(date);
}
