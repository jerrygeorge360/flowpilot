export type ActivityItem = {
  id: string;
  text: string;
  when: string;
  type?: 'save' | 'yield' | 'rule';
};

export default function ActivityFeed({ items = [] }: { items?: ActivityItem[] }) {
  return (
    <div style={{
      background: '#0f0f14',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '20px',
      padding: '24px',
      height: '100%',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#e4e4e7' }}>Recent Activity</span>
        <span style={{
          fontSize: '10px', fontWeight: 700, color: '#818cf8',
          background: 'rgba(129,140,248,0.1)', border: '1px solid rgba(129,140,248,0.2)',
          borderRadius: '99px', padding: '2px 8px'
        }}>
          {items.length} events
        </span>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        <div style={{
          position: 'absolute', left: '10px', top: '8px', bottom: '8px', width: '1px',
          background: 'linear-gradient(to bottom, transparent, #818cf8 30%, #a78bfa 70%, transparent)'
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
          {items.length === 0 && (
            <div style={{
              fontSize: '12px',
              color: '#71717a',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '10px',
              padding: '12px',
              background: 'rgba(255,255,255,0.02)'
            }}>
              No activity yet. Execute a plan to see events.
            </div>
          )}
          {items.map((item) => {
            const colors = {
              save: { dot: '#34d399', bg: 'rgba(52,211,153,0.15)' },
              yield: { dot: '#60a5fa', bg: 'rgba(96,165,250,0.15)' },
              rule: { dot: '#818cf8', bg: 'rgba(129,140,248,0.15)' },
            };
            const c = colors[item.type || 'save'];
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', paddingLeft: '28px', position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: '4px', top: '6px',
                  width: '12px', height: '12px', borderRadius: '50%',
                  background: c.bg, border: `1.5px solid ${c.dot}`,
                  flexShrink: 0,
                }} />
                <div style={{
                  flex: 1, background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px', padding: '10px 12px'
                }}>
                  <p style={{ fontSize: '12px', color: '#e4e4e7', margin: '0 0 3px' }}>{item.text}</p>
                  <p style={{ fontSize: '10px', color: '#52525b', margin: 0, fontFamily: 'monospace' }}>{item.when}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
