'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  EXPLAINER_CTA,
  EXPLAINER_INTRO,
  EXPLAINER_STORIES,
  EXPLAINER_STORY_ALIAS,
  EXPLAINER_STEPS,
  EXPLAINER_VISAS,
} from '../../../mockData/Landing/explainer';
import LandingBadge from './ui/LandingBadge';
import LandingButton from './ui/LandingButton';
import LandingCard from './ui/LandingCard';
import LandingGlow from './LandingGlow';
import LandingMarketingFooter from './LandingMarketingFooter';

function resolvePersona(searchParams) {
  const fromQuery = searchParams.get('persona');
  if (fromQuery && EXPLAINER_INTRO[fromQuery]) return fromQuery;
  return 'grad';
}

export default function ExplainerPage() {
  const searchParams = useSearchParams();
  const personaKey = useMemo(() => resolvePersona(searchParams), [searchParams]);
  const [playing, setPlaying] = useState(false);

  const storyKey = EXPLAINER_STORY_ALIAS[personaKey] || personaKey;
  const storyOrder = [
    storyKey,
    ...Object.keys(EXPLAINER_STORIES).filter((x) => x !== storyKey),
  ].slice(0, 3);
  const stories = storyOrder.map((k) => EXPLAINER_STORIES[k]);
  const applyHref = `/apply?persona=${personaKey}`;

  return (
    <div className="landing-root">
      <header
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--surface-inverse)',
          color: 'var(--text-on-dark)',
        }}
      >
        <LandingGlow style={{ right: '-20%', top: '-20%', width: '90%', maxWidth: 1100, opacity: 0.45 }} />
        <div style={{ position: 'relative', maxWidth: 1080, margin: '0 auto', padding: '28px 24px 0' }}>
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 20,
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--text-on-dark)',
              textDecoration: 'none',
            }}
          >
            Surely Placed
          </Link>
        </div>
        <div
          style={{
            position: 'relative',
            maxWidth: 1080,
            margin: '0 auto',
            padding: '56px 24px 72px',
            display: 'flex',
            flexDirection: 'column',
            gap: 36,
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 760 }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
                color: 'var(--teal-300)',
              }}
            >
              How placement works
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(32px, 4.2vw, 52px)',
                lineHeight: 1.1,
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              The path from where you are to a US tech offer.
            </h1>
            <p style={{ margin: 0, fontSize: 'var(--text-xl)', lineHeight: 'var(--leading-normal)', color: 'var(--text-on-dark-muted)' }}>
              {EXPLAINER_INTRO[personaKey]}
            </p>
          </div>
          <div
            style={{
              position: 'relative',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg)',
              aspectRatio: '16 / 9',
              background: 'var(--neutral-800)',
            }}
          >
            <Image
              src="/landing/explainer.png"
              alt="A coach and a candidate in a one-on-one video session"
              fill
              sizes="(max-width: 1080px) 100vw, 1080px"
              style={{ objectFit: 'cover' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(13,13,13,0.75), rgba(13,13,13,0) 55%)',
              }}
            />
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                padding: 'clamp(16px, 3vw, 32px)',
                display: 'flex',
                alignItems: 'center',
                gap: 20,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                aria-label="Play explainer video"
                onClick={() => setPlaying((v) => !v)}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 999,
                  border: 'none',
                  background: 'var(--brand-primary)',
                  color: 'var(--text-on-brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: 'var(--shadow-md)',
                  flexShrink: 0,
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7z" />
                </svg>
              </button>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-xl)', color: 'var(--text-on-dark)' }}>
                  Watch: how placement works
                </span>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-on-dark-muted)' }}>
                  {playing ? 'Video embed goes here — replace with your hosted explainer' : '12 minutes · subtitles available'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section style={{ padding: '88px 24px', background: 'var(--surface-page)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
                color: 'var(--brand-primary)',
              }}
            >
              Step by step
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(26px, 3vw, 38px)',
                lineHeight: 'var(--leading-snug)',
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              System beats luck. Every time.
            </h2>
          </div>
          <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column' }}>
            {EXPLAINER_STEPS.map((s) => (
              <li
                key={s.n}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '64px minmax(0, 1fr)',
                  gap: '16px 24px',
                  padding: '28px 0',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 'var(--text-2xl)',
                    color: 'var(--brand-primary)',
                    lineHeight: 1.2,
                  }}
                >
                  {s.n}
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: 680 }}>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-xl)', lineHeight: 'var(--leading-snug)' }}>
                    {s.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-normal)', color: 'var(--text-secondary)' }}>
                    {s.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section style={{ padding: '88px 24px', background: 'var(--surface-sunken)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
                color: 'var(--brand-primary)',
              }}
            >
              Supported paths
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(26px, 3vw, 38px)',
                lineHeight: 'var(--leading-snug)',
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              Where you are on the visa map.
            </h2>
            <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--leading-normal)', color: 'var(--text-secondary)' }}>
              We coach the job search around each of these. For legal questions about your status, we&apos;ll point you to an immigration attorney.
            </p>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 16,
            }}
          >
            {EXPLAINER_VISAS.map((v) => (
              <LandingCard key={`${v.tag}-${v.title}`} padding="md">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <LandingBadge tone={v.tone}>{v.tag}</LandingBadge>
                  <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-lg)' }}>{v.title}</h3>
                  <p style={{ margin: 0, fontSize: 'var(--text-base)', lineHeight: 'var(--leading-normal)', color: 'var(--text-secondary)' }}>
                    {v.body}
                  </p>
                </div>
              </LandingCard>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '88px 24px', background: 'var(--surface-page)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 40 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
            <span
              style={{
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                letterSpacing: 'var(--tracking-wider)',
                textTransform: 'uppercase',
                color: 'var(--brand-primary)',
              }}
            >
              Candidate stories
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: 'var(--font-display)',
                fontWeight: 600,
                fontSize: 'clamp(26px, 3vw, 38px)',
                lineHeight: 'var(--leading-snug)',
                letterSpacing: 'var(--tracking-tight)',
              }}
            >
              People who started where you are.
            </h2>
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
              gap: 20,
            }}
          >
            {stories.map((st) => (
              <LandingCard key={st.by} padding="lg">
                <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>
                  <LandingBadge tone={st.tone}>{st.tag}</LandingBadge>
                  <blockquote style={{ margin: 0, fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-normal)' }}>
                    “{st.quote}”
                  </blockquote>
                  <figcaption style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{st.by}</figcaption>
                </figure>
              </LandingCard>
            ))}
          </div>
        </div>
      </section>

      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          padding: '96px 24px',
          background: 'var(--surface-inverse)',
          color: 'var(--text-on-dark)',
        }}
      >
        <LandingGlow style={{ left: '-15%', bottom: '-40%', width: '80%', opacity: 0.5 }} />
        <div
          style={{
            position: 'relative',
            maxWidth: 720,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 24,
            textAlign: 'center',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 'clamp(28px, 3.4vw, 44px)',
              lineHeight: 1.15,
              letterSpacing: 'var(--tracking-tight)',
            }}
          >
            {EXPLAINER_CTA[personaKey]}
          </h2>
          <p style={{ margin: 0, fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-normal)', color: 'var(--text-on-dark-muted)' }}>
            A few short questions, one at a time, then pick a time for your call. About three minutes.
          </p>
          <LandingButton href={applyHref}>Apply now</LandingButton>
        </div>
      </section>

      <LandingMarketingFooter wide />
    </div>
  );
}
