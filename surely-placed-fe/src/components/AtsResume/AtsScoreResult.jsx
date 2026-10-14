'use client';

import { useEffect, useRef } from 'react';
import { animateGauge, buildGaugeSvgMarkup } from './gaugeUtils';
import {
  PLACEHOLDER_BULLETS,
  PLACEHOLDER_FIXES,
  PLACEHOLDER_KW,
  colorOf,
  executiveSummary,
  searchVisibility,
  stOf,
} from './reportUtils';

const easeOut = (t) => 1 - (1 - t) ** 3;

function speedCount(el, final, dur, reduced) {
  if (!el) return;
  if (reduced) {
    el.textContent = final;
    return;
  }
  const t0 = performance.now();
  const spin = dur * 0.45;
  let last = 0;
  function frame(now) {
    const t = now - t0;
    if (t < spin) {
      if (now - last > 40) {
        el.textContent = Math.floor(Math.random() * 100);
        last = now;
      }
      requestAnimationFrame(frame);
    } else if (t < dur) {
      const p = (t - spin) / (dur - spin);
      el.textContent = Math.round(final * easeOut(p));
      requestAnimationFrame(frame);
    } else {
      el.textContent = final;
      el.classList.remove('flash');
      void el.offsetWidth;
      el.classList.add('flash');
    }
  }
  requestAnimationFrame(frame);
}

function Gate({ label, hint, count, onOpenLead, children }) {
  return (
    <div className="gate">
      <div className="locked" aria-hidden="true">
        {children}
      </div>
      <div className="lock-cta">
        <b>{label}</b>
        <small>{hint || count}</small>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => onOpenLead()}>
          Get my full review
        </button>
      </div>
    </div>
  );
}

function KwRow({ k, mode }) {
  return (
    <tr>
      <td className="term">{k.term}</td>
      <td>{k.type}</td>
      {mode === 'match' ? <td className="num">{k.jd || 1}×</td> : null}
      <td>{k.has ? <span className="yes">✓ Found</span> : <span className="no">✕ Missing</span>}</td>
      <td>
        {k.has ? (
          <span className="st good">Keep</span>
        ) : k.w === 2 ? (
          <span className="st critical">High</span>
        ) : (
          <span className="st warn">Medium</span>
        )}
      </td>
    </tr>
  );
}

function bandClassFromScore(score) {
  if (score >= 70) return 'good';
  if (score >= 50) return 'warn';
  return 'critical';
}

