import type { AppData } from "../types";
import { CATEGORIES, CAT_COLORS, HOURS_PER_DAY, DAYS_PER_MONTH } from "../constants";
import { getUniqueDates, getTotalHoursForDate } from "../utils/calc";
import { formatDateWithWeekday } from "../utils/date";
import { renderMarkdown } from "../utils/markdown";

interface Props {
  data: AppData;
  onSave: (data: AppData) => void;
  onEditDate: (date: string) => void;
  onToast: (msg: string) => void;
}

export function History({ data, onSave, onEditDate, onToast }: Props) {
  const dates = getUniqueDates(data.entries);

  function handleDelete(date: string) {
    if (!window.confirm(`${formatDateWithWeekday(date)} のデータを削除しますか？`)) return;
    const newEntries = data.entries.filter((e) => e.date !== date);
    onSave({ ...data, entries: newEntries });
    onToast("削除しました");
  }

  if (dates.length === 0) {
    return (
      <div style={{ padding: 16, textAlign: "center", color: "#94a3b8", marginTop: 40 }}>
        まだ入力データがありません
      </div>
    );
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {dates.map((date) => {
          const totalHours = getTotalHoursForDate(data.entries, date);
          const totalDays = totalHours / HOURS_PER_DAY;
          const totalMM = totalDays / DAYS_PER_MONTH;
          const entriesForDate = data.entries.filter((e) => e.date === date);

          return (
            <div
              key={date}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <div>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>
                    {formatDateWithWeekday(date)}
                  </span>
                  <span style={{ fontSize: 13, color: "#64748b", marginLeft: 8 }}>
                    {totalHours.toFixed(2)}h（{totalDays.toFixed(2)}人日 / {totalMM.toFixed(3)}人月）
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    onClick={() => onEditDate(date)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid #e2e8f0",
                      background: "#f8fafc",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    編集
                  </button>
                  <button
                    onClick={() => handleDelete(date)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      border: "1px solid #fecaca",
                      background: "#fef2f2",
                      color: "#dc2626",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    削除
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {entriesForDate.map((entry) => {
                  const cat = CATEGORIES.find((c) => c.id === entry.catId);
                  if (!cat) return null;
                  const color = CAT_COLORS[cat.id] || "#64748b";
                  return (
                    <div key={entry.id} style={{ display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "3px 10px",
                          borderRadius: 20,
                          background: `${color}15`,
                          color: color,
                          fontSize: 12,
                          fontWeight: 500,
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: color,
                          }}
                        />
                        {cat.name} {entry.hours}h
                      </span>
                      {entry.memo && (
                        <span
                          style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}
                          dangerouslySetInnerHTML={{ __html: renderMarkdown(entry.memo) }}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
