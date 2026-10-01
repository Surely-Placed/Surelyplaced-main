'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { trackMetaEvent } from '@/components/seo/MetaPixel';
import { submitEnrollmentRequest } from '@/lib/payments';
import {
  APPLY_COUNTRY_CODES,
  APPLY_EMPLOYED_VISAS,
  APPLY_INVEST,
  APPLY_PERSONA_OPTS,
  APPLY_QUESTION_COUNT,
  APPLY_REGIONS,
  APPLY_SLOT_TIMES,
  APPLY_STATUS_VISA,
  APPLY_TIMELINE,
  APPLY_TIMEZONES,
  APPLY_TONE_LINES,
  APPLY_VISA_OPTIONS,
} from '../../../mockData/Landing/apply';
import { mapApplyAnswersToEnrollmentPayload } from './mapEnrollmentPayload';
import LandingBadge from './ui/LandingBadge';
import LandingButton from './ui/LandingButton';
import LandingCard from './ui/LandingCard';

const N = APPLY_QUESTION_COUNT;

function e164(raw) {
  return (raw || '').replace(/[\s\-().]/g, '');
}

function detectCountry(num) {
  if (!/^\+[1-9]\d{7,14}$/.test(num)) return null;
  const d = num.slice(1);
  for (const len of [3, 2, 1]) {
    const c = d.slice(0, len);
    if (APPLY_COUNTRY_CODES[c]) return `${APPLY_COUNTRY_CODES[c]} (+${c})`;
  }
  return `International (+${d.slice(0, 3)})`;
}

