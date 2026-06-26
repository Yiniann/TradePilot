import { redirect } from "next/navigation";
import { createUser, setUserStatus, updateUserRole } from "./actions";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  canAssignRole,
  canManageTargetUser,
  canManageUsers,
  manageableRolesFor,
  roleLabels,
  userStatusLabels
} from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const currentUser = await requireCurrentUser();

  if (!canManageUsers(currentUser.role)) {
    redirect("/admin");
  }

  const users = await prisma.user.findMany({
    orderBy: {
      createdAt: "asc"
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true
    }
  });
  const roleOptions = manageableRolesFor(currentUser.role);

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Team</p>
          <h2>成员与角色</h2>
        </div>
        <span className="muted-text">共 {users.length} 个账号</span>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Create User</p>
            <h2>新建成员</h2>
          </div>
        </div>
        <form action={createUser} className="user-create-grid">
          <label>
            <span>姓名</span>
            <input name="name" required />
          </label>
          <label>
            <span>邮箱</span>
            <input name="email" required type="email" />
          </label>
          <label>
            <span>初始密码</span>
            <input minLength={8} name="password" required type="password" />
          </label>
          <label>
            <span>角色</span>
            <select name="role" required>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </label>
          <button className="primary-button" type="submit">
            创建
          </button>
        </form>
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Users</p>
            <h2>账号列表</h2>
          </div>
        </div>
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>成员</th>
                <th>角色</th>
                <th>状态</th>
                <th>最近登录</th>
                <th>创建时间</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const canManageTarget =
                  user.id !== currentUser.id &&
                  canManageTargetUser(currentUser.role, user.role);
                const statusAction =
                  user.status === "ACTIVE" ? "DISABLED" : "ACTIVE";

                return (
                  <tr key={user.id}>
                    <td>
                      <div className="entity-cell">
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </td>
                    <td>
                      <form action={updateUserRole} className="inline-form">
                        <input name="userId" type="hidden" value={user.id} />
                        <select
                          aria-label="角色"
                          defaultValue={user.role}
                          disabled={!canManageTarget}
                          name="role"
                        >
                          {roleOptions.map((role) => (
                            <option
                              disabled={!canAssignRole(currentUser.role, role)}
                              key={role}
                              value={role}
                            >
                              {roleLabels[role]}
                            </option>
                          ))}
                        </select>
                        <button
                          className="quiet-button"
                          disabled={!canManageTarget}
                          type="submit"
                        >
                          保存
                        </button>
                      </form>
                    </td>
                    <td>
                      <span className={`status-badge user-${user.status.toLowerCase()}`}>
                        {userStatusLabels[user.status]}
                      </span>
                    </td>
                    <td>{formatDate(user.lastLoginAt)}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <form action={setUserStatus}>
                        <input name="userId" type="hidden" value={user.id} />
                        <input name="status" type="hidden" value={statusAction} />
                        <button
                          className="quiet-button"
                          disabled={!canManageTarget}
                          type="submit"
                        >
                          {user.status === "ACTIVE" ? "禁用" : "启用"}
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function formatDate(date: Date | null) {
  if (!date) {
    return "-";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
