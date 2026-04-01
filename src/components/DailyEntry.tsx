import type { AppData, TimeEntry } from "../types";
import { CATEGORIES, PLAN_GROUPS, CAT_COLORS, GROUP_COLORS, HOURS_PER_DAY, DAYS_PER_MONTH } from "../constants";
import { getToday, addDays, formatDateWithWeekday } from "../utils/date";
import { getTotalHoursForDate } from "../utils/calc";
import { generateId } from "../utils/id";
import { EntryCard } from "./EntryCard";
import { useState, useRef, useEffect, useCallback } from "react";

interface Props {
  data: AppData;
  onSave: (data: AppData) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  onToast: (msg: string) => void;
}

// 「+」ボタン → カテゴリ選択ポップオーバー
function AddMenu({ categories, onSelect }: {
  categories: { id: string; label: string; color: string }[];
  onSelect: (catId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          border: "1px solid #e2e8f0",
          background: open ? "#f1f5f9" : "#fff",
          fontSize: 16,
          color: "#2563eb",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          lineHeight: 1,
          flexShrink: 0,
        }}
        title="追加"
      >
        +
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: 28,
            right: 0,
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            zIndex: 50,
            minWidth: 180,
            padding: 4,
          }}
        >
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => { onSelect(c.id); setOpen(false); }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "7px 10px",
                border: "none",
                background: "transparent",
                borderRadius: 6,
                fontSize: 13,
                color: "#334155",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "#f8fafc"; }}
              onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "transparent"; }}
            >
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: c.color, flexShrink: 0 }} />
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function DailyEntry({ data, onSave, selectedDate, onDateChange, onToast }: Props) {
  // 新規追加されたエントリIDを追跡（編集モードで開始するため）
  const [newEntryIds, setNewEntryIds] = useState<Set<string>>(new Set());

  function getEntriesForCat(catId: string): TimeEntry[] {
    return data.entries.filter(
      (e) => e.date === selectedDate && e.catId === catId
    );
  }

  function getGroupTotalHours(groupId: string): number {
    const catIds = CATEGORIES.filter((c) => c.groupId === groupId).map((c) => c.id);
    return data.entries
      .filter((e) => e.date === selectedDate && catIds.includes(e.catId))
      .reduce((s, e) => s + e.hours, 0);
  }

  function addEntry(catId: string) {
    const id = generateId();
    const newEntry: TimeEntry = { id, date: selectedDate, catId, hours: 1 };
    onSave({ ...data, entries: [...data.entries, newEntry] });
    setNewEntryIds((prev) => new Set(prev).add(id));
  }

  const updateEntryHours = useCallback((entryId: string, value: string) => {
    const hours = parseFloat(value) || 0;
    if (hours <= 0) {
      const newEntries = data.entries.filter((e) => e.id !== entryId);
      onSave({ ...data, entries: newEntries });
      return;
    }
    const newEntries = data.entries.map((e) =>
      e.id === entryId ? { ...e, hours } : e
    );
    onSave({ ...data, entries: newEntries });
    // 保存されたらnewフラグを消す
    setNewEntryIds((prev) => {
      const next = new Set(prev);
      next.delete(entryId);
      return next;
    });
  }, [data, onSave]);

  const updateEntryMemo = useCallback((entryId: string, memo: string) => {
    const newEntries = data.entries.map((e) =>
      e.id === entryId ? { ...e, memo: memo || undefined } : e
    );
    onSave({ ...data, entries: newEntries });
  }, [data, onSave]);

  const removeEntry = useCallback((entryId: string) => {
    const newEntries = data.entries.filter((e) => e.id !== entryId);
    onSave({ ...data, entries: newEntries });
    onToast("削除しました");
  }, [data, onSave, onToast]);

  const totalHours = getTotalHoursForDate(data.entries, selectedDate);
  const totalDays = totalHours / HOURS_PER_DAY;
  const totalMM = totalDays / DAYS_PER_MONTH;

  const groupedSections = PLAN_GROUPS.map((group) => ({
    group,
    categories: CATEGORIES.filter((c) => c.groupId === group.id),
  }));
  const unplannedCategories = CATEGORIES.filter(
    (c) => !PLAN_GROUPS.some((g) => g.id === c.groupId)
  );

  // サブカテゴリ行（エントリがある場合のみ）
  function renderActiveCatRow(cat: typeof CATEGORIES[number], label: string, showBorder: boolean) {
    const entries = getEntriesForCat(cat.id);
    if (entries.length === 0) return null;
    const catTotal = entries.reduce((s, e) => s + e.hours, 0);
    return (
      <div
        key={cat.id}
        style={{
          padding: "8px 16px 8px 28px",
          borderBottom: showBorder ? "1px solid #f1f5f9" : "none",
          background: "#fafbfc",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: CAT_COLORS[cat.id],
              flexShrink: 0,
              marginRight: 8,
            }}
          />
          <span style={{ flex: 1, fontSize: 13, color: "#475569" }}>{label}</span>
          <span style={{ fontSize: 12, color: "#64748b", marginRight: 4 }}>
            計 {catTotal}h
          </span>
          <button onClick={() => addEntry(cat.id)} style={plusIconStyle} title="追加">+</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 16 }}>
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              isNew={newEntryIds.has(entry.id)}
              onUpdateHours={updateEntryHours}
              onUpdateMemo={updateEntryMemo}
              onRemove={removeEntry}
              onToast={onToast}
            />
          ))}
        </div>
      </div>
    );
  }

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
        <button onClick={() => onDateChange(addDays(selectedDate, -1))} style={navBtnStyle}>
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
        <button onClick={() => onDateChange(addDays(selectedDate, 1))} style={navBtnStyle}>
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

      {/* ─── 計画グループ ─── */}
      {groupedSections.map(({ group, categories }) => {
        const groupColor = GROUP_COLORS[group.id] || "#64748b";
        const groupTotal = getGroupTotalHours(group.id);
        const hasMultipleCats = categories.length > 1;

        const menuItems = hasMultipleCats
          ? categories.map((c) => ({
              id: c.id,
              label: c.name.replace(`${group.name}: `, ""),
              color: CAT_COLORS[c.id] || groupColor,
            }))
          : [{ id: categories[0].id, label: group.name, color: groupColor }];

        return (
          <div
            key={group.id}
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 12,
              overflow: "visible",
              marginBottom: 12,
              borderLeft: `4px solid ${groupColor}`,
              position: "relative",
            }}
          >
            {/* グループヘッダー */}
            <div
              style={{
                padding: "10px 16px",
                background: `${groupColor}08`,
                borderBottom: groupTotal > 0 ? "1px solid #f1f5f9" : "none",
                display: "flex",
                alignItems: "center",
                borderRadius: "0 12px 0 0",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: "50%",
                  background: groupColor,
                  marginRight: 8,
                  flexShrink: 0,
                }}
              />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: "#1e293b" }}>
                {group.name}
              </span>
              {groupTotal > 0 && (
                <span style={{ fontSize: 12, fontWeight: 600, color: groupColor, marginRight: 8 }}>
                  {groupTotal}h
                </span>
              )}
              <AddMenu categories={menuItems} onSelect={addEntry} />
            </div>

            {/* エントリ表示 */}
            {hasMultipleCats ? (
              (() => {
                const activeCats = categories.filter(
                  (c) => getEntriesForCat(c.id).length > 0
                );
                if (activeCats.length === 0) return null;
                return activeCats.map((cat, i) =>
                  renderActiveCatRow(
                    cat,
                    cat.name.replace(`${group.name}: `, ""),
                    i < activeCats.length - 1
                  )
                );
              })()
            ) : (
              (() => {
                const entries = getEntriesForCat(categories[0].id);
                if (entries.length === 0) return null;
                return (
                  <div style={{ padding: "8px 16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {entries.map((entry) => (
                        <EntryCard
                          key={entry.id}
                          entry={entry}
                          isNew={newEntryIds.has(entry.id)}
                          onUpdateHours={updateEntryHours}
                          onUpdateMemo={updateEntryMemo}
                          onRemove={removeEntry}
                          onToast={onToast}
                        />
                      ))}
                    </div>
                  </div>
                );
              })()
            )}
          </div>
        );
      })}

      {/* ─── 計画外セクション ─── */}
      {(() => {
        const hasAnyUnplanned = unplannedCategories.some(
          (c) => getEntriesForCat(c.id).length > 0
        );
        const menuItems = unplannedCategories.map((c) => ({
          id: c.id,
          label: c.name,
          color: CAT_COLORS[c.id] || "#94a3b8",
        }));

        return (
          <div style={{ marginTop: 20, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ height: 1, flex: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, letterSpacing: 1 }}>
                計画外
              </span>
              <div style={{ height: 1, flex: 1, background: "#e2e8f0" }} />
              <AddMenu categories={menuItems} onSelect={addEntry} />
            </div>

            {hasAnyUnplanned && (
              <div
                style={{
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: 12,
                  overflow: "hidden",
                  borderLeft: "4px solid #cbd5e1",
                }}
              >
                {unplannedCategories.map((cat, i) => {
                  const entries = getEntriesForCat(cat.id);
                  if (entries.length === 0) return null;
                  const catTotal = entries.reduce((s, e) => s + e.hours, 0);
                  return (
                    <div
                      key={cat.id}
                      style={{
                        padding: "10px 16px",
                        borderBottom: i < unplannedCategories.length - 1 ? "1px solid #f1f5f9" : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                        <span
                          style={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            background: CAT_COLORS[cat.id],
                            flexShrink: 0,
                            marginRight: 8,
                          }}
                        />
                        <span style={{ flex: 1, fontSize: 14, color: "#1e293b" }}>{cat.name}</span>
                        <span style={{ fontSize: 12, color: "#64748b", marginRight: 4 }}>
                          計 {catTotal}h
                        </span>
                        <button onClick={() => addEntry(cat.id)} style={plusIconStyle} title="追加">+</button>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginLeft: 18 }}>
                        {entries.map((entry) => (
                          <EntryCard
                            key={entry.id}
                            entry={entry}
                            isNew={newEntryIds.has(entry.id)}
                            onUpdateHours={updateEntryHours}
                            onUpdateMemo={updateEntryMemo}
                            onRemove={removeEntry}
                            onToast={onToast}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* 当日合計 */}
      <div
        style={{
          marginTop: 4,
          padding: "12px 16px",
          background: "linear-gradient(135deg, #1e293b, #334155)",
          borderRadius: 10,
          textAlign: "center",
          fontSize: 15,
          fontWeight: 600,
          color: "#fff",
        }}
      >
        本日合計: {totalHours}h（{totalDays.toFixed(2)}人日 / {totalMM.toFixed(3)}人月）
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

const plusIconStyle: React.CSSProperties = {
  width: 22,
  height: 22,
  borderRadius: 5,
  border: "1px solid #e2e8f0",
  background: "#fff",
  fontSize: 15,
  color: "#2563eb",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  lineHeight: 1,
  flexShrink: 0,
  padding: 0,
};
