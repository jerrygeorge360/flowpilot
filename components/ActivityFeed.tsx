"use client";

import { useTheme } from "@/context/ThemeProvider";


export type ActivityItem = {
  id: string;
  text: string;
  when: string;
  type?: "save" | "yield" | "rule";
};

export default function ActivityFeed({ items = [] }: { items?: ActivityItem[] }) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const T = {
    cardBg:        dark ? "#071209"                    : "#ffffff",
    cardBorder:    dark ? "rgba(34,197,94,0.1)"        : "rgba(21,128,61,0.15)",
    heading:       dark ? "#f0fdf4"                    : "#052e16",
    emptyBg:       dark ? "rgba(255,255,255,0.02)"     : "rgba(21,128,61,0.03)",
    emptyBorder:   dark ? "rgba(255,255,255,0.06)"     : "rgba(21,128,61,0.12)",
    emptyText:     dark ? "#4b7a57"                    : "#86a897",
    badgeBg:       dark ? "rgba(34,197,94,0.08)"       : "rgba(22,163,74,0.08)",
    badgeBorder:   dark ? "rgba(34,197,94,0.2)"        : "rgba(22,163,74,0.25)",
    badgeText:     dark ? "#22c55e"                    : "#16a34a",
    timelineLine:  dark
      ? "linear-gradient(to bottom, transparent, #22c55e 30%, #4ade80 70%, transparent)"
      : "linear-gradient(to bottom, transparent, #16a34a 30%, #22c55e 70%, transparent)",
    itemBg:        dark ? "rgba(255,255,255,0.025)"    : "rgba(21,128,61,0.04)",
    itemBorder:    dark ? "rgba(255,255,255,0.06)"     : "rgba(21,128,61,0.1)",
    itemText:      dark ? "#f0fdf4"                    : "#052e16",
    itemTime:      dark ? "#166534"                    : "#86a897",
  };

  // Activity type → dot colour
  const dotColors = {
    save:  { dot: dark ? "#22c55e" : "#16a34a", bg: dark ? "rgba(34,197,94,0.15)"  : "rgba(22,163,74,0.12)"  },
    yield: { dot: dark ? "#4ade80" : "#22c55e", bg: dark ? "rgba(74,222,128,0.15)" : "rgba(34,197,94,0.12)"  },
    rule:  { dot: dark ? "#86efac" : "#15803d", bg: dark ? "rgba(134,239,172,0.15)": "rgba(21,128,61,0.12)"  },
  };

  return (
    <div style={{
      background: T.cardBg,
      border: `1px solid ${T.cardBorder}`,
      borderRadius: 20,
      padding: 24,
      height: "100%",
      boxShadow: dark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
      transition: "background 0.4s ease, border-color 0.4s ease",
    }}>
    
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: T.heading, fontFamily: "'Syne', sans-serif" }}>
          Recent Activity
        </span>
        <span style={{
          fontSize: 10, fontWeight: 700, color: T.badgeText,
          background: T.badgeBg, border: `1px solid ${T.badgeBorder}`,
          borderRadius: 99, padding: "2px 8px",
        }}>
          {items.length} events
        </span>
      </div>

      <div style={{ position: "relative" }}>
        {items.length > 0 && (
          <div style={{
            position: "absolute", left: 10, top: 8, bottom: 8, width: 1,
            background: T.timelineLine,
          }} />
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 280, overflowY: "auto" }}>
          {items.length === 0 && (
            <div style={{
              fontSize: 12, color: T.emptyText,
              border: `1px solid ${T.emptyBorder}`,
              borderRadius: 10, padding: 12,
              background: T.emptyBg,
            }}>
              No activity yet. Execute a plan to see events.
            </div>
          )}

          {items.map((item) => {
            const c = dotColors[item.type || "save"];
            return (
              <div key={item.id} style={{ display: "flex", alignItems: "flex-start", gap: 12, paddingLeft: 28, position: "relative" }}>
                <div style={{
                  position: "absolute", left: 4, top: 6,
                  width: 12, height: 12, borderRadius: "50%",
                  background: c.bg, border: `1.5px solid ${c.dot}`,
                  flexShrink: 0,
                }} />
                <div style={{
                  flex: 1,
                  background: T.itemBg,
                  border: `1px solid ${T.itemBorder}`,
                  borderRadius: 10, padding: "10px 12px",
                }}>
                  <p style={{ fontSize: 12, color: T.itemText, margin: "0 0 3px", fontFamily: "'DM Sans', sans-serif" }}>
                    {item.text}
                  </p>
                  <p style={{ fontSize: 10, color: T.itemTime, margin: 0, fontFamily: "monospace" }}>
                    {item.when}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}