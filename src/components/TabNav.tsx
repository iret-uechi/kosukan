const TABS = ["日次入力", "予実サマリー", "履歴", "設定"];

interface Props {
  activeTab: number;
  onChange: (index: number) => void;
}

export function TabNav({ activeTab, onChange }: Props) {
  return (
    <nav
      style={{
        display: "flex",
        borderBottom: "1px solid #e2e8f0",
        background: "#fff",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}
    >
      {TABS.map((label, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          style={{
            flex: 1,
            padding: "12px 0",
            border: "none",
            borderBottom: activeTab === i ? "2px solid #2563eb" : "2px solid transparent",
            background: "none",
            fontWeight: activeTab === i ? 600 : 400,
            color: activeTab === i ? "#2563eb" : "#64748b",
            fontSize: 14,
            cursor: "pointer",
            transition: "all 0.2s",
          }}
        >
          {label}
        </button>
      ))}
    </nav>
  );
}
