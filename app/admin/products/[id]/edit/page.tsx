import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { updateProduct } from "../../actions";
import { ProductRichTextEditor } from "@/components/product-rich-text-editor";
import { ProductVariantsBuilder } from "@/components/product-variants-builder";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageProducts } from "@/lib/permissions";

type EditProductPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: EditProductPageProps) {
  const [{ id }, user] = await Promise.all([params, requireCurrentUser()]);

  if (!canManageProducts(user.role)) {
    redirect("/admin");
  }

  const [product, categories] = await Promise.all([
    prisma.product.findUnique({
      where: {
        id
      },
      include: {
        variants: {
          include: {
            priceTiers: {
              orderBy: [{ sortOrder: "asc" }, { minQuantity: "asc" }]
            }
          },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
        }
      }
    }),
    prisma.productCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
    })
  ]);

  if (!product) {
    notFound();
  }

  const initialVariants = product.variants.map((variant) => ({
    name: variant.name,
    sku: variant.sku || "",
    priceTiers: variant.priceTiers.length
      ? variant.priceTiers.map((tier) => ({
          minQuantity: String(tier.minQuantity),
          maxQuantity: tier.maxQuantity ? String(tier.maxQuantity) : "",
          unitPrice: tier.unitPrice.toString(),
          currency: tier.currency
        }))
      : [
          {
            minQuantity: "1",
            maxQuantity: "",
            unitPrice: "",
            currency: "USD"
          }
        ]
  }));

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Edit Product</p>
          <h2>编辑产品</h2>
        </div>
        <div className="tool-actions">
          {product.status === "PUBLISHED" ? (
            <Link className="quiet-button" href={`/products/${product.slug}`}>
              预览
            </Link>
          ) : null}
          <Link className="secondary-link" href="/admin/products">
            <ArrowLeft size={16} />
            返回列表
          </Link>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Product Info</p>
            <h2>产品资料</h2>
          </div>
        </div>
        <form action={updateProduct} className="product-form">
          <input name="productId" type="hidden" value={product.id} />
          <label>
            <span>产品名称</span>
            <input name="name" required defaultValue={product.name} />
          </label>
          <label>
            <span>链接标识</span>
            <input name="slug" defaultValue={product.slug} />
          </label>
          <label>
            <span>SKU</span>
            <input name="sku" defaultValue={product.sku || ""} />
          </label>
          <label>
            <span>分类</span>
            <select name="categoryId" defaultValue={product.categoryId || ""}>
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
            <select name="status" defaultValue={product.status}>
              <option value="DRAFT">草稿</option>
              <option value="PUBLISHED">上架</option>
              <option value="ARCHIVED">归档</option>
            </select>
          </label>
          <label>
            <span>排序</span>
            <input name="sortOrder" type="number" defaultValue={product.sortOrder} />
          </label>
          <div className="product-form-wide product-form-section">
            <span>主图</span>
            {product.coverImage ? (
              <div className="product-cover-preview">
                <Image alt={product.name} fill sizes="240px" src={product.coverImage} />
              </div>
            ) : null}
            <input accept="image/*" name="coverImage" type="file" />
          </div>
          <label className="product-form-wide">
            <span>摘要</span>
            <input name="summary" defaultValue={product.summary || ""} />
          </label>
          <label className="product-form-wide">
            <span>价格说明</span>
            <input
              name="priceNote"
              defaultValue={product.priceNote || ""}
              placeholder="如 MOQ / FOB / 面议"
            />
          </label>
          <label className="product-form-full">
            <span>产品说明</span>
            <textarea name="description" rows={4} defaultValue={product.description || ""} />
          </label>
          <div className="product-form-full product-form-section">
            <span>详情页内容</span>
            <ProductRichTextEditor initialHtml={product.detailHtml} />
          </div>
          <div className="product-form-full product-form-section">
            <span>SKU 与区间价格</span>
            <ProductVariantsBuilder initialVariants={initialVariants} />
          </div>
          <button className="primary-button" type="submit">
            保存修改
          </button>
        </form>
      </section>
    </main>
  );
}
