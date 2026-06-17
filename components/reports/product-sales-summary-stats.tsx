import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type ProductSalesSummaryMetric = {
  key: string;
  label: string;
  value: string;
  icon: LucideIcon;
  iconClassName?: string;
  valueClassName?: string;
};

type ProductSalesSummaryStatsProps = {
  loading?: boolean;
  metrics: ProductSalesSummaryMetric[];
};

export const ProductSalesSummaryStats = ({
  loading = false,
  metrics,
}: ProductSalesSummaryStatsProps) => (
  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
    {metrics.map((metric) => (
      <div key={metric.key} className="min-w-0 rounded-lg border p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{metric.label}</p>
          <metric.icon className={cn("size-4 shrink-0", metric.iconClassName)} />
        </div>
        <p
          className={cn(
            "mt-2 truncate text-xl font-bold tabular-nums lg:text-2xl",
            metric.valueClassName,
          )}
          title={metric.value}>
          {loading ? "—" : metric.value}
        </p>
      </div>
    ))}
  </div>
);
