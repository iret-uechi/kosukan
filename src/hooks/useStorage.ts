import { useState, useCallback, useEffect } from "react";
import type { AppData, Plans } from "../types";
import { STORAGE_KEY, CATEGORIES } from "../constants";

function getDefaultPlans(): Plans {
  const plans: Plans = {};
  CATEGORIES.forEach((cat) => {
    plans[cat.id] = cat.defaultPlan;
  });
  return plans;
}

function getDefaultData(): AppData {
  return {
    entries: [],
    plans: getDefaultPlans(),
  };
}

function loadFromStorage(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const parsed = JSON.parse(raw) as AppData;
    // 新しいカテゴリが追加された場合の対応
    const defaults = getDefaultPlans();
    for (const key of Object.keys(defaults)) {
      if (!(key in parsed.plans)) {
        parsed.plans[key] = defaults[key];
      }
    }
    return parsed;
  } catch {
    return getDefaultData();
  }
}

export function useStorage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AppData>(getDefaultData);

  useEffect(() => {
    setData(loadFromStorage());
    setLoading(false);
  }, []);

  const save = useCallback((newData: AppData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
  }, []);

  const reset = useCallback(() => {
    const defaults = getDefaultData();
    setData(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  }, []);

  return { data, save, reset, loading };
}
