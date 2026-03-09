"use client";

import { useState } from "react";
import WithdrawModal from "./WithdrawModal";

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

export default function BalanceCard({ balance = 0, rulesCount = 0, yieldEarned = 0, loading = false, onBalanceUpdate }: BalanceCardProps) {
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);

  if (loading) {
    return (
      <div style={{
        background: '#0f0f14', border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: '20px', padding: '32px',
      }}>
        <div style={{ height: '16px', width: '96px', background: '#16161d', borderRadius: '4px' }} />
        <div style={{ height: '48px', width: '160px', background: '#16161d', borderRadius: '4px', marginTop: '16px' }} />
      </div>
    );
  }

  return (
    <div style={{
      background: '#0f0f14',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px',
      padding: '32px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Glow behind balance */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '200px', height: '200px',
        background: 'radial-gradient(circle, rgba(129,140,248,0.08), transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Balance */}
      <div style={{ textAlign: 'center', marginBottom: '32px', position: 'relative' }}>
        <p style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#52525b', marginBottom: '12px' }}>
          Total Balance
        </p>
        <p style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '-0.04em', color: '#e4e4e7', margin: '0 0 4px', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
          {formatBalance(balance)}
        </p>
        <p style={{ fontSize: '14px', fontWeight: 500, color: '#71717a', margin: 0 }}>FLOW</p>
        <div style={{ width: '48px', height: '1px', margin: '16px auto 0', background: 'linear-gradient(90deg, transparent, #818cf8, transparent)' }} />
      </div>

      {/* Withdraw Button */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => setWithdrawModalOpen(true)}
          disabled={balance <= 0}
          style={{
            padding: '12px 28px',
            fontSize: '13px',
            fontWeight: 600,
            background: balance > 0 ? 'linear-gradient(135deg, #818cf8, #6366f1)' : 'rgba(255,255,255,0.05)',
            border: 'none',
            borderRadius: '10px',
            color: balance > 0 ? '#fff' : '#52525b',
            cursor: balance > 0 ? 'pointer' : 'not-allowed',
            letterSpacing: '0.02em',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={(e) => balance > 0 && (e.currentTarget.style.transform = 'translateY(-1px)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
        >
          💸 Withdraw Funds
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: '16px' }}>
        {/* Yield */}
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px', textAlign: 'center'
        }}>
          <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', marginBottom: '8px' }}>
            Pending Yield
          </p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#34d399', margin: '0 0 2px', fontVariantNumeric: 'tabular-nums' }}>
            {formatYield(yieldEarned)}
          </p>
          <p style={{ fontSize: '10px', color: '#52525b', margin: 0 }}>FLOW</p>
        </div>

        <div style={{ width: '1px', background: 'rgba(255,255,255,0.06)', flexShrink: 0 }} />

        {/* Rules */}
        <div style={{
          flex: 1, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '12px', padding: '16px', textAlign: 'center'
        }}>
          <p style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#52525b', marginBottom: '8px' }}>
            Active Rules
          </p>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#e4e4e7', margin: '0 0 6px', fontVariantNumeric: 'tabular-nums' }}>
            {rulesCount}
          </p>
          <span style={{
            fontSize: '10px', fontWeight: 600, color: '#34d399',
            background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.2)',
            borderRadius: '99px', padding: '2px 8px'
          }}>
            ~5% APY
          </span>
        </div>
      </div>

      {/* Withdraw Modal */}
      <WithdrawModal
        open={withdrawModalOpen}
        onClose={() => setWithdrawModalOpen(false)}
        currentBalance={balance}
        onSuccess={() => {
          onBalanceUpdate?.();
        }}
      />
    </div>
  );
}
