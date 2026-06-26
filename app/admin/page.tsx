import Link from "next/link";
import {
  BarChart3,
  Inbox,
  Package,
  PackageCheck,
  PackagePlus,
  UsersRound,
  Waypoints
} from "lucide-react";
import { CustomerTable } from "@/components/customer-table";
import { MetricCard } from "@/components/metric-card";
import { prisma } from "@/lib/db";

const productStatusLabels = {
  DRAFT: "草稿",
  PUBLISHED: "上架",
  ARCHIVED: "归档"
} as const;

const inquiryStatusLabels = {
  NEW: "新询盘",
  ASSIGNED: "已分配",
  REPLIED: "已回复",
  CLOSED: "已关闭"
} as const;

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const todayStart = getStartOfToday();
  const sevenDaysStart = getStartOfSevenDays();
  const [
    todayPageViews,
    todayUniqueVisitors,
    sevenDayPageViews,
    sevenDayUniqueVisitors,
    totalProducts,
    publishedProducts,
    draftProducts,
    newInquiries,
    totalCustomers,
    productsNeedWork,
    recentProducts,
    recentInquiries
  ] = await Promise.all([
    prisma.siteVisit.count({
      where: {
        createdAt: {
          gte: todayStart
        }
      }
    }),
    prisma.siteVisit.groupBy({
      by: ["visitorId"],
      where: {
        createdAt: {
          gte: todayStart
        }
      }
    }),
    prisma.siteVisit.count({
      where: {
        createdAt: {
          gte: sevenDaysStart
        }
      }
    }),
    prisma.siteVisit.groupBy({
      by: ["visitorId"],
      where: {
        createdAt: {
          gte: sevenDaysStart
        }
      }
    }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.customer.count({ where: { deletedAt: null } }),
    prisma.product.findMany({
      where: {
        OR: [
          { coverImage: null },
          { variants: { none: {} } },
          { detailHtml: null }
        ]
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        variants: true
      }
    }),
    prisma.product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: {
        category: true,
        variants: true
      }
    }),
    prisma.inquiry.findMany({
      orderBy: { receivedAt: "desc" },
      take: 5,
      include: {
        customer: true,
        product: true
      }
    })
  ]);
  const conversionRate =
    sevenDayUniqueVisitors.length > 0
      ? `${((newInquiries / sevenDayUniqueVisitors.length) * 100).toFixed(1)}%`
      : "0%";

  return (
    <main className="admin-content">
      <section className="metrics-grid" aria-label="站点访问数据">
        <MetricCard
          icon={BarChart3}
          label="今日访问量"
          value={String(todayPageViews)}
          trend="PV"
        />
        <MetricCard
          icon={UsersRound}
          label="今日访客"
          value={String(todayUniqueVisitors.length)}
          trend="UV"
        />
        <MetricCard
          icon={Waypoints}
          label="7日访问量"
          value={String(sevenDayPageViews)}
          trend={`${sevenDayUniqueVisitors.length} UV`}
        />
        <MetricCard
          icon={PackageCheck}
          label="已上架产品"
          value={String(publishedProducts)}
          trend={`共 ${totalProducts} 个产品`}
        />
        <MetricCard
          icon={PackagePlus}
          label="草稿产品"
          value={String(draftProducts)}
          trend="待完善后上架"
        />
        <MetricCard
          icon={Inbox}
          label="询盘转化"
          value={conversionRate}
          trend={`${newInquiries} 个新询盘 / 7日UV`}
        />
      </section>

      <section className="dashboard-grid dashboard-grid-even">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Inquiry Queue</p>
              <h2>最新询盘</h2>
            </div>
            <Link className="quiet-button" href="/admin/inquiries">
              查看全部
            </Link>
          </div>
          {recentInquiries.length > 0 ? (
            <div className="queue-list">
              {recentInquiries.map((inquiry) => (
                <article key={inquiry.id}>
                  <div>
                    <strong>{inquiry.subject}</strong>
                    <span>
                      {inquiry.customer?.name || "未关联客户"} ·{" "}
                      {inquiry.product?.name || "未关联产品"} · {formatDate(inquiry.receivedAt)}
                    </span>
                  </div>
                  <span className={`status-badge inquiry-${inquiry.status.toLowerCase()}`}>
                    {inquiryStatusLabels[inquiry.status]}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <div className="catalog-empty compact-empty">
              <Inbox size={30} />
              <h2>暂无询盘</h2>
              <p>客户从产品详情提交询盘后，会出现在这里。</p>
            </div>
          )}
        </div>

        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Customers</p>
              <h2>近期客户</h2>
            </div>
            <Link className="quiet-button" href="/admin/customers">
              查看全部
            </Link>
          </div>
          {totalCustomers > 0 ? (
            <CustomerTable limit={5} />
          ) : (
            <div className="catalog-empty compact-empty">
              <UsersRound size={30} />
              <h2>暂无客户</h2>
              <p>收到询盘或手动新建客户后，会显示在这里。</p>
            </div>
          )}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Catalog Health</p>
              <h2>待完善产品</h2>
            </div>
            <Link className="quiet-button" href="/admin/products/new">
              新增产品
            </Link>
          </div>
          {productsNeedWork.length > 0 ? (
            <div className="queue-list">
              {productsNeedWork.map((product) => (
                <article key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <span>{getProductMissingText(product)}</span>
                  </div>
                  <Link className="quiet-button" href={`/admin/products/${product.id}/edit`}>
                    完善
                  </Link>
                </article>
              ))}
            </div>
          ) : (
            <div className="catalog-empty compact-empty">
              <PackageCheck size={30} />
              <h2>产品资料完整</h2>
              <p>当前产品都有主图、详情内容和 SKU。</p>
            </div>
          )}
        </div>

        <aside className="panel activity-panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Latest Products</p>
              <h2>最近更新</h2>
            </div>
          </div>
          {recentProducts.length > 0 ? (
            <div className="activity-list">
              {recentProducts.map((product) => (
                <article key={product.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{product.name}</strong>
                    <p>{product.category?.name || "未分类"}</p>
                    <span>{product.variants.length} 个 SKU</span>
                    <small>{formatDate(product.updatedAt)}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="catalog-empty compact-empty">
              <Package size={30} />
              <h2>暂无产品</h2>
              <p>新增产品后，这里会显示最近更新。</p>
            </div>
          )}
        </aside>
      </section>
    </main>
  );
}

function getProductMissingText(product: {
  coverImage: string | null;
  detailHtml: string | null;
  variants: unknown[];
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
}) {
  const missing = [
    product.coverImage ? "" : "主图",
    product.detailHtml ? "" : "详情",
    product.variants.length > 0 ? "" : "SKU"
  ].filter(Boolean);

  if (missing.length === 0) {
    return productStatusLabels[product.status];
  }

  return `缺少${missing.join("、")}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function getStartOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function getStartOfSevenDays() {
  const date = getStartOfToday();
  date.setDate(date.getDate() - 6);
  return date;
}
