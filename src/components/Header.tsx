import type { AppData } from "../types";
import { HOURS_PER_DAY, DAYS_PER_MONTH } from "../constants";
import { getTotalPlan } from "../utils/calc";

interface Props {
  data: AppData;
}

export function Header({ data }: Props) {
  const totalActualHours = data.entries.reduce((s, e) => s + e.hours, 0);
  const totalActualMM = totalActualHours / HOURS_PER_DAY / DAYS_PER_MONTH;
  const totalPlan = getTotalPlan(data.plans); // 人月
  const rate = totalPlan > 0 ? (totalActualMM / totalPlan) * 100 : 0;

  return (
    <header
      style={{
        background: "linear-gradient(135deg, #1e293b, #334155)",
        color: "#fff",
        padding: "20px 24px",
        borderRadius: "0 0 16px 16px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>
            工数トラッカー
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 13, opacity: 0.7 }}>
            個人工数 予実管理ツール
          </p>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.15)",
            borderRadius: 8,
            padding: "6px 12px",
            textAlign: "center",
            minWidth: 80,
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700 }}>{rate.toFixed(1)}%</div>
          <div style={{ fontSize: 11, opacity: 0.7 }}>全体消化率</div>
        </div>
      </div>
    </header>
  );
}
