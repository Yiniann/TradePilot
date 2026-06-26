import Link from "next/link";
import { Filter, Plus, Search } from "lucide-react";
import { CustomerTable } from "@/components/customer-table";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Customers</p>
          <h2>客户管理</h2>
        </div>
        <div className="tool-actions">
          <label className="search-field">
            <Search size={16} />
            <input placeholder="搜索公司、联系人、邮箱" />
          </label>
          <button className="icon-button" type="button" title="筛选">
            <Filter size={18} />
          </button>
          <Link className="primary-link" href="/admin/customers/new">
            <Plus size={16} />
            新建客户
          </Link>
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
        <CustomerTable />
      </section>
    </main>
  );
}
