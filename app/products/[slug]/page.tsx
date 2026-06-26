import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Send } from "lucide-react";
import { createProductInquiry } from "@/app/products/actions";
import { ProductInquiryOptions } from "@/components/product-inquiry-options";
import { prisma } from "@/lib/db";

type ProductDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    sent?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
  searchParams
}: ProductDetailPageProps) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const product = await prisma.product.findFirst({
    where: {
      slug,
      status: "PUBLISHED"
    },
    include: {
      category: true,
      variants: {
        include: {
          priceTiers: {
            orderBy: [{ sortOrder: "asc" }, { minQuantity: "asc" }]
          }
        },
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }]
      }
    }
  });

  if (!product) {
    notFound();
  }

  const variants = product.variants.map((variant) => ({
    id: variant.id,
    name: variant.name,
    sku: variant.sku,
    priceTiers: variant.priceTiers.map((tier) => ({
      id: tier.id,
      minQuantity: tier.minQuantity,
      maxQuantity: tier.maxQuantity,
      unitPrice: tier.unitPrice.toString(),
      currency: tier.currency
    }))
  }));

  return (
    <main className="site-shell">
      <header className="site-nav">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span>
          <span>TradePilot</span>
        </Link>
        <Link className="icon-link" href="/products">
          <ArrowLeft size={18} />
          <span>产品</span>
        </Link>
      </header>

      <section className="product-detail-page">
        <div className="product-detail-media">
          {product.coverImage ? (
            <Image
              alt={product.name}
              fill
              priority
              sizes="(max-width: 980px) 100vw, 48vw"
              src={product.coverImage}
            />
          ) : (
            <span>Product Image</span>
          )}
        </div>

        <div className="product-detail-copy">
          <p className="eyebrow">
            {product.category?.name || "Product"}
            {product.sku ? ` / ${product.sku}` : ""}
          </p>
          <h1>{product.name}</h1>
          <p>{product.summary || "欢迎提交询盘，我们会带着产品上下文处理需求。"}</p>
          {product.priceNote ? <strong>{product.priceNote}</strong> : null}
          {product.detailHtml ? (
            <div
              className="product-description rich-content"
              dangerouslySetInnerHTML={{ __html: product.detailHtml }}
            />
          ) : product.description ? (
            <div className="product-description">
              {product.description.split(/\r?\n/).map((line, index) => (
                <p key={`${line}-${index}`}>{line}</p>
              ))}
            </div>
          ) : null}
        </div>

        <aside className="inquiry-panel">
          <p className="eyebrow">Inquiry</p>
          <h2>发起询盘</h2>
          {query.sent === "1" ? (
            <p className="success-note">询盘已提交，我们会尽快回复。</p>
          ) : null}
          <form action={createProductInquiry} className="public-inquiry-form">
            <input name="productId" type="hidden" value={product.id} />
            <input name="productSlug" type="hidden" value={product.slug} />
            {variants.length > 0 ? <ProductInquiryOptions variants={variants} /> : null}
            <label>
              <span>公司名称</span>
              <input name="companyName" required />
            </label>
            <label>
              <span>联系人</span>
              <input name="contactName" required />
            </label>
            <label>
              <span>邮箱</span>
              <input name="email" required type="email" />
            </label>
            <label>
              <span>电话</span>
              <input name="phone" />
            </label>
            <label>
              <span>需求</span>
              <textarea
                name="message"
                required
                rows={5}
                defaultValue={`I am interested in ${product.name}. Please share MOQ, lead time, and quotation.`}
              />
            </label>
            <button className="primary-button auth-submit" type="submit">
              <Send size={16} />
              提交询盘
            </button>
          </form>
        </aside>
      </section>
    </main>
  );
}
