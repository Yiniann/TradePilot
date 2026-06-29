import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createProduct } from "../actions";
import { ProductForm } from "@/components/product-form";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageProducts } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function NewProductPage() {
  const user = await requireCurrentUser();

  if (!canManageProducts(user.role)) {
    redirect("/admin");
  }

  const categories = await prisma.productCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">New Product</p>
          <h2>上传产品</h2>
        </div>
        <Link className="secondary-link" href="/admin/products">
          <ArrowLeft size={16} />
          返回列表
        </Link>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Product Info</p>
            <h2>基础信息</h2>
          </div>
        </div>
        <ProductForm action={createProduct} categories={categories} submitLabel="保存产品" />
      </section>
    </main>
  );
}
