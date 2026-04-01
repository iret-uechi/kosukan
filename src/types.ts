export interface Category {
  id: string;
  name: string;
  defaultPlan: number; // 人日
}

export interface TimeEntry {
  date: string;   // "YYYY-MM-DD"
  catId: string;  // Category.id
  hours: number;  // 時間単位（0.25h刻み）
}

export interface Plans {
  [catId: string]: number; // 人日
}

export interface AppData {
  entries: TimeEntry[];
  plans: Plans;
}
