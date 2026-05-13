import type { AppData } from "../types";

const BACKUP_VERSION = 1;

export interface BackupFile {
  version: number;
  exportedAt: string;
  data: AppData;
  spreadsheetUrl?: string;
}

export function buildBackup(data: AppData, spreadsheetUrl?: string): BackupFile {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
    spreadsheetUrl: spreadsheetUrl || undefined,
  };
}

export function downloadJsonBackup(data: AppData, spreadsheetUrl?: string) {
  const payload = buildBackup(data, spreadsheetUrl);
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  a.download = `workload_backup_${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export type ParseResult =
  | { ok: true; backup: BackupFile }
  | { ok: false; error: string };

export function parseBackup(text: string): ParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, error: "JSON として読み込めませんでした" };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "バックアップ形式ではありません" };
  }
  const obj = parsed as Record<string, unknown>;
  const version = obj.version;
  if (typeof version !== "number") {
    return { ok: false, error: "version フィールドがありません" };
  }
  if (version !== BACKUP_VERSION) {
    return { ok: false, error: `未対応のバージョンです（${version}）` };
  }
  const data = obj.data as AppData | undefined;
  if (!data || !Array.isArray(data.entries) || typeof data.plans !== "object" || data.plans === null) {
    return { ok: false, error: "data フィールドが不正です" };
  }
  const spreadsheetUrl = typeof obj.spreadsheetUrl === "string" ? obj.spreadsheetUrl : undefined;
  return {
    ok: true,
    backup: {
      version,
      exportedAt: typeof obj.exportedAt === "string" ? obj.exportedAt : "",
      data,
      spreadsheetUrl,
    },
  };
}
