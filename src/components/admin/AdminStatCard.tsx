interface StatCardProps {
  label: string;
  value: string | number;
  delta?: string;
  positive?: boolean;
  icon?: string;
  accent?: string;
}

export default function AdminStatCard({ label, value, delta, positive, icon, accent = "#b4f000" }: StatCardProps) {
  return (
    <div style={{
      background: "rgba(14,12,22,0.75)",
      border: "1px solid rgba(255,255,255,0.07)",
      borderRadius: 12,
      padding: "1.25rem 1.5rem",
      display: "flex",
      flexDirection: "column",
      gap: "0.5rem",
      position: "relative",
      overflow: "hidden",
      transition: "border-color 0.2s ease",
    }}>
      <div style={{ position: "absolute", top: 0, right: 0, width: 80, height: 80, borderRadius: "0 12px 0 80px", background: `${accent}08` }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: "0.12em", color: "#64748b", textTransform: "uppercase" }}>[ {label} ]</span>
        {icon && <span style={{ fontSize: 18, opacity: 0.6 }}>{icon}</span>}
      </div>
      <div style={{ fontSize: 32, fontWeight: 700, color: "#f8fafc", lineHeight: 1 }}>{value}</div>
      {delta && (
        <div style={{ fontSize: 12, color: positive ? "#4ade80" : "#f87171", fontFamily: "monospace" }}>
          {positive ? "↑" : "↓"} {delta}
        </div>
      )}
    </div>
  );
}
