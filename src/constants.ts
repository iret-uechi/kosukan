import type { Category, PlanGroup } from "./types";

interface MonthOption {
  value: string;
  label: string;
}

interface LocalConstants {
  PLAN_GROUPS?: PlanGroup[];
  PLANLESS_GROUP_NAMES?: Record<string, string>;
  CATEGORIES?: Category[];
  MONTHS?: MonthOption[];
  GROUP_COLORS?: Record<string, string>;
  CAT_COLORS?: Record<string, string>;
}

const localModules = import.meta.glob<LocalConstants>("./constants.local.ts", {
  eager: true,
});
const localConstants = localModules["./constants.local.ts"];

// 計画グループ（予算管理の単位）
// fork 後に自身の業務カテゴリへ書き換えて利用してください。
const DEFAULT_PLAN_GROUPS: PlanGroup[] = [
  { id: "ams_task",   name: "AMS課題対応",         defaultPlan: 2.5 },
  { id: "ext_mon",    name: "External Monitoring", defaultPlan: 1.0 },
  { id: "eol",        name: "各種EOL対応",         defaultPlan: 0.75 },
  { id: "mail_hando", name: "メール通知引継",       defaultPlan: 0.25 },
  { id: "ops",        name: "運用保守",            defaultPlan: 1.5 },
];

// 計画外（記録のみ・計画値を持たない）グループ名
const DEFAULT_PLANLESS_GROUP_NAMES: Record<string, string> = {
  indirect: "間接業務",
  leave:    "有休",
};

// 入力カテゴリ（日次記録の単位）
// 通常: 1グループ=1カテゴリ。1グループに複数カテゴリを置くと内訳記録が可能（下の ops の例参照）。
const DEFAULT_CATEGORIES: Category[] = [
  { id: "ams_task",    name: "AMS課題対応",                  groupId: "ams_task" },
  { id: "ext_mon",     name: "External Monitoring",          groupId: "ext_mon" },
  { id: "eol",         name: "各種EOL対応",                  groupId: "eol" },
  { id: "mail_hando",  name: "メール通知引継",                groupId: "mail_hando" },
  // 運用保守（サービス別）
  { id: "ops_abuse",   name: "運用保守: Abuse傾向検知",       groupId: "ops" },
  { id: "ops_ams",     name: "運用保守: AMS",                groupId: "ops" },
  { id: "ops_mail",    name: "運用保守: メール通知システム",    groupId: "ops" },
  { id: "ops_ext_mon", name: "運用保守: External Monitoring", groupId: "ops" },
  { id: "ops_mtg",     name: "運用保守: MTG（定例・会議）",    groupId: "ops" },
  { id: "ops_etc",     name: "運用保守: その他",              groupId: "ops" },
  // 計画外
  { id: "indirect",    name: "間接業務",                    groupId: "indirect" },
  { id: "leave",       name: "有休",                       groupId: "leave" },
];

// 上期 6ヶ月の表示順
// fork 後に自身の対象期間へ書き換えて利用してください。
const DEFAULT_MONTHS: MonthOption[] = [
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
const DEFAULT_GROUP_COLORS: Record<string, string> = {
  ams_task:   "#2563eb",
  ext_mon:    "#7c3aed",
  eol:        "#059669",
  mail_hando: "#d97706",
  ops:        "#0891b2",
  indirect:   "#78716c",
  leave:      "#94a3b8",
};

// カテゴリ別の色（運用業務サブカテゴリは同系色のバリエーション）
const DEFAULT_CAT_COLORS: Record<string, string> = {
  ams_task:    "#2563eb",
  ext_mon:     "#7c3aed",
  eol:         "#059669",
  mail_hando:  "#d97706",
  ops_abuse:   "#0891b2",
  ops_ams:     "#06b6d4",
  ops_mail:    "#14b8a6",
  ops_ext_mon: "#2dd4bf",
  ops_mtg:     "#67e8f9",
  ops_etc:     "#5eead4",
  indirect:    "#78716c",
  leave:       "#94a3b8",
};

export const PLAN_GROUPS: PlanGroup[] = localConstants?.PLAN_GROUPS ?? DEFAULT_PLAN_GROUPS;
export const PLANLESS_GROUP_NAMES: Record<string, string> =
  localConstants?.PLANLESS_GROUP_NAMES ?? DEFAULT_PLANLESS_GROUP_NAMES;
export const CATEGORIES: Category[] = localConstants?.CATEGORIES ?? DEFAULT_CATEGORIES;
export const MONTHS: MonthOption[] = localConstants?.MONTHS ?? DEFAULT_MONTHS;
export const GROUP_COLORS: Record<string, string> =
  localConstants?.GROUP_COLORS ?? DEFAULT_GROUP_COLORS;
export const CAT_COLORS: Record<string, string> =
  localConstants?.CAT_COLORS ?? DEFAULT_CAT_COLORS;
