"use client";

import { useState } from "react";

export default function AnalyticsClient() {
  const [range, setRange] = useState<"7D" | "30D" | "90D">("30D");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <p style={{ fontFamily: "monospace", fontSize: 11, color: "#c084fc", letterSpacing: "0.12em" }}>
            [ ADMIN / ANALYTICS ]
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>
            Platform Performance & Usage Metrics
          </h1>
          <p style={{ color: "#64748b", fontSize: 13 }}>
            Aggregated retention, study hour velocity, technique adoption, and hardware breakdowns.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.4rem" }}>
          {(["7D", "30D", "90D"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                padding: "0.4rem 0.8rem",
                borderRadius: 6,
                background: range === r ? "#b4f000" : "rgba(255,255,255,0.04)",
                color: range === r ? "#000" : "#94a3b8",
                fontWeight: range === r ? 700 : 500,
                fontSize: 11,
                fontFamily: "monospace",
                border: "none",
                cursor: "pointer",
              }}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* High level metric summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.25rem" }}>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b" }}>[ 30-DAY RETENTION ]</span>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#f8fafc", marginTop: 4 }}>76.4%</div>
          <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace" }}>↑ +4.2% vs prev period</span>
        </div>
        <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.25rem" }}>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b" }}>[ TOTAL STUDY HOURS ]</span>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#b4f000", marginTop: 4 }}>1,842 hrs</div>
          <span style={{ fontSize: 11, color: "#4ade80", fontFamily: "monospace" }}>↑ +18.9% growth</span>
        </div>
        <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.25rem" }}>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b" }}>[ AVG SESSION LENGTH ]</span>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#c084fc", marginTop: 4 }}>48.5 min</div>
          <span style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>Across all 10 techniques</span>
        </div>
        <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.25rem" }}>
          <span style={{ fontSize: 10, fontFamily: "monospace", color: "#64748b" }}>[ WEBRTC PACKET RELIABILITY ]</span>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#38bdf8", marginTop: 4 }}>99.8%</div>
          <span style={{ fontSize: 11, color: "#38bdf8", fontFamily: "monospace" }}>LiveKit SFU global edge</span>
        </div>
      </div>

      {/* Grid: Study Techniques Breakdown & Device Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1rem" }}>
        {/* Study Technique Popularity */}
        <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#c084fc" }}>[ TECHNIQUE USAGE SPLIT ]</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>Hours spent</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {[
              { name: "Pomodoro Technique (25/5)", pct: 38, hours: "700h", color: "#b4f000" },
              { name: "Feynman Technique", pct: 22, hours: "405h", color: "#c084fc" },
              { name: "Active Recall", pct: 16, hours: "295h", color: "#38bdf8" },
              { name: "Spaced Repetition & Leitner", pct: 14, hours: "258h", color: "#f472b6" },
              { name: "Cornell & Mind Mapping", pct: 10, hours: "184h", color: "#fb923c" },
            ].map((t) => (
              <div key={t.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#f8fafc", marginBottom: 4 }}>
                  <span>{t.name}</span>
                  <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>{t.hours} ({t.pct}%)</span>
                </div>
                <div style={{ height: 6, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 9999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${t.pct}%`, background: t.color, borderRadius: 9999 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Device & Client Breakdown */}
        <div style={{ background: "rgba(14,12,22,0.75)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, color: "#c084fc" }}>[ CLIENT HARDWARE & BROWSER ]</span>
            <span style={{ fontSize: 11, color: "#64748b" }}>Traffic %</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {[
              { name: "Desktop Chrome / Edge (Chromium)", pct: 64, color: "#b4f000" },
              { name: "macOS Safari", pct: 18, color: "#c084fc" },
              { name: "Desktop Firefox", pct: 11, color: "#38bdf8" },
              { name: "Mobile iOS / Android Web", pct: 7, color: "#fb923c" },
            ].map((d) => (
              <div key={d.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#f8fafc", marginBottom: 4 }}>
                  <span>{d.name}</span>
                  <span style={{ fontFamily: "monospace", color: "#94a3b8" }}>{d.pct}%</span>
                </div>
                <div style={{ height: 6, width: "100%", background: "rgba(255,255,255,0.06)", borderRadius: 9999, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${d.pct}%`, background: d.color, borderRadius: 9999 }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", marginTop: "1.25rem", paddingTop: "0.75rem", fontSize: 11, fontFamily: "monospace", color: "#64748b" }}>
            ℹ WebRTC hardware acceleration is enabled on 94% of sessions.
          </div>
        </div>
      </div>
    </div>
  );
}
