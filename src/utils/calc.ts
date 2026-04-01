import type { TimeEntry, Plans } from "../types";
import { HOURS_PER_DAY } from "../constants";

export function hoursToManDays(hours: number): number {
  return hours / HOURS_PER_DAY;
}

export function getTotalHoursForDate(entries: TimeEntry[], date: string): number {
  return entries
    .filter((e) => e.date === date)
    .reduce((sum, e) => sum + e.hours, 0);
}

export function getActualHoursByCat(
  entries: TimeEntry[],
  catId: string,
  monthFilter?: string
): number {
  return entries
    .filter(
      (e) =>
        e.catId === catId &&
        (!monthFilter || e.date.startsWith(monthFilter))
    )
    .reduce((sum, e) => sum + e.hours, 0);
}

export function getTotalActualHours(
  entries: TimeEntry[],
  monthFilter?: string
): number {
  return entries
    .filter((e) => !monthFilter || e.date.startsWith(monthFilter))
    .reduce((sum, e) => sum + e.hours, 0);
}

export function getTotalPlan(plans: Plans): number {
  return Object.values(plans).reduce((sum, v) => sum + v, 0);
}

export function getPlanForPeriod(
  plan: number,
  monthFilter?: string
): number {
  // 月フィルタ時は計画値を1/6に按分
  return monthFilter ? plan / 6 : plan;
}

export function getConsumptionRate(actual: number, plan: number): number {
  if (plan === 0) return actual > 0 ? 100 : 0;
  return (actual / plan) * 100;
}

export function getUniqueDates(entries: TimeEntry[]): string[] {
  const dates = [...new Set(entries.map((e) => e.date))];
  return dates.sort((a, b) => b.localeCompare(a));
}

export function getActualByMonth(
  entries: TimeEntry[],
  yearMonth: string
): number {
  return entries
    .filter((e) => e.date.startsWith(yearMonth))
    .reduce((sum, e) => sum + e.hours, 0);
}
