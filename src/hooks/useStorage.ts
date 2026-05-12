import { useState, useCallback } from "react";
import type { AppData, Plans, TimeEntry } from "../types";
import { STORAGE_KEY, PLAN_GROUPS } from "../constants";
import { generateId } from "../utils/id";

function getDefaultPlans(): Plans {
  const plans: Plans = {};
  PLAN_GROUPS.forEach((g) => {
    plans[g.id] = g.defaultPlan;
  });
  return plans;
}

function getDefaultData(): AppData {
  return {
    entries: [],
    plans: getDefaultPlans(),
  };
}

// idがないエントリにidを付与するマイグレーション
function migrateEntries(entries: TimeEntry[]): TimeEntry[] {
  return entries.map((e) => (e.id ? e : { ...e, id: generateId() }));
}

function loadFromLocalStorage(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw) as AppData;
    const defaults = getDefaultPlans();
    for (const key of Object.keys(defaults)) {
      if (!(key in parsed.plans)) {
        parsed.plans[key] = defaults[key];
      }
    }
    parsed.entries = migrateEntries(parsed.entries);
    return parsed;
  } catch {
    return getDefaultData();
  }
}

export function useStorage() {
  const [data, setData] = useState<AppData>(loadFromLocalStorage);

  const save = useCallback((newData: AppData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const reset = useCallback(() => {
    const defaults = getDefaultData();
    setData(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  }, []);

  return { data, save, reset, loading: false };
}
