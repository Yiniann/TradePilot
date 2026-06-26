import { Check, Clock, MailPlus, Send, UserPlus } from "lucide-react";
import { inquiries } from "@/lib/mock-data";
import { StatusBadge } from "./status-badge";

export function InquiryWorkspace() {
  const activeInquiry = inquiries[0];

  return (
    <div className="inquiry-grid">
      <section className="panel inquiry-list" aria-label="询盘列表">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Inbox</p>
            <h2>询盘收件箱</h2>
          </div>
          <button className="icon-button" type="button" title="导入邮件">
            <MailPlus size={18} />
          </button>
        </div>

        <div className="inquiry-items">
          {inquiries.map((inquiry) => (
            <article
              className={`inquiry-item ${inquiry.id === activeInquiry.id ? "is-active" : ""}`}
              key={inquiry.id}
            >
              <div>
                <strong>{inquiry.subject}</strong>
                <span>{inquiry.company}</span>
              </div>
              <div className="inquiry-meta">
                <StatusBadge type="priority" value={inquiry.priority} />
                <span>{inquiry.receivedAt}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel inquiry-detail" aria-label="询盘详情">
        <div className="detail-heading">
          <div>
            <p className="eyebrow">{activeInquiry.id}</p>
            <h2>{activeInquiry.subject}</h2>
          </div>
          <StatusBadge type="inquiry" value={activeInquiry.status} />
        </div>

        <div className="detail-meta">
          <span>{activeInquiry.company}</span>
          <span>{activeInquiry.contact}</span>
          <span>{activeInquiry.email}</span>
          <span>{activeInquiry.channel}</span>
        </div>

        <div className="message-box">
          <p>{activeInquiry.message}</p>
        </div>

        <div className="action-strip">
          <button type="button">
            <UserPlus size={16} />
            转为客户
          </button>
          <button type="button">
            <Clock size={16} />
            设置跟进
          </button>
          <button type="button">
            <Check size={16} />
            标记已处理
          </button>
        </div>

        <form className="reply-box">
          <label htmlFor="reply">回复内容</label>
          <textarea
            id="reply"
            defaultValue={`Hi ${activeInquiry.contact},\n\nThanks for your inquiry. We can share MOQ, estimated lead time, certification files, and packaging options for ${activeInquiry.product}.\n\nBest regards,\nTradePilot Sales Team`}
          />
          <div className="reply-footer">
            <span>回复将记录到客户时间线，并同步更新询盘状态。</span>
            <button className="primary-button" type="button">
              <Send size={16} />
              发送回复
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
