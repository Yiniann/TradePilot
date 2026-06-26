import { redirect } from "next/navigation";
import { AuthIcon, LoginForm, SetupAdminForm } from "@/components/auth-form";
import { getCurrentUser, hasAnyUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const [hasUsers, currentUser] = await Promise.all([
    hasAnyUser(),
    getCurrentUser()
  ]);

  if (currentUser) {
    redirect("/admin");
  }

  const setupMode = !hasUsers;

  return (
    <main className="auth-page">
      <section className="auth-panel">
        <AuthIcon setupMode={setupMode} />
        <p className="eyebrow">TradePilot Admin</p>
        <h1>{setupMode ? "创建管理员账号" : "登录后台"}</h1>
        <p>
          {setupMode
            ? "首次使用需要创建一个超级管理员账号。"
            : "使用后台账号密码进入独立站后台。"}
        </p>
        {setupMode ? <SetupAdminForm /> : <LoginForm />}
      </section>
    </main>
  );
}
