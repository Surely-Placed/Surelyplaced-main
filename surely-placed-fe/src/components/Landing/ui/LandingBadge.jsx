const toneStyles = {
  teal: { background: 'var(--teal-50)', color: 'var(--teal-700)' },
  blue: { background: 'var(--blue-50)', color: 'var(--blue-700)' },
  warning: { background: 'oklch(95% 0.06 75)', color: 'oklch(45% 0.12 75)' },
  neutral: { background: 'var(--neutral-100)', color: 'var(--text-secondary)' },
  success: { background: 'var(--teal-50)', color: 'var(--teal-700)' },
};

export default function LandingBadge({ tone = 'teal', children }) {
  const colors = toneStyles[tone] || toneStyles.teal;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        letterSpacing: 'var(--tracking-wide)',
        ...colors,
      }}
    >
      {children}
    </span>
  );
}
