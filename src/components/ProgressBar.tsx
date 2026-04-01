interface Props {
  value: number; // 0〜100+
  color: string;
}

export function ProgressBar({ value, color }: Props) {
  const isOver = value > 100;
  const barColor = isOver ? "#dc2626" : color;
  const width = Math.min(value, 100);

  return (
    <div
      style={{
        width: "100%",
        height: 8,
        background: "#e2e8f0",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${width}%`,
          height: "100%",
          background: barColor,
          borderRadius: 4,
          transition: "width 0.3s ease",
        }}
      />
    </div>
  );
}
