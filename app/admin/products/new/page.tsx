import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createProduct } from "../actions";
import { ProductMainImagesUploader } from "@/components/product-main-images-uploader";
import { ProductRichTextEditor } from "@/components/product-rich-text-editor";
import { ProductVariantsBuilder } from "@/components/product-variants-builder";
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
        <form action={createProduct} className="product-form">
          <div className="product-form-full product-form-section">
            <span>产品主图</span>
            <ProductMainImagesUploader />
          </div>
          <label className="product-form-full">
            <span>产品名称</span>
            <input name="name" required />
          </label>
          <label>
            <span>型号</span>
            <input name="sku" />
          </label>
          <label>
            <span>分类</span>
            <select name="categoryId" defaultValue="">
              <option value="">未分类</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span>新分类名称</span>
            <input name="newCategoryName" placeholder="填写后优先使用" />
          </label>
          <label>
            <span>状态</span>
            <select name="status" defaultValue="DRAFT">
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">上架</option>
              <option value="ARCHIVED">归档</option>
            </select>
          </label>
          <label>
            <span>排序</span>
            <input name="sortOrder" type="number" defaultValue="0" />
          </label>
          <label className="product-form-wide">
            <span>摘要</span>
            <input name="summary" />
          </label>
          <label className="product-form-wide">
            <span>价格说明</span>
            <input name="priceNote" placeholder="如 MOQ / FOB / 面议" />
          </label>
          <label className="product-form-full">
            <span>产品说明</span>
            <textarea name="description" rows={4} />
          </label>
          <div className="product-form-full product-form-section">
            <span>详情页内容</span>
            <ProductRichTextEditor />
          </div>
          <div className="product-form-full product-form-section">
            <span>SKU 与区间价格</span>
            <ProductVariantsBuilder />
          </div>
          <button className="primary-button" type="submit">
            保存产品
          </button>
        </form>
      </section>
    </main>
  );
}
