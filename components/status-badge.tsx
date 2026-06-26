import type { CustomerStage, InquiryStatus, Priority } from "@/lib/mock-data";
import { inquiryStatusLabels, stageLabels } from "@/lib/mock-data";

type StatusBadgeProps =
  | {
      type: "stage";
      value: CustomerStage;
    }
  | {
      type: "inquiry";
      value: InquiryStatus;
    }
  | {
      type: "priority";
      value: Priority;
    };

const priorityLabels: Record<Priority, string> = {
  high: "高优先级",
  medium: "中优先级",
  low: "低优先级"
};

export function StatusBadge(props: StatusBadgeProps) {
  const label =
    props.type === "stage"
      ? stageLabels[props.value]
      : props.type === "inquiry"
        ? inquiryStatusLabels[props.value]
        : priorityLabels[props.value];

  return (
    <span className={`status-badge ${props.type}-${props.value}`}>
      {label}
    </span>
  );
}
