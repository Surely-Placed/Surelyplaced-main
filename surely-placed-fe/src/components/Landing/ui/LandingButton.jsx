'use client';

import Link from 'next/link';

const variantStyles = {
  primary: {
    background: 'var(--brand-primary)',
    color: 'var(--text-on-brand)',
    border: 'none',
  },
  secondary: {
    background: 'transparent',
    color: 'var(--text-on-dark)',
    border: '1px solid var(--neutral-600)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: 'none',
  },
};

const sizeStyles = {
  lg: { padding: '14px 22px', fontSize: 'var(--text-lg)' },
  md: { padding: '10px 18px', fontSize: 'var(--text-sm)' },
  sm: { padding: '8px 14px', fontSize: 'var(--text-sm)' },
};

export default function LandingButton({
  variant = 'primary',
  size = 'lg',
  href,
  onClick,
  disabled,
  type = 'button',
  children,
  className = '',
}) {
  const style = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'var(--font-body)',
    fontWeight: 600,
    borderRadius: 'var(--radius-md)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
    textDecoration: 'none',
    transition: `background ${120}ms var(--ease-standard), border-color ${120}ms var(--ease-standard)`,
    ...variantStyles[variant],
    ...sizeStyles[size],
  };

  if (href) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={className} style={style}>
      {children}
    </button>
  );
}
