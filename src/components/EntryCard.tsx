import { useState, useRef, useEffect } from "react";
import type { TimeEntry } from "../types";
import { HOURS_PER_DAY, DAYS_PER_MONTH } from "../constants";
import { renderMarkdown } from "../utils/markdown";

interface Props {
  entry: TimeEntry;
  isNew?: boolean;
  onUpdateHours: (id: string, value: string) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  onRemove: (id: string) => void;
  onToast: (msg: string) => void;
}

function formatConversion(hours: number): string {
  const days = hours / HOURS_PER_DAY;
  const mm = days / DAYS_PER_MONTH;
  return `${hours}h（${days.toFixed(2)}人日 / ${mm.toFixed(3)}人月）`;
}

export function EntryCard({ entry, isNew, onUpdateHours, onUpdateMemo, onRemove, onToast }: Props) {
  const [editing, setEditing] = useState(!!isNew);
  const [localHours, setLocalHours] = useState(String(entry.hours));
  const [localMemo, setLocalMemo] = useState(entry.memo || "");
  const hoursRef = useRef<HTMLInputElement>(null);
  const memoRef = useRef<HTMLTextAreaElement>(null);

  // 新規追加時に時間inputにフォーカス
  useEffect(() => {
    if (editing && hoursRef.current) {
      hoursRef.current.focus();
      hoursRef.current.select();
    }
  }, [editing]);

  // 外部からのentry変更を反映
  useEffect(() => {
    if (!editing) {
      setLocalHours(String(entry.hours));
      setLocalMemo(entry.memo || "");
    }
  }, [entry.hours, entry.memo, editing]);

  function handleSave() {
    const hours = parseFloat(localHours) || 0;
    if (hours <= 0) {
      onRemove(entry.id);
      return;
    }
    onUpdateHours(entry.id, localHours);
    onUpdateMemo(entry.id, localMemo);
    setEditing(false);
    onToast("保存しました");
  }

  function handleCancel() {
    if (isNew && (parseFloat(localHours) || 0) <= 0) {
      onRemove(entry.id);
      return;
    }
    setLocalHours(String(entry.hours));
    setLocalMemo(entry.memo || "");
    setEditing(false);
  }

  // ─── 編集モード ───
  if (editing) {
    const memoRows = localMemo ? Math.min(Math.max(localMemo.split("\n").length, 2), 8) : 2;
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding: "10px 12px",
          background: "#fff",
          borderRadius: 8,
          border: "1px solid #2563eb",
          boxShadow: "0 0 0 1px #2563eb20",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <input
            ref={hoursRef}
            type="number"
            step="0.25"
            min="0"
            value={localHours}
            onChange={(e) => setLocalHours(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") memoRef.current?.focus(); }}
            style={{
              width: 60,
              padding: "4px 6px",
              borderRadius: 5,
              border: "1px solid #e2e8f0",
              background: "#f8fafc",
              fontSize: 14,
              textAlign: "right",
            }}
          />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>h</span>
          <span style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>
            = {formatConversion(parseFloat(localHours) || 0)}
          </span>
        </div>
        <textarea
          ref={memoRef}
          value={localMemo}
          placeholder="作業メモ（Markdown対応）"
          onChange={(e) => setLocalMemo(e.target.value)}
          rows={memoRows}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            fontSize: 13,
            color: "#334155",
            resize: "vertical",
            fontFamily: "'IBM Plex Mono', 'Menlo', monospace",
            lineHeight: 1.5,
            boxSizing: "border-box",
          }}
        />
        <div style={{ fontSize: 11, color: "#b0b8c4" }}>
          **太字** / [リンク](URL) / `コード` / - リスト
        </div>
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <button onClick={handleCancel} style={cancelBtnStyle}>
            キャンセル
          </button>
          <button onClick={handleSave} style={saveBtnStyle}>
            保存
          </button>
        </div>
      </div>
    );
  }

  // ─── 表示モード ───
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 2,
        padding: "8px 10px",
        background: "#fff",
        borderRadius: 8,
        border: "1px solid #e9ecef",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
          {entry.hours}h
        </span>
        <span style={{ fontSize: 11, color: "#94a3b8", flex: 1 }}>
          {formatConversion(entry.hours)}
        </span>
        <button
          onClick={() => setEditing(true)}
          style={iconBtnStyle}
          title="編集"
        >
          &#9998;
        </button>
        <button
          onClick={() => onRemove(entry.id)}
          style={{ ...iconBtnStyle, color: "#cbd5e1" }}
          title="削除"
        >
          ×
        </button>
      </div>
      {entry.memo && (
        <div
          dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.memo) }}
          style={{
            fontSize: 13,
            color: "#475569",
            lineHeight: 1.6,
            wordBreak: "break-word",
            marginTop: 2,
          }}
        />
      )}
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 4,
  border: "none",
  background: "transparent",
  color: "#94a3b8",
  fontSize: 13,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
  padding: 0,
};

const saveBtnStyle: React.CSSProperties = {
  padding: "4px 14px",
  borderRadius: 6,
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontSize: 12,
  fontWeight: 600,
  cursor: "pointer",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "4px 14px",
  borderRadius: 6,
  border: "1px solid #e2e8f0",
  background: "#fff",
  color: "#64748b",
  fontSize: 12,
  cursor: "pointer",
};
