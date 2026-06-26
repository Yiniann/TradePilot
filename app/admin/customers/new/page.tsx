import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createCustomer } from "../actions";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canCreateCustomer, roleLabels } from "@/lib/permissions";

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

export const dynamic = "force-dynamic";

export default async function NewCustomerPage() {
  const user = await requireCurrentUser();

  if (!canCreateCustomer(user.role)) {
    redirect("/admin/customers");
  }

  const owners = await prisma.user.findMany({
    where: {
      status: "ACTIVE",
      role: {
        not: "VIEWER"
      }
    },
    orderBy: [{ role: "asc" }, { createdAt: "asc" }]
  });

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">New Customer</p>
          <h2>新建客户</h2>
        </div>
        <Link className="secondary-link" href="/admin/customers">
          <ArrowLeft size={16} />
          返回列表
        </Link>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Customer Info</p>
            <h2>客户资料</h2>
          </div>
        </div>
        <form action={createCustomer} className="customer-form">
          <label>
            <span>公司名称</span>
            <input name="name" required />
          </label>
          <label>
            <span>客户阶段</span>
            <select name="stage" defaultValue="NEW">
              {Object.entries(customerStageLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>来源</span>
            <select name="source" defaultValue="MANUAL">
              {Object.entries(customerSourceLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>负责人</span>
            <select name="ownerId" defaultValue={user.id}>
              {owners.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name} / {roleLabels[owner.role]}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>国家/地区</span>
            <input name="country" />
          </label>
          <label>
            <span>网站</span>
            <input name="website" placeholder="https://example.com" />
          </label>
          <label>
            <span>主联系人</span>
            <input name="contactName" />
          </label>
          <label>
            <span>邮箱</span>
            <input name="email" type="email" />
          </label>
          <label>
            <span>电话</span>
            <input name="phone" />
          </label>
          <label className="customer-form-wide">
            <span>联系人备注</span>
            <input name="contactNote" />
          </label>
          <label className="customer-form-full">
            <span>客户备注</span>
            <textarea name="note" rows={5} />
          </label>
          <button className="primary-button" type="submit">
            保存客户
          </button>
        </form>
      </section>
    </main>
  );
}
