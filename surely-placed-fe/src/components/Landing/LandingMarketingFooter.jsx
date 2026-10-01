import Link from 'next/link';

export default function LandingMarketingFooter({ wide = false }) {
  const maxWidth = wide ? 1080 : 1200;
  return (
    <footer
      style={{
        background: 'var(--surface-inverse)',
        color: 'var(--text-on-dark-muted)',
        padding: wide ? '48px 24px' : '40px 20px 120px',
        borderTop: '1px solid var(--neutral-800)',
      }}
    >
      <div
        style={{
          maxWidth,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: wide ? 24 : 20,
          fontSize: 'var(--text-sm)',
          lineHeight: 'var(--leading-normal)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: '16px 32px',
            alignItems: 'baseline',
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 'var(--text-lg)',
              color: 'var(--text-on-dark)',
              textDecoration: 'none',
            }}
          >
            Surely Placed
          </Link>
          <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 24px' }}>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-and-conditions">Terms of Service</Link>
            <Link href="/refund-cancellation-policy">Refund Policy</Link>
          </nav>
        </div>
        <p style={{ margin: 0, maxWidth: 820 }}>
          Surely Placed provides career coaching and job-search support. We are not a law firm and
          do not provide immigration or legal advice. We do not guarantee employment, visa outcomes
          or placement timelines.
        </p>
        <p style={{ margin: 0 }}>© 2026 Surely Placed · [Registered business address]</p>
      </div>
    </footer>
  );
}
