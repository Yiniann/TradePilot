import Link from "next/link";
import { Clock3 } from "lucide-react";

export default function InquiryLinkExpiredPage() {
  return (
    <main className="inquiry-link-state">
      <section>
        <Clock3 size={28} />
        <h1>询盘访问链接无效或已过期</h1>
        <p>请使用最近一封询盘邮件中的链接，或联系业务人员重新发送访问邮件。</p>
        <Link className="primary-link" href="/products">
          返回产品列表
        </Link>
      </section>
    </main>
  );
}
