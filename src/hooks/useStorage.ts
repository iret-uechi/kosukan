import { useState, useCallback, useEffect } from "react";
import type { AppData, Plans, TimeEntry } from "../types";
import { STORAGE_KEY, PLAN_GROUPS } from "../constants";
import { exportToCsvWithBom, parseCsv } from "../utils/csv";
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

async function loadFromServer(): Promise<AppData | null> {
  try {
    const [csvRes, plansRes] = await Promise.all([
      fetch("/api/data"),
      fetch("/api/plans"),
    ]);

    const defaults = getDefaultData();

    let entries = defaults.entries;
    if (csvRes.ok) {
      const csvText = await csvRes.text();
      const parsed = parseCsv(csvText);
      if (parsed.length > 0) {
        entries = migrateEntries(parsed);
      }
    }

    let plans = defaults.plans;
    if (plansRes.ok) {
      const plansJson = await plansRes.json();
      if (plansJson && typeof plansJson === "object") {
        plans = { ...defaults.plans, ...plansJson };
      }
    }

    return { entries, plans };
  } catch {
    return null;
  }
}

async function saveToServer(data: AppData): Promise<void> {
  try {
    const csv = exportToCsvWithBom(data);
    await Promise.all([
      fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      }),
      fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data.plans),
      }),
    ]);
  } catch {
    // サーバー保存に失敗してもlocalStorageには保存済み
  }
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
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AppData>(getDefaultData);

  useEffect(() => {
    loadFromServer().then((serverData) => {
      if (serverData && serverData.entries.length > 0) {
        setData(serverData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serverData));
      } else {
        setData(loadFromLocalStorage());
      }
      setLoading(false);
    });
  }, []);

  const save = useCallback((newData: AppData) => {
    setData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData));
    saveToServer(newData);
  }, []);

  const reset = useCallback(() => {
    const defaults = getDefaultData();
    setData(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
    saveToServer(defaults);
  }, []);

  return { data, save, reset, loading };
}
