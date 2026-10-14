'use client';

import { useEffect, useRef } from 'react';
import { animateGauge, buildGaugeSvgMarkup } from './gaugeUtils';

function bandClassFromScore(score) {
  if (score >= 70) return 'good';
  if (score >= 50) return 'warn';
  return 'critical';
}

export default function AtsScoreResult({ result, scanMeta, animate }) {
  const gaugeRef = useRef(null);
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!result || !gaugeRef.current) return;
    if (animate) {
      animateGauge(result.score, gaugeRef.current, () => {
        const band = gaugeRef.current?.querySelector('#g-band');
        band?.classList.add('show');
      }, reduced);
    } else {
      const num = gaugeRef.current.querySelector('#g-num');
      if (num) num.textContent = String(result.score);
      gaugeRef.current.querySelector('#g-band')?.classList.add('show');
    }
  }, [result, animate, reduced]);

  if (!result) return null;

  const target = [scanMeta.role, scanMeta.company && `at ${scanMeta.company}`].filter(Boolean).join(' ');
  const bandCls = bandClassFromScore(result.score);
  const bandC = bandCls === 'critical' ? 'crit' : bandCls;
  const date = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <section className="report" id="report" aria-label="Your ATS score">
      <div className="wrap">
        <article className="rp">
          <header className="rp-head">
            <div className="rp-meta">
              <span className="eyebrow">ATS resume score</span>
              <h2>
                {scanMeta.mode === 'match'
                  ? target
                    ? `Your match for ${target}`
                    : 'Your match for this job'
                  : 'Your general ATS readiness'}
              </h2>
              <p className="lede" style={{ fontSize: '15.5px' }}>
                {result.message}
              </p>
              <dl className="meta-grid">
                <div>
                  <dt>Scan type</dt>
                  <dd>{scanMeta.mode === 'match' ? 'Job match' : 'General ATS'}</dd>
                </div>
                <div>
                  <dt>Target</dt>
                  <dd>{target || '—'}</dd>
                </div>
                <div>
                  <dt>File</dt>
                  <dd>{scanMeta.fileName || 'Pasted text'}</dd>
                </div>
                <div>
                  <dt>Generated</dt>
                  <dd>{date}</dd>
                </div>
              </dl>
            </div>
            <div className="gauge-box" ref={gaugeRef}>
              <div dangerouslySetInnerHTML={{ __html: buildGaugeSvgMarkup() }} />
              <div className="g-read">
                <span className="g-num" id="g-num">
                  {animate ? '0' : result.score}
                </span>
                <span className="g-sub">ATS SCORE / 100</span>
                <span
                  className="g-band"
                  id="g-band"
                  style={{
                    background: `var(--${bandC}-wash)`,
                    color: `var(--${bandC})`,
                  }}
                >
                  {result.band}
                </span>
              </div>
            </div>
          </header>
          <footer className="rp-foot">
            <span>
              Scores are estimates based on how ATS platforms parse resumes and how recruiters search them.
              Each employer configures its system differently.
            </span>
            <span>Surely Placed · surelyplaced.com</span>
          </footer>
        </article>
      </div>
    </section>
  );
}
