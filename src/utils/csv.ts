import type { AppData } from "../types";
import { CATEGORIES, HOURS_PER_DAY, DAYS_PER_MONTH } from "../constants";
import { generateId } from "./id";

/**
 * CSVフォーマット仕様（スプレッドシート互換）
 *
 * - 文字コード: UTF-8（BOM付き）
 * - 改行: CRLF（\r\n）
 * - 区切り: カンマ
 * - 文字列フィールド: ダブルクォートで囲む
 * - 数値フィールド: クォートなし
 * - マルチラインフィールド: ダブルクォート内に改行を含む（RFC 4180準拠）
 *
 * カラム定義:
 * | # | カラム名     | 型     | 説明                              |
 * |---|-------------|--------|-----------------------------------|
 * | 1 | 日付         | string | YYYY-MM-DD形式                    |
 * | 2 | カテゴリID    | string | 内部識別子（ams_task等）            |
 * | 3 | カテゴリ名    | string | 表示名                            |
 * | 4 | グループID    | string | 計画グループの識別子               |
 * | 5 | グループ名    | string | 計画グループの表示名               |
 * | 6 | 時間(h)      | number | 入力値（時間単位）                 |
 * | 7 | 人日         | number | 時間÷8（小数4桁）                  |
 * | 8 | 人月         | number | 人日÷20（小数6桁）                 |
 * | 9 | メモ         | string | 作業内容メモ（Markdown対応、改行可）|
 */

const CSV_COLUMNS = [
  "日付", "カテゴリID", "カテゴリ名", "グループID", "グループ名",
  "時間(h)", "人日", "人月", "メモ",
];

const BOM = "\uFEFF";
const CRLF = "\r\n";

