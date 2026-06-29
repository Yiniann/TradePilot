import type { InquiryStatus } from "@prisma/client";
import type { Route } from "next";
import Link from "next/link";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canViewOwnDataOnly } from "@/lib/permissions";

const inquiryStatusLabels = {
  NEW: "新询盘",
  ASSIGNED: "已分配",
  REPLIED: "已回复",
  CLOSED: "已关闭"
} as const;

const inquiryStatusFilters: Array<{
  label: string;
  value: InquiryStatus | "ALL";
}> = [
  { label: "新询盘", value: "NEW" },
  { label: "已分配", value: "ASSIGNED" },
  { label: "已回复", value: "REPLIED" },
  { label: "已关闭", value: "CLOSED" },
  { label: "全部", value: "ALL" }
];

type InquiriesPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function InquiriesPage({ searchParams }: InquiriesPageProps) {
  const user = await requireCurrentUser();
  const query = await searchParams;
  const activeStatus = inquiryStatusFilters.some((filter) => filter.value === query.status)
    ? query.status
    : "NEW";
  const ownerWhere = canViewOwnDataOnly(user.role) ? { ownerId: user.id } : {};
  const inquiryWhere =
    activeStatus === "ALL"
      ? ownerWhere
      : { ...ownerWhere, status: activeStatus as InquiryStatus };

  const [inquiries, totalCount, newCount, assignedCount, repliedCount, closedCount] =
    await Promise.all([
      prisma.inquiry.findMany({
        where: inquiryWhere,
        orderBy: {
          receivedAt: "desc"
        },
        include: {
          customer: true,
          contact: true,
          product: true,
          owner: true,
          _count: {
            select: {
              messages: true
            }
          }
        }
      }),
      prisma.inquiry.count({ where: ownerWhere }),
      prisma.inquiry.count({ where: { ...ownerWhere, status: "NEW" } }),
      prisma.inquiry.count({ where: { ...ownerWhere, status: "ASSIGNED" } }),
      prisma.inquiry.count({ where: { ...ownerWhere, status: "REPLIED" } }),
      prisma.inquiry.count({ where: { ...ownerWhere, status: "CLOSED" } })
    ]);

  const statusCounts = {
    ALL: totalCount,
    NEW: newCount,
    ASSIGNED: assignedCount,
    REPLIED: repliedCount,
    CLOSED: closedCount
  };

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Inquiries</p>
          <h2>询盘工作台</h2>
        </div>
        <div className="tool-actions">
          <span className="muted-text">共 {totalCount} 条询盘</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Inbox</p>
            <h2>询盘列表</h2>
          </div>
          <span>{inquiries.length} 条</span>
        </div>
        <div className="status-tabs">
          {inquiryStatusFilters.map((filter) => {
            const href = `/admin/inquiries?status=${filter.value}` as Route;
            const isActive = activeStatus === filter.value;

            return (
              <Link
                aria-current={isActive ? "page" : undefined}
                className={`status-tab${isActive ? " active" : ""}`}
                href={href}
                key={filter.value}
              >
                <span>{filter.label}</span>
                <strong>{statusCounts[filter.value]}</strong>
              </Link>
            );
          })}
        </div>

        {inquiries.length > 0 ? (
          <div className="inquiry-db-list">
            {inquiries.map((inquiry) => (
              <Link
                className="inquiry-db-item"
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
                    <span>{inquiry.customer?.name || "未关联客户"}</span>
                    <span>{inquiry.contact?.name || "未关联联系人"}</span>
                    <span>{inquiry.contact?.email || "未填写邮箱"}</span>
                    <span>{inquiry.product?.name || "未关联产品"}</span>
                    <span>{inquiry.owner?.name ? `负责人 ${inquiry.owner.name}` : "未分配"}</span>
                    <span>{inquiry._count.messages} 条记录</span>
                  </div>
                </div>
                <small>{formatDate(inquiry.receivedAt)}</small>
              </Link>
            ))}
          </div>
        ) : (
          <div className="catalog-empty compact-empty">
            <h2>{totalCount > 0 ? "当前筛选暂无询盘" : "暂无询盘"}</h2>
            <p>
              {totalCount > 0
                ? "切换顶部状态标签查看其他询盘。"
                : "客户从产品详情提交询盘后，会出现在这里。"}
            </p>
          </div>
        )}
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
