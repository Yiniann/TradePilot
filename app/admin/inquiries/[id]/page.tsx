import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, MessageSquare, Send, UserRound } from "lucide-react";
import { addInquiryMessage, assignInquiry, updateInquiryStatus } from "../actions";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  canAssignInquiry,
  canReplyInquiry,
  canViewOwnDataOnly,
  roleLabels
} from "@/lib/permissions";

const inquiryStatusLabels = {
  NEW: "新询盘",
  ASSIGNED: "已分配",
  REPLIED: "已回复",
  CLOSED: "已关闭"
} as const;

const messageDirectionLabels = {
  INBOUND: "客户询盘",
  OUTBOUND: "回复记录",
  INTERNAL_NOTE: "内部备注"
} as const;

type InquiryDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function InquiryDetailPage({ params }: InquiryDetailPageProps) {
  const user = await requireCurrentUser();
  const { id } = await params;
  const [inquiry, assignees] = await Promise.all([
    prisma.inquiry.findUnique({
      where: {
        id
      },
      include: {
        customer: true,
        contact: true,
        product: true,
        owner: true,
        messages: {
          include: {
            author: true
          },
          orderBy: {
            createdAt: "asc"
          }
        }
      }
    }),
    canAssignInquiry(user.role)
      ? prisma.user.findMany({
          where: {
            status: "ACTIVE",
            role: {
              in: ["SUPER_ADMIN", "ADMIN", "SALES"]
            }
          },
          orderBy: [{ role: "asc" }, { createdAt: "asc" }]
        })
      : Promise.resolve([])
  ]);

  if (!inquiry) {
    notFound();
  }

  if (canViewOwnDataOnly(user.role) && inquiry.ownerId !== user.id) {
    notFound();
  }

  const canReply = canReplyInquiry(user.role);
  const canAssign = canAssignInquiry(user.role);

  const originalMessage = {
    id: "original",
    direction: "INBOUND" as const,
    body: inquiry.message,
    author: null,
    createdAt: inquiry.receivedAt
  };
  const hasInboundMessage = inquiry.messages.some(
    (message) => message.direction === "INBOUND"
  );
  const timelineMessages = hasInboundMessage
    ? inquiry.messages
    : [originalMessage, ...inquiry.messages];

  return (
    <main className="admin-content">
      <section className="page-tools">
        <div>
          <p className="eyebrow">Inquiry Detail</p>
          <h2>{inquiry.subject}</h2>
        </div>
        <div className="tool-actions">
          <Link className="secondary-link" href="/admin/inquiries">
            <ArrowLeft size={16} />
            返回列表
          </Link>
        </div>
      </section>

      <section className="inquiry-detail-layout">
        <div className="inquiry-detail-main">
          <section className="panel inquiry-chat-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Conversation</p>
                <h2>询盘沟通</h2>
              </div>
              <span>{timelineMessages.length} 条消息</span>
            </div>

            <div className="inquiry-chat-window">
              {timelineMessages.map((message) => (
                <article
                  className={`inquiry-chat-message ${message.direction.toLowerCase()}`}
                  key={message.id}
                >
                  <div className="inquiry-chat-bubble">
                    <div className="inquiry-chat-meta">
                      <strong>{messageDirectionLabels[message.direction]}</strong>
                      <span>
                        {message.author?.name ||
                          (message.direction === "INBOUND" ? "客户" : "系统")}
                        {" · "}
                        {formatDate(message.createdAt)}
                      </span>
                    </div>
                    <p>{message.body}</p>
                  </div>
                </article>
              ))}
            </div>

            {canReply ? (
              <form action={addInquiryMessage} className="inquiry-chat-composer">
                <input name="inquiryId" type="hidden" value={inquiry.id} />
                <input name="direction" type="hidden" value="OUTBOUND" />
                <label htmlFor="reply">回复客户</label>
                <textarea
                  id="reply"
                  name="body"
                  placeholder="输入回复内容..."
                />
                <div className="reply-footer">
                  <span>保存后会发送邮件给客户，并带上当前业务员信息。</span>
                  <button className="primary-button" type="submit">
                    <Send size={16} />
                    保存回复
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        </div>

        <aside className="inquiry-reply-panel">
          <section className="panel inquiry-sidebar-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Customer</p>
                <h2>客户信息</h2>
              </div>
              <span className={`status-badge inquiry-${inquiry.status.toLowerCase()}`}>
                {inquiryStatusLabels[inquiry.status]}
              </span>
            </div>

            <div className="inquiry-context-grid">
              <div>
                <span>客户</span>
                <strong>{inquiry.customer?.name || "未关联客户"}</strong>
              </div>
              <div>
                <span>联系人</span>
                <strong>{inquiry.contact?.name || "未关联联系人"}</strong>
              </div>
              <div>
                <span>邮箱</span>
                <strong>{inquiry.contact?.email || "未填写邮箱"}</strong>
              </div>
              <div>
                <span>电话</span>
                <strong>{inquiry.contact?.phone || "未填写电话"}</strong>
              </div>
              <div>
                <span>询盘产品</span>
                <strong>{inquiry.product?.name || "未关联产品"}</strong>
              </div>
              <div>
                <span>负责人</span>
                <strong>{inquiry.owner?.name || "未分配"}</strong>
              </div>
              <div>
                <span>收到时间</span>
                <strong>{formatDate(inquiry.receivedAt)}</strong>
              </div>
            </div>
            {inquiry.customer ? (
              <Link
                className="secondary-link sidebar-full-link"
                href={`/admin/customers/${inquiry.customer.id}`}
              >
                <UserRound size={16} />
                打开客户卡片
              </Link>
            ) : null}
          </section>

          <section className="panel inquiry-sidebar-panel">
            <div className="panel-header">
              <div>
                <p className="eyebrow">Actions</p>
                <h2>询盘处理</h2>
              </div>
            </div>
            <div className="action-strip">
              {canAssign ? (
                <form action={assignInquiry} className="assignment-form">
                  <input name="inquiryId" type="hidden" value={inquiry.id} />
                  <label htmlFor="ownerId">分配给</label>
                  <select
                    defaultValue={inquiry.ownerId || ""}
                    id="ownerId"
                    name="ownerId"
                    required
                  >
                    <option disabled value="">
                      选择负责人
                    </option>
                    {assignees.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>
                        {assignee.name} / {roleLabels[assignee.role]}
                      </option>
                    ))}
                  </select>
                  <button type="submit">
                    分配
                  </button>
                </form>
              ) : null}
              {canReply ? (
                <form action={updateInquiryStatus}>
                  <input name="inquiryId" type="hidden" value={inquiry.id} />
                  <input name="status" type="hidden" value="CLOSED" />
                  <button type="submit">
                    <Check size={16} />
                    关闭
                  </button>
                </form>
              ) : null}
            </div>
          </section>

          {canReply ? (
            <section className="panel inquiry-sidebar-panel">
              <form action={addInquiryMessage} className="reply-box inquiry-note-box">
                <input name="inquiryId" type="hidden" value={inquiry.id} />
                <input name="direction" type="hidden" value="INTERNAL_NOTE" />
                <label htmlFor="note">内部备注</label>
                <textarea
                  id="note"
                  name="body"
                  placeholder="记录报价、样品、跟进计划等内部信息。"
                />
                <div className="reply-footer">
                  <span>备注只给后台业务看。</span>
                  <button className="secondary-link" type="submit">
                    <MessageSquare size={16} />
                    添加备注
                  </button>
                </div>
              </form>
            </section>
          ) : null}
        </aside>
      </section>
    </main>
  );
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}