// ダブルクォートで囲む（内部のダブルクォートはエスケープ）
function q(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

// 全エントリをCSVとして出力（CRLF改行、RFC 4180準拠）
export function exportToCsv(data: AppData): string {
  const lines: string[] = [];

  lines.push(CSV_COLUMNS.join(","));

  const sorted = [...data.entries].sort((a, b) => {
    const dateCmp = a.date.localeCompare(b.date);
    if (dateCmp !== 0) return dateCmp;
    return a.catId.localeCompare(b.catId);
  });

  for (const entry of sorted) {
    const cat = CATEGORIES.find((c) => c.id === entry.catId);
    const catName = cat ? cat.name : entry.catId;
    const groupId = cat ? cat.groupId : "";
    const groupName = cat ? getGroupName(cat.groupId) : "";
    const manDays = entry.hours / HOURS_PER_DAY;
    const manMonths = manDays / DAYS_PER_MONTH;

    lines.push(
      [
        q(entry.date),
        q(entry.catId),
        q(catName),
        q(groupId),
        q(groupName),
        entry.hours,
        manDays.toFixed(4),
        manMonths.toFixed(6),
        q(entry.memo || ""),
      ].join(",")
    );
  }

  return lines.join(CRLF) + CRLF;
}

function getGroupName(groupId: string): string {
  const names: Record<string, string> = {
    ams_task: "AMS課題対応",
    ext_mon: "External Monitoring",
    eol: "各種EOL対応",
    mail_hando: "メール通知引継",
    ops: "運用保守",
    indirect: "間接業務",
    leave: "有休",
  };
  return names[groupId] || groupId;
}

// CSVファイルをダウンロード（BOM付き）
export function downloadCsv(data: AppData) {
  const csv = exportToCsv(data);
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const now = new Date();
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  a.download = `workload_${dateStr}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * RFC 4180準拠のCSVパーサー
 * ダブルクォート内の改行（マルチラインフィールド）に対応
 */
export function parseCsv(csvText: string): AppData["entries"] {
  const text = csvText.replace(/^\uFEFF/, "");
  const records = parseCsvRecords(text);
  if (records.length < 2) return [];

  // ヘッダーからカラム位置を動的に判定
  const header = records[0];
  const dateIdx = findCol(header, "日付");
  const catIdIdx = findCol(header, "カテゴリID");
  const hoursIdx = findCol(header, "時間(h)", "時間");
  const memoIdx = findCol(header, "メモ");

  if (dateIdx < 0 || catIdIdx < 0 || hoursIdx < 0) return [];

  const entries: AppData["entries"] = [];
  for (let i = 1; i < records.length; i++) {
    const cols = records[i];
    const date = cols[dateIdx]?.trim();
    const catId = cols[catIdIdx]?.trim();
    const hours = parseFloat(cols[hoursIdx]);
    const memo = memoIdx >= 0 ? (cols[memoIdx] ?? "") : "";
    if (!date || !catId || isNaN(hours) || hours <= 0) continue;
    entries.push({ id: generateId(), date, catId, hours, memo: memo || undefined });
  }
  return entries;
}

function findCol(header: string[], ...names: string[]): number {
  for (const name of names) {
    const idx = header.findIndex((h) => h.trim() === name);
    if (idx >= 0) return idx;
  }
  return -1;
}

/**
 * CSV全体をレコード（行）の配列にパース
 * ダブルクォート内の改行・カンマ・ダブルクォートエスケープに対応
 */
function parseCsvRecords(text: string): string[][] {
  const records: string[][] = [];
  let i = 0;
  const len = text.length;

  while (i < len) {
    const { fields, nextPos } = parseRecord(text, i);
    if (fields.length > 0 && !(fields.length === 1 && fields[0] === "")) {
      records.push(fields);
    }
    i = nextPos;
  }

  return records;
}

function parseRecord(text: string, start: number): { fields: string[]; nextPos: number } {
  const fields: string[] = [];
  let i = start;
  const len = text.length;

  while (i < len) {
    if (text[i] === '"') {
      // クォートフィールド
      const { value, nextPos } = parseQuotedField(text, i);
      fields.push(value);
      i = nextPos;
    } else if (text[i] === ',' ) {
      // 空フィールドまたはフィールド区切り
      if (fields.length === 0) {
        fields.push("");
      }
      i++;
      // 行末のカンマの後に改行/EOFが来たら空フィールドを追加
      if (i >= len || text[i] === '\r' || text[i] === '\n') {
        fields.push("");
      }
      continue;
    } else if (text[i] === '\r' || text[i] === '\n') {
      // レコード終端
      if (text[i] === '\r' && i + 1 < len && text[i + 1] === '\n') {
        i += 2;
      } else {
        i++;
      }
      break;
    } else {
      // 非クォートフィールド
      const { value, nextPos } = parseUnquotedField(text, i);
      fields.push(value);
      i = nextPos;
    }

    // フィールド後のカンマをスキップ
    if (i < len && text[i] === ',') {
      i++;
      // 次がEOFまたは改行なら空フィールドを追加
      if (i >= len || text[i] === '\r' || text[i] === '\n') {
        fields.push("");
      }
    } else if (i < len && (text[i] === '\r' || text[i] === '\n')) {
      // レコード終端
      if (text[i] === '\r' && i + 1 < len && text[i + 1] === '\n') {
        i += 2;
      } else {
        i++;
      }
      break;
    }
  }

  return { fields, nextPos: i };
}

function parseQuotedField(text: string, start: number): { value: string; nextPos: number } {
  let i = start + 1; // 開始クォートの次から
  let value = "";
  const len = text.length;

  while (i < len) {
    if (text[i] === '"') {
      if (i + 1 < len && text[i + 1] === '"') {
        // エスケープされたクォート
        value += '"';
        i += 2;
      } else {
        // フィールド終端
        i++; // 閉じクォートの次へ
        break;
      }
    } else {
      // 改行もそのまま値に含める（マルチラインフィールド）
      value += text[i];
      i++;
    }
  }

  return { value, nextPos: i };
}

function parseUnquotedField(text: string, start: number): { value: string; nextPos: number } {
  let i = start;
  let value = "";
  const len = text.length;

  while (i < len && text[i] !== ',' && text[i] !== '\r' && text[i] !== '\n') {
    value += text[i];
    i++;
  }

  return { value, nextPos: i };
}
