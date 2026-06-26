import { prisma } from "@/lib/db";

const inquiryStatusLabels = {
  NEW: "新询盘",
  ASSIGNED: "已分配",
  REPLIED: "已回复",
  CLOSED: "已关闭"
} as const;

export const dynamic = "force-dynamic";

export default async function InquiriesPage() {
  const inquiries = await prisma.inquiry.findMany({
    orderBy: {
      receivedAt: "desc"
    },
    include: {
      customer: true,
      contact: true,
      product: true,
      owner: true
    }
  });

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Inquiries</p>
          <h2>询盘回复</h2>
        </div>
        <div className="segmented-control" aria-label="询盘视图">
          <button className="is-selected" type="button">待处理</button>
          <button type="button">已分配</button>
          <button type="button">已关闭</button>
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

        {inquiries.length > 0 ? (
          <div className="inquiry-db-list">
            {inquiries.map((inquiry) => (
              <article key={inquiry.id} className="inquiry-db-item">
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
                  </div>
                </div>
                <small>{formatDate(inquiry.receivedAt)}</small>
              </article>
            ))}
          </div>
        ) : (
          <div className="catalog-empty compact-empty">
            <h2>暂无询盘</h2>
            <p>客户从产品详情提交询盘后，会出现在这里。</p>
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
