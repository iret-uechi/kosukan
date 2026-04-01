import { useEffect } from "react";

interface Props {
  message: string;
  visible: boolean;
  onHide: () => void;
}

export function Toast({ message, visible, onHide }: Props) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(onHide, 2000);
      return () => clearTimeout(timer);
    }
  }, [visible, onHide]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        left: "50%",
        transform: "translateX(-50%)",
        background: "#1e293b",
        color: "#fff",
        padding: "10px 24px",
        borderRadius: 10,
        fontSize: 14,
        zIndex: 1000,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      {message}
    </div>
  );
}