export default function AtsScoreResult({ result, animate, onOpenLead }) {
  const gaugeRef = useRef(null);
  const rpRef = useRef(null);
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const mode = result.mode || 'match';
  const unlocked = Boolean(result.unlocked);
  const target = [result.role, result.company && `at ${result.company}`].filter(Boolean).join(' ');
  const date = new Date().toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const [vis, visColor] = searchVisibility(result, mode);
  const { risk, win, asset } = executiveSummary(result);
  const bandCls = bandClassFromScore(result.score);
  const bandC = bandCls === 'critical' ? 'crit' : bandCls;

  const kwTotal = result.kwTotal ?? result.kw?.length ?? 0;
  const kwSorted = result.kw || [];
  const lockedKw = result.locked?.keywords ?? 0;
  const bullets = result.bullets || [];
  const bulletsTotal = result.bulletsTotal ?? bullets.length;
  const lockedBullets = result.locked?.bullets ?? 0;
  const fixes = result.fixes || [];
  const lockedPlan = result.locked?.planSteps ?? 0;
  const matchedCount = result.unlocked
    ? result.matched?.length ?? 0
    : result.matchedCount ?? 0;
  const missingCount = result.unlocked
    ? result.missing?.length ?? 0
    : result.missingCount ?? 0;
  const cov =
    result.coveragePct ??
    (kwTotal ? Math.round((matchedCount / kwTotal) * 100) : 0);

  useEffect(() => {
    if (!result || !gaugeRef.current) return;
    if (animate) {
      animateGauge(result.score, gaugeRef.current, () => {
        gaugeRef.current?.querySelector('#g-band')?.classList.add('show');
      }, reduced);
    } else {
      const num = gaugeRef.current.querySelector('#g-num');
      if (num) num.textContent = String(result.score);
      gaugeRef.current.querySelector('#g-band')?.classList.add('show');
    }
  }, [result, animate, reduced]);

  useEffect(() => {
    if (!rpRef.current || !result) return;
    const root = rpRef.current;
    const fills = root.querySelectorAll('.fill');
    const nums = root.querySelectorAll('.cat-num');
    const covI = root.querySelector('#cov-i');

    if (animate && !reduced) {
      fills.forEach((f, i) => {
        setTimeout(() => {
          f.style.width = `${f.dataset.w}%`;
          speedCount(nums[i], +nums[i].dataset.v, 1100, reduced);
        }, 900 + i * 140);
      });
      if (covI) {
        setTimeout(() => {
          covI.style.width = `${covI.dataset.w}%`;
        }, 1300);
      }
    } else {
      fills.forEach((f, i) => {
        f.style.width = `${f.dataset.w}%`;
        if (nums[i]) nums[i].textContent = nums[i].dataset.v;
      });
      if (covI) covI.style.width = `${covI.dataset.w}%`;
    }
  }, [result, animate, reduced, cov]);

  if (!result) return null;

  const secItem = (k, label) => {
    const v = result.found?.[k];
    return (
      <li key={k} className={v === 1 ? 'ok' : v ? 'part' : 'bad'}>
        <span className="ic">{v === 1 ? '✓' : v ? '!' : '✕'}</span>
        {label}
        <small>{v === 1 ? 'Detected' : v ? 'Mentioned, no clear heading' : 'Not found'}</small>
      </li>
    );
  };

  const bulItem = (b) => (
    <li key={b.text.slice(0, 40)} className="bul">
      <q>{b.text.length > 180 ? `${b.text.slice(0, 177)}…` : b.text}</q>
      <div className="tags">
        <span className={`tag ${b.num ? 'y' : 'n'}`}>{b.num ? '✓ Has a number' : '✕ No number'}</span>
        <span className={`tag ${b.verb ? 'y' : 'n'}`}>{b.verb ? '✓ Action verb' : '✕ Weak opener'}</span>
        {b.weak ? <span className="tag w">{`Passive: "${b.weak}"`}</span> : null}
      </div>
      {!b.num || !b.verb || b.weak ? (
        <p className="tip">
          <b>Rewrite tip:</b>{' '}
          {!b.verb || b.weak ? 'Open with what you did (Built, Led, Reduced). ' : ''}
          {!b.num ? 'Add the result: how much, how many, how fast.' : ''}
        </p>
      ) : null}
    </li>
  );

  const planItem = (f) => (
    <li key={f.t}>
      <div>
        <b>{f.t}</b>
        <p>{f.d}</p>
      </div>
      <span className={`st ${f.s}`}>{f.s === 'warn' ? 'Improve' : f.s === 'critical' ? 'Fix first' : 'Keep'}</span>
    </li>
  );

  const order = { critical: 0, warn: 1, good: 2 };
  const fxSorted = fixes.slice().sort((a, b) => order[a.s] - order[b.s]);

  return (
    <section className="report" id="report" aria-label="Your ATS report">
      <div className="wrap">
        <article className="rp" ref={rpRef} id="rp">
          <header className="rp-head">
            <div className="rp-meta">
              <span className="eyebrow">ATS resume report · {result.reportId}</span>
              <h2>
                {mode === 'match'
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
                  <dt>Candidate</dt>
                  <dd>{result.parsed?.Name || 'Not detected'}</dd>
                </div>
                <div>
                  <dt>Scan type</dt>
                  <dd>{mode === 'match' ? 'Job match' : 'General ATS'}</dd>
                </div>
                <div>
                  <dt>Target</dt>
                  <dd>{target || '—'}</dd>
                </div>
                <div>
                  <dt>Search visibility</dt>
                  <dd style={{ color: visColor }}>{vis}</dd>
                </div>
                <div>
                  <dt>File</dt>
                  <dd>{result.fileName || 'Pasted text'}</dd>
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

          <nav className="rp-tabs" aria-label="Report sections">
            <a href="#r-sum">Summary</a>
            <a href="#r-cat">Breakdown</a>
            <a href="#r-kw">Keywords</a>
            <a href="#r-parse">Parse view</a>
            <a href="#r-bul">Bullets</a>
            <a href="#r-plan">Action plan</a>
          </nav>

          <section className="rp-sec" id="r-sum">
            <div className="rp-sec-h">
              <h3>Executive summary</h3>
              <p>The three things that matter most right now</p>
            </div>
            <div className="summary">
              <div className="sum risk">
                <span className="k">Biggest risk</span>
                <b>{risk.t}</b>
                <p>{risk.d}</p>
              </div>
              <div className="sum asset">
                <span className="k">Strongest area</span>
                <b>
                  {asset.label} · {Math.round(asset.v)}/100
                </b>
                <p>{asset.note}.</p>
              </div>
              <div className="sum win">
                <span className="k">Fastest win</span>
                <b>{win.t}</b>
                <p>{win.d}</p>
              </div>
            </div>
          </section>

          <section className="rp-sec" id="r-cat">
            <div className="rp-sec-h">
              <h3>
                Score breakdown <small>6 checks</small>
              </h3>
              <p>
                {mode === 'match'
                  ? 'Keyword match carries 40% of your score'
                  : 'Weighted for a general ATS read'}
              </p>
            </div>
            <div className="cats">
              {result.cats.map((c) => {
                const [sc, sl] = stOf(c.v);
                return (
                  <div key={c.k} className="cat">
                    <div className="cat-top">
                      <b>{c.label}</b>
                      <span className={`st ${sc}`}>{sl}</span>
                    </div>
                    <div className="cat-top">
                      <span className="cat-num" data-v={Math.round(c.v)}>
                        {animate ? '0' : Math.round(c.v)}
                      </span>
                      <span className="hint">/ 100</span>
                    </div>
                    <div className="track">
                      <div
                        className="fill"
                        data-w={Math.round(c.v)}
                        style={{ background: colorOf(c.v), width: animate ? 0 : `${Math.round(c.v)}%` }}
                      />
                    </div>
                    <p className="note">{c.note}</p>
                    <p className="why">{c.why}</p>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rp-sec" id="r-kw">
            <div className="rp-sec-h">
              <h3>
                {mode === 'match' ? 'Keyword gap analysis' : 'Skills we recognized'}{' '}
                <small>{kwTotal} terms</small>
              </h3>
              <p>
                {mode === 'match'
                  ? 'Pulled from the job description you pasted'
                  : 'Add a job description for a gap analysis'}
              </p>
            </div>
            {mode === 'match' ? (
              <div className="cov">
                <span className="cov-n">
                  {cov}
                  <small>%</small>
                </span>
                <div>
                  <div className="cov-bar">
                    <i id="cov-i" data-w={cov} style={{ width: animate ? 0 : `${cov}%` }} />
                  </div>
                  <div className="cov-legend">
                    <span>
                      <i style={{ background: 'var(--teal)' }} />
                      {matchedCount} found
                    </span>
                    <span>
                      <i style={{ background: 'var(--crit-wash)', border: '1px solid #EDB3A8' }} />
                      {missingCount} missing
                    </span>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="tbl-wrap">
              <table className="kw">
                <thead>
                  <tr>
                    <th>Keyword</th>
                    <th>Type</th>
                    {mode === 'match' ? <th>In JD</th> : null}
                    <th>Your resume</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {kwSorted.length ? kwSorted.map((k) => <KwRow key={k.term} k={k} mode={mode} />) : (
                    <tr>
                      <td colSpan={5}>No keywords detected.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            {!unlocked && lockedKw > 0 ? (
              <Gate
                label={`${lockedKw} more keywords`}
                hint="Full keyword gap table is in your full report"
                onOpenLead={onOpenLead}
              >
                <div className="tbl-wrap">
                  <table className="kw">
                    <tbody>{PLACEHOLDER_KW.slice(0, 4).map((k) => <KwRow key={k.term} k={k} mode={mode} />)}</tbody>
                  </table>
                </div>
              </Gate>
            ) : null}
          </section>

          <section className="rp-sec" id="r-parse">
            <div className="rp-sec-h">
              <h3>What the ATS extracted</h3>
              <p>How a parser reads your file</p>
            </div>
            <div className="two">
              <dl className="parsed">
                {Object.entries(result.parsed || {}).map(([k, v]) => (
                  <div key={k} className="parsed-row">
                    <dt>{k}</dt>
                    <dd className={v ? '' : 'none'}>{v || 'Not found'}</dd>
                  </div>
                ))}
              </dl>
              <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
                <ul className="checks">
                  {secItem('experience', 'Experience')}
                  {secItem('education', 'Education')}
                  {secItem('skills', 'Skills')}
                  {secItem('summary', 'Summary')}
                  {secItem(
                    (result.found?.projects ?? 0) >= (result.found?.certs ?? 0) ? 'projects' : 'certs',
                    (result.found?.projects ?? 0) >= (result.found?.certs ?? 0) ? 'Projects' : 'Certifications'
                  )}
                </ul>
                <div className="stats-mini">
                  <div>
                    <b>{result.words}</b>
                    <small>words</small>
                  </div>
                  <div>
                    <b>{bulletsTotal}</b>
                    <small>bullets</small>
                  </div>
                  <div>
                    <b>{result.lineCount}</b>
                    <small>lines read</small>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rp-sec" id="r-bul">
            <div className="rp-sec-h">
              <h3>
                Bullet impact audit <small>{Math.min(10, bulletsTotal)} reviewed</small>
              </h3>
              <p>Numbers, verbs and passive phrasing, line by line</p>
            </div>
            <ul className="bullets">
              {bullets.length ? bullets.map(bulItem) : (
                <li className="bul">
                  <q>No bullet points detected. Use &quot;•&quot; bullets under each role.</q>
                </li>
              )}
            </ul>
            {!unlocked && lockedBullets > 0 ? (
              <Gate
                label={`${lockedBullets} more bullets audited`}
                hint="Bullet-by-bullet audit is in your full report"
                onOpenLead={onOpenLead}
              >
                <ul className="bullets">{PLACEHOLDER_BULLETS.map(bulItem)}</ul>
              </Gate>
            ) : null}
          </section>

          <section className="rp-sec" id="r-plan">
            <div className="rp-sec-h">
              <h3>
                Your action plan <small>{fxSorted.length} steps</small>
              </h3>
              <p>Ranked by impact on your score</p>
            </div>
            <ol className="plan">{fxSorted.map(planItem)}</ol>
            {!unlocked && lockedPlan > 0 ? (
              <Gate
                label={`${lockedPlan} more steps`}
                hint="Complete action plan is in your full report"
                onOpenLead={onOpenLead}
              >
                <ol className="plan" start={4}>
                  {PLACEHOLDER_FIXES.map(planItem)}
                </ol>
              </Gate>
            ) : null}
          </section>

          <section className="next">
            <h3>
              {unlocked
                ? 'Want a person to take it from here?'
                : 'Get the full report, then decide how much help you want.'}
            </h3>
            <p>
              {unlocked
                ? 'Your full report is unlocked. An expert can review it line by line or rebuild it with you.'
                : 'The full report is free with your email. Add an expert human review or a full revamp if you want a person on it.'}
            </p>
            <div className="opts">
              <div className="opt">
                <span className="pr">{unlocked ? 'Unlocked' : 'Free with email'}</span>
                <b>Full ATS report</b>
                <p>Every missing keyword, bullet audit and complete action plan.</p>
              </div>
              <div className="opt">
                <span className="pr">Expert-led</span>
                <b>Expert human review</b>
                <p>A resume expert reviews yours line by line for this role.</p>
              </div>
              <div className="opt">
                <span className="pr">Expert-led</span>
                <b>Full resume revamp</b>
                <p>Rebuilt with an expert until it&apos;s ATS-ready.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-white" onClick={() => onOpenLead(unlocked ? 'review' : undefined)}>
                {unlocked ? 'Add an expert review' : 'Get my full review'}
              </button>
              <a className="btn" href="#checker" style={{ color: '#FFFFFF', border: '1.5px solid rgba(255,255,255,.4)' }}>
                Scan another job
              </a>
            </div>
          </section>

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
