import type { AppData, TimeEntry } from "../types";
import { CATEGORIES, CAT_COLORS, HOURS_PER_DAY } from "../constants";
import { getToday, addDays, formatDateWithWeekday } from "../utils/date";
import { getTotalHoursForDate } from "../utils/calc";
import { useState } from "react";

interface Props {
  data: AppData;
  onSave: (data: AppData) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onToast: (msg: string) => void;
}

export function DailyEntry({ data, onSave, selectedDate, onDateChange, onToast }: Props) {
  const [, setRender] = useState(0);

  function getHours(catId: string): number {
    const entry = data.entries.find(
      (e) => e.date === selectedDate && e.catId === catId
    );
    return entry ? entry.hours : 0;
  }

  function handleChange(catId: string, value: string) {
    const hours = parseFloat(value) || 0;
    let newEntries: TimeEntry[];

    if (hours === 0) {
      // 0の場合はエントリを削除
      newEntries = data.entries.filter(
        (e) => !(e.date === selectedDate && e.catId === catId)
      );
    } else {
      const existing = data.entries.find(
        (e) => e.date === selectedDate && e.catId === catId
      );
      if (existing) {
        newEntries = data.entries.map((e) =>
          e.date === selectedDate && e.catId === catId
            ? { ...e, hours }
            : e
        );
      } else {
        newEntries = [...data.entries, { date: selectedDate, catId, hours }];
      }
    }

    onSave({ ...data, entries: newEntries });
    onToast("保存しました");
    setRender((n) => n + 1);
  }

  const totalHours = getTotalHoursForDate(data.entries, selectedDate);
  const totalDays = totalHours / HOURS_PER_DAY;

  return (
    <div style={{ padding: 16 }}>
      {/* 日付セレクタ */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 16,
          justifyContent: "center",
        }}
      >
        <button
          onClick={() => onDateChange(addDays(selectedDate, -1))}
          style={navBtnStyle}
        >
          ◀
        </button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            fontSize: 15,
            background: "#f8fafc",
          }}
        />
        <button
          onClick={() => onDateChange(addDays(selectedDate, 1))}
          style={navBtnStyle}
        >
          ▶
        </button>
        <button
          onClick={() => onDateChange(getToday())}
          style={{
            padding: "8px 12px",
            borderRadius: 6,
            border: "1px solid #e2e8f0",
            background: "#f8fafc",
            fontSize: 13,
            cursor: "pointer",
          }}
        >
          今日
        </button>
      </div>

      <div style={{ textAlign: "center", marginBottom: 16, fontSize: 14, color: "#64748b" }}>
        {formatDateWithWeekday(selectedDate)}
      </div>

      {/* カテゴリ別入力 */}
      <div
        style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {CATEGORIES.map((cat, i) => (
          <div
            key={cat.id}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "12px 16px",
              borderBottom: i < CATEGORIES.length - 1 ? "1px solid #f1f5f9" : "none",
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: CAT_COLORS[i],
                flexShrink: 0,
                marginRight: 10,
              }}
            />
            <span style={{ flex: 1, fontSize: 14 }}>{cat.name}</span>
            <input
              type="number"
              step="0.25"
              min="0"
              value={getHours(cat.id) || ""}
              placeholder="0"
              onChange={(e) => handleChange(cat.id, e.target.value)}
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
            <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: 4, width: 14 }}>h</span>
          </div>
        ))}
      </div>

      {/* 当日合計 */}
      <div
        style={{
          marginTop: 16,
          padding: "12px 16px",
          background: "#f8fafc",
          borderRadius: 10,
          textAlign: "center",
          fontSize: 15,
          fontWeight: 600,
          color: "#334155",
        }}
      >
        本日合計: {totalHours.toFixed(2)}h（{totalDays.toFixed(2)} 人日）
      </div>
    </div>
  );
}

const navBtnStyle: React.CSSProperties = {
  width: 36,
  height: 36,
  borderRadius: 6,
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
  fontSize: 14,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
