import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { updateProductStatus } from "./actions";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageProducts } from "@/lib/permissions";

const productStatusLabels = {
  DRAFT: "草稿",
  PUBLISHED: "上架",
  ARCHIVED: "归档"
} as const;

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const user = await requireCurrentUser();

  if (!canManageProducts(user.role)) {
    redirect("/admin");
  }

  const products = await prisma.product.findMany({
    include: {
      category: true
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Products</p>
          <h2>产品管理</h2>
        </div>
        <div className="tool-actions">
          <span className="muted-text">共 {products.length} 个产品</span>
          <Link className="primary-link" href="/admin/products/new">
            <Plus size={16} />
            新增产品
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2>产品列表</h2>
          </div>
        </div>
        {products.length > 0 ? (
          <div className="product-admin-list">
            {products.map((product) => (
              <article className="product-admin-item" key={product.id}>
                <div className="product-thumb">
                  {product.coverImage ? (
                    <Image
                      alt={product.name}
                      fill
                      sizes="96px"
                      src={product.coverImage}
                    />
                  ) : (
                    <span>无图</span>
                  )}
                </div>
                <div>
                  <strong>{product.name}</strong>
                  <span>{product.sku || "未填写 SKU"}</span>
                  <small>/products/{product.slug}</small>
                </div>
                <span className="category-pill">
                  {product.category?.name || "未分类"}
                </span>
                <span className={`status-badge product-${product.status.toLowerCase()}`}>
                  {productStatusLabels[product.status]}
                </span>
                <Link className="quiet-button" href={`/admin/products/${product.id}/edit`}>
                  <Pencil size={16} />
                  编辑
                </Link>
                <form action={updateProductStatus} className="inline-form">
                  <input name="productId" type="hidden" value={product.id} />
                  <select name="status" defaultValue={product.status}>
                    <option value="DRAFT">草稿</option>
                    <option value="PUBLISHED">上架</option>
                    <option value="ARCHIVED">归档</option>
                  </select>
                  <button className="quiet-button" type="submit">
                    保存
                  </button>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <div className="catalog-empty compact-empty">
            <h2>暂无产品</h2>
            <p>先新增一个产品，之后列表里只处理状态和管理信息。</p>
          </div>
        )}
      </section>
    </main>
  );
}
