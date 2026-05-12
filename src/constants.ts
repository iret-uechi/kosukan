import type { Category, PlanGroup } from "./types";

// 計画グループ（予算管理の単位）
// fork 後に自身の業務カテゴリへ書き換えて利用してください。
export const PLAN_GROUPS: PlanGroup[] = [
  { id: "project_a", name: "プロジェクトA", defaultPlan: 2.0 },
  { id: "project_b", name: "プロジェクトB", defaultPlan: 1.5 },
  { id: "project_c", name: "プロジェクトC", defaultPlan: 1.0 },
  { id: "ops",       name: "運用業務",     defaultPlan: 1.5 },
];

// 計画外（記録のみ・計画値を持たない）グループ名
export const PLANLESS_GROUP_NAMES: Record<string, string> = {
  indirect: "間接業務",
  leave:    "有休",
};

// 入力カテゴリ（日次記録の単位）
// 通常: 1グループ=1カテゴリ。1グループに複数カテゴリを置くと内訳記録が可能（下の ops の例参照）。
export const CATEGORIES: Category[] = [
  { id: "project_a",   name: "プロジェクトA",       groupId: "project_a" },
  { id: "project_b",   name: "プロジェクトB",       groupId: "project_b" },
  { id: "project_c",   name: "プロジェクトC",       groupId: "project_c" },
  // 運用業務（サブカテゴリで内訳を記録する例）
  { id: "ops_general", name: "運用業務: 通常対応",   groupId: "ops" },
  { id: "ops_meeting", name: "運用業務: 定例MTG",   groupId: "ops" },
  { id: "ops_other",   name: "運用業務: その他",     groupId: "ops" },
  // 計画外
  { id: "indirect",    name: "間接業務",           groupId: "indirect" },
  { id: "leave",       name: "有休",              groupId: "leave" },
];

// 上期 6ヶ月の表示順
// fork 後に自身の対象期間へ書き換えて利用してください。
export const MONTHS = [
  { value: "2026-04", label: "4月" },
  { value: "2026-05", label: "5月" },
  { value: "2026-06", label: "6月" },
  { value: "2026-07", label: "7月" },
  { value: "2026-08", label: "8月" },
  { value: "2026-09", label: "9月" },
];

export const HOURS_PER_DAY = 8;
export const DAYS_PER_MONTH = 20; // 1人月 = 20人日

export const STORAGE_KEY = "workload-tracker-data";

// グループ別の色
export const GROUP_COLORS: Record<string, string> = {
  project_a: "#2563eb",
  project_b: "#7c3aed",
  project_c: "#059669",
  ops:       "#0891b2",
  indirect:  "#78716c",
  leave:     "#94a3b8",
};

// カテゴリ別の色（運用業務サブカテゴリは同系色のバリエーション）
export const CAT_COLORS: Record<string, string> = {
  project_a:   "#2563eb",
  project_b:   "#7c3aed",
  project_c:   "#059669",
  ops_general: "#0891b2",
  ops_meeting: "#06b6d4",
  ops_other:   "#14b8a6",
  indirect:    "#78716c",
  leave:       "#94a3b8",
};
