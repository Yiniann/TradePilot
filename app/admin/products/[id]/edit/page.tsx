import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { updateProduct } from "../../actions";
import { ProductForm } from "@/components/product-form";
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
    image: variant.image || "",
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
        <ProductForm
          action={updateProduct}
          categories={categories}
          initialValues={{
            id: product.id,
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            categoryId: product.categoryId,
            summary: product.summary,
            material: product.material,
            productType: product.productType,
            application: product.application,
            packaging: product.packaging,
            size: product.size,
            weight: product.weight,
            composition: product.composition,
            priceNote: product.priceNote,
            detailHtml: product.detailHtml,
            coverImage: product.coverImage,
            gallery: product.gallery,
            videoUrl: product.videoUrl
          }}
          initialVariants={initialVariants}
          submitLabel="保存修改"
        />
      </section>
    </main>
  );
}
