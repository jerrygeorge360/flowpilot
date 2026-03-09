import Link from "next/link";

export default function HomePage() {
  return (
    <main style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', padding: '24px',
      background: '#09090b', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '20%', left: '30%',
        width: '400px', height: '400px',
        background: 'radial-gradient(circle, rgba(129,140,248,0.06), transparent 60%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '30%',
        width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(167,139,250,0.04), transparent 60%)',
        pointerEvents: 'none',
      }} />

      <div style={{ width: '100%', maxWidth: '800px', position: 'relative', zIndex: 1 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: '80px' }}>
          <h1 style={{ fontSize: '56px', fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.1, margin: '0 0 24px', color: '#e4e4e7' }}>
            Tell{' '}
            <span style={{
              background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              your wallet
            </span>
            <br />
            what you want.
          </h1>
          <p style={{ fontSize: '18px', color: '#71717a', maxWidth: '480px', margin: '0 auto 32px', lineHeight: 1.7 }}>
            Natural language DeFi automation on Flow blockchain. Private. Simple. Just works.
          </p>

          {/* CTA */}
          <Link
            href="/dashboard"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '10px',
              background: 'linear-gradient(135deg, #818cf8, #a78bfa)',
              borderRadius: '99px', padding: '14px 32px',
              fontSize: '15px', fontWeight: 600, color: 'white', textDecoration: 'none',
              boxShadow: '0 8px 30px rgba(129,140,248,0.25)',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Launch App
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>

          {/* Example Prompts */}
          <div style={{ marginTop: '48px' }}>
            <p style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#52525b', marginBottom: '14px' }}>
              Try saying
            </p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {[
                "Save 50 FLOW every week",
                "Earn yield on my idle balance",
                "Buy FLOW every Monday"
              ].map((prompt) => (
                <span
                  key={prompt}
                  style={{
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '99px', padding: '8px 16px', fontSize: '12px', fontWeight: 500,
                    color: '#a1a1aa',
                  }}
                >
                  {prompt}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Feature Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '720px', margin: '0 auto' }}>
          {[
            {
              title: "Private AI",
              desc: "Inference runs inside NEAR AI trusted environments",
              icon: (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ),
            },
            {
              title: "Safe by Design",
              desc: "Built on Cadence's resource-oriented model",
              icon: (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              ),
            },
            {
              title: "Zero Jargon",
              desc: "Just plain English — no crypto complexity",
              icon: (
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              ),
            },
          ].map((feature) => (
            <div
              key={feature.title}
              style={{
                background: '#0f0f14', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: '16px', padding: '24px', textAlign: 'left',
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, rgba(129,140,248,0.15), rgba(167,139,250,0.1))',
                color: '#818cf8', marginBottom: '16px',
              }}>
                {feature.icon}
              </div>
              <h3 style={{ fontSize: '14px', fontWeight: 600, color: '#e4e4e7', margin: '0 0 6px' }}>
                {feature.title}
              </h3>
              <p style={{ fontSize: '13px', color: '#71717a', margin: 0, lineHeight: 1.6 }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
