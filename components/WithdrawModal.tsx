"use client";

import { useState } from "react";
import { withdrawFromVault } from "@/lib/cadence";

type WithdrawModalProps = {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
  onSuccess?: () => void;
};

export default function WithdrawModal({ open, onClose, currentBalance, onSuccess }: WithdrawModalProps) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const handleWithdraw = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    if (numAmount > currentBalance) {
      setError(`Insufficient balance. You have ${currentBalance.toFixed(2)} FLOW`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await withdrawFromVault(numAmount);
      onSuccess?.();
      setAmount("");
      onClose();
    } catch (err: any) {
      console.error("Withdrawal error:", err);
      setError(err.message || "Failed to withdraw. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMaxClick = () => {
    setAmount(currentBalance.toFixed(8));
    setError(null);
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#0f0f14",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "20px",
          padding: "32px",
          minWidth: "400px",
          maxWidth: "500px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: "24px" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              color: "#e4e4e7",
              margin: "0 0 8px",
            }}
          >
            Withdraw from Vault
          </h2>
          <p style={{ fontSize: "13px", color: "#71717a", margin: 0 }}>
            Available: <strong style={{ color: "#a1a1aa" }}>{currentBalance.toFixed(2)} FLOW</strong>
          </p>
        </div>

        {/* Amount Input */}
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{
              display: "block",
              fontSize: "12px",
              fontWeight: 600,
              color: "#a1a1aa",
              marginBottom: "8px",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Amount
          </label>
          <div style={{ position: "relative" }}>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError(null);
              }}
              placeholder="0.00"
              style={{
                width: "100%",
                padding: "14px 90px 14px 16px",
                fontSize: "16px",
                fontWeight: 500,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                color: "#e4e4e7",
                outline: "none",
                boxSizing: "border-box",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "rgba(129,140,248,0.4)";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "rgba(255,255,255,0.1)";
              }}
            />
            <div
              style={{
                position: "absolute",
                right: "12px",
                top: "50%",
                transform: "translateY(-50%)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <button
                onClick={handleMaxClick}
                style={{
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "#818cf8",
                  background: "rgba(129,140,248,0.1)",
                  border: "1px solid rgba(129,140,248,0.2)",
                  borderRadius: "6px",
                  padding: "4px 10px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
                disabled={loading}
              >
                Max
              </button>
              <span style={{ fontSize: "14px", color: "#71717a", fontWeight: 500 }}>FLOW</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            <p style={{ fontSize: "13px", color: "#fca5a5", margin: 0 }}>{error}</p>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: "14px",
              fontSize: "14px",
              fontWeight: 600,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "12px",
              color: "#a1a1aa",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleWithdraw}
            disabled={loading || !amount}
            style={{
              flex: 1,
              padding: "14px",
              fontSize: "14px",
              fontWeight: 600,
              background: loading ? "#52525b" : "linear-gradient(135deg, #818cf8, #6366f1)",
              border: "none",
              borderRadius: "12px",
              color: "#fff",
              cursor: loading || !amount ? "not-allowed" : "pointer",
              opacity: loading || !amount ? 0.5 : 1,
            }}
          >
            {loading ? "Processing..." : "Withdraw"}
          </button>
        </div>

        {/* Info */}
        <div
          style={{
            marginTop: "20px",
            padding: "12px 16px",
            background: "rgba(129,140,248,0.05)",
            border: "1px solid rgba(129,140,248,0.1)",
            borderRadius: "10px",
          }}
        >
          <p style={{ fontSize: "12px", color: "#a1a1aa", margin: 0 }}>
            💡 Funds will be returned to your Flow wallet immediately after confirmation.
          </p>
        </div>
      </div>
    </div>
  );
}
