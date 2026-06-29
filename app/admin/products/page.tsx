import Image from "next/image";
import type { Route } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MoreHorizontal, Pencil, Plus } from "lucide-react";
import type { ProductStatus } from "@prisma/client";
import { updateProductStatus } from "./actions";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageProducts } from "@/lib/permissions";

const productStatusLabels = {
  DRAFT: "草稿",
  PUBLISHED: "上架",
  ARCHIVED: "归档"
} as const;

const productStatusFilters: Array<{
  label: string;
  value: ProductStatus | "ALL";
}> = [
  { label: "全部", value: "ALL" },
  { label: "已上架", value: "PUBLISHED" },
  { label: "草稿", value: "DRAFT" },
  { label: "归档", value: "ARCHIVED" }
];

type AdminProductsPageProps = {
  searchParams: Promise<{
    status?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage({ searchParams }: AdminProductsPageProps) {
  const [query, user] = await Promise.all([searchParams, requireCurrentUser()]);

  if (!canManageProducts(user.role)) {
    redirect("/admin");
  }

  const activeStatus = productStatusFilters.some((filter) => filter.value === query.status)
    ? query.status
    : "PUBLISHED";
  const productWhere =
    activeStatus === "ALL" ? undefined : { status: activeStatus as ProductStatus };

  const [products, totalCount, publishedCount, draftCount, archivedCount] = await Promise.all([
    prisma.product.findMany({
      where: productWhere,
      include: {
        category: true
      },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    }),
    prisma.product.count(),
    prisma.product.count({ where: { status: "PUBLISHED" } }),
    prisma.product.count({ where: { status: "DRAFT" } }),
    prisma.product.count({ where: { status: "ARCHIVED" } })
  ]);

  const statusCounts = {
    ALL: totalCount,
    PUBLISHED: publishedCount,
    DRAFT: draftCount,
    ARCHIVED: archivedCount
  };

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Products</p>
          <h2>产品管理</h2>
        </div>
        <div className="tool-actions">
          <span className="muted-text">共 {totalCount} 个产品</span>
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
        <div className="status-tabs">
          {productStatusFilters.map((filter) => {
            const href = `/admin/products?status=${filter.value}` as Route;
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
        {products.length > 0 ? (
          <div className="product-admin-list">
            <div className="product-admin-header">
              <span aria-hidden="true" />
              <span>产品信息</span>
              <span>分类</span>
              <span>状态</span>
              <span>操作</span>
            </div>
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
                  {product.status === "PUBLISHED" ? (
                    <Link className="product-title-link" href={`/products/${product.slug}`}>
                      {product.name}
                    </Link>
                  ) : (
                    <strong>{product.name}</strong>
                  )}
                  <span>{product.sku || "未填写型号"}</span>
                  <small>/products/{product.slug}</small>
                </div>
                <span className="category-pill">
                  {product.category?.name || "未分类"}
                </span>
                <span className={`status-badge product-${product.status.toLowerCase()}`}>
                  {productStatusLabels[product.status]}
                </span>
                <details className="row-action-menu">
                  <summary aria-label={`${product.name} 操作`}>
                    <MoreHorizontal size={18} />
                  </summary>
                  <div className="row-action-dropdown">
                    <Link href={`/admin/products/${product.id}/edit`}>
                      <Pencil size={15} />
                      编辑
                    </Link>
                    <form action={updateProductStatus}>
                      <input name="productId" type="hidden" value={product.id} />
                      <input
                        name="status"
                        type="hidden"
                        value={product.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED"}
                      />
                      <button type="submit">
                        {product.status === "PUBLISHED" ? "转为草稿" : "上架"}
                      </button>
                    </form>
                    <form action={updateProductStatus}>
                      <input name="productId" type="hidden" value={product.id} />
                      <input name="status" type="hidden" value="ARCHIVED" />
                      <button disabled={product.status === "ARCHIVED"} type="submit">
                        归档
                      </button>
                    </form>
                  </div>
                </details>
              </article>
            ))}
          </div>
        ) : (
          <div className="catalog-empty compact-empty">
            <h2>{totalCount > 0 ? "当前筛选暂无产品" : "暂无产品"}</h2>
            <p>
              {totalCount > 0
                ? "切换顶部状态标签查看其他产品。"
                : "先新增一个产品，之后列表里只处理状态和管理信息。"}
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
