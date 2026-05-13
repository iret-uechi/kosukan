import type { Category, PlanGroup } from "./types";

export const PLAN_GROUPS: PlanGroup[] = [
  { id: "project_a", name: "プロジェクトA", defaultPlan: 2.0 },
  { id: "project_b", name: "プロジェクトB", defaultPlan: 1.5 },
  { id: "ops", name: "運用業務", defaultPlan: 1.5 },
];

export const PLANLESS_GROUP_NAMES: Record<string, string> = {
  indirect: "間接業務",
  leave: "有休",
};

export const CATEGORIES: Category[] = [
  { id: "project_a", name: "プロジェクトA", groupId: "project_a" },
  { id: "project_b", name: "プロジェクトB", groupId: "project_b" },
  { id: "ops_general", name: "運用業務: 通常対応", groupId: "ops" },
  { id: "ops_meeting", name: "運用業務: 定例MTG", groupId: "ops" },
  { id: "indirect", name: "間接業務", groupId: "indirect" },
  { id: "leave", name: "有休", groupId: "leave" },
];

export const MONTHS = [
  { value: "2026-04", label: "4月" },
  { value: "2026-05", label: "5月" },
  { value: "2026-06", label: "6月" },
  { value: "2026-07", label: "7月" },
  { value: "2026-08", label: "8月" },
  { value: "2026-09", label: "9月" },
];

export const GROUP_COLORS: Record<string, string> = {
  project_a: "#2563eb",
  project_b: "#7c3aed",
  ops: "#0891b2",
  indirect: "#78716c",
  leave: "#94a3b8",
};

export const CAT_COLORS: Record<string, string> = {
  project_a: "#2563eb",
  project_b: "#7c3aed",
  ops_general: "#0891b2",
  ops_meeting: "#06b6d4",
  indirect: "#78716c",
  leave: "#94a3b8",
};
