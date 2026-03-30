"use client";

import { useState } from "react";
import WithdrawModal from "./WithdrawModal";
import { useTheme } from "@/context/ThemeProvider";


type BalanceCardProps = {
  balance?: number;
  rulesCount?: number;
  yieldEarned?: number;
  loading?: boolean;
  onBalanceUpdate?: () => void;
};

function formatBalance(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatYield(n: number): string {
  if (n <= 0) return "0.0000";
  if (n < 0.0001) return "<0.0001";
  return n.toFixed(4);
}

export default function BalanceCard({
  balance = 0, rulesCount = 0, yieldEarned = 0, loading = false, onBalanceUpdate,
}: BalanceCardProps) {
  const { theme } = useTheme();
  const dark = theme === "dark";
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  
  const T = {
    cardBg:          dark ? "#071209"                   : "#ffffff",
    cardBorder:      dark ? "rgba(34,197,94,0.1)"       : "rgba(21,128,61,0.15)",
    glowBg:          dark ? "rgba(34,197,94,0.07)"      : "rgba(22,163,74,0.06)",
    labelText:       dark ? "#166534"                   : "#86a897",
    balanceText:     dark ? "#f0fdf4"                   : "#052e16",
    unitText:        dark ? "#4b7a57"                   : "#86a897",
    dividerLine:     dark
      ? "linear-gradient(90deg,transparent,#22c55e,transparent)"
      : "linear-gradient(90deg,transparent,#16a34a,transparent)",
    btnActiveBg:     dark
      ? "linear-gradient(135deg,#22c55e,#4ade80)"
      : "linear-gradient(135deg,#16a34a,#22c55e)",
    btnActiveText:   dark ? "#052e16"                   : "#f0fdf4",
    btnDisabledBg:   dark ? "rgba(255,255,255,0.05)"    : "rgba(21,128,61,0.05)",
    btnDisabledText: dark ? "#166534"                   : "#86a897",
    statBg:          dark ? "rgba(34,197,94,0.04)"      : "rgba(22,163,74,0.05)",
    statBorder:      dark ? "rgba(34,197,94,0.12)"      : "rgba(22,163,74,0.15)",
    statLabel:       dark ? "#166534"                   : "#86a897",
    statDivider:     dark ? "rgba(34,197,94,0.1)"       : "rgba(22,163,74,0.12)",
    yieldValue:      dark ? "#22c55e"                   : "#16a34a",
    yieldUnit:       dark ? "#166534"                   : "#86a897",
    rulesValue:      dark ? "#f0fdf4"                   : "#052e16",
    apyBg:           dark ? "rgba(34,197,94,0.1)"       : "rgba(22,163,74,0.08)",
    apyBorder:       dark ? "rgba(34,197,94,0.25)"      : "rgba(22,163,74,0.25)",
    apyText:         dark ? "#22c55e"                   : "#16a34a",
    shimmerBg:       dark ? "#0d1f10"                   : "#f4fdf5",
    shimmerBlock:    dark ? "#122016"                   : "#e8f5ea",
  };

  if (loading) {
    return (
      <div style={{
        background: T.cardBg,
        border: `1px solid ${T.cardBorder}`,
        borderRadius: 20, padding: 32,
        position: "relative", overflow: "hidden",
        boxShadow: dark ? "none" : "0 1px 6px rgba(0,0,0,0.07)",
        transition: "background 0.4s ease, border-color 0.4s ease",
        fontFamily: "'DM Sans', sans-serif",
        minHeight: 334, // Approximate stable height
      }}>
        {/* Skeleton Shimmer Mask */}
        <div style={{ textAlign: "center", marginBottom: 28, position: "relative" }}>
          <div style={{ 
            height: 12, width: 80, background: T.shimmerBlock, borderRadius: 4, 
            margin: "0 auto 12px", opacity: 0.5, animation: "pulse-dot 2s ease infinite" 
          }} />
          <div style={{ 
            height: 56, width: 140, background: T.shimmerBlock, borderRadius: 8, 
            margin: "0 auto 10px", opacity: 0.8, animation: "pulse-dot 2s ease infinite" 
          }} />
          <div style={{ 
            height: 14, width: 40, background: T.shimmerBlock, borderRadius: 4, 
            margin: "0 auto", opacity: 0.4, animation: "pulse-dot 2s ease infinite" 
          }} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div style={{ 
            height: 42, width: 154, background: T.shimmerBlock, borderRadius: 10, 
            margin: "0 auto", opacity: 0.3, animation: "pulse-dot 2s ease infinite" 
          }} />
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
          <div style={{ 
            flex: 1, height: 86, background: T.statBg, border: `1px solid ${T.statBorder}`, 
            borderRadius: 12, opacity: 0.5, animation: "pulse-dot 2s ease infinite" 
          }} />
          <div style={{ width: 1, background: T.statDivider, flexShrink: 0 }} />
          <div style={{ 
            flex: 1, height: 86, background: T.statBg, border: `1px solid ${T.statBorder}`, 
            borderRadius: 12, opacity: 0.5, animation: "pulse-dot 2s ease infinite" 
          }} />
        </div>
      </div>
    );
  }

  const canWithdraw = balance > 0;

  return (
    <div style={{
      background: T.cardBg,
      border: `1px solid ${T.cardBorder}`,
      borderRadius: 20, padding: 32,
      position: "relative", overflow: "hidden",
      boxShadow: dark ? "none" : "0 1px 6px rgba(0,0,0,0.07)",
      transition: "background 0.4s ease, border-color 0.4s ease",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%,-50%)",
        width: 220, height: 220,
        background: `radial-gradient(circle,${T.glowBg},transparent 70%)`,
        pointerEvents: "none",
      }} />

     
      <div style={{ textAlign: "center", marginBottom: 28, position: "relative" }}>
        <p style={{
          fontSize: 11, fontWeight: 600, letterSpacing: "0.12em",
          textTransform: "uppercase", color: T.labelText, marginBottom: 12,
        }}>
          Total Balance
        </p>
        <p style={{
          fontSize: 56, fontWeight: 900, letterSpacing: "-0.04em",
          color: T.balanceText, margin: "0 0 4px",
          fontVariantNumeric: "tabular-nums", lineHeight: 1,
          fontFamily: "'Syne', sans-serif",
        }}>
          {formatBalance(balance)}
        </p>
        <p style={{ fontSize: 14, fontWeight: 500, color: T.unitText, margin: 0 }}>FLOW</p>
        <div style={{
          width: 48, height: 1, margin: "14px auto 0",
          background: T.dividerLine,
        }} />
      </div>

    
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <button
          onClick={() => setWithdrawModalOpen(true)}
          disabled={!canWithdraw}
          style={{
            padding: "12px 28px", fontSize: 13, fontWeight: 700,
            background: canWithdraw ? T.btnActiveBg : T.btnDisabledBg,
            border: "none", borderRadius: 10,
            color: canWithdraw ? T.btnActiveText : T.btnDisabledText,
            cursor: canWithdraw ? "pointer" : "not-allowed",
            letterSpacing: "0.02em",
            transition: "transform 0.15s, box-shadow 0.15s",
            boxShadow: canWithdraw
              ? (dark ? "0 4px 16px rgba(34,197,94,0.2)" : "0 4px 16px rgba(22,163,74,0.2)")
              : "none",
            fontFamily: "'DM Sans', sans-serif",
          }}
          onMouseEnter={e => { if (canWithdraw) { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = dark ? "0 8px 24px rgba(34,197,94,0.3)" : "0 8px 24px rgba(22,163,74,0.3)"; } }}
          onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = canWithdraw ? (dark ? "0 4px 16px rgba(34,197,94,0.2)" : "0 4px 16px rgba(22,163,74,0.2)") : "none"; }}
        >
          💸 Withdraw Funds
        </button>
      </div>

   
      <div style={{ display: "flex", gap: 12, alignItems: "stretch" }}>
       
        <div style={{
          flex: 1, background: T.statBg, border: `1px solid ${T.statBorder}`,
          borderRadius: 12, padding: 16, textAlign: "center",
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: T.statLabel, marginBottom: 8, margin: "0 0 8px" }}>
            Pending Yield
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: T.yieldValue, margin: "0 0 2px", fontVariantNumeric: "tabular-nums", fontFamily: "'Syne', sans-serif" }}>
            {formatYield(yieldEarned)}
          </p>
          <p style={{ fontSize: 10, color: T.yieldUnit, margin: 0 }}>FLOW</p>
        </div>

        
        <div style={{ width: 1, background: T.statDivider, flexShrink: 0 }} />

       
        <div style={{
          flex: 1, background: T.statBg, border: `1px solid ${T.statBorder}`,
          borderRadius: 12, padding: 16, textAlign: "center",
        }}>
          <p style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: T.statLabel, marginBottom: 8, margin: "0 0 8px" }}>
            Active Rules
          </p>
          <p style={{ fontSize: 22, fontWeight: 700, color: T.rulesValue, margin: "0 0 6px", fontVariantNumeric: "tabular-nums", fontFamily: "'Syne', sans-serif" }}>
            {rulesCount}
          </p>
          <span style={{
            fontSize: 10, fontWeight: 700, color: T.apyText,
            background: T.apyBg, border: `1px solid ${T.apyBorder}`,
            borderRadius: 99, padding: "2px 8px",
          }}>
            ~5% APY
          </span>
        </div>
      </div>

      <WithdrawModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        currentBalance={balance}
        onSuccess={() => onBalanceUpdate?.()}
      />
    </div>
  );
}