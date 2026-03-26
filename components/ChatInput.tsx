"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ParsedIntent } from "@/lib/nearai";
import { getSponsorsipStatus } from "@/lib/cadence";
import { fcl } from "@/lib/flow";
import { useTheme } from "@/context/ThemeProvider";


type ChatInputProps = {
  onParsed: (plan: ParsedIntent) => void;
  disabled?: boolean;
  refreshTrigger?: number;
};

export default function ChatInput({ onParsed, disabled = false, refreshTrigger = 0 }: ChatInputProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  const [sponsorshipStatus, setSponsorshipStatus] = useState<{
    sponsored: boolean;
    remaining: number;
    used: number;
    total: number;
  } | null>(null);
  const [user, setUser] = useState<{ addr?: string | null }>({});

  useEffect(() => { fcl.currentUser.subscribe(setUser); }, []);
  useEffect(() => { if (user.addr) checkSponsorship(user.addr); }, [user.addr, refreshTrigger]);

  async function checkSponsorship(address: string) {
    try {
      const status = await getSponsorsipStatus(address);
      setSponsorshipStatus(status as any);
    } catch (e) { console.error("Failed to check sponsorship:", e); }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!message.trim() || disabled) return;
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/parse-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      if (!res.ok) throw new Error("Failed to parse intent");
      onParsed(await res.json());
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally { setLoading(false); }
  }


  const T = {
    accent:        dark ? "#22c55e"                     : "#16a34a",
    accentAlt:     dark ? "#4ade80"                     : "#22c55e",
    accentRgb:     dark ? "34,197,94"                   : "22,163,74",
    chipBg:        dark ? "rgba(34,197,94,0.04)"        : "rgba(22,163,74,0.06)",
    chipBorder:    dark ? "rgba(34,197,94,0.12)"        : "rgba(22,163,74,0.18)",
    chipText:      dark ? "#4b7a57"                     : "#15803d",
    chipHoverBg:   dark ? "rgba(34,197,94,0.1)"         : "rgba(22,163,74,0.12)",
    chipHoverBorder: dark ? "rgba(34,197,94,0.35)"      : "rgba(22,163,74,0.45)",
    chipHoverText: dark ? "#22c55e"                     : "#15803d",
    inputBg:       dark ? "#071209"                     : "#ffffff",
    inputBorder:   dark ? "rgba(34,197,94,0.2)"         : "rgba(22,163,74,0.25)",
    inputBorderFocus: dark ? "rgba(34,197,94,0.45)"     : "rgba(22,163,74,0.55)",
    inputGlow:     dark ? "rgba(34,197,94,0.06)"        : "rgba(22,163,74,0.06)",
    inputText:     dark ? "#f0fdf4"                     : "#052e16",
    inputPlaceholder: dark ? "#4b7a57"                  : "#86a897",
    lockIcon:      dark ? "#166534"                     : "#86a897",
    btnBg:         dark
      ? "linear-gradient(135deg,#22c55e,#4ade80)"
      : "linear-gradient(135deg,#16a34a,#22c55e)",
    btnText:       dark ? "#052e16"                     : "#f0fdf4",
    errorBg:       "rgba(248,113,113,0.08)",
    errorBorder:   "rgba(248,113,113,0.18)",
    sponsorGreenBg:     dark ? "rgba(34,197,94,0.08)"   : "rgba(22,163,74,0.08)",
    sponsorGreenBorder: dark ? "rgba(34,197,94,0.2)"    : "rgba(22,163,74,0.25)",
    sponsorGreenText:   dark ? "#22c55e"                : "#16a34a",
    sponsorMutedBg:     dark ? "rgba(255,255,255,0.02)" : "rgba(21,128,61,0.04)",
    sponsorMutedBorder: dark ? "rgba(255,255,255,0.08)" : "rgba(21,128,61,0.12)",
    sponsorMutedText:   dark ? "#4b7a57"                : "#86a897",
  };

  const hasText = message.trim().length > 0;

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Prompt chips */}
      <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 12 }}>
        {["Save 50 FLOW/week", "Earn yield on idle balance", "DCA into FLOW daily"].map(chip => (
          <button
            key={chip}
            type="button"
            onClick={() => setMessage(chip)}
            style={{
              background: T.chipBg, border: `1px solid ${T.chipBorder}`,
              borderRadius: 99, padding: "6px 14px",
              fontSize: 12, fontWeight: 500, color: T.chipText,
              cursor: "pointer", transition: "all 0.2s",
              fontFamily: "'DM Sans', sans-serif",
            }}
            onMouseEnter={e => {
              const el = e.currentTarget;
              el.style.background = T.chipHoverBg;
              el.style.borderColor = T.chipHoverBorder;
              el.style.color = T.chipHoverText;
            }}
            onMouseLeave={e => {
              const el = e.currentTarget;
              el.style.background = T.chipBg;
              el.style.borderColor = T.chipBorder;
              el.style.color = T.chipText;
            }}
          >
            {chip}
          </button>
        ))}
      </div>

  
      {error && (
        <div style={{
          marginBottom: 12, padding: "10px 14px", borderRadius: 10,
          background: T.errorBg, border: `1px solid ${T.errorBorder}`,
          fontSize: 13, color: "#f87171",
        }}>
          ⚠ {error}
        </div>
      )}

   
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          background: T.inputBg,
          border: `1px solid ${focused ? T.inputBorderFocus : T.inputBorder}`,
          borderRadius: 99,
          padding: "6px 6px 6px 20px",
          boxShadow: focused
            ? `0 0 0 4px rgba(${T.accentRgb},0.08)`
            : `0 0 0 0px rgba(${T.accentRgb},0)`,
          transition: "border-color 0.2s, box-shadow 0.2s, background 0.4s",
        }}
      >
        
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke={T.lockIcon} strokeWidth={2} style={{ flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>

        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={loading ? "Thinking privately…" : "e.g. Save 50 FLOW every week and earn yield…"}
          disabled={disabled || loading}
          style={{
            flex: 1, background: "transparent", border: "none", outline: "none",
            fontSize: 14, color: T.inputText,
            fontFamily: "'DM Sans', sans-serif", padding: "10px 0",
          
          }}
        />

        <style>{`
          input::placeholder { color: ${T.inputPlaceholder}; }
        `}</style>

        <button
          type="submit"
          disabled={disabled || loading || !hasText}
          style={{
            background: hasText && !disabled && !loading ? T.btnBg : (dark ? "rgba(34,197,94,0.08)" : "rgba(22,163,74,0.06)"),
            border: "none", borderRadius: 99, padding: "10px 22px",
            fontSize: 13, fontWeight: 700,
            color: hasText && !disabled && !loading ? T.btnText : T.lockIcon,
            cursor: disabled || loading || !hasText ? "not-allowed" : "pointer",
            opacity: disabled ? 0.4 : 1,
            transition: "all 0.2s", flexShrink: 0,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {loading ? (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", border: `2px solid ${T.accent}`, borderTopColor: "transparent", display: "inline-block", animation: "spin 0.7s linear infinite" }} />
              …
            </span>
          ) : "Go"}
        </button>
      </form>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

    
      {sponsorshipStatus && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          {sponsorshipStatus.sponsored ? (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 600, color: T.sponsorGreenText,
              background: T.sponsorGreenBg, border: `1px solid ${T.sponsorGreenBorder}`,
              borderRadius: 99, padding: "4px 12px",
            }}>
              ⛽ Gasless · {sponsorshipStatus.remaining} of {sponsorshipStatus.total} free transactions remaining
            </span>
          ) : (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              fontSize: 11, fontWeight: 600, color: T.sponsorMutedText,
              background: T.sponsorMutedBg, border: `1px solid ${T.sponsorMutedBorder}`,
              borderRadius: 99, padding: "4px 12px",
            }}>
              ⛽ Gas fees apply from here
            </span>
          )}
        </div>
      )}
    </div>
  );
}