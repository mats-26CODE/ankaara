import dayjs from "dayjs";

export type ReportPeriodPreset = "weekly" | "monthly" | "all_time" | "custom";

export type ReportDateRange = {
  fromDate: string | null;
  toDate: string | null;
};

export const resolveReportPeriodRange = (
  preset: ReportPeriodPreset,
  customFrom?: string | null,
  customTo?: string | null,
): ReportDateRange => {
  if (preset === "custom") {
    return {
      fromDate: customFrom?.trim() || null,
      toDate: customTo?.trim() || null,
    };
  }

  if (preset === "all_time") {
    return { fromDate: null, toDate: null };
  }

  const today = dayjs().startOf("day");

  if (preset === "weekly") {
    return {
      fromDate: today.subtract(6, "day").format("YYYY-MM-DD"),
      toDate: today.format("YYYY-MM-DD"),
    };
  }

  return {
    fromDate: today.startOf("month").format("YYYY-MM-DD"),
    toDate: today.format("YYYY-MM-DD"),
  };
};

export const formatReportPeriodLabel = (
  preset: ReportPeriodPreset,
  customFrom?: string | null,
  customTo?: string | null,
): string => {
  if (preset === "all_time") return "All time";
  if (preset === "weekly") return "Last 7 days";
  if (preset === "monthly") return "This month";

  const from = customFrom?.trim();
  const to = customTo?.trim();
  if (!from && !to) return "Custom range";
  if (from && to) {
    return `${dayjs(from).format("MMM D, YYYY")} – ${dayjs(to).format("MMM D, YYYY")}`;
  }
  if (from) return `From ${dayjs(from).format("MMM D, YYYY")}`;
  return `Until ${dayjs(to!).format("MMM D, YYYY")}`;
};
