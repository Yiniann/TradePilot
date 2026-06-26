import type { LucideIcon } from "lucide-react";

type MetricCardProps = {
  label: string;
  value: string;
  trend: string;
  icon: LucideIcon;
};

export function MetricCard({ label, value, trend, icon: Icon }: MetricCardProps) {
  return (
    <article className="metric-card">
      <div className="metric-icon">
        <Icon size={18} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{trend}</span>
      </div>
    </article>
  );
}
