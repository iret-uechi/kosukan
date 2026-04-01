import type { Category } from "./types";

export const CATEGORIES: Category[] = [
  { id: "automation", name: "運用自動化 外部展開", defaultPlan: 0.5 },
  { id: "ams", name: "AMS 課題", defaultPlan: 1.5 },
  { id: "analysis", name: "運用 分析Org 対応", defaultPlan: 2.5 },
  { id: "o11y", name: "O11y 導入", defaultPlan: 0.5 },
  { id: "c1ws", name: "C1WS API廃止", defaultPlan: 0 },
  { id: "aurora", name: "Aurora", defaultPlan: 0 },
  { id: "ai_research", name: "生成系AI / 技術調査", defaultPlan: 0 },
];

export const MONTHS = [
  { value: "2026-04", label: "4月" },
  { value: "2026-05", label: "5月" },
  { value: "2026-06", label: "6月" },
  { value: "2026-07", label: "7月" },
  { value: "2026-08", label: "8月" },
  { value: "2026-09", label: "9月" },
];

export const HOURS_PER_DAY = 8;

export const STORAGE_KEY = "fy26h1-tracker-data";

export const CAT_COLORS = [
  "#2563eb", "#7c3aed", "#059669", "#d97706",
  "#dc2626", "#0891b2", "#db2777",
];
