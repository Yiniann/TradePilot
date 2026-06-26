export type CustomerStage = "new" | "qualified" | "quoted" | "negotiating" | "won";
export type InquiryStatus = "new" | "assigned" | "replied" | "waiting" | "closed";
export type Priority = "high" | "medium" | "low";

export type Customer = {
  id: string;
  company: string;
  contact: string;
  country: string;
  email: string;
  phone: string;
  source: string;
  stage: CustomerStage;
  owner: string;
  value: string;
  lastContactAt: string;
  tags: string[];
};

export type Inquiry = {
  id: string;
  subject: string;
  company: string;
  contact: string;
  email: string;
  channel: string;
  status: InquiryStatus;
  priority: Priority;
  receivedAt: string;
  product: string;
  message: string;
  owner: string;
};

export type Activity = {
  id: string;
  customer: string;
  type: string;
  note: string;
  time: string;
};

export const customers: Customer[] = [
  {
    id: "CUS-1008",
    company: "Northstar Retail Group",
    contact: "Elena Moore",
    country: "United States",
    email: "elena@northstar.example",
    phone: "+1 415 010 8821",
    source: "官网询盘",
    stage: "quoted",
    owner: "Mia",
    value: "$42,800",
    lastContactAt: "今天 10:25",
    tags: ["连锁零售", "复购潜力"]
  },
  {
    id: "CUS-1007",
    company: "Astra Industrial Co.",
    contact: "Hassan Ali",
    country: "UAE",
    email: "hassan@astra.example",
    phone: "+971 50 010 3110",
    source: "展会名片",
    stage: "negotiating",
    owner: "Leo",
    value: "$118,000",
    lastContactAt: "昨天 16:40",
    tags: ["年度框架", "重点客户"]
  },
  {
    id: "CUS-1006",
    company: "Meridian Home Supply",
    contact: "Sofia Rossi",
    country: "Italy",
    email: "sofia@meridian.example",
    phone: "+39 02 010 7788",
    source: "Google Ads",
    stage: "qualified",
    owner: "Iris",
    value: "$19,600",
    lastContactAt: "6 月 24 日",
    tags: ["样品单"]
  },
  {
    id: "CUS-1005",
    company: "Pacific Tools Ltd.",
    contact: "Daniel Chen",
    country: "Australia",
    email: "daniel@pacifictools.example",
    phone: "+61 2 0100 8721",
    source: "老客户推荐",
    stage: "won",
    owner: "Mia",
    value: "$63,500",
    lastContactAt: "6 月 22 日",
    tags: ["已成交", "售后跟进"]
  }
];

export const inquiries: Inquiry[] = [
  {
    id: "INQ-22018",
    subject: "Request quotation for private label order",
    company: "Northstar Retail Group",
    contact: "Elena Moore",
    email: "elena@northstar.example",
    channel: "官网表单",
    status: "new",
    priority: "high",
    receivedAt: "今天 09:42",
    product: "Smart inventory scanner",
    message:
      "We are sourcing a private label batch for 120 stores. Please share MOQ, lead time, certification files, and packaging options.",
    owner: "待分配"
  },
  {
    id: "INQ-22017",
    subject: "Sample feedback and revised quotation",
    company: "Meridian Home Supply",
    contact: "Sofia Rossi",
    email: "sofia@meridian.example",
    channel: "邮件导入",
    status: "waiting",
    priority: "medium",
    receivedAt: "昨天 18:05",
    product: "Modular shelf kit",
    message:
      "The sample quality is acceptable. Could you revise the price based on 5,000 units and include the carton drop test report?",
    owner: "Iris"
  },
  {
    id: "INQ-22016",
    subject: "Distributor pricing for GCC market",
    company: "Astra Industrial Co.",
    contact: "Hassan Ali",
    email: "hassan@astra.example",
    channel: "展会录入",
    status: "assigned",
    priority: "high",
    receivedAt: "6 月 25 日",
    product: "Industrial control panel",
    message:
      "We would like distributor pricing for the GCC market and technical documents for compliance review.",
    owner: "Leo"
  }
];

export const activities: Activity[] = [
  {
    id: "ACT-301",
    customer: "Northstar Retail Group",
    type: "询盘进入",
    note: "官网表单提交，要求报价、MOQ、交期与认证资料。",
    time: "今天 09:42"
  },
  {
    id: "ACT-300",
    customer: "Astra Industrial Co.",
    type: "销售备注",
    note: "对方希望先锁定 GCC 区域经销价格，再推进样机测试。",
    time: "昨天 16:40"
  },
  {
    id: "ACT-299",
    customer: "Meridian Home Supply",
    type: "邮件回复",
    note: "已发送样品单报价，等待确认包装测试要求。",
    time: "昨天 11:20"
  }
];

export const stageLabels: Record<CustomerStage, string> = {
  new: "新客户",
  qualified: "已确认需求",
  quoted: "已报价",
  negotiating: "谈判中",
  won: "已成交"
};

export const inquiryStatusLabels: Record<InquiryStatus, string> = {
  new: "新询盘",
  assigned: "已分配",
  replied: "已回复",
  waiting: "待客户反馈",
  closed: "已关闭"
};
