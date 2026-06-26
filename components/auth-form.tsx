"use client";

import { useActionState } from "react";
import { LockKeyhole, LogIn, UserPlus } from "lucide-react";
import {
  createInitialAdmin,
  login,
  type AuthFormState
} from "@/app/login/actions";

const initialState: AuthFormState = {};

export function LoginForm() {
  const [state, action, isPending] = useActionState(login, initialState);

  return (
    <form action={action} className="auth-form">
      <label>
        <span>邮箱</span>
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        <span>密码</span>
        <input
          autoComplete="current-password"
          name="password"
          required
          type="password"
        />
      </label>
      <label className="check-row">
        <input name="remember" type="checkbox" />
        <span>保持登录 30 天</span>
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button className="primary-button auth-submit" disabled={isPending} type="submit">
        <LogIn size={16} />
        {isPending ? "登录中" : "登录"}
      </button>
    </form>
  );
}

export function SetupAdminForm() {
  const [state, action, isPending] = useActionState(
    createInitialAdmin,
    initialState
  );

  return (
    <form action={action} className="auth-form">
      <label>
        <span>姓名</span>
        <input autoComplete="name" name="name" required />
      </label>
      <label>
        <span>邮箱</span>
        <input autoComplete="email" name="email" required type="email" />
      </label>
      <label>
        <span>密码</span>
        <input
          autoComplete="new-password"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label>
        <span>确认密码</span>
        <input
          autoComplete="new-password"
          minLength={8}
          name="confirmPassword"
          required
          type="password"
        />
      </label>
      {state.error ? <p className="form-error">{state.error}</p> : null}
      <button className="primary-button auth-submit" disabled={isPending} type="submit">
        <UserPlus size={16} />
        {isPending ? "创建中" : "创建管理员"}
      </button>
    </form>
  );
}

export function AuthIcon({ setupMode }: { setupMode: boolean }) {
  return (
    <div className="auth-icon" aria-hidden="true">
      {setupMode ? <UserPlus size={22} /> : <LockKeyhole size={22} />}
    </div>
  );
}
