import type { AppData } from "../types";
import { CATEGORIES, CAT_COLORS, HOURS_PER_DAY } from "../constants";
import { getTotalPlan } from "../utils/calc";

interface Props {
  data: AppData;
  onSave: (data: AppData) => void;
  onReset: () => void;
  onToast: (msg: string) => void;
}

export function Settings({ data, onSave, onReset, onToast }: Props) {
  function handlePlanChange(catId: string, value: string) {
    const plan = parseFloat(value) || 0;
    const newPlans = { ...data.plans, [catId]: plan };
    onSave({ ...data, plans: newPlans });
    onToast("計画値を更新しました");
  }

  function handleReset() {
    if (!window.confirm("全データをリセットしますか？この操作は取り消せません。")) return;
    onReset();
    onToast("データをリセットしました");
  }

  const totalPlan = getTotalPlan(data.plans);

  return (
    <div style={{ padding: 16 }}>
      {/* 計画工数編集 */}
      <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, marginTop: 0 }}>
        計画工数（人日 / 半期）
      </h3>
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
              step="0.5"
              min="0"
              value={data.plans[cat.id] ?? 0}
              onChange={(e) => handlePlanChange(cat.id, e.target.value)}
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
            <span style={{ fontSize: 13, color: "#94a3b8", marginLeft: 4, width: 30 }}>人日</span>
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
            {totalPlan.toFixed(1)} 人日
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
          = {(totalPlan * HOURS_PER_DAY).toFixed(0)} 時間
        </div>
      </div>

      {/* データ管理 */}
      <div
        style={{
          marginTop: 32,
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
