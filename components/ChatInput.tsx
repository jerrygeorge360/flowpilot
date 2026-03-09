"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { ParsedIntent } from "@/lib/nearai";
import { getSponsorsipStatus } from "@/lib/cadence";
import { fcl } from "@/lib/flow";

type ChatInputProps = {
  onParsed: (plan: ParsedIntent) => void;
  disabled?: boolean;
  refreshTrigger?: number;
};

export default function ChatInput({ onParsed, disabled = false, refreshTrigger = 0 }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sponsorshipStatus, setSponsorshipStatus] = useState<{
    sponsored: boolean;
    remaining: number;
    used: number;
    total: number;
  } | null>(null);
  const [user, setUser] = useState<{ addr?: string | null }>({});

  // Subscribe to user and check sponsorship status
  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  useEffect(() => {
    if (user.addr) {
      checkSponsorship(user.addr);
    }
  }, [user.addr, refreshTrigger]);

  async function checkSponsorship(address: string) {
    try {
      const status = await getSponsorsipStatus(address);
      setSponsorshipStatus(status as any);
    } catch (error) {
      console.error("Failed to check sponsorship:", error);
    }
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!message.trim() || disabled) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/parse-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) {
        throw new Error("Failed to parse intent");
      }

      const data = await res.json();
      onParsed(data);
      setMessage("");
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Prompt chips */}
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '12px' }}>
        {["Save 50 FLOW/week", "Earn yield on idle balance", "DCA into FLOW daily"].map(chip => (
          <button key={chip} type="button" onClick={() => setMessage(chip)} style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '99px', padding: '6px 14px', fontSize: '12px', fontWeight: 500,
            color: '#a1a1aa', cursor: 'pointer', transition: 'all 0.2s',
            fontFamily: 'Inter, sans-serif',
          }}>
            {chip}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.15)', fontSize: '13px', color: '#f87171' }}>
          ⚠ {error}
        </div>
      )}

      {/* Input bar */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#0f0f14', border: '1px solid rgba(129,140,248,0.25)', borderRadius: '99px', padding: '6px 6px 6px 20px', boxShadow: '0 0 0 4px rgba(129,140,248,0.05)' }}>
        {/* Lock icon */}
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="#52525b" strokeWidth={2} style={{ flexShrink: 0 }}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>

        <input
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder={loading ? "Thinking privately..." : "e.g. Save 50 FLOW every week and earn yield..."}
          disabled={disabled || loading}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: '14px', color: '#e4e4e7', fontFamily: 'Inter, sans-serif',
            padding: '10px 0',
          }}
        />

        <button type="submit" disabled={disabled || loading || !message.trim()} style={{
          background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
          border: 'none', borderRadius: '99px', padding: '10px 22px',
          fontSize: '13px', fontWeight: 600, color: 'white', cursor: 'pointer',
          opacity: (disabled || loading || !message.trim()) ? 0.35 : 1,
          transition: 'all 0.2s', flexShrink: 0, fontFamily: 'Inter, sans-serif',
        }}>
          {loading ? "..." : "Go"}
        </button>
      </form>

      {/* Sponsorship badge */}
      {sponsorshipStatus && (
        <div style={{ marginTop: '12px', textAlign: 'center' }}>
          {sponsorshipStatus.sponsored ? (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '11px', fontWeight: 600, color: '#10b981',
              background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: '99px', padding: '4px 12px',
            }}>
              ⛽ Gasless · {sponsorshipStatus.remaining} of {sponsorshipStatus.total} free transactions remaining
            </span>
          ) : (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              fontSize: '11px', fontWeight: 600, color: '#52525b',
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '99px', padding: '4px 12px',
            }}>
              ⛽ Gas fees apply from here
            </span>
          )}
        </div>
      )}
    </div>
  );
}
