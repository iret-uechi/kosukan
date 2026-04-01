// 計画グループ（予算管理の単位）
export interface PlanGroup {
  id: string;
  name: string;
  defaultPlan: number; // 人月
}

// 入力カテゴリ（日次記録の単位）
export interface Category {
  id: string;
  name: string;
  groupId: string; // PlanGroup.id
}

export interface TimeEntry {
  id: string;     // ユニークID
  date: string;   // "YYYY-MM-DD"
  catId: string;  // Category.id
  hours: number;  // 時間単位
  memo?: string;  // 作業メモ
}

// 計画値はグループ単位（人月）
export interface Plans {
  [groupId: string]: number; // 人月
}

export interface AppData {
  entries: TimeEntry[];
  plans: Plans;
}
