import type { AppData } from "../types";
import { PLAN_GROUPS, GROUP_COLORS, DAYS_PER_MONTH, HOURS_PER_DAY } from "../constants";
import { getTotalPlan } from "../utils/calc";
import { downloadCsv, parseCsv } from "../utils/csv";
import { downloadJsonBackup, parseBackup } from "../utils/backup";
import { useRef, useState } from "react";

interface Props {
  data: AppData;
  onSave: (data: AppData) => void;
  onReset: () => void;
  onToast: (msg: string) => void;
}

const SPREADSHEET_URL_KEY = "fy26h1-spreadsheet-url";

export function Settings({ data, onSave, onReset, onToast }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState(
    () => localStorage.getItem(SPREADSHEET_URL_KEY) || import.meta.env.VITE_SPREADSHEET_URL || ""
  );

  function handleUrlSave(url: string) {
    setSpreadsheetUrl(url);
    if (url) {
      localStorage.setItem(SPREADSHEET_URL_KEY, url);
    } else {
      localStorage.removeItem(SPREADSHEET_URL_KEY);
    }
    onToast("スプレッドシートURLを更新しました");
  }

  function handlePlanChange(groupId: string, value: string) {
    const plan = parseFloat(value) || 0;
    const newPlans = { ...data.plans, [groupId]: plan };
    onSave({ ...data, plans: newPlans });
    onToast("計画値を更新しました");
  }

  function handleReset() {
    if (!window.confirm("全データをリセットしますか？この操作は取り消せません。")) return;
    onReset();
    onToast("データをリセットしました");
  }

  function handleExport() {
    downloadCsv(data);
    onToast("CSVをダウンロードしました");
  }

  function handleImport() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const imported = parseCsv(text);
      if (imported.length === 0) {
        onToast("インポートできるデータがありませんでした");
        return;
      }

      // 既存データとマージ（同日・同カテゴリはCSV側で上書き）
      const existingMap = new Map(
        data.entries.map((e) => [`${e.date}_${e.catId}`, e])
      );
      for (const entry of imported) {
        existingMap.set(`${entry.date}_${entry.catId}`, entry);
      }
      const merged = [...existingMap.values()];
      onSave({ ...data, entries: merged });
      onToast(`${imported.length}件のデータをインポートしました`);
    };
    reader.readAsText(file);
    // 同じファイルの再選択を可能にする
    e.target.value = "";
  }

  function handleJsonExport() {
    downloadJsonBackup(data, spreadsheetUrl);
    onToast("バックアップ（JSON）をダウンロードしました");
  }

  function handleJsonImport() {
    jsonInputRef.current?.click();
  }

  function handleJsonFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const result = parseBackup(text);
      if (!result.ok) {
        onToast(`インポート失敗: ${result.error}`);
        return;
      }
      const totalEntries = result.backup.data.entries.length;
      const confirmed = window.confirm(
        `バックアップを復元します（${totalEntries}件）。\n` +
          `現在のデータは上書きされます。よろしいですか？`
      );
      if (!confirmed) return;
      onSave(result.backup.data);
      if (result.backup.spreadsheetUrl !== undefined) {
        handleUrlSave(result.backup.spreadsheetUrl);
      }
      onToast(`バックアップを復元しました（${totalEntries}件）`);
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  const totalPlan = getTotalPlan(data.plans);
  const totalDays = totalPlan * DAYS_PER_MONTH;
  const totalHours = totalDays * HOURS_PER_DAY;

  return (
    <div style={{ padding: 16 }}>
      {/* 計画工数編集 */}
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 0 }}>
        計画工数（人月 / 半期）
      </h3>
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {PLAN_GROUPS.map((group, i) => (
          <div
            key={group.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: i < PLAN_GROUPS.length - 1 ? "1px solid #f1f5f9" : "none",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: GROUP_COLORS[group.id] || "#64748b",
                flexShrink: 0,
                marginRight: 10,
              }}
            />
            <span style={{ flex: 1, fontSize: 14 }}>{group.name}</span>
            <input
              type="number"
              step="0.25"
              min="0"
              value={data.plans[group.id] ?? 0}
              onChange={(e) => handlePlanChange(group.id, e.target.value)}
              style={{
                width: 72,
                padding: "6px 8px",
                borderRadius: 6,
                border: "1px solid #e2e8f0",
                background: "#f8fafc",
                fontSize: 15,
                textAlign: "right",
              }}
            />
            <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: 4, width: 30 }}>人月</span>
          </div>
        ))}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "12px 16px",
            background: "#f8fafc",
            fontWeight: 600,
          }}
        >
          <span style={{ flex: 1, fontSize: 14 }}>合計</span>
          <span style={{ fontSize: 15, marginRight: 34 }}>
            {totalPlan.toFixed(2)} 人月
          </span>
        </div>
        <div
          style={{
            padding: "8px 16px",
            background: "#f8fafc",
            fontSize: 13,
            color: "#64748b",
            borderTop: "1px solid #f1f5f9",
          }}
        >
          = {totalDays.toFixed(0)} 人日 = {totalHours.toFixed(0)} 時間
        </div>
      </div>

      {/* マスターデータ参照 */}
      <div
        style={{
          marginTop: 20,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: 13,
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 6, color: "#475569" }}>工数割振り根拠</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="url"
            placeholder="スプレッドシートのURLを入力"
            value={spreadsheetUrl}
            onChange={(e) => setSpreadsheetUrl(e.target.value)}
            onBlur={(e) => handleUrlSave(e.target.value)}
            style={{
              flex: 1,
              padding: "6px 8px",
              borderRadius: 6,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              fontSize: 13,
            }}
          />
          {spreadsheetUrl && (
            <a
              href={spreadsheetUrl}
              target="_blank"
              rel="noopener"
              style={{ color: "#2563eb", fontSize: 13, whiteSpace: "nowrap" }}
            >
              開く &#x2197;
            </a>
          )}
        </div>
      </div>

      {/* 換算表 */}
      <div
        style={{
          marginTop: 12,
          background: "#f8fafc",
          borderRadius: 10,
          padding: "12px 16px",
          fontSize: 13,
          color: "#64748b",
        }}
      >
        <div style={{ fontWeight: 600, marginBottom: 4, color: "#475569" }}>換算</div>
        <div>1人月 = {DAYS_PER_MONTH}人日 = {DAYS_PER_MONTH * HOURS_PER_DAY}h</div>
      </div>

      {/* データ管理 */}
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 28 }}>
        データ管理
      </h3>

      {/* CSV エクスポート / インポート */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>CSV</div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12, marginTop: 0 }}>
          日次入力データをCSVファイルとしてエクスポート・インポートできます。
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleExport}
            disabled={data.entries.length === 0}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: data.entries.length > 0 ? "#f8fafc" : "#f1f5f9",
              color: data.entries.length > 0 ? "#334155" : "#94a3b8",
              fontSize: 14,
              fontWeight: 500,
              cursor: data.entries.length > 0 ? "pointer" : "default",
            }}
          >
            エクスポート
          </button>
          <button
            onClick={handleImport}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#334155",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            インポート
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* JSON バックアップ / 復元 */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>バックアップ（JSON）</div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12, marginTop: 0 }}>
          実績・計画値・スプレッドシートURLを 1 ファイルにまとめて保存・復元します。別端末への移行や定期バックアップにご利用ください。
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleJsonExport}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#334155",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            バックアップ取得
          </button>
          <button
            onClick={handleJsonImport}
            style={{
              padding: "8px 20px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              color: "#334155",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            バックアップ復元
          </button>
          <input
            ref={jsonInputRef}
            type="file"
            accept=".json,application/json"
            style={{ display: "none" }}
            onChange={handleJsonFileChange}
          />
        </div>
      </div>

      {/* デンジャーゾーン */}
      <div
        style={{
          marginTop: 16,
          border: "2px solid #fecaca",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, color: "#dc2626", marginTop: 0, marginBottom: 8 }}>
          デンジャーゾーン
        </h3>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>
          全ての入力データと計画値を初期状態にリセットします。
        </p>
        <button
          onClick={handleReset}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            background: "#dc2626",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          全データリセット
        </button>
      </div>
    </div>
  );
}
