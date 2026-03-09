"use client";

import { useEffect, useState } from "react";
import ActivityFeed from "@/components/ActivityFeed";
import type { ActivityItem } from "@/components/ActivityFeed";
import BalanceCard from "@/components/BalanceCard";
import ChatInput from "@/components/ChatInput";
import PlanPreview from "@/components/PlanPreview";
import WalletButton from "@/components/WalletButton";
import ManageRules from "@/components/ManageRules";
import type { ParsedIntent } from "@/lib/nearai";
import { fcl } from "@/lib/flow";
import { createAutomationRule, depositToVault, hasVault, initializeVault, publishRuleBookCapability } from "@/lib/cadence";

export default function DashboardPage() {
  const [plan, setPlan] = useState<ParsedIntent | null>(null);
  const [activating, setActivating] = useState(false);
  const [user, setUser] = useState<{ addr?: string | null; loggedIn?: boolean }>({ loggedIn: false });
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [principal, setPrincipal] = useState<number>(0);
  const [pendingYield, setPendingYield] = useState<number>(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [rulesCount, setRulesCount] = useState<number>(0);
  const [rules, setRules] = useState<any[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [sponsorRefreshKey, setSponsorRefreshKey] = useState(0);

  const yieldEarned = Math.max(0, pendingYield);

  useEffect(() => {
    fcl.currentUser.subscribe(setUser);
  }, []);

  useEffect(() => {
    if (user.addr) {
      fetchBalance();
      fetchRules();
      fetchActivity();
    }
  }, [user.addr]);

  useEffect(() => {
    if (!user.addr) return;
    const id = setInterval(() => {
      fetchBalance();
    }, 15000);
    return () => clearInterval(id);
  }, [user.addr]);

  async function fetchBalance() {
    if (!user.addr) return;
    setBalanceLoading(true);
    try {
      const res = await fetch(`/api/get-balance?address=${user.addr}`, { cache: "no-store" });
      const data = await res.json();
      if (data.balance !== undefined) setBalance(Number(data.balance) || 0);
      if (data.principal !== undefined) setPrincipal(Number(data.principal) || 0);
      if (data.pendingYield !== undefined) setPendingYield(Number(data.pendingYield) || 0);
    } catch (error) {
      console.error("Failed to fetch balance:", error);
    } finally {
      setBalanceLoading(false);
    }
  }

  async function fetchRules() {
    if (!user.addr) return;
    console.log("[Dashboard] Fetching rules for user address:", user.addr);
    try {
      const res = await fetch(`/api/get-rules?address=${user.addr}`, { cache: "no-store" });
      const data = await res.json();
      console.log("[Dashboard] API response:", data);
      if (data.rules) {
        // Transform event data to Rule format with index
        const transformedRules = data.rules.map((eventData: any, index: number) => ({
          actionType: eventData.actionType || "SCHEDULED_SAVE",
          amount: String(eventData.amount || 0),
          intervalSeconds: String(eventData.intervalSeconds || 0),
          active: eventData.active !== false,
          schedulerId: eventData.schedulerId ? String(eventData.schedulerId) : null,
          index: Number.isInteger(eventData.index) ? eventData.index : index,
          txId: eventData.txId ? String(eventData.txId) : undefined,
        }));
        console.log("[Dashboard] Transformed rules:", transformedRules);
        console.log("[Dashboard] Active rules count:", transformedRules.filter((r: any) => r.active).length);
        setRules(transformedRules);
        setRulesCount(transformedRules.filter((r: any) => r.active).length);
      }
    } catch (error) {
      console.error("Failed to fetch rules:", error);
    }
  }

  async function fetchActivity() {
    if (!user.addr) return;
    try {
      console.log("Fetching activity for address:", user.addr);
      const res = await fetch(`/api/get-activity?address=${user.addr}`, { cache: "no-store" });
      const data = await res.json();
      console.log("Activity response:", data);
      if (data.activities) {
        console.log("Setting activity items from blockchain:", data.activities);
        setActivityItems(data.activities);
      }
    } catch (error) {
      console.error("Failed to fetch activity:", error);
    }
  }

  async function confirmPlan() {
    if (!plan?.understood) return;

    if (!user.loggedIn || !user.addr) {
      alert("Please connect your wallet first");
      return;
    }

    setActivating(true);
    setTxStatus("Executing transactions...");

    try {
      const txIds: string[] = [];

      console.log("Plan to execute:", plan);
      console.log("Plan actions:", plan.actions);

      // Must run in browser so FCL can access wallet auth session
      const vaultExists = await hasVault(user.addr);
      console.log("Vault exists:", vaultExists);
      
      if (!vaultExists) {
        console.log("Initializing vault...");
        const initTxId = await initializeVault(user.addr);
        console.log("Vault initialized:", initTxId);
        txIds.push(initTxId);
      }

      for (const action of plan.actions ?? []) {
        console.log("Processing action:", action);
        
        if (action.type === "SCHEDULED_SAVE" && action.amount && action.intervalDays) {
          console.log("Creating SCHEDULED_SAVE rule...");
          const txId = await createAutomationRule(
            action.type,
            action.amount,
            action.intervalDays,
            user.addr
          );
          console.log("Rule created:", txId);
          txIds.push(txId);
        } else if (action.type === "AUTO_YIELD" && action.amount) {
          console.log("Depositing to vault...");
          const txId = await depositToVault(action.amount, user.addr);
          console.log("Deposited:", txId);
          txIds.push(txId);
        } else if (action.type === "DCA" && action.amount && action.intervalDays) {
          console.log("Creating DCA rule...");
          const txId = await createAutomationRule(
            action.type,
            action.amount,
            action.intervalDays,
            user.addr
          );
          console.log("DCA rule created:", txId);
          txIds.push(txId);
        } else {
          console.log("Action skipped (missing fields):", action);
        }
      }

      console.log("Total transactions executed:", txIds.length);

      setTxStatus(`Success! ${txIds.length} transaction(s) executed`);
      setPlan(null);
      await fetchBalance();
      await fetchRules();
      await fetchActivity(); // Fetch fresh blockchain events
      setSponsorRefreshKey((k) => k + 1);
    } catch (error: any) {
      console.error("[confirmPlan] Error during plan execution:", error);
      console.error("[confirmPlan] Error stack:", error.stack);
      setTxStatus(`Error: ${error.message || error.toString()}`);
    } finally {
      setActivating(false);
      setTimeout(() => setTxStatus(null), 5000);
    }
  }

  async function fixRuleBookCapability() {
    if (!user.addr) return;
    try {
      setTxStatus("Publishing RuleBook capability...");
      await publishRuleBookCapability(user.addr);
      setTxStatus("✅ Capability published! Refreshing rules...");
      await fetchRules();
      setTimeout(() => setTxStatus(null), 3000);
    } catch (error: any) {
      console.error("Fix capability error:", error);
      setTxStatus(`Error: ${error.message || error.toString()}`);
      setTimeout(() => setTxStatus(null), 5000);
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#09090b', padding: '0' }}>
      {/* Top gradient bar */}
      <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, #818cf8, #a78bfa, transparent)', opacity: 0.5 }} />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '32px 24px' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
          <div>
            <h1 style={{
              fontSize: '22px', fontWeight: 800, margin: 0,
              background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
            }}>
              FlowPilot
            </h1>
            <p style={{ fontSize: '12px', color: '#52525b', margin: '4px 0 0' }}>
              Tell your wallet what you want
            </p>
          </div>
          <WalletButton />
        </div>

        {/* ── Transaction Status Toast ── */}
        {txStatus && (
          <div style={{
            marginBottom: '24px', padding: '12px 16px', borderRadius: '12px',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
            fontSize: '13px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            ℹ {txStatus}
            <button onClick={() => setTxStatus(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: '16px' }}>×</button>
          </div>
        )}

        {/* ── Main Grid: Balance (3) + Activity (2) ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '20px', marginBottom: '24px' }}>
          <BalanceCard balance={balance} rulesCount={rulesCount} yieldEarned={yieldEarned} loading={balanceLoading} onBalanceUpdate={fetchBalance} />
          <ActivityFeed items={activityItems} />
        </div>

        {/* ── Manage Rules Section ── */}
        {rules.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <ManageRules 
              rules={rules}
              userAddress={user.addr || undefined}
              onRuleDeactivated={() => {
                fetchRules();
                fetchBalance();
                fetchActivity();
              }}
            />
          </div>
        )}

        {user.addr && (
          <p style={{ marginTop: '-12px', marginBottom: '18px', fontSize: '11px', color: '#52525b' }}>
            Active rules are counted for wallet: {user.addr}
          </p>
        )}

        {/* ── Debug: Fix capability button (temporary) ── */}
        {user.addr && rules.length === 0 && !balanceLoading && (
          <div style={{ 
            marginBottom: '24px', 
            padding: '16px', 
            background: 'rgba(251,191,36,0.1)', 
            border: '1px solid rgba(251,191,36,0.3)',
            borderRadius: '12px'
          }}>
            <p style={{ fontSize: '13px', color: '#fbbf24', margin: '0 0 12px' }}>
              ⚠️ Can't see your rules? You may need to publish the RuleBook capability.
            </p>
            <button
              onClick={fixRuleBookCapability}
              style={{
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 600,
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                border: 'none',
                borderRadius: '8px',
                color: '#000',
                cursor: 'pointer',
              }}
            >
              Fix RuleBook Capability
            </button>
          </div>
        )}

        <p style={{ marginTop: '-12px', marginBottom: '20px', fontSize: '11px', color: '#52525b' }}>
          On-chain APY: 5.00% · Principal: {principal.toFixed(2)} FLOW · Live pending yield: {pendingYield.toFixed(4)} FLOW
        </p>

        {/* ── Chat Input ── */}
        <div style={{ marginBottom: '24px' }}>
          <p style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#52525b', textAlign: 'center', marginBottom: '12px' }}>
            What do you want to do?
          </p>
          <ChatInput onParsed={setPlan} disabled={!user.loggedIn} refreshTrigger={sponsorRefreshKey} />
          {!user.loggedIn && (
            <p style={{ marginTop: '12px', fontSize: '12px', textAlign: 'center', color: '#52525b' }}>
              Connect your wallet to start
            </p>
          )}
        </div>

        {/* ── Plan Preview ── */}
        {plan && (
          <PlanPreview
            plan={plan}
            onConfirm={confirmPlan}
            onEdit={() => setPlan(null)}
            loading={activating}
          />
        )}
      </div>
    </main>
  );
}
