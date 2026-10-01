export default function LandingCard({ padding = 'lg', children }) {
  const pad = padding === 'md' ? '20px' : '28px';
  return (
    <div
      style={{
        padding: pad,
        borderRadius: 'var(--radius-lg)',
        background: 'var(--surface-card)',
        border: '1px solid var(--border-subtle)',
        boxShadow: 'var(--shadow-sm)',
        height: '100%',
      }}
    >
      {children}
    </div>
  );
}
