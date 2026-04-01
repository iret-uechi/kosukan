import { useState, useRef, useEffect } from "react";
import { renderMarkdown } from "../utils/markdown";

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
}

export function MemoField({ value, onChange, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 編集モードに入ったらフォーカス
  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      // カーソルを末尾に
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [editing]);

  // メモが空なら常に編集モード（プレースホルダー表示）
  if (!value && !editing) {
    return (
      <div style={{ marginTop: 4 }}>
        <div
          onClick={() => setEditing(true)}
          style={{
            width: "calc(100% - 0px)",
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px dashed #cbd5e1",
            background: "#f8fafc",
            fontSize: 13,
            color: "#94a3b8",
            cursor: "text",
            minHeight: 32,
            lineHeight: 1.5,
          }}
        >
          作業メモを追加（Markdown対応）
        </div>
      </div>
    );
  }

  // 編集モード
  if (editing) {
    const rows = value ? Math.min(Math.max(value.split("\n").length, 3), 10) : 3;
    return (
      <div style={{ marginTop: 4 }}>
        <textarea
          ref={textareaRef}
          value={value}
          placeholder="作業メモ（Markdown対応・複数行可）"
          onChange={(e) => onChange(e.target.value)}
          onBlur={() => {
            setEditing(false);
            onSave();
          }}
          rows={rows}
          style={{
            width: "100%",
            padding: "6px 8px",
            borderRadius: 6,
            border: "1px solid #2563eb",
            background: "#fff",
            fontSize: 13,
            color: "#334155",
            resize: "vertical",
            fontFamily: "'IBM Plex Mono', 'Menlo', monospace",
            lineHeight: 1.5,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <div style={{ marginTop: 2, fontSize: 11, color: "#b0b8c4" }}>
          **太字** / [リンク](URL) / `コード` / - リスト
        </div>
      </div>
    );
  }

  // 表示モード（Markdownレンダリング）
  return (
    <div style={{ marginTop: 4 }}>
      <div
        onClick={() => setEditing(true)}
        style={{
          width: "100%",
          padding: "6px 8px",
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          background: "#fff",
          fontSize: 13,
          color: "#334155",
          cursor: "text",
          lineHeight: 1.6,
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        <div
          dangerouslySetInnerHTML={{ __html: renderMarkdown(value) }}
          style={{ wordBreak: "break-word" }}
        />
        <div
          style={{
            position: "absolute",
            top: 4,
            right: 6,
            fontSize: 10,
            color: "#cbd5e1",
          }}
        >
          click to edit
        </div>
      </div>
    </div>
  );
}