function fmtTime(t) {
  const [h, m] = t.split(':').map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, '0')}${h < 12 ? ' AM' : ' PM'}`;
}

function weekdaySlots() {
  const out = [];
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  while (out.length < 6) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d));
  }
  return out;
}

function buildQuestions(a, urlStatus, urlPersona) {
  const emp = a.persona === 'switcher' || a.persona === 'layoff' || APPLY_EMPLOYED_VISAS.includes(a.visa);
  const phd = urlStatus === 'phd';
  return [
    {
      id: 'contact',
      kind: 'contact',
      title: "Let's start with you.",
      sub: 'Your name and the best number for your coach to reach you on — WhatsApp works too.',
    },
    {
      id: 'email',
      kind: 'email',
      title: "What's your email?",
      sub: "We'll send your call confirmation here.",
      placeholder: 'name@example.com',
    },
    {
      id: 'persona',
      kind: 'choice',
      title: 'Which of these best describes you right now?',
      sub: urlPersona
        ? "We've pre-selected this from the page you came from — change it if it's not quite right."
        : null,
      options: APPLY_PERSONA_OPTS,
    },
    {
      id: 'pain',
      kind: 'text',
      title: "What's the single biggest thing standing in your way right now?",
      placeholder: 'e.g. Not getting interview calls',
    },
    {
      id: 'visa',
      kind: 'choice',
      title: "What's your current visa status?",
      sub: APPLY_STATUS_VISA[urlStatus]
        ? "Pre-selected from the page you came from — change it if it's not right."
        : null,
      options: APPLY_VISA_OPTIONS.map((x) => ({ v: x, label: x })),
    },
    {
      id: 'org',
      kind: 'text',
      title: phd ? 'Your university or research lab' : emp ? 'Your current or most recent employer' : 'Your university',
      sub: phd
        ? 'Where you did your PhD or postdoc.'
        : emp
          ? 'If you are between roles, your most recent one.'
          : 'Or the university you plan to attend.',
      placeholder: 'Type your answer here…',
    },
    {
      id: 'experience',
      kind: 'choice',
      title: 'Years of relevant experience',
      options: ['0–1 years', '1–3 years', '3–5 years', '5+ years'].map((x) => ({ v: x, label: x })),
    },
    {
      id: 'region',
      kind: 'choice',
      title: 'What US region are you targeting?',
      sub: "We'll use this to show call times in your timezone.",
      options: APPLY_REGIONS,
    },
    {
      id: 'timeline',
      kind: 'choice',
      title: 'When do you need to be placed by?',
      options: APPLY_TIMELINE.map((x) => ({ v: x, label: x })),
    },
    {
      id: 'invest',
      kind: 'choice',
      title:
        "Which of these best describes where you're at with investing in professional support to speed up your placement?",
      sub: "There's no wrong answer — it helps your coach tailor the call.",
      options: APPLY_INVEST,
    },
    {
      id: 'notes',
      kind: 'text',
      optional: true,
      title: 'Anything else we should know before your call?',
      sub: 'Optional.',
      placeholder: 'Type your answer here…',
    },
  ];
}

function validateQuestion(q, a) {
  if (q.kind === 'contact') {
    if ((a.fullName || '').trim().length < 2) return 'Please enter your full name.';
    if (!/^\+[1-9]\d{7,14}$/.test(e164(a.phone))) {
      return 'Enter your full number starting with + and your country code, e.g. +14155551234.';
    }
    return '';
  }
  const v = (a[q.id] || '').trim();
  if (q.optional) return '';
  if (!v) return q.kind === 'choice' ? 'Please pick an option.' : 'Please fill this in.';
  if (q.kind === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
    return "That email doesn't look quite right.";
  }
  return '';
}

export default function ApplyWizardPage() {
  const searchParams = useSearchParams();
  const urlPersonaParam = searchParams.get('persona');
  const urlPersona = APPLY_PERSONA_OPTS.some((o) => o.v === urlPersonaParam) ? urlPersonaParam : null;
  const urlStatus = urlPersonaParam || null;

  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(1);
  const [shift, setShift] = useState('0px');
  const [error, setError] = useState('');
  const [a, setA] = useState(() => ({
    persona: urlPersona || '',
    visa: APPLY_STATUS_VISA[urlStatus] || '',
    fullName: '',
    phone: '',
    email: '',
  }));
  const [dayIdx, setDayIdx] = useState(null);
  const [slot, setSlot] = useState(null);
  const [tz, setTz] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const questions = useMemo(() => buildQuestions(a, urlStatus, urlPersona), [a, urlStatus, urlPersona]);
  const isQuestion = step < N;
  const isScheduler = step === N;
  const isDone = step === N + 1;

  const go = useCallback(
    (to) => {
      setFade(0);
      setShift(to > step ? '-8px' : '8px');
      setTimeout(() => {
        setStep((prev) => {
          const nextStep = to;
          if (to === questions.findIndex((x) => x.id === 'timeline') && !a.timeline) {
            const p = a.persona;
            const timeline =
              p === 'grad' || p === 'layoff'
                ? APPLY_TIMELINE[0]
                : p === 'explorer'
                  ? APPLY_TIMELINE[3]
                  : APPLY_TIMELINE[1];
            setA((s) => ({ ...s, timeline }));
          }
          if (to === N && !tz) {
            const r = APPLY_REGIONS.find((x) => x.v === a.region);
            setTz(r ? r.tz : 'America/New_York');
          }
          return nextStep;
        });
        setError('');
        setShift(to > step ? '8px' : '-8px');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            setFade(1);
            setShift('0px');
          });
        });
      }, 350);
    },
    [a.persona, a.region, a.timeline, questions, step, tz],
  );

  useEffect(() => {
    if (!isQuestion) return undefined;
    const timer = setTimeout(() => {
      const el = document.querySelector('.apply-wizard-main input');
      el?.focus();
    }, 380);
    return () => clearTimeout(timer);
  }, [step, isQuestion]);

  const next = () => {
    if (step >= N || fade < 1) return;
    const q = questions[step];
    const err = validateQuestion(q, a);
    if (err) {
      setError(err);
      return;
    }
    if (q.kind === 'contact') {
      setA((s) => ({ ...s, phone: e164(s.phone) }));
    }
    go(step + 1);
  };

  const pick = (id, v) => {
    setA((s) => ({ ...s, [id]: v }));
    setError('');
    setTimeout(() => go(step + 1), 260);
  };

  const onKeyDown = (e) => {
    if (step >= N) return;
    const q = questions[step];
    if (e.key === 'Enter') {
      e.preventDefault();
      next();
      return;
    }
    if (q.kind === 'choice' && e.target.tagName !== 'INPUT') {
      const i = e.key.toUpperCase().charCodeAt(0) - 65;
      if (e.key.length === 1 && i >= 0 && i < q.options.length) {
        pick(q.id, q.options[i].v);
      }
    }
  };

  const days = weekdaySlots();
  const tzValue = tz || 'America/New_York';
  const tzLabel = (APPLY_TIMEZONES.find((t) => t.value === tzValue) || APPLY_TIMEZONES[0]).label;
  const dayFmt = (d, opts) => d.toLocaleDateString('en-US', opts);
  const pickedLabel =
    dayIdx != null && slot
      ? `${dayFmt(days[dayIdx], { weekday: 'long', month: 'long', day: 'numeric' })} · ${fmtTime(slot)} ${tzLabel}`
      : 'Choose a day and a time';

  const nameParts = (a.fullName || '').trim().split(/\s+/);
  const firstName = nameParts[0] || 'there';
  const toneLine = APPLY_TONE_LINES[urlStatus] || APPLY_TONE_LINES[a.persona] || APPLY_TONE_LINES.grad;

  const book = async () => {
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = mapApplyAnswersToEnrollmentPayload(a);
      await submitEnrollmentRequest(payload);
      trackMetaEvent('Lead');
      go(N + 1);
    } catch (err) {
      setSubmitError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const q = isQuestion ? questions[step] : { title: '' };
  const progressPct = isQuestion ? `${(step / N) * 100}%` : '100%';
  const stepLabel = isQuestion
    ? `${step + 1} of ${N}`
    : isScheduler
      ? 'Book your call'
      : 'Confirmed';

  const inputStyle = {
    width: '100%',
    padding: '12px 14px',
    borderRadius: 'var(--radius-md)',
    border: `1px solid ${error ? 'var(--color-danger)' : 'var(--border-default)'}`,
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--text-lg)',
    boxSizing: 'border-box',
  };

  return (
    <div className="landing-root" data-theme="apply" onKeyDown={onKeyDown} style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 2, background: 'var(--surface-sunken)' }}>
        <div style={{ height: 4, background: 'var(--neutral-200)' }}>
          <div
            style={{
              height: '100%',
              width: progressPct,
              background: 'var(--brand-primary)',
              transition: 'width 400ms var(--ease-standard)',
            }}
          />
        </div>
        <div
          style={{
            maxWidth: 1080,
            margin: '0 auto',
            padding: '20px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Link
            href="/"
            style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 600,
              fontSize: 18,
              letterSpacing: 'var(--tracking-tight)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
            }}
          >
            Surely Placed
          </Link>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{stepLabel}</span>
        </div>
      </div>

      <main
        className="apply-wizard-main"
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px 24px 64px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 680,
            opacity: fade,
            transform: `translateY(${shift})`,
            transition: 'opacity 350ms var(--ease-standard), transform 350ms var(--ease-standard)',
          }}
        >
          {isQuestion && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)',
                    color: 'var(--brand-primary)',
                  }}
                >
                  {step + 1} →
                </span>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 'clamp(24px, 3.2vw, 34px)',
                    lineHeight: 'var(--leading-snug)',
                    letterSpacing: 'var(--tracking-tight)',
                  }}
                >
                  {q.title}
                </h1>
                {q.sub && (
                  <p style={{ margin: 0, fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-normal)', color: 'var(--text-secondary)' }}>
                    {q.sub}
                  </p>
                )}
              </div>

              {q.kind === 'contact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Full name</span>
                    <input
                      type="text"
                      value={a.fullName || ''}
                      placeholder="e.g. Priya Sharma"
                      onChange={(e) => {
                        setA((s) => ({ ...s, fullName: e.target.value }));
                        setError('');
                      }}
                      style={inputStyle}
                    />
                    {error && error.indexOf('name') > -1 && (
                      <span style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</span>
                    )}
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Phone / WhatsApp number</span>
                    <input
                      type="tel"
                      value={a.phone || ''}
                      placeholder="+14155551234"
                      onChange={(e) => {
                        setA((s) => ({ ...s, phone: e.target.value }));
                        setError('');
                      }}
                      style={inputStyle}
                    />
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
                      Include your country code, starting with +. e.g. +1 415 555 1234 or +91 98765 43210
                    </span>
                    {error && error.indexOf('number') > -1 && (
                      <span style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</span>
                    )}
                    {q.kind === 'contact' && detectCountry(e164(a.phone)) && (
                      <LandingBadge tone="teal">{detectCountry(e164(a.phone))}</LandingBadge>
                    )}
                  </label>
                </div>
              )}

              {q.kind !== 'choice' && q.kind !== 'contact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input
                    type={q.kind === 'email' ? 'email' : 'text'}
                    value={a[q.id] || ''}
                    placeholder={q.placeholder}
                    onChange={(e) => {
                      setA((s) => ({ ...s, [q.id]: e.target.value }));
                      setError('');
                    }}
                    style={inputStyle}
                  />
                  {error && <span style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</span>}
                </div>
              )}

              {q.kind === 'choice' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {q.options.map((o, i) => {
                    const on = a[q.id] === o.v;
                    return (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => pick(q.id, o.v)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          width: '100%',
                          textAlign: 'left',
                          padding: '14px 16px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${on ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                          background: on ? 'var(--blue-50)' : 'var(--surface-card)',
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--text-lg)',
                          lineHeight: 'var(--leading-snug)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        <span
                          style={{
                            flexShrink: 0,
                            width: 28,
                            height: 28,
                            borderRadius: 'var(--radius-sm)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 'var(--text-sm)',
                            fontWeight: 600,
                            background: on ? 'var(--brand-primary)' : 'var(--neutral-100)',
                            color: on ? 'var(--text-on-brand)' : 'var(--text-secondary)',
                          }}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span>{o.label}</span>
                      </button>
                    );
                  })}
                  {error && <span style={{ color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{error}</span>}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px 20px' }}>
                <LandingButton onClick={next}>
                  {q.optional && !(a[q.id] || '').trim() ? 'Skip' : 'OK'}
                </LandingButton>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                  {q.kind === 'choice'
                    ? `or press A–${String.fromCharCode(64 + q.options.length)}`
                    : 'press Enter ↵'}
                </span>
              </div>
            </div>
          )}

          {isScheduler && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 'var(--text-sm)',
                    color: 'var(--brand-primary)',
                  }}
                >
                  Last step
                </span>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 'clamp(24px, 3.2vw, 34px)',
                    lineHeight: 'var(--leading-snug)',
                    letterSpacing: 'var(--tracking-tight)',
                  }}
                >
                  Pick a time for your call, {firstName}.
                </h1>
                <p style={{ margin: 0, fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-normal)', color: 'var(--text-secondary)' }}>
                  30 minutes with a Surely Placed coach. Free, no obligation.
                </p>
              </div>
              <div style={{ maxWidth: 320 }}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>Your timezone</span>
                  <select
                    value={tzValue}
                    onChange={(e) => setTz(e.target.value)}
                    style={inputStyle}
                  >
                    {APPLY_TIMEZONES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))', gap: 8 }}>
                {days.map((d, i) => {
                  const on = dayIdx === i;
                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => {
                        setDayIdx(i);
                        setSlot(null);
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                        padding: '12px 8px',
                        borderRadius: 'var(--radius-md)',
                        border: `1px solid ${on ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                        background: on ? 'var(--brand-primary)' : 'var(--surface-card)',
                        color: on ? 'var(--text-on-brand)' : 'var(--text-primary)',
                        fontFamily: 'var(--font-body)',
                        cursor: 'pointer',
                      }}
                    >
                      <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, letterSpacing: 'var(--tracking-wide)', textTransform: 'uppercase' }}>
                        {dayFmt(d, { weekday: 'short' })}
                      </span>
                      <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-2xl)' }}>{d.getDate()}</span>
                      <span style={{ fontSize: 'var(--text-xs)' }}>{dayFmt(d, { month: 'short' })}</span>
                    </button>
                  );
                })}
              </div>
              {dayIdx != null && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 8 }}>
                  {APPLY_SLOT_TIMES.map((t, i) => {
                    const off = (dayIdx * 3 + i * 5) % 7 === 2;
                    const on = slot === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={off}
                        onClick={() => !off && setSlot(t)}
                        style={{
                          padding: '12px 8px',
                          borderRadius: 'var(--radius-md)',
                          border: `1px solid ${on ? 'var(--brand-primary)' : 'var(--border-default)'}`,
                          background: on ? 'var(--brand-primary)' : off ? 'var(--surface-sunken)' : 'var(--surface-card)',
                          color: on ? 'var(--text-on-brand)' : off ? 'var(--text-tertiary)' : 'var(--text-primary)',
                          fontFamily: 'var(--font-body)',
                          fontSize: 'var(--text-base)',
                          fontWeight: 500,
                          cursor: off ? 'not-allowed' : 'pointer',
                          textDecoration: off ? 'line-through' : 'none',
                        }}
                      >
                        {fmtTime(t)}
                      </button>
                    );
                  })}
                </div>
              )}
              {submitError && (
                <p style={{ margin: 0, color: 'var(--color-danger)', fontSize: 'var(--text-sm)' }}>{submitError}</p>
              )}
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '12px 20px' }}>
                <LandingButton disabled={!(dayIdx != null && slot) || submitting} onClick={book}>
                  {submitting ? 'Submitting…' : 'Book my call'}
                </LandingButton>
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>{pickedLabel}</span>
              </div>
            </div>
          )}

          {isDone && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <LandingBadge tone="success">Call booked</LandingBadge>
                <h1
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-display)',
                    fontWeight: 600,
                    fontSize: 'clamp(26px, 3.6vw, 38px)',
                    lineHeight: 'var(--leading-snug)',
                    letterSpacing: 'var(--tracking-tight)',
                  }}
                >
                  You&apos;re all set, {firstName}.
                </h1>
                <p style={{ margin: 0, fontSize: 'var(--text-lg)', lineHeight: 'var(--leading-normal)', color: 'var(--text-secondary)' }}>
                  {toneLine}
                </p>
              </div>
              <LandingCard padding="lg">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <span
                      style={{
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        letterSpacing: 'var(--tracking-wider)',
                        textTransform: 'uppercase',
                        color: 'var(--text-tertiary)',
                      }}
                    >
                      Your call
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 'var(--text-2xl)' }}>
                      {pickedLabel}
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                    <span style={{ fontWeight: 600 }}>Who will call</span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                      A Surely Placed career coach will call you on {a.phone || 'your number'} at that time. A calendar invite is on its way to{' '}
                      {a.email || 'your email'}.
                    </span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                    <span style={{ fontWeight: 600 }}>What to have ready</span>
                    <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-secondary)', lineHeight: 'var(--leading-relaxed)' }}>
                      <li>Your current resume (any version is fine)</li>
                      <li>Your visa or status documents — I-20, EAD or I-797, whichever applies</li>
                      <li>A few roles or companies you&apos;re interested in</li>
                    </ul>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
                    <span style={{ fontWeight: 600 }}>If you miss the call</span>
                    <span style={{ color: 'var(--text-secondary)', lineHeight: 'var(--leading-normal)' }}>
                      No problem. We&apos;ll message you on WhatsApp and email to find a new time. You can also reach us at [support email].
                    </span>
                  </div>
                </div>
              </LandingCard>
            </div>
          )}
        </div>
      </main>

      {step > 0 && !isDone && (
        <div style={{ maxWidth: 1080, width: '100%', boxSizing: 'border-box', margin: '0 auto', padding: '0 24px 24px' }}>
          <LandingButton variant="ghost" size="sm" onClick={() => go(step - 1)}>
            ← Back
          </LandingButton>
        </div>
      )}
    </div>
  );
}
