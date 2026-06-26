import Image from "next/image";
import Link from "next/link";
import { ArrowRight, PackageOpen } from "lucide-react";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    where: {
      status: "PUBLISHED"
    },
    include: {
      category: true
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }]
  });
  const productGroups = products.reduce<
    Array<{ id: string; name: string; products: typeof products }>
  >((groups, product) => {
    const id = product.category?.id || "uncategorized";
    const name = product.category?.name || "未分类";
    const group = groups.find((item) => item.id === id);

    if (group) {
      group.products.push(product);
    } else {
      groups.push({
        id,
        name,
        products: [product]
      });
    }

    return groups;
  }, []);

  return (
    <main className="site-shell">
      <header className="site-nav">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span>
          <span>TradePilot</span>
        </Link>
        <Link className="icon-link" href="/admin" title="进入后台">
          <PackageOpen size={18} />
          <span>后台</span>
        </Link>
      </header>

      <section className="catalog-page">
        <div className="catalog-heading">
          <p className="eyebrow">Product Cabinet</p>
          <h1>产品货柜</h1>
          <p>展示已上架产品，客户可以从产品详情直接发起带产品信息的询盘。</p>
        </div>

        {products.length > 0 ? (
          <div className="product-category-sections">
            {productGroups.map((group) => (
              <section className="product-category-section" key={group.id}>
                <div className="product-category-heading">
                  <h2>{group.name}</h2>
                  <span>{group.products.length} 个产品</span>
                </div>
                <div className="product-cabinet">
                  {group.products.map((product) => (
                    <Link
                      className="product-card"
                      href={`/products/${product.slug}`}
                      key={product.id}
                    >
                      <div className="product-card-image">
                        {product.coverImage ? (
                          <Image
                            alt={product.name}
                            fill
                            sizes="(max-width: 760px) 100vw, 33vw"
                            src={product.coverImage}
                          />
                        ) : (
                          <PackageOpen size={36} />
                        )}
                      </div>
                      <div>
                        <span>{product.sku || "Product"}</span>
                        <h2>{product.name}</h2>
                        <p>{product.summary || "查看产品详情并发起询盘。"}</p>
                      </div>
                      <small>
                        查看详情
                        <ArrowRight size={15} />
                      </small>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <div className="catalog-empty">
            <PackageOpen size={34} />
            <h2>暂无上架产品</h2>
            <p>在后台产品管理中创建并上架产品后，这里会显示货柜列表。</p>
          </div>
        )}
      </section>
    </main>
  );
}
