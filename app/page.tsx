"use client";
import ThemeToggle from "@/components/ThemeToggle";
import { useTheme } from "@/context/ThemeProvider";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";


function useTypewriter(words: string[], speed = 80, pause = 1800): string {
  const [display, setDisplay] = useState("");
  const [wordIdx, setWordIdx] = useState(0);
  const [charIdx, setCharIdx] = useState(0);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    const current = words[wordIdx];
    const t = setTimeout(() => {
      if (!deleting) {
        setDisplay(current.slice(0, charIdx + 1));
        if (charIdx + 1 === current.length) setTimeout(() => setDeleting(true), pause);
        else setCharIdx(c => c + 1);
      } else {
        setDisplay(current.slice(0, charIdx - 1));
        if (charIdx - 1 === 0) { setDeleting(false); setWordIdx(i => (i + 1) % words.length); setCharIdx(0); }
        else setCharIdx(c => c - 1);
      }
    }, deleting ? speed / 2 : speed);
    return () => clearTimeout(t);
  }, [charIdx, deleting, wordIdx, words, speed, pause]);
  return display;
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0; const step = Math.ceil(to / 40);
        const t = setInterval(() => { start = Math.min(start + step, to); setVal(start); if (start >= to) clearInterval(t); }, 30);
        obs.disconnect();
      }
    });
    obs.observe(el); return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  const router = useRouter();
  const { theme } = useTheme();
  const dark = theme === "dark";

  const typed = useTypewriter(["your wallet", "your savings", "your DeFi", "your future"]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // ── Token palette ─────────────────────────────────────────────────────────
  const T = {
    // backgrounds
    pageBg:        dark ? "#030a05"              : "#f0fdf4",
    cardBg:        dark ? "#071209"              : "#ffffff",
    cardBorder:    dark ? "rgba(34,197,94,0.1)"  : "rgba(21,128,61,0.15)",
    cardBorderHov: dark ? "rgba(34,197,94,0.3)"  : "rgba(21,128,61,0.4)",
    statsBg:       dark ? "rgba(34,197,94,0.1)"  : "rgba(21,128,61,0.08)",
    statItemBg:    dark ? "#071209"              : "#ffffff",
    gridLine:      dark ? "rgba(34,197,94,0.03)" : "rgba(21,128,61,0.06)",
    // text
    heading:       dark ? "#f0fdf4"              : "#052e16",
    body:          dark ? "#6b7280"              : "#4b7a57",
    muted:         dark ? "#14532d"              : "#86a897",
    statLabel:     dark ? "#166534"              : "#15803d",
    // accent
    accent:        dark ? "#22c55e"              : "#16a34a",
    accentAlt:     dark ? "#4ade80"              : "#22c55e",
    accentRgb:     dark ? "34,197,94"            : "22,163,74",
    accentAltRgb:  dark ? "74,222,128"           : "34,197,94",
    // badge / pill
    badgeBg:       dark ? "rgba(34,197,94,0.08)" : "rgba(22,163,74,0.1)",
    badgeBorder:   dark ? "rgba(34,197,94,0.25)" : "rgba(22,163,74,0.3)",
    badgeText:     dark ? "#22c55e"              : "#16a34a",
    // chip
    chipBg:        dark ? "rgba(34,197,94,0.04)" : "rgba(22,163,74,0.06)",
    chipBorder:    dark ? "rgba(34,197,94,0.12)" : "rgba(22,163,74,0.2)",
    chipText:      dark ? "#4b7a57"              : "#15803d",
    chipHoverBg:   dark ? "rgba(34,197,94,0.08)" : "rgba(22,163,74,0.12)",
    chipHoverBorder: dark ? "rgba(34,197,94,0.4)": "rgba(22,163,74,0.5)",
    chipHoverText: dark ? "#22c55e"              : "#15803d",
    // cta
    ctaColor:      dark ? "#052e16"              : "#f0fdf4",
    ctaShadow:     dark ? "rgba(34,197,94,0.3)"  : "rgba(22,163,74,0.35)",
    // orbs
    orb1:          dark ? "rgba(34,197,94,0.06)"  : "rgba(22,163,74,0.08)",
    orb2:          dark ? "rgba(74,222,128,0.04)" : "rgba(34,197,94,0.06)",
    orb3:          dark ? "rgba(34,197,94,0.03)"  : "rgba(22,163,74,0.05)",
    // ticker
    tickerText:    dark ? "#14532d"              : "#86a897",
    tickerDivider: dark ? "rgba(34,197,94,0.06)" : "rgba(22,163,74,0.12)",
    // top bar
    topBar:        dark
      ? "linear-gradient(90deg, transparent, #22c55e, #4ade80, transparent)"
      : "linear-gradient(90deg, transparent, #16a34a, #22c55e, transparent)",
  };

  const accentGrad = `linear-gradient(135deg, ${T.accent}, ${T.accentAlt})`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800;900&family=DM+Sans:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        @keyframes drift {
          from { transform: translate(0,0) scale(1); }
          to   { transform: translate(30px,-20px) scale(1.1); }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(28px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes shimmer {
          0%   { background-position:-200% center; }
          100% { background-position:200% center; }
        }
        @keyframes blink {
          0%,100% { opacity:1; } 50% { opacity:0; }
        }
        @keyframes pulseRing-dark {
          0%   { box-shadow:0 0 0 0 rgba(34,197,94,0.45); }
          70%  { box-shadow:0 0 0 14px rgba(34,197,94,0); }
          100% { box-shadow:0 0 0 0 rgba(34,197,94,0); }
        }
        @keyframes pulseRing-light {
          0%   { box-shadow:0 0 0 0 rgba(22,163,74,0.4); }
          70%  { box-shadow:0 0 0 14px rgba(22,163,74,0); }
          100% { box-shadow:0 0 0 0 rgba(22,163,74,0); }
        }
        @keyframes float {
          0%,100% { transform:translateY(0); }
          50%      { transform:translateY(-8px); }
        }
        @keyframes ticker {
          0%   { transform:translateX(0); }
          100% { transform:translateX(-50%); }
        }
        @keyframes cardReveal {
          from { opacity:0; transform:translateY(20px) scale(0.97); }
          to   { opacity:1; transform:translateY(0) scale(1); }
        }
        @keyframes gradientShift {
          0%,100% { background-position:0% 50%; }
          50%      { background-position:100% 50%; }
        }
        @keyframes themeFade {
          from { opacity:0.6; } to { opacity:1; }
        }

        .fade-up-1 { opacity:0; animation:fadeUp .7s ease forwards .1s; }
        .fade-up-2 { opacity:0; animation:fadeUp .7s ease forwards .3s; }
        .fade-up-3 { opacity:0; animation:fadeUp .7s ease forwards .5s; }
        .fade-up-4 { opacity:0; animation:fadeUp .7s ease forwards .7s; }
        .fade-up-5 { opacity:0; animation:fadeUp .7s ease forwards .9s; }
        .card-1 { opacity:0; animation:cardReveal .6s ease forwards 1.0s; }
        .card-2 { opacity:0; animation:cardReveal .6s ease forwards 1.15s; }
        .card-3 { opacity:0; animation:cardReveal .6s ease forwards 1.3s; }

        .theme-transition { animation: themeFade 0.3s ease forwards; }

        .cta-btn {
          display:inline-flex; align-items:center; gap:10px;
          border-radius:99px; padding:14px 32px;
          font-size:15px; font-weight:700;
          cursor:pointer; border:none;
          transition:transform .2s ease, box-shadow .2s ease;
          font-family:'DM Sans',sans-serif;
          position:relative; overflow:hidden;
          width:100%; justify-content:center;
        }
        .cta-btn::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent);
          background-size:200% 100%; animation:shimmer 2.5s linear infinite;
        }
        .cta-btn:hover { transform:translateY(-2px) scale(1.02); }
        @media(min-width:480px){ .cta-btn { width:auto; } }

        .prompt-chips { display:flex; gap:8px; justify-content:center; flex-wrap:wrap; }

        .stats-grid {
          display:grid; grid-template-columns:1fr; gap:1px;
          border-radius:16px; overflow:hidden;
          max-width:560px; margin:0 auto 48px; width:100%;
        }
        @media(min-width:480px){ .stats-grid { grid-template-columns:repeat(3,1fr); } }

        .feature-grid {
          display:grid; grid-template-columns:1fr; gap:12px;
          max-width:720px; margin:0 auto; width:100%;
        }
        @media(min-width:560px){ .feature-grid { grid-template-columns:repeat(2,1fr); gap:14px; } }
        @media(min-width:800px){ .feature-grid { grid-template-columns:repeat(3,1fr); gap:16px; } }

        .ticker-wrap {
          overflow:hidden; width:100%;
          mask-image:linear-gradient(90deg,transparent,black 10%,black 90%,transparent);
        }
        .ticker-track { display:flex; gap:48px; width:max-content; animation:ticker 18s linear infinite; }
        .ticker-item {
          font-family:'DM Sans',sans-serif; font-size:11px; font-weight:600;
          letter-spacing:.12em; text-transform:uppercase; white-space:nowrap;
          display:flex; align-items:center; gap:12px;
        }
        .ticker-dot { width:4px; height:4px; border-radius:50%; flex-shrink:0; }

        .hero-h1 {
          font-size:clamp(34px,8vw,60px); font-family:'Syne',sans-serif;
          font-weight:900; letter-spacing:-.03em; line-height:1.08; margin:0 0 20px;
        }
        @media(min-width:640px){ .hero-h1 { margin:0 0 24px; } }

        .hero-p { font-size:16px; max-width:480px; margin:0 auto 28px; line-height:1.75; }
        @media(min-width:640px){ .hero-p { font-size:18px; margin:0 auto 36px; } }

        .top-bar {
          height:1px; opacity:.6;
          background-size:200% 100%; animation:gradientShift 4s ease infinite;
        }
      `}</style>

      <div className="theme-transition" key={theme}>
      
        <div className="top-bar" style={{ background: T.topBar }} />

        <main style={{
          minHeight:"100vh", display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center", padding:"32px 16px",
          background: T.pageBg, position:"relative", overflow:"hidden",
          fontFamily:"'DM Sans',sans-serif",
          transition: "background 0.4s ease",
        }}>
      
          {[
            { top:"10%", left:"10%", size:"min(500px,80vw)", bg: T.orb1, dur:"9s" },
            { bottom:"10%", right:"5%", size:"min(380px,60vw)", bg: T.orb2, dur:"11s" },
            { top:"55%", left:"2%", size:"min(200px,40vw)", bg: T.orb3, dur:"7s" },
          ].map((o, i) => (
            <div key={i} style={{
              position:"absolute", borderRadius:"50%", filter:"blur(80px)", pointerEvents:"none",
              top: o.top, bottom: (o as any).bottom, left: o.left, right: (o as any).right,
              width: o.size, height: o.size, background: o.bg,
              animation:`drift ${o.dur} ease-in-out infinite alternate`,
            }} />
          ))}

          
          <div style={{
            position:"absolute", inset:0, pointerEvents:"none",
            backgroundImage:`linear-gradient(${T.gridLine} 1px,transparent 1px),linear-gradient(90deg,${T.gridLine} 1px,transparent 1px)`,
            backgroundSize:"60px 60px",
            maskImage:"radial-gradient(ellipse 80% 60% at 50% 50%,black 30%,transparent 100%)",
          }} />

          <div style={{ width:"100%", maxWidth:"820px", position:"relative", zIndex:1 }}>

          
            <div className="fade-up-1" style={{ display:"flex", alignItems:"center", justifyContent:"center", gap:12, marginBottom:24, flexWrap:"wrap" }}>
              <span style={{
                display:"inline-flex", alignItems:"center", gap:8,
                background: T.badgeBg, border:`1px solid ${T.badgeBorder}`,
                borderRadius:"99px", padding:"6px 14px",
                fontSize:10, fontWeight:600, letterSpacing:"0.1em",
                textTransform:"uppercase", color: T.badgeText,
              }}>
                <span style={{
                  width:6, height:6, borderRadius:"50%", background: T.accent,
                  display:"inline-block", flexShrink:0,
                  animation:`${dark ? "pulseRing-dark" : "pulseRing-light"} 2s infinite`,
                }} />
                Now live on Flow Testnet
              </span>
              <ThemeToggle />
            </div>

          
            <div style={{ textAlign:"center", marginBottom:"56px" }}>
              <h1 className="hero-h1 fade-up-2" style={{ color: T.heading }}>
                Tell{" "}
                <span style={{ background: accentGrad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", display:"inline-block", minWidth:"3ch" }}>
                  {mounted ? typed : "your wallet"}
                </span>
                <span style={{ display:"inline-block", width:3, height:"0.85em", background: T.accent, marginLeft:3, verticalAlign:"text-bottom", animation:"blink 1s step-end infinite" }} />
                <br />what you want.
              </h1>

              <p className="hero-p fade-up-3" style={{ color: T.body }}>
                Natural language DeFi automation on Flow blockchain.{" "}
                <span style={{ color: dark ? "#a1a1aa" : "#4b7a57", fontWeight:500 }}>Private. Simple. Just works.</span>
              </p>

              <div className="fade-up-4">
                <button
                  onClick={() => window.location.href = "/dashboard"}
                  className="cta-btn"
                  style={{
                    background: accentGrad,
                    color: T.ctaColor,
                    boxShadow: `0 8px 30px ${T.ctaShadow}`,
                    animation: `${dark ? "pulseRing-dark" : "pulseRing-light"} 2.5s ease-in-out infinite 1.5s`,
                  }}
                >
                  Launch App
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>

              <div className="fade-up-5" style={{ marginTop:40 }}>
                <p style={{ fontSize:10, fontWeight:600, letterSpacing:"0.15em", textTransform:"uppercase", color: T.muted, marginBottom:12 }}>
                  Try saying
                </p>
                <div className="prompt-chips">
                  {["Save 50 FLOW every week","Earn yield on my idle balance","Buy FLOW every Monday"].map(p => (
                    <span key={p} style={{
                      background: T.chipBg, border:`1px solid ${T.chipBorder}`,
                      borderRadius:"99px", padding:"8px 14px",
                      fontSize:12, fontWeight:500, color: T.chipText,
                      cursor:"default", fontFamily:"'DM Sans',sans-serif", whiteSpace:"nowrap",
                      transition:"all 0.2s",
                    }}
                    onMouseEnter={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = T.chipHoverBorder;
                      el.style.color = T.chipHoverText;
                      el.style.background = T.chipHoverBg;
                    }}
                    onMouseLeave={e => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = T.chipBorder;
                      el.style.color = T.chipText;
                      el.style.background = T.chipBg;
                    }}
                    >
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            </div>

          
            <div className="stats-grid fade-up-5" style={{ background: T.statsBg }}>
              {[
                { label:"Transactions automated", val:0, suffix:"+" },
                { label:"Total volume", val:2, suffix:"M FLOW" },
                { label:"Avg setup time", val:30, suffix:"s" },
              ].map((s, i) => (
                <div key={i} style={{ background: T.statItemBg, padding:"18px 16px", textAlign:"center" }}>
                  <div style={{
                    fontFamily:"'Syne',sans-serif", fontSize:28, fontWeight:900,
                    background: accentGrad, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
                  }}>
                    <Counter to={s.val} suffix={s.suffix} />
                  </div>
                  <div style={{ fontSize:11, color: T.statLabel, marginTop:4, fontWeight:500 }}>{s.label}</div>
                </div>
              ))}
            </div>

          
            <div className="feature-grid">
              {[
                { title:"Private AI", desc:"Inference runs inside NEAR AI trusted environments", cls:"card-1", delay:"0s",
                  icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg> },
                { title:"Safe by Design", desc:"Built on Cadence's resource-oriented model", cls:"card-2", delay:"0.4s",
                  icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg> },
                { title:"Zero Jargon", desc:"Just plain English — no crypto complexity", cls:"card-3", delay:"0.8s",
                  icon:<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"/></svg> },
              ].map(f => (
                <div key={f.title} className={`${f.cls}`}
                  style={{
                    background: T.cardBg,
                    border:`1px solid ${T.cardBorder}`,
                    borderRadius:16, padding:20, textAlign:"left",
                    transition:"border-color .3s,transform .3s,box-shadow .3s",
                    position:"relative", overflow:"hidden",
                    boxShadow: dark ? "none" : "0 1px 4px rgba(0,0,0,0.06)",
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = T.cardBorderHov;
                    el.style.transform = "translateY(-4px)";
                    el.style.boxShadow = dark
                      ? "0 16px 40px rgba(0,0,0,0.5)"
                      : "0 12px 32px rgba(21,128,61,0.12)";
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = T.cardBorder;
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = dark ? "none" : "0 1px 4px rgba(0,0,0,0.06)";
                  }}
                >
                  <div style={{
                    width:40, height:40, borderRadius:10, flexShrink:0,
                    display:"flex", alignItems:"center", justifyContent:"center",
                    background:`linear-gradient(135deg,rgba(${T.accentRgb},0.15),rgba(${T.accentAltRgb},0.08))`,
                    color: T.accent, marginBottom:14,
                    animation:`float 3s ease-in-out infinite`, animationDelay: f.delay,
                  }}>
                    {f.icon}
                  </div>
                  <h3 style={{ fontSize:14, fontWeight:700, color: T.heading, margin:"0 0 6px", fontFamily:"'Syne',sans-serif" }}>
                    {f.title}
                  </h3>
                  <p style={{ fontSize:13, color: T.body, margin:0, lineHeight:1.65 }}>{f.desc}</p>
                </div>
              ))}
            </div>

        
            <div style={{ marginTop:48, borderTop:`1px solid ${T.tickerDivider}`, paddingTop:20 }}>
              <div className="ticker-wrap">
                <div className="ticker-track">
                  {[...Array(2)].flatMap((_,ai) =>
                    ["Flow Blockchain","NEAR AI","Private Inference","DeFi Automation","Natural Language","Resource-Oriented","Zero Jargon","Live on Mainnet"].map((t,i)=>(
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