import Link from "next/link";
import type { CustomerStage } from "@prisma/client";
import { Plus, Search } from "lucide-react";
import { CustomerTable } from "@/components/customer-table";
import { requireCurrentUser } from "@/lib/auth";
import { canCreateCustomer } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const stages: CustomerStage[] = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

const stageLabels: Record<CustomerStage, string> = {
  NEW: "新客户",
  CONTACTED: "已联系",
  QUOTED: "已报价",
  WON: "已成交",
  LOST: "已流失"
};

type CustomersPageProps = {
  searchParams: Promise<{
    q?: string;
    stage?: string;
  }>;
};

export default async function CustomersPage({ searchParams }: CustomersPageProps) {
  const [query, user] = await Promise.all([searchParams, requireCurrentUser()]);
  const keyword = query.q?.trim() || "";
  const stage = stages.includes(query.stage as CustomerStage)
    ? (query.stage as CustomerStage)
    : undefined;

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Customers</p>
          <h2>客户管理</h2>
        </div>
        <div className="tool-actions">
          <form className="customer-filter-form">
            <label className="search-field">
              <Search size={16} />
              <input defaultValue={keyword} name="q" placeholder="搜索公司、联系人、邮箱" />
            </label>
            <select defaultValue={stage || ""} name="stage" aria-label="客户阶段">
              <option value="">全部阶段</option>
              {stages.map((value) => (
                <option key={value} value={value}>{stageLabels[value]}</option>
              ))}
            </select>
            <button className="secondary-link" type="submit">筛选</button>
            {keyword || stage ? <Link className="quiet-button" href="/admin/customers">清除</Link> : null}
          </form>
          {canCreateCustomer(user.role) ? (
            <Link className="primary-link" href="/admin/customers/new">
              <Plus size={16} />
              新建客户
            </Link>
          ) : null}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Customer List</p>
            <h2>全部客户</h2>
          </div>
          <span>可按阶段、来源、负责人筛选</span>
        </div>
        <CustomerTable query={keyword} stage={stage} />
      </section>
    </main>
  );
}
