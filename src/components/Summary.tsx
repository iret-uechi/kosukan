import type { AppData } from "../types";
import { PLAN_GROUPS, CATEGORIES, GROUP_COLORS, CAT_COLORS, MONTHS } from "../constants";
import {
  getActualHoursByGroup,
  getActualHoursByCat,
  getTotalActualHours,
  getTotalPlan,
  getPlanForPeriod,
  getConsumptionRate,
  getActualByMonth,
  hoursToManMonths,
} from "../utils/calc";
import { ProgressBar } from "./ProgressBar";
import { useState } from "react";

interface Props {
  data: AppData;
}

export function Summary({ data }: Props) {
  const [monthFilter, setMonthFilter] = useState<string>("");

  const totalActualHours = getTotalActualHours(data.entries, monthFilter || undefined);
  const totalActualMM = hoursToManMonths(totalActualHours);
  const totalPlan = getTotalPlan(data.plans); // 人月
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

      {/* グループ別カード */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {PLAN_GROUPS.map((group) => {
          const plan = data.plans[group.id] || 0; // 人月
          const planForPeriod = getPlanForPeriod(plan, monthFilter || undefined);
          const actualHours = getActualHoursByGroup(
            data.entries,
            group.id,
            monthFilter || undefined
          );
          const actualMM = hoursToManMonths(actualHours);

          // 計画0かつ実績0は非表示
          if (planForPeriod === 0 && actualMM === 0) return null;

          const rate = getConsumptionRate(actualMM, planForPeriod);
          const remaining = planForPeriod - actualMM;
          const isOver = remaining < 0;
          const color = GROUP_COLORS[group.id] || "#64748b";

          // 運用保守のサブカテゴリ内訳
          const subCategories = CATEGORIES.filter((c) => c.groupId === group.id);
          const hasSubCategories = subCategories.length > 1;

          return (
            <div
              key={group.id}
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
                    background: color,
                    marginRight: 8,
                  }}
                />
                <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{group.name}</span>
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 8 }}>
                <span style={{ fontSize: 24, fontWeight: 700 }}>{actualMM.toFixed(2)}</span>
                <span style={{ fontSize: 14, color: "#94a3b8" }}>
                  / {planForPeriod.toFixed(2)} 人月
                </span>
              </div>
              <ProgressBar value={rate} color={color} />
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
                  残: {remaining.toFixed(2)} 人月
                </span>
              </div>

              {/* サブカテゴリ内訳（運用保守など） */}
              {hasSubCategories && actualHours > 0 && (
                <div
                  style={{
                    marginTop: 10,
                    paddingTop: 10,
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>内訳</div>
                  {subCategories.map((cat) => {
                    const catHours = getActualHoursByCat(
                      data.entries,
                      cat.id,
                      monthFilter || undefined
                    );
                    if (catHours === 0) return null;
                    const catMM = hoursToManMonths(catHours);
                    return (
                      <div
                        key={cat.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "3px 0",
                          fontSize: 13,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              background: CAT_COLORS[cat.id] || color,
                            }}
                          />
                          <span>{cat.name.replace(`${group.name}: `, "")}</span>
                        </div>
                        <span style={{ color: "#64748b" }}>{catMM.toFixed(2)} 人月</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* 計画外カテゴリ（間接業務・有休） */}
        {(() => {
          const unplannedGroups = [...new Set(
            CATEGORIES
              .filter((c) => !PLAN_GROUPS.some((g) => g.id === c.groupId))
              .map((c) => c.groupId)
          )];
          return unplannedGroups.map((gid) => {
            const hours = getActualHoursByGroup(data.entries, gid, monthFilter || undefined);
            if (hours === 0) return null;
            const mm = hoursToManMonths(hours);
            const cat = CATEGORIES.find((c) => c.groupId === gid);
            const name = cat?.name ?? gid;
            const color = GROUP_COLORS[gid] || "#94a3b8";
            return (
              <div
                key={gid}
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
                      background: color,
                      marginRight: 8,
                    }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600, flex: 1 }}>{name}</span>
                  <span style={{ fontSize: 11, color: "#94a3b8" }}>計画外</span>
                </div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  <span style={{ fontSize: 24, fontWeight: 700 }}>{mm.toFixed(2)}</span>
                  <span style={{ fontSize: 14, color: "#94a3b8" }}>人月</span>
                </div>
              </div>
            );
          });
        })()}

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
            <span style={{ fontSize: 24, fontWeight: 700 }}>{totalActualMM.toFixed(2)}</span>
            <span style={{ fontSize: 14, opacity: 0.7 }}>
              / {totalPlanForPeriod.toFixed(2)} 人月
            </span>
          </div>
          <div style={{ marginTop: 8 }}>
            <ProgressBar
              value={totalPlanForPeriod > 0 ? (totalActualMM / totalPlanForPeriod) * 100 : 0}
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
            const mm = hoursToManMonths(hours);
            const maxMM = Math.max(
              ...MONTHS.map((mm2) => hoursToManMonths(getActualByMonth(data.entries, mm2.value))),
              0.1
            );
            const heightPct = (mm / maxMM) * 100;

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
                  {mm > 0 ? mm.toFixed(2) : ""}
                </span>
                <div
                  style={{
                    width: "100%",
                    maxWidth: 40,
                    height: `${heightPct}%`,
                    background: "linear-gradient(180deg, #2563eb, #60a5fa)",
                    borderRadius: "4px 4px 0 0",
                    minHeight: mm > 0 ? 4 : 0,
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
