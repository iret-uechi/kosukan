import type { Category, PlanGroup } from "./types";

// 計画グループ（予算管理の単位）
export const PLAN_GROUPS: PlanGroup[] = [
  { id: "ams_task",    name: "AMS課題対応",        defaultPlan: 2.50 },
  { id: "ext_mon",     name: "External Monitoring", defaultPlan: 1.00 },
  { id: "eol",         name: "各種EOL対応",         defaultPlan: 0.75 },
  { id: "mail_hando",  name: "メール通知引継",       defaultPlan: 0.25 },
  { id: "ops",         name: "運用保守",            defaultPlan: 1.50 },
];

// 入力カテゴリ（日次記録の単位）
// 通常カテゴリ: 1グループ=1カテゴリ
// 運用保守: 1グループに複数カテゴリ（サービス別）
export const CATEGORIES: Category[] = [
  // AMS課題対応
  { id: "ams_task",       name: "AMS課題対応",               groupId: "ams_task" },
  // External Monitoring
  { id: "ext_mon",        name: "External Monitoring",       groupId: "ext_mon" },
  // 各種EOL対応
  { id: "eol",            name: "各種EOL対応",                groupId: "eol" },
  // メール通知引継
  { id: "mail_hando",     name: "メール通知引継",              groupId: "mail_hando" },
  // 運用保守（サービス別）
  { id: "ops_abuse",      name: "運用保守: Abuse傾向検知",     groupId: "ops" },
  { id: "ops_ams",        name: "運用保守: AMS",              groupId: "ops" },
  { id: "ops_mail",       name: "運用保守: メール通知システム",  groupId: "ops" },
  { id: "ops_ext_mon",    name: "運用保守: External Monitoring", groupId: "ops" },
  { id: "ops_mtg",        name: "運用保守: MTG（定例・会議）",   groupId: "ops" },
  { id: "ops_etc",        name: "運用保守: その他",            groupId: "ops" },
  // 計画外
  { id: "indirect",       name: "間接業務",                   groupId: "indirect" },
  { id: "leave",          name: "有休",                      groupId: "leave" },
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
export const DAYS_PER_MONTH = 20; // 1人月 = 20人日

export const STORAGE_KEY = "fy26h1-tracker-data";

// グループ別の色
export const GROUP_COLORS: Record<string, string> = {
  ams_task:   "#2563eb",
  ext_mon:    "#7c3aed",
  eol:        "#059669",
  mail_hando: "#d97706",
  ops:        "#0891b2",
  indirect:   "#78716c",
  leave:      "#94a3b8",
};

// カテゴリ別の色（運用保守サブカテゴリは同系色のバリエーション）
export const CAT_COLORS: Record<string, string> = {
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
