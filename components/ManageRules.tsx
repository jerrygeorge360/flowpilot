"use client";

import { useState } from "react";
import { deactivateRule } from "@/lib/cadence";

export type Rule = {
  actionType: string;
  amount: string;
  intervalSeconds: string;
  active: boolean;
  schedulerId: string | null;
  index: number;
  txId?: string;
};

export default function ManageRules({
  rules = [],
  userAddress,
  onRuleDeactivated,
}: {
  rules?: Rule[];
  userAddress?: string;
  onRuleDeactivated?: () => void;
}) {
  const [deactivating, setDeactivating] = useState<number | null>(null);
  const activeCount = rules.filter((r) => r.active).length;
  const canceledCount = rules.length - activeCount;

  const handleDeactivate = async (ruleIndex: number) => {
    if (!confirm("Cancel this automation rule? You'll receive ~50% of unused fees back.")) {
      return;
    }

    setDeactivating(ruleIndex);
    try {
      const rule = rules.find((r) => r.index === ruleIndex);
      await deactivateRule(ruleIndex, userAddress, rule?.schedulerId ?? null);
      onRuleDeactivated?.();
    } catch (error) {
      console.error("Failed to deactivate rule:", error);
      alert("Failed to deactivate rule. Check console for details.");
    } finally {
      setDeactivating(null);
    }
  };

  if (rules.length === 0) {
    return (
      <div
        style={{
          background: "#0f0f14",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: "20px",
          padding: "24px",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#e4e4e7" }}>
          Your Automation Rules
        </span>
        <div
          style={{
            fontSize: "12px",
            color: "#71717a",
            marginTop: "16px",
            padding: "12px",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "10px",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          No rules created yet. Create one to get started!
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#0f0f14",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: "20px",
        padding: "24px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
        <span style={{ fontSize: "13px", fontWeight: 600, color: "#e4e4e7" }}>
          Your Automation Rules
        </span>
        <span
          style={{
            fontSize: "10px",
            fontWeight: 700,
            color: "#818cf8",
            background: "rgba(129,140,248,0.1)",
            border: "1px solid rgba(129,140,248,0.2)",
            borderRadius: "99px",
            padding: "2px 8px",
          }}
        >
          {activeCount} active · {canceledCount} canceled
        </span>
      </div>

      {/* Rules List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {rules.map((rule) => {
          const intervalDays = parseFloat(rule.intervalSeconds) / 86400;
          const isDeactivating = deactivating === rule.index;

          return (
            <div
              key={rule.index}
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "12px",
                padding: "16px",
                background: rule.active
                  ? "rgba(129,140,248,0.03)"
                  : "rgba(255,255,255,0.02)",
                opacity: rule.active ? 1 : 0.5,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#e4e4e7", marginBottom: "4px" }}>
                    {rule.actionType}
                  </div>
                  <div style={{ fontSize: "12px", color: "#a1a1aa" }}>
                    {parseFloat(rule.amount).toFixed(2)} FLOW every {intervalDays} day{intervalDays !== 1 ? "s" : ""}
                  </div>
                  <div style={{ fontSize: "10px", color: "#71717a", marginTop: "6px" }}>
                    Rule #{rule.index}
                    {rule.txId ? ` · Tx ${rule.txId.slice(0, 10)}…${rule.txId.slice(-6)}` : ""}
                  </div>
                  {rule.schedulerId && (
                    <div style={{ fontSize: "10px", color: "#71717a", marginTop: "6px" }}>
                      Scheduler ID: {rule.schedulerId}
                    </div>
                  )}
                </div>

                <div>
                  {rule.active && rule.schedulerId ? (
                    <button
                      onClick={() => handleDeactivate(rule.index)}
                      disabled={isDeactivating}
                      style={{
                        fontSize: "11px",
                        fontWeight: 600,
                        color: isDeactivating ? "#71717a" : "#ef4444",
                        background: isDeactivating ? "rgba(255,255,255,0.05)" : "rgba(239,68,68,0.1)",
                        border: isDeactivating ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(239,68,68,0.2)",
                        borderRadius: "8px",
                        padding: "6px 12px",
                        cursor: isDeactivating ? "not-allowed" : "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        if (!isDeactivating) {
                          e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isDeactivating) {
                          e.currentTarget.style.background = "rgba(239,68,68,0.1)";
                        }
                      }}
                    >
                      {isDeactivating ? "Canceling..." : "Cancel Rule"}
                    </button>
                  ) : rule.active && !rule.schedulerId ? (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#a1a1aa",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        padding: "6px 12px",
                      }}
                    >
                      Legacy Rule
                    </span>
                  ) : (
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 600,
                        color: "#71717a",
                        background: "rgba(255,255,255,0.05)",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "8px",
                        padding: "6px 12px",
                      }}
                    >
                      Canceled
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
