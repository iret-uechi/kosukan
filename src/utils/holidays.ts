// 対象期間の祝日一覧。
// テンプレ初期値として 2026年度 上期（4月〜9月）の日本祝日を入れています。
// 利用者は自身の対象期間に合わせて、この配列と下の getHolidayName の対応表を更新してください。
const HOLIDAYS_2026H1: string[] = [
  "2026-04-29", // 昭和の日
  "2026-05-03", // 憲法記念日
  "2026-05-04", // みどりの日
  "2026-05-05", // こどもの日
  "2026-05-06", // 振替休日
  "2026-07-20", // 海の日
  "2026-08-11", // 山の日
  "2026-09-21", // 敬老の日
  "2026-09-23", // 秋分の日
];

const holidaySet = new Set(HOLIDAYS_2026H1);

export function isHoliday(dateStr: string): boolean {
  return holidaySet.has(dateStr);
}

export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function isNonWorkday(dateStr: string): boolean {
  return isWeekend(dateStr) || isHoliday(dateStr);
}

export function getHolidayName(dateStr: string): string | null {
  const names: Record<string, string> = {
    "2026-04-29": "昭和の日",
    "2026-05-03": "憲法記念日",
    "2026-05-04": "みどりの日",
    "2026-05-05": "こどもの日",
    "2026-05-06": "振替休日",
    "2026-07-20": "海の日",
    "2026-08-11": "山の日",
    "2026-09-21": "敬老の日",
    "2026-09-23": "秋分の日",
  };
  return names[dateStr] || null;
}

// 次の営業日を返す（direction: 1=未来、-1=過去）
export function nextWorkday(dateStr: string, direction: 1 | -1): string {
  let d = new Date(dateStr + "T00:00:00");
  do {
    d.setDate(d.getDate() + direction);
  } while (isNonWorkday(formatDate(d)));
  return formatDate(d);
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
