'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { DEFAULT_PAIN_LINE, LANDING_PERSONAS, LANDING_ROLES } from '../../../mockData/Landing/personas';
import { useWeeklyCountdown } from './hooks/useWeeklyCountdown';
import { useRevealOnScroll } from './hooks/useRevealOnScroll';
import LandingBadge from './ui/LandingBadge';
import LandingButton from './ui/LandingButton';
import LandingCard from './ui/LandingCard';
import LandingGlow from './LandingGlow';
import LandingMarketingFooter from './LandingMarketingFooter';

const CHIP_POS = [
  { left: '-4px', right: 'auto', top: '8%' },
  { left: 'auto', right: '-4px', top: '44%' },
  { left: '6%', right: 'auto', top: '78%' },
];

export default function PersonaLandingPage({ personaKey }) {
  const raw = LANDING_PERSONAS[personaKey] || LANDING_PERSONAS.grad;
  const p = { painLine: DEFAULT_PAIN_LINE, ...raw };
  const ctaHref = `/how-it-works?persona=${personaKey}`;
  const rootRef = useRef(null);
  const [stickyVisible, setStickyVisible] = useState(false);
  const { countdown, timeParts, stickyNote } = useWeeklyCountdown();
  const showUrgency = !p.calm;

  useRevealOnScroll(rootRef);

  useEffect(() => {
    const onScroll = () => setStickyVisible(window.scrollY > 420);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const roles = [...LANDING_ROLES, ...LANDING_ROLES];
  const isClock = p.lens === 'clock';
  const isSilence = p.lens === 'silence';

  return (
    <div className="landing-root" ref={rootRef}>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: 'var(--brand-primary)',
          color: 'var(--text-on-brand)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '10px 16px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px 14px',
            fontSize: 'var(--text-sm)',
            lineHeight: 1.35,
            textAlign: 'center',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: 'var(--teal-300)',
                animation: 'sp-blink 1.2s ease-in-out infinite',
                flexShrink: 0,
              }}
            />
            {p.bar}
          </span>
          {showUrgency && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <span style={{ opacity: 0.85 }}>This week&apos;s free calls close in</span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 600,
                  background: 'rgba(13,13,13,0.25)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-sm)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {countdown}
              </span>
            </span>
          )}
        </div>
      </div>

      <header
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--surface-inverse)',
          color: 'var(--text-on-dark)',
        }}
      >
        <LandingGlow
          style={{ left: '-25%', bottom: '-35%', width: '110%', maxWidth: 1300 }}
        />
        <div
          style={{
            position: 'relative',
            maxWidth: 1200,
            margin: '0 auto',
            padding: '18px 20px 0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 19,
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--text-on-dark)',
              textDecoration: 'none',
            }}
          >
            Surely Placed
          </Link>
          <LandingButton variant="secondary" size="sm" href={ctaHref}>
            Apply now →
          </LandingButton>
        </div>

        <div
          style={{
            position: 'relative',
            maxWidth: 1200,
            margin: '0 auto',
            padding: 'clamp(28px, 6vw, 64px) 20px clamp(48px, 8vw, 88px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 420px), 1fr))',
            gap: 'clamp(36px, 6vw, 64px)',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 3vw, 26px)', minWidth: 0 }}>
            <div style={{ display: 'flex', animation: 'sp-rise 600ms ease-out both' }}>
              <LandingBadge tone={p.badgeTone}>{p.badge}</LandingBadge>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <h1
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontWeight: 600,
                  fontSize: 'clamp(30px, 4.4vw, 54px)',
                  lineHeight: 1.1,
                  letterSpacing: 'var(--tracking-tight)',
                }}
              >
                <span style={{ color: 'var(--text-on-dark)' }}>{p.h1} </span>
                <span style={{ color: 'var(--teal-200)' }}>{p.h1b}</span>
              </h1>
              <div
                style={{
                  width: 96,
                  height: 4,
                  borderRadius: 999,
                  background: 'var(--brand-teal)',
                  transformOrigin: 'left',
                  animation: 'sp-sweep 900ms 600ms cubic-bezier(.2,.7,.2,1) both',
                }}
              />
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 'clamp(17px, 1.6vw, 20px)',
                lineHeight: 'var(--leading-normal)',
                color: 'var(--text-on-dark-muted)',
                maxWidth: 540,
              }}
            >
              {p.sub}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, animation: 'sp-rise 700ms 400ms ease-out both' }}>
              <div style={{ position: 'relative', display: 'flex' }}>
                <span style={{ position: 'relative', display: 'inline-flex' }}>
                  <span
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 'var(--radius-md)',
                      border: '2px solid var(--teal-300)',
                      animation: 'sp-pulse 1.8s ease-out infinite',
                      pointerEvents: 'none',
                    }}
                  />
                  <LandingButton href={ctaHref}>{p.cta} →</LandingButton>
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '6px 16px',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--text-on-dark-muted)',
                }}
              >
                {['Free 30-min call', '3 minutes to apply', 'No obligation'].map((label) => (
                  <span key={label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ color: 'var(--teal-300)', fontWeight: 700 }}>✓</span>
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              position: 'relative',
              minWidth: 0,
              padding: '0 8px',
              animation: 'sp-rise 900ms 300ms ease-out both',
            }}
          >
            <div
              style={{
                position: 'absolute',
                inset: '6% -2% -3% 10%',
                borderRadius: 'var(--radius-xl)',
                border: '1px dashed var(--teal-700)',
                animation: 'sp-float 7s ease-in-out infinite',
              }}
            />
            <Image
              src={p.img}
              alt={p.alt}
              width={800}
              height={1000}
              style={{
                position: 'relative',
                display: 'block',
                width: '100%',
                height: 'auto',
                aspectRatio: '4 / 5',
                maxHeight: 620,
                objectFit: 'cover',
                borderRadius: 'var(--radius-lg)',
                boxShadow: 'var(--shadow-lg)',
              }}
              priority
            />
            {p.chips.map((chip, i) => {
              const pos = CHIP_POS[i];
              return (
                <div
                  key={chip[0]}
                  style={{
                    position: 'absolute',
                    left: pos.left,
                    right: pos.right,
                    top: pos.top,
                    animation: `sp-float 5s ease-in-out infinite`,
                    animationDelay: `${i * -1.6}s`,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: 'var(--surface-card)',
                      color: 'var(--text-primary)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg)',
                      padding: '10px 14px',
                      fontSize: 'clamp(12px, 1.3vw, 14px)',
                      fontWeight: 500,
                      maxWidth: 240,
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: 'var(--teal-50)',
                        color: 'var(--teal-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      ✓
                    </span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 1, lineHeight: 1.25 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          letterSpacing: 'var(--tracking-wide)',
                          textTransform: 'uppercase',
                          color: 'var(--brand-primary)',
                        }}
                      >
                        {chip[0]}
                      </span>
                      <span>{chip[1]}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <div
        style={{
          background: 'var(--neutral-800)',
          color: 'var(--text-on-dark)',
          overflow: 'hidden',
          borderTop: '1px solid var(--neutral-700)',
          borderBottom: '1px solid var(--neutral-700)',
        }}
      >
        <div style={{ display: 'flex', width: 'max-content', animation: 'sp-marquee 36s linear infinite' }}>
          {roles.map((r, idx) => (
            <span
              key={`${r}-${idx}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 18,
                padding: '14px 18px',
                fontFamily: 'var(--font-display)',
                fontWeight: 500,
                fontSize: 'clamp(14px, 1.6vw, 18px)',
                whiteSpace: 'nowrap',
              }}
            >
              <span>{r}</span>
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--brand-teal)' }} />
            </span>
          ))}
        </div>
      </div>

      <section style={{ background: 'var(--surface-page)', padding: 'clamp(56px, 9vw, 96px) 20px' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
            gap: 'clamp(28px, 5vw, 64px)',
            alignItems: 'start',
          }}
        >
          <div className="landing-reveal" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
                color: 'var(--brand-primary)',
              }}
            >
              Sound familiar?
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(26px, 3.4vw, 42px)',
                lineHeight: 1.15,
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              {p.painTitle}
            </h2>
            <p style={{ margin: 0, fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-normal)', color: 'var(--text-secondary)' }}>
              {p.painLine}
            </p>
            {isClock && (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--surface-inverse)',
                  color: 'var(--text-on-dark)',
                  marginTop: 4,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 12,
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  <span style={{ fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 999,
                        background: 'var(--color-warning)',
                        animation: 'sp-blink 1.2s ease-in-out infinite',
                      }}
                    />
                    {p.lensLabel}
                  </span>
                  <span style={{ color: 'var(--text-on-dark-muted)', textAlign: 'right' }}>{p.lensRight}</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: 'var(--neutral-700)', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      borderRadius: 999,
                      background: 'linear-gradient(90deg, var(--color-warning), var(--brand-teal))',
                      transformOrigin: 'right',
                      animation: 'sp-drain 7s ease-in-out infinite alternate',
                    }}
                  />
                </div>
              </div>
            )}
            {isSilence && (
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', gap: 10, marginTop: 4 }}>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '18px 20px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--surface-inverse)',
                    color: 'var(--text-on-dark)',
                  }}
                >
                  <span
                    data-count={p.sent}
                    data-suffix="+"
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: 'clamp(32px, 4vw, 44px)',
                      lineHeight: 1,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {p.sent}+
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-on-dark-muted)' }}>Applications sent</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    padding: '18px 20px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--surface-card)',
                    border: '1px solid var(--border-default)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontWeight: 600,
                      fontSize: 'clamp(32px, 4vw, 44px)',
                      lineHeight: 1,
                      color: 'var(--color-danger)',
                      animation: 'sp-blink 2.4s ease-in-out infinite',
                    }}
                  >
                    {p.replies}
                  </span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{p.repliesLabel}</span>
                </div>
              </div>
            )}
            <div style={{ display: 'flex', paddingTop: 8 }}>
              <LandingButton href={ctaHref}>Fix this with a coach →</LandingButton>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {p.pains.map((text, i) => (
              <div
                key={text}
                className="landing-reveal"
                data-delay={i * 120}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 14,
                  padding: '18px 20px',
                  background: 'var(--surface-card)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-lg)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: 'oklch(95% 0.03 25)',
                    color: 'var(--color-danger)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  ✕
                </span>
                <span style={{ fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-snug)', paddingTop: 2 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--surface-inverse)',
          color: 'var(--text-on-dark)',
          padding: 'clamp(56px, 9vw, 104px) 20px',
        }}
      >
        <LandingGlow
          style={{
            right: '-30%',
            top: '-40%',
            width: '90%',
            animation: 'sp-glow 11s ease-in-out infinite reverse',
          }}
        />
        <div
          style={{
            position: 'relative',
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 'clamp(32px, 5vw, 48px)',
          }}
        >
          <div className="landing-reveal" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 720 }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
                color: 'var(--teal-300)',
              }}
            >
              {p.clockLabel}
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(28px, 3.8vw, 46px)',
                lineHeight: 1.1,
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              {p.timelineTitle}
            </h2>
            <p style={{ margin: 0, fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-normal)', color: 'var(--text-on-dark-muted)' }}>
              {p.caption}
            </p>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ height: 6, borderRadius: 999, background: 'var(--neutral-700)', overflow: 'hidden' }}>
              <div
                className="landing-reveal landing-reveal--fill"
                style={{
                  height: '100%',
                  borderRadius: 999,
                  background: 'linear-gradient(90deg, var(--brand-teal), var(--blue-400))',
                }}
              />
            </div>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
              gap: 16,
            }}
          >
            {p.milestones.map(([when, what], i) => (
              <div
                key={when}
                className="landing-reveal"
                data-delay={300 + i * 220}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  padding: 20,
                  borderRadius: 'var(--radius-lg)',
                  background: 'var(--neutral-800)',
                  border: '1px solid var(--neutral-700)',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)',
                    color: 'var(--teal-300)',
                  }}
                >
                  <span
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 999,
                      background: 'var(--brand-teal)',
                      boxShadow: '0 0 0 4px rgba(56,189,177,0.2)',
                    }}
                  />
                  {when}
                </span>
                <span style={{ fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-snug)' }}>{what}</span>
              </div>
            ))}
          </div>
          <div className="landing-reveal" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px 20px' }}>
            <LandingButton variant="secondary" href={ctaHref}>
              {p.cta2} →
            </LandingButton>
            <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-on-dark-muted)' }}>
              Your coach builds this plan with you on the first call.
            </span>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--surface-sunken)', padding: 'clamp(56px, 9vw, 96px) 20px' }}>
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))',
            gap: 20,
            alignItems: 'stretch',
          }}
        >
          <div
            className="landing-reveal"
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: 8,
              padding: 'clamp(24px, 4vw, 40px)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--brand-primary)',
              color: 'var(--text-on-brand)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                right: -60,
                top: -60,
                width: 200,
                height: 200,
                borderRadius: 999,
                border: '2px dashed rgba(255,255,255,0.25)',
                animation: 'sp-spin 30s linear infinite',
              }}
            />
            <span
              data-count={890}
              data-suffix="+"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(56px, 8vw, 88px)',
                lineHeight: 1,
                letterSpacing: 'var(--tracking-tight)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              890+
            </span>
            <span style={{ fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-snug)', maxWidth: 320 }}>
              international students placed into US tech, product and data roles
            </span>
          </div>
          <div className="landing-reveal" data-delay={150} style={{ display: 'flex' }}>
            <LandingCard padding="lg">
              <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 18 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: 56, lineHeight: 0.6, color: 'var(--brand-teal)' }}>
                  “
                </span>
                <blockquote style={{ margin: 0, fontSize: 'clamp(18px, 1.8vw, 21px)', lineHeight: 'var(--leading-normal)' }}>
                  {p.quote}
                </blockquote>
                <figcaption style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{p.quoteBy}</figcaption>
              </figure>
            </LandingCard>
          </div>
        </div>
      </section>

      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--surface-inverse)',
          color: 'var(--text-on-dark)',
          padding: 'clamp(64px, 10vw, 112px) 20px clamp(96px, 12vw, 112px)',
        }}
      >
        <LandingGlow
          style={{
            left: '50%',
            top: '50%',
            width: '120%',
            maxWidth: 1400,
            transform: 'translate(-50%, -50%)',
            WebkitMaskImage: 'radial-gradient(closest-side, #000 50%, transparent)',
            maskImage: 'radial-gradient(closest-side, #000 50%, transparent)',
            animation: 'sp-glow 7s ease-in-out infinite',
          }}
        />
        <div
          className="landing-reveal"
          style={{
            position: 'relative',
            maxWidth: 760,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 22,
            textAlign: 'center',
          }}
        >
          <LandingBadge tone={p.badgeTone}>{p.badge}</LandingBadge>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 'clamp(28px, 4.4vw, 52px)',
              lineHeight: 1.1,
              letterSpacing: 'var(--tracking-tight)',
            }}
          >
            {p.finalTitle}
          </h2>
          {showUrgency && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {timeParts.map((t) => (
                  <div
                    key={t.l}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      minWidth: 60,
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--neutral-800)',
                      border: '1px solid var(--neutral-700)',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        fontSize: 'clamp(22px, 3vw, 30px)',
                        fontVariantNumeric: 'tabular-nums',
                        lineHeight: 1,
                      }}
                    >
                      {t.v}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        letterSpacing: 'var(--tracking-wider)',
                        textTransform: 'uppercase',
                        color: 'var(--text-on-dark-muted)',
                      }}
                    >
                      {t.l}
                    </span>
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-on-dark-muted)' }}>
                until this week&apos;s free call slots close
              </span>
            </div>
          )}
          <span style={{ position: 'relative', display: 'inline-flex', marginTop: 6 }}>
            <span
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: 'var(--radius-md)',
                border: '2px solid var(--teal-300)',
                animation: 'sp-pulse 1.8s ease-out infinite',
                pointerEvents: 'none',
              }}
            />
            <LandingButton href={ctaHref}>{p.cta} →</LandingButton>
          </span>
        </div>
      </section>

      <LandingMarketingFooter />

      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 30,
          padding: '10px 12px calc(10px + env(safe-area-inset-bottom))',
          background: 'rgba(13,13,13,0.94)',
          borderTop: '1px solid var(--neutral-700)',
          transform: stickyVisible ? 'translateY(0)' : 'translateY(110%)',
          transition: 'transform 350ms var(--ease-standard)',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <span style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, color: 'var(--text-on-dark)' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', lineHeight: 1.25 }}>{p.stickyText}</span>
            <span
              style={{
                fontSize: 12,
                color: 'var(--text-on-dark-muted)',
                fontFamily: 'var(--font-mono)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {p.calm ? 'Senior and specialist roles · by consultation' : stickyNote}
            </span>
          </span>
          <span style={{ flexShrink: 0, display: 'inline-flex', animation: 'sp-nudge 1.6s ease-in-out infinite' }}>
            <LandingButton size="md" href={ctaHref}>
              Apply now →
            </LandingButton>
          </span>
        </div>
      </div>
    </div>
  );
}
