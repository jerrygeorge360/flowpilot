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
import { useTheme } from "@/context/ThemeProvider";
import ThemeToggle from "@/components/ThemeToggle";


export default function DashboardPage() {
  const { theme } = useTheme();
  const dark = theme === "dark";

  const [plan, setPlan] = useState<ParsedIntent | null>(null);
  const [activating, setActivating] = useState(false);
  const [user, setUser] = useState<{ addr?: string | null; loggedIn?: boolean }>({ loggedIn: false });
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [principal, setPrincipal] = useState(0);
  const [pendingYield, setPendingYield] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [rulesCount, setRulesCount] = useState(0);
  const [rules, setRules] = useState<any[]>([]);
  const [activityItems, setActivityItems] = useState<ActivityItem[]>([]);
  const [sponsorRefreshKey, setSponsorRefreshKey] = useState(0);
  const [mounted, setMounted] = useState(false);

  const yieldEarned = Math.max(0, pendingYield);
  const isError = txStatus?.startsWith("Error");

  const T = {
    pageBg:        dark ? "#030a05"              : "#f0fdf4",
    cardBg:        dark ? "#071209"              : "#ffffff",
    cardBorder:    dark ? "rgba(34,197,94,0.1)"  : "rgba(21,128,61,0.15)",
    cardBorderHov: dark ? "rgba(34,197,94,0.25)" : "rgba(21,128,61,0.35)",
    heading:       dark ? "#f0fdf4"              : "#052e16",
    body:          dark ? "#6b7280"              : "#4b7a57",
    muted:         dark ? "#166534"              : "#86a897",
    accent:        dark ? "#22c55e"              : "#16a34a",
    accentAlt:     dark ? "#4ade80"              : "#22c55e",
    accentRgb:     dark ? "34,197,94"            : "22,163,74",
    badgeBg:       dark ? "rgba(34,197,94,0.08)" : "rgba(22,163,74,0.1)",
    badgeBorder:   dark ? "rgba(34,197,94,0.25)" : "rgba(22,163,74,0.3)",
    pillBg:        dark ? "rgba(34,197,94,0.04)" : "rgba(22,163,74,0.06)",
    pillBorder:    dark ? "rgba(34,197,94,0.1)"  : "rgba(22,163,74,0.18)",
    pillText:      dark ? "#166534"              : "#15803d",
    pillAccentBg:  dark ? "rgba(34,197,94,0.08)" : "rgba(22,163,74,0.1)",
    pillAccentBorder: dark ? "rgba(34,197,94,0.3)" : "rgba(22,163,74,0.35)",
    pillAccentText: dark ? "#22c55e"             : "#16a34a",
    chatLabelColor: dark ? "#166534"             : "#86a897",
    divider:       dark ? "rgba(34,197,94,0.06)" : "rgba(22,163,74,0.1)",
    topBar:        dark
      ? "linear-gradient(90deg,transparent,#22c55e,#4ade80,transparent)"
      : "linear-gradient(90deg,transparent,#16a34a,#22c55e,transparent)",
    hintBg:        dark ? "rgba(34,197,94,0.03)" : "rgba(22,163,74,0.05)",
    hintBorder:    dark ? "rgba(34,197,94,0.15)" : "rgba(22,163,74,0.2)",
    hintText:      dark ? "#166534"              : "#15803d",
    toastSuccBg:   dark ? "rgba(34,197,94,0.08)" : "rgba(22,163,74,0.08)",
    toastSuccBorder: dark ? "rgba(34,197,94,0.25)" : "rgba(22,163,74,0.3)",
    toastSuccText: dark ? "#22c55e"              : "#16a34a",
    tickerText:    dark ? "#14532d"              : "#86a897",
    gridLine:      dark ? "rgba(34,197,94,0.025)": "rgba(22,163,74,0.05)",
    orb1:          dark ? "rgba(34,197,94,0.05)" : "rgba(22,163,74,0.07)",
    orb2:          dark ? "rgba(74,222,128,0.04)": "rgba(34,197,94,0.05)",
  };

  const accentGrad = `linear-gradient(135deg,${T.accent},${T.accentAlt})`;

  useEffect(() => {
    setMounted(true);
    fcl.currentUser.subscribe(setUser);
  }, []);

  useEffect(() => {
    if (user.addr) { fetchBalance(); fetchRules(); fetchActivity(); }
  }, [user.addr]);

  useEffect(() => {
    if (!user.addr) return;
    const id = setInterval(fetchBalance, 15000);
    return () => clearInterval(id);
  }, [user.addr]);

  async function fetchBalance() {
    if (!user.addr) return;
    setBalanceLoading(true);
    try {
      const res = await fetch(`/api/get-balance?address=${user.addr}`, { cache:"no-store" });
      const d = await res.json();
      if (d.balance !== undefined) setBalance(Number(d.balance) || 0);
      if (d.principal !== undefined) setPrincipal(Number(d.principal) || 0);
      if (d.pendingYield !== undefined) setPendingYield(Number(d.pendingYield) || 0);
    } catch (e) { console.error(e); } finally { setBalanceLoading(false); }
  }

  async function fetchRules() {
    if (!user.addr) return;
    try {
      const res = await fetch(`/api/get-rules?address=${user.addr}`, { cache:"no-store" });
      const d = await res.json();
      if (d.rules) {
        const transformed = d.rules.map((ev: any, idx: number) => ({
          actionType: ev.actionType || "SCHEDULED_SAVE",
          amount: String(ev.amount || 0),
          intervalSeconds: String(ev.intervalSeconds || 0),
          active: ev.active !== false,
          schedulerId: ev.schedulerId ? String(ev.schedulerId) : null,
          index: Number.isInteger(ev.index) ? ev.index : idx,
          txId: ev.txId ? String(ev.txId) : undefined,
        }));
        setRules(transformed);
        setRulesCount(transformed.filter((r: any) => r.active).length);
      }
    } catch (e) { console.error(e); }
  }

  async function fetchActivity() {
    if (!user.addr) return;
    try {
      const res = await fetch(`/api/get-activity?address=${user.addr}`, { cache:"no-store" });
      const d = await res.json();
      if (d.activities) setActivityItems(d.activities);
    } catch (e) { console.error(e); }
  }

  async function confirmPlan() {
    if (!plan?.understood || !user.loggedIn || !user.addr) return;
    setActivating(true); setTxStatus("Executing transactions...");
    try {
      const txIds: string[] = [];
      if (!(await hasVault(user.addr))) txIds.push(await initializeVault(user.addr));
      for (const a of plan.actions ?? []) {
        if (a.type === "SCHEDULED_SAVE" && a.amount && a.intervalDays) txIds.push(await createAutomationRule(a.type, a.amount, a.intervalDays, user.addr));
        else if (a.type === "AUTO_YIELD" && a.amount) txIds.push(await depositToVault(a.amount, user.addr));
        else if (a.type === "DCA" && a.amount && a.intervalDays) txIds.push(await createAutomationRule(a.type, a.amount, a.intervalDays, user.addr));
      }
      setTxStatus(`Success! ${txIds.length} transaction(s) executed`);
      setPlan(null);
      await fetchBalance(); await fetchRules(); await fetchActivity();
      setSponsorRefreshKey(k => k + 1);
    } catch (e: any) { setTxStatus(`Error: ${e.message || e}`); }
    finally { setActivating(false); setTimeout(() => setTxStatus(null), 5000); }
  }

  async function fixRuleBookCapability() {
    if (!user.addr) return;
    try {
      setTxStatus("Publishing RuleBook capability...");
      await publishRuleBookCapability(user.addr);
      setTxStatus("✅ Capability published!");
      await fetchRules();
      setTimeout(() => setTxStatus(null), 3000);
    } catch (e: any) { setTxStatus(`Error: ${e.message || e}`); setTimeout(() => setTxStatus(null), 5000); }
  }

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;}

        @keyframes fadeUp{from{opacity:0;transform:translateY(20px);}to{opacity:1;transform:translateY(0);}}
        @keyframes drift{from{transform:translate(0,0) scale(1);}to{transform:translate(20px,-14px) scale(1.07);}}
        @keyframes pulse-dot{0%,100%{opacity:1;transform:scale(1);}50%{opacity:.4;transform:scale(.75);}}
        @keyframes ticker{0%{transform:translateX(0);}100%{transform:translateX(-50%);}}
        @keyframes slideIn{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}
        @keyframes gradientShift{0%,100%{background-position:0% 50%;}50%{background-position:100% 50%;}}
        @keyframes themeFade{from{opacity:.6;}to{opacity:1;}}

        .d1{opacity:0;animation:fadeUp .55s ease forwards .05s;}
        .d2{opacity:0;animation:fadeUp .55s ease forwards .15s;}
        .d3{opacity:0;animation:fadeUp .55s ease forwards .25s;}
        .d4{opacity:0;animation:fadeUp .55s ease forwards .35s;}
        .d5{opacity:0;animation:fadeUp .55s ease forwards .45s;}
        .d6{opacity:0;animation:fadeUp .55s ease forwards .55s;}

        .theme-transition{animation:themeFade .3s ease forwards;}

        .main-grid{display:grid;grid-template-columns:1fr;gap:14px;margin-bottom:16px;}
        @media(min-width:640px){.main-grid{grid-template-columns:3fr 2fr;gap:20px;margin-bottom:20px;}}

        .dash-header{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:28px;}
        @media(min-width:480px){.dash-header{margin-bottom:36px;flex-wrap:nowrap;}}

        .meta-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin-bottom:18px;}

        .warn-box{margin-bottom:18px;padding:14px 16px;background:rgba(251,191,36,.07);border:1px solid rgba(251,191,36,.22);border-radius:14px;display:flex;flex-direction:column;gap:10px;}
        @media(min-width:480px){.warn-box{flex-direction:row;align-items:center;justify-content:space-between;}}
        .warn-btn{padding:8px 16px;font-size:12px;font-weight:700;background:linear-gradient(135deg,#fbbf24,#f59e0b);border:none;border-radius:8px;color:#000;cursor:pointer;font-family:'DM Sans',sans-serif;transition:opacity .2s,transform .2s;align-self:flex-start;white-space:nowrap;}
        .warn-btn:hover{opacity:.88;transform:translateY(-1px);}

        .top-bar{height:1px;opacity:.6;background-size:200% 100%;animation:gradientShift 4s ease infinite;}
        .chat-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;text-align:center;margin-bottom:12px;font-family:'DM Sans',sans-serif;}
        .toast-enter{animation:slideIn .25s ease forwards;}

        .ticker-wrap{overflow:hidden;width:100%;mask-image:linear-gradient(90deg,transparent,black 8%,black 92%,transparent);}
        .ticker-track{display:flex;gap:40px;width:max-content;animation:ticker 22s linear infinite;}
        .ticker-item{font-size:10px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;white-space:nowrap;display:flex;align-items:center;gap:10px;font-family:'DM Sans',sans-serif;}
        .ticker-dot{width:3px;height:3px;border-radius:50%;flex-shrink:0;}
      `}</style>

      <div className="theme-transition" key={theme} style={{ transition:"background 0.4s ease" }}>
        <div className="top-bar" style={{ background: T.topBar }} />

        {/* Fixed bg orbs */}
        <div style={{ position:"fixed", inset:0, pointerEvents:"none", overflow:"hidden", zIndex:0 }}>
          <div style={{ position:"absolute", top:"5%", right:"8%", width:"min(420px,55vw)", height:"min(420px,55vw)", borderRadius:"50%", filter:"blur(90px)", background: T.orb1, animation:"drift 10s ease-in-out infinite alternate" }} />
          <div style={{ position:"absolute", bottom:"8%", left:"4%", width:"min(300px,42vw)", height:"min(300px,42vw)", borderRadius:"50%", filter:"blur(80px)", background: T.orb2, animation:"drift 13s ease-in-out infinite alternate-reverse" }} />
          <div style={{ position:"absolute", inset:0, backgroundImage:`linear-gradient(${T.gridLine} 1px,transparent 1px),linear-gradient(90deg,${T.gridLine} 1px,transparent 1px)`, backgroundSize:"60px 60px", maskImage:"radial-gradient(ellipse 90% 60% at 60% 30%,black 10%,transparent 100%)" }} />
        </div>

        <main style={{ minHeight:"100vh", background: T.pageBg, fontFamily:"'DM Sans',sans-serif", position:"relative", transition:"background 0.4s ease" }}>
          <div style={{ maxWidth:"900px", margin:"0 auto", padding:"24px 16px", position:"relative", zIndex:1 }}>

            {/* Header */}
            <header className="dash-header d1">
              <div>
                <h1 style={{ fontSize:20, fontWeight:800, margin:0, fontFamily:"'Syne',sans-serif", background: accentGrad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                  FlowPilot
                </h1>
                <p style={{ fontSize:11, color: T.muted, margin:"3px 0 0", fontWeight:500 }}>Tell your wallet what you want</p>
              </div>
              <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
                {user.loggedIn && (
                  <span style={{ display:"inline-flex", alignItems:"center", gap:6, background: T.badgeBg, border:`1px solid ${T.badgeBorder}`, borderRadius:"99px", padding:"5px 11px", fontSize:10, fontWeight:600, letterSpacing:"0.08em", textTransform:"uppercase", color: T.accent }}>
                    <span style={{ width:5, height:5, borderRadius:"50%", background: T.accent, animation:"pulse-dot 2s ease infinite", display:"inline-block" }} />
                    Live
                  </span>
                )}
                <ThemeToggle />
                <WalletButton />
              </div>
            </header>

            {txStatus && (
              <div className="toast-enter" style={{ marginBottom:18, padding:"12px 16px", borderRadius:12, background: isError ? "rgba(239,68,68,0.08)" : T.toastSuccBg, border:`1px solid ${isError ? "rgba(239,68,68,0.2)" : T.toastSuccBorder}`, fontSize:13, color: isError ? "#f87171" : T.toastSuccText, display:"flex", alignItems:"center", gap:10 }}>
                <span>{isError ? "⚠" : "ℹ"}</span>
                <span style={{ flex:1 }}>{txStatus}</span>
                <button onClick={() => setTxStatus(null)} style={{ background:"none", border:"none", color: T.muted, cursor:"pointer", fontSize:18, lineHeight:1, padding:"0 2px" }}>×</button>
              </div>
            )}

           
            {!user.loggedIn && mounted && (
              <div className="d2" style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:8, padding:"28px 20px", textAlign:"center", background: T.hintBg, border:`1px dashed ${T.hintBorder}`, borderRadius:16, marginBottom:18 }}>
                <div style={{ width:44, height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", background:`rgba(${T.accentRgb},0.1)`, fontSize:20 }}>⚡</div>
                <p style={{ fontSize:14, fontWeight:600, color: T.heading, margin:0 }}>Connect your wallet to get started</p>
                <p style={{ fontSize:12, color: T.hintText, margin:0 }}>Automate your DeFi in plain English</p>
              </div>
            )}

          
            <div className="main-grid d2">
              <BalanceCard balance={balance} rulesCount={rulesCount} yieldEarned={yieldEarned} loading={balanceLoading} onBalanceUpdate={fetchBalance} />
              <ActivityFeed items={activityItems} />
            </div>

           
            <div className="meta-bar d3">
              {[
                { label:"5.00% APY", accent:true },
                { label:`Principal: ${principal.toFixed(2)} FLOW` },
                { label:`Pending yield: ${pendingYield.toFixed(4)} FLOW` },
                ...(user.addr ? [{ label:`${user.addr.slice(0,6)}…${user.addr.slice(-4)}` }] : []),
              ].map((p, i) => (
                <span key={i} style={{
                  display:"inline-flex", alignItems:"center", gap:5,
                  background: p.accent ? T.pillAccentBg : T.pillBg,
                  border:`1px solid ${p.accent ? T.pillAccentBorder : T.pillBorder}`,
                  borderRadius:"99px", padding:"4px 10px",
                  fontSize:11, color: p.accent ? T.pillAccentText : T.pillText,
                  fontWeight:500, fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap",
                }}>
                  {p.accent && <span style={{ width:5, height:5, borderRadius:"50%", background: T.accent, animation:"pulse-dot 2s ease infinite", display:"inline-block" }} />}
                  {p.label}
                </span>
              ))}
            </div>

            
            {rules.length > 0 && (
              <div className="d4" style={{ marginBottom:18 }}>
                <ManageRules rules={rules} userAddress={user.addr || undefined} onRuleDeactivated={() => { fetchRules(); fetchBalance(); fetchActivity(); }} />
              </div>
            )}

          
            {user.addr && rules.length === 0 && !balanceLoading && (
              <div className="warn-box d4">
                <p style={{ fontSize:13, color:"#fbbf24", margin:0, lineHeight:1.5 }}>⚠️ Can't see your rules? You may need to publish the RuleBook capability.</p>
                <button className="warn-btn" onClick={fixRuleBookCapability}>Fix RuleBook Capability</button>
              </div>
            )}

         
            <div className="d5" style={{ marginBottom:18 }}>
              <div style={{
                background: T.cardBg,
                border:`1px solid ${T.cardBorder}`,
                borderRadius:16, padding:20,
                transition:"border-color .3s, box-shadow .3s",
                position:"relative", overflow:"hidden",
                boxShadow: dark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <p className="chat-label" style={{ color: T.chatLabelColor }}>What do you want to do?</p>
                <ChatInput onParsed={setPlan} disabled={!user.loggedIn} refreshTrigger={sponsorRefreshKey} />
                {!user.loggedIn && (
                  <p style={{ marginTop:10, fontSize:12, textAlign:"center", color: T.muted }}>Connect your wallet to start automating</p>
                )}
              </div>
            </div>

       
            {plan && (
              <div className="d5">
                <PlanPreview plan={plan} onConfirm={confirmPlan} onEdit={() => setPlan(null)} loading={activating} />
              </div>
            )}

         
            <div className="d6" style={{ marginTop:40, paddingTop:18, borderTop:`1px solid ${T.divider}` }}>
              <div className="ticker-wrap">
                <div className="ticker-track">
                  {[...Array(2)].flatMap((_,ai) =>
                    ["Flow Blockchain","NEAR AI","Private Inference","DeFi Automation","Natural Language","5% APY","Zero Jargon","Live on Mainnet"].map((t,i)=>(
                      <span key={`${t}-${ai}-${i}`} className="ticker-item" style={{ color: T.tickerText }}>
                        <span className="ticker-dot" style={{ background: T.accent }} />{t}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </>
  );
}