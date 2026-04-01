import type { AppData } from "../types";
import { CATEGORIES, CAT_COLORS, MONTHS } from "../constants";
import {
  getActualHoursByCat,
  getTotalActualHours,
  getTotalPlan,
  getPlanForPeriod,
  getConsumptionRate,
  getActualByMonth,
  hoursToManDays,
} from "../utils/calc";
import { ProgressBar } from "./ProgressBar";
import { useState } from "react";

interface Props {
  data: AppData;
}

export function Summary({ data }: Props) {
  const [monthFilter, setMonthFilter] = useState<string>("");

  const totalActualHours = getTotalActualHours(data.entries, monthFilter || undefined);
  const totalActualDays = hoursToManDays(totalActualHours);
  const totalPlan = getTotalPlan(data.plans);
  const totalPlanForPeriod = monthFilter ? totalPlan / 6 : totalPlan;

  return (
    <div style={{ padding: 16 }}>
      {/* フィルタ */}
      <select
        value={monthFilter}
        onChange={(e) => setMonthFilter(e.target.value)}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid #e2e8f0",
          fontSize: 14,
          marginBottom: 16,
          background: "#f8fafc",
        }}
      >
        <option value="">上期全体（4月〜9月）</option>
        {MONTHS.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      {/* カテゴリ別カード */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {CATEGORIES.map((cat, i) => {
          const plan = data.plans[cat.id] || 0;
          const planForPeriod = getPlanForPeriod(plan, monthFilter || undefined);
          const actualHours = getActualHoursByCat(
            data.entries,
            cat.id,
            monthFilter || undefined
          );
          const actualDays = hoursToManDays(actualHours);

          // 計画0かつ実績0は非表示
          if (planForPeriod === 0 && actualDays === 0) return null;

          const rate = getConsumptionRate(actualDays, planForPeriod);
          const remaining = planForPeriod - actualDays;
          const isOver = remaining < 0;

          return (
            <div
              key={cat.id}
              style={{
                background: "#fff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
                <span
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: CAT_COLORS[i],
                    marginRight: 8,
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{cat.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{actualDays.toFixed(2)}</span>
                <span style={{ fontSize: 14, color: "#94a3b8" }}>
                  / {planForPeriod.toFixed(2)} 人日
                </span>
              </div>
              <ProgressBar value={rate} color={CAT_COLORS[i]} />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 6,
                  fontSize: 13,
                }}
              >
                <span style={{ color: isOver ? "#dc2626" : "#64748b" }}>
                  {rate.toFixed(1)}%
                </span>
                <span style={{ color: isOver ? "#dc2626" : "#64748b" }}>
                  残: {remaining.toFixed(2)} 人日
                </span>
              </div>
            </div>
          );
        })}

        {/* 合計行 */}
        <div
          style={{
            background: "#1e293b",
            color: "#fff",
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>合計</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
            <span style={{ fontSize: 24, fontWeight: 700 }}>{totalActualDays.toFixed(2)}</span>
            <span style={{ fontSize: 14, opacity: 0.7 }}>
              / {totalPlanForPeriod.toFixed(2)} 人日
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <ProgressBar
              value={totalPlanForPeriod > 0 ? (totalActualDays / totalPlanForPeriod) * 100 : 0}
              color="#60a5fa"
            />
          </div>
        </div>
      </div>

      {/* 月別棒グラフ */}
      <div
        style={{
          marginTop: 24,
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, marginTop: 0 }}>
          月別実績
        </h3>
        <div style={{ display: "flex", gap: 8, alignItems: "flex-end", height: 120 }}>
          {MONTHS.map((m) => {
            const hours = getActualByMonth(data.entries, m.value);
            const days = hoursToManDays(hours);
            const maxDays = Math.max(
              ...MONTHS.map((mm) => hoursToManDays(getActualByMonth(data.entries, mm.value))),
              1
            );
            const heightPct = (days / maxDays) * 100;

            return (
              <div
                key={m.value}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                  {days > 0 ? days.toFixed(1) : ""}
                </span>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 40,
                    height: `${heightPct}%`,
                    background: "linear-gradient(180deg, #2563eb, #60a5fa)",
                    borderRadius: "4px 4px 0 0",
                    minHeight: days > 0 ? 4 : 0,
                    transition: "height 0.3s ease",
                  }}
                />
                <span style={{ fontSize: 12, color: "#64748b", marginTop: 6 }}>
                  {m.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
