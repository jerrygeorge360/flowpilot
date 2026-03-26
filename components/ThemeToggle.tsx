"use client";

import { useTheme } from "@/context/ThemeProvider";


export default function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggle}
      aria-label="Toggle theme"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 14px",
        borderRadius: "99px",
        border: isDark
          ? "1px solid rgba(34,197,94,0.25)"
          : "1px solid rgba(21,128,61,0.25)",
        background: isDark
          ? "rgba(34,197,94,0.08)"
          : "rgba(21,128,61,0.08)",
        cursor: "pointer",
        transition: "all 0.25s ease",
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12,
        fontWeight: 600,
        color: isDark ? "#22c55e" : "#15803d",
        letterSpacing: "0.04em",
      }}
    >
      {/* Track */}
      <span style={{
        position: "relative",
        display: "inline-block",
        width: 36,
        height: 20,
        borderRadius: 99,
        background: isDark ? "rgba(34,197,94,0.2)" : "rgba(21,128,61,0.15)",
        border: isDark ? "1px solid rgba(34,197,94,0.3)" : "1px solid rgba(21,128,61,0.3)",
        transition: "all 0.25s ease",
        flexShrink: 0,
      }}>
        {/* Thumb */}
        <span style={{
          position: "absolute",
          top: 2,
          left: isDark ? 2 : 18,
          width: 14,
          height: 14,
          borderRadius: "50%",
          background: isDark ? "#22c55e" : "#15803d",
          transition: "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 8,
        }}>
          {isDark ? "🌙" : "☀️"}
        </span>
      </span>
      <span>{isDark ? "Dark" : "Light"}</span>
    </button>
  );
}