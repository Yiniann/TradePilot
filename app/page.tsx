import Link from "next/link";
import { ArrowRight, Building2 } from "lucide-react";

export default function PublicHomePage() {
  return (
    <main className="site-shell">
      <header className="site-nav">
        <Link className="brand" href="/">
          <span className="brand-mark">T</span>
          <span>TradePilot</span>
        </Link>
        <Link className="icon-link" href="/admin" title="进入后台">
          <Building2 size={18} />
          <span>后台</span>
        </Link>
      </header>

      <section className="site-placeholder">
        <div>
          <p className="eyebrow">B2B Independent Site Admin</p>
          <h1>公共官网入口已预留</h1>
          <p>
            当前版本先聚焦业务后台。后续 UI 与 VI 确定后，这里可以承载品牌首页、产品目录、案例页和询盘表单。
          </p>
          <Link className="primary-link" href="/admin">
            进入管理后台
            <ArrowRight size={18} />
          </Link>
          <Link className="secondary-link" href="/products">
            查看产品货柜
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </main>
  );
}
