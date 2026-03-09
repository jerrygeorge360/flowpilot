"use client";

import type { ParsedIntent } from "@/lib/nearai";

type PlanPreviewProps = {
  plan: ParsedIntent;
  onConfirm?: () => Promise<void> | void;
  onEdit?: () => void;
  loading?: boolean;
};

export default function PlanPreview({ plan, onConfirm, onEdit, loading }: PlanPreviewProps) {
  if (!plan.understood) {
    return (
      <div style={{
        background: '#0f0f14',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        borderRight: '1px solid rgba(255,255,255,0.07)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        borderLeft: '3px solid #fbbf24',
        borderRadius: '16px',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(251,191,36,0.1)', color: '#fbbf24', fontSize: '18px',
          }}>
            ?
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '14px', color: '#e4e4e7', margin: '0 0 4px' }}>Need clarification</p>
            <p style={{ fontSize: '13px', color: '#71717a', margin: 0, lineHeight: 1.6 }}>
              {plan.clarificationNeeded ?? "Please clarify what you want FlowPilot to do."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: '#0f0f14', border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px', padding: '32px',
    }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#818cf8', margin: '0 0 6px' }}>
          Action Plan
        </p>
        <h3 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em', color: '#e4e4e7', margin: '0 0 8px' }}>
          Here&apos;s your plan
        </h3>
        <p style={{ fontSize: '13px', color: '#71717a', margin: 0, lineHeight: 1.6 }}>
          {plan.summary}
        </p>
      </div>

      {/* Numbered Steps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        {(plan.actions ?? []).map((action, idx) => (
          <div
            key={`${action.type}-${idx}`}
            style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)' }}
          >
            <div style={{
              flexShrink: 0, width: '24px', height: '24px', borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '10px', fontWeight: 700, color: 'white',
              background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
            }}>
              {idx + 1}
            </div>
            <p style={{ fontSize: '13px', color: '#e4e4e7', margin: 0, lineHeight: 1.6, paddingTop: '2px' }}>
              {action.description}
            </p>
          </div>
        ))}
      </div>

      {/* Privacy Badge Row */}
      <div style={{ marginBottom: '20px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '11px', fontWeight: 600, color: '#818cf8',
          background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)',
          borderRadius: '99px', padding: '4px 12px',
        }}>
          🔒 Private via NEAR AI (TEE)
        </span>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '11px', fontWeight: 600, color: '#10b981',
          background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: '99px', padding: '4px 12px',
        }}>
          ⛽ Gas sponsored by FlowPilot · Powered by Flow Fee Payer
        </span>
      </div>

      {/* One-time setup notice */}
      <div style={{
        marginBottom: '24px', padding: '12px 16px', borderRadius: '12px',
        background: 'rgba(129,140,248,0.05)', border: '1px solid rgba(129,140,248,0.15)',
        display: 'flex', alignItems: 'flex-start', gap: '10px'
      }}>
        <div style={{ fontSize: '14px', marginTop: '1px' }}>💡</div>
        <div>
          <p style={{ fontSize: '12px', fontWeight: 600, color: '#e4e4e7', margin: '0 0 4px' }}>
            One-time setup required
          </p>
          <p style={{ fontSize: '11px', color: '#a1a1aa', margin: 0, lineHeight: 1.5 }}>
            You'll sign <strong>once</strong> to set up automation. After that, Flow's scheduler handles everything automatically — no more signatures needed.
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={onConfirm}
          disabled={loading}
          style={{
            flex: 1, borderRadius: '12px', padding: '14px 24px',
            fontWeight: 600, fontSize: '14px', color: 'white', border: 'none',
            background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
            boxShadow: '0 4px 16px rgba(129,140,248,0.2)',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.4 : 1, fontFamily: 'Inter, sans-serif',
          }}
        >
          {loading ? "Activating..." : "Confirm & Activate"}
        </button>
        <button
          onClick={onEdit}
          style={{
            borderRadius: '12px', padding: '14px 24px',
            fontWeight: 600, fontSize: '14px', color: '#71717a',
            background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}
        >
          Edit
        </button>
      </div>
    </div>
  );
}
