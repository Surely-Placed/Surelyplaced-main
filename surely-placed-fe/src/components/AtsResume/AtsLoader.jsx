'use client';

import { useEffect, useRef } from 'react';
import { LOADER_STAGES, LOADER_TIPS, LOADER_WORDS } from './loaderUtils';

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default function AtsLoader({ open, loaderData, onFinish, onSkip }) {
  const arenaRef = useRef(null);
  const rootRef = useRef(null);
  const finishedRef = useRef(false);
  const rafRef = useRef(null);

  useEffect(() => {
    if (!open || !loaderData) return undefined;

    finishedRef.current = false;
    document.body.style.overflow = 'hidden';
    const reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const arena = arenaRef.current;
    if (!arena) return undefined;

    const hl = loaderData.matched.filter((t) => !t.includes('&')).sort((a, b) => b.length - a.length);
    let pre = escapeHtml(
      loaderData.lines
        .slice(0, 22)
        .map((l) => (l.length > 52 ? `${l.slice(0, 50)}…` : l))
        .join('\n')
    );
    hl.forEach((t) => {
      pre = pre.replace(new RegExp(`(${escapeHtml(t)})`, 'gi'), '<mark>$1</mark>');
    });
    const preEl = rootRef.current?.querySelector('#ld-pre');
    if (preEl) preEl.innerHTML = pre;

    const mqw = (loaderData.kwTerms.length ? loaderData.kwTerms : loaderData.matched)
      .concat(['ATS', 'Keywords', 'Recruiter', 'Resume'])
      .map((t) => t.toUpperCase());
    const mrow = `${mqw.join(' · ')} · `;
    rootRef.current?.querySelectorAll('.mq-row span').forEach((x) => {
      x.textContent = mrow + mrow;
    });

    let fN = 0;
    let mN = 0;
    let xp = 0;
    let combo = 1;
    let lastTap = 0;
    let bonus = 0;
    let curStage = -1;
    let next = 0;
    const live = new Set();

    const fEl = rootRef.current?.querySelector('#bin-f-n');
    const mEl = rootRef.current?.querySelector('#bin-m-n');
    const xpEl = rootRef.current?.querySelector('#ld-xp');
    const cEl = rootRef.current?.querySelector('#ld-combo');
    if (fEl) fEl.textContent = '0';
    if (mEl) mEl.textContent = '0';
    if (xpEl) xpEl.textContent = '0';
    if (cEl) cEl.textContent = 'x1';

    let toks = loaderData.matched.map((t) => ({ t, f: true })).concat(
      loaderData.missing.map((t) => ({ t, f: false }))
    );
    if (loaderData.mode !== 'match') {
      ['experience', 'education', 'skills', 'summary'].forEach((k) => {
        toks.push({ t: `${k} heading`, f: loaderData.matched.includes(k) });
      });
    }
    toks = toks.sort(() => Math.random() - 0.5).slice(0, 26);

    const T = reduced ? 900 : Math.max(5200, Math.min(7200, 3800 + toks.length * 140));
    const t0 = performance.now();
    const spawnStart = 0.12;
    const spawnEnd = 0.82;
    toks.forEach((k, i) => {
      k.at = (spawnStart + ((spawnEnd - spawnStart) * i) / Math.max(1, toks.length - 1)) * T;
    });

    function ar() {
      return arena.getBoundingClientRect();
    }

    function binCenter(found) {
      const b = rootRef.current?.querySelector(found ? '#bin-f' : '#bin-m');
      if (!b) return [0, 0];
      const br = b.getBoundingClientRect();
      const a = ar();
      return [br.left - a.left + br.width / 2, br.top - a.top + br.height / 2];
    }

    function land(k) {
      if (k.f) {
        fN += 1;
        if (fEl) fEl.textContent = String(fN);
      } else {
        mN += 1;
        if (mEl) mEl.textContent = String(mN);
      }
      const b = rootRef.current?.querySelector(k.f ? '#bin-f' : '#bin-m');
      b?.classList.add('bump');
      setTimeout(() => b?.classList.remove('bump'), 150);
      xp += k.f ? 20 : 8;
      if (xpEl) xpEl.textContent = String(xp);
    }

    function finish() {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const bar = rootRef.current?.querySelector('#ld-bar');
      if (bar) bar.style.width = '100%';
      LOADER_STAGES.forEach((_, i) => {
        const s = rootRef.current?.querySelector(`#lds-${i}`);
        if (s) s.className = 'done';
      });
      live.forEach((el) => el.remove());
      live.clear();
      const pct = rootRef.current?.querySelector('#ld-pct');
      if (pct) pct.textContent = '100';
      const dn = document.createElement('div');
      dn.className = 'ld-done';
      dn.innerHTML = '<span>Score<br>ready.</span>';
      rootRef.current?.appendChild(dn);
      setTimeout(() => {
        document.body.style.overflow = '';
        dn.remove();
        arena.querySelectorAll('.tok, .spark, .pop').forEach((e) => e.remove());
        onFinish?.();
      }, reduced ? 150 : 750);
    }

    function spawn(k) {
      const doc = rootRef.current?.querySelector('#ld-doc');
      if (!doc) return;
      const a = ar();
      const d = doc.getBoundingClientRect();
      const el = document.createElement('button');
      el.type = 'button';
      el.className = `tok ${k.f ? 'f' : 'm'}`;
      el.textContent = k.t;
      arena.appendChild(el);
      const w = el.offsetWidth;
      const h = el.offsetHeight;
      const x0 = d.left - a.left + Math.random() * Math.max(10, d.width - w);
      const y0 = d.top - a.top + d.height * (0.25 + Math.random() * 0.6);
      const [bx, by] = binCenter(k.f);
      const x1 = bx - w / 2 + (Math.random() * 40 - 20);
      const y1 = by - h / 2;
      const peakX = (x0 + x1) / 2 + (Math.random() * 80 - 40);
      const peakY = Math.min(y0, y1) - 60 - Math.random() * 60;
      el.style.left = '0';
      el.style.top = '0';
      const anim = el.animate(
        [
          { transform: `translate(${x0}px,${y0}px) scale(.4)`, opacity: 0 },
          { transform: `translate(${x0}px,${y0 - 14}px) scale(1.08)`, opacity: 1, offset: 0.14 },
          { transform: `translate(${peakX}px,${peakY}px) scale(1)`, opacity: 1, offset: 0.52 },
          { transform: `translate(${x1}px,${y1}px) scale(.55)`, opacity: 0.2 },
        ],
        {
          duration: 1500 + Math.random() * 500,
          easing: 'cubic-bezier(.45,.05,.55,.95)',
          fill: 'forwards',
        }
      );
      live.add(el);
      anim.onfinish = () => {
        live.delete(el);
        el.remove();
        land(k);
      };
      el.addEventListener(
        'pointerdown',
        (ev) => {
          ev.preventDefault();
          if (!live.has(el)) return;
          live.delete(el);
          anim.cancel();
          const ra = ar();
          const x = ev.clientX - ra.left;
          const y = ev.clientY - ra.top;
          const now = performance.now();
          combo = now - lastTap < 1300 ? Math.min(combo + 1, 9) : 1;
          lastTap = now;
          if (cEl) cEl.textContent = `x${combo}`;
          const gain = 15 * combo;
          xp += gain;
          bonus += 180;
          if (xpEl) xpEl.textContent = String(xp);
          el.remove();
          land(k);
        },
        { once: true }
      );
    }

    function tick(now) {
      if (finishedRef.current) return;
      const el = now - t0 + bonus;
      const p = Math.min(1, el / T);
      const bar = rootRef.current?.querySelector('#ld-bar');
      if (bar) bar.style.width = `${(p * 100).toFixed(1)}%`;
      const si = Math.min(LOADER_STAGES.length - 1, Math.floor(p * LOADER_STAGES.length));
      const stageEl = rootRef.current?.querySelector('#ld-stage');
      if (stageEl) stageEl.textContent = `STAGE ${String(si + 1).padStart(2, '0')} / 06`;
      const pct = rootRef.current?.querySelector('#ld-pct');
      if (pct) pct.textContent = String(Math.round(p * 100));
      const tip = rootRef.current?.querySelector('#ld-tip');
      if (tip) tip.textContent = LOADER_TIPS[Math.floor(el / 1700) % LOADER_TIPS.length];
      if (si !== curStage) {
        curStage = si;
        const wd = rootRef.current?.querySelector('#ld-word');
        if (wd) {
          wd.textContent = LOADER_WORDS[si][0];
          wd.classList.remove('slam');
          void wd.offsetWidth;
          wd.classList.add('slam');
        }
        const sub = rootRef.current?.querySelector('#ld-sub');
        if (sub) sub.innerHTML = `<b>${String(si + 1).padStart(2, '0')}</b> — ${LOADER_WORDS[si][1]}`;
      }
      LOADER_STAGES.forEach((_, i) => {
        const s = rootRef.current?.querySelector(`#lds-${i}`);
        if (!s) return;
        if (i < si) s.className = 'done';
        else if (i === si) s.className = 'on';
        else s.className = '';
      });
      if (!reduced) {
        while (next < toks.length && toks[next].at <= el) {
          spawn(toks[next]);
          next += 1;
        }
      }
      if (p >= 1 && (live.size === 0 || el > T + 1600)) {
        finish();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.body.style.overflow = '';
      finishedRef.current = true;
    };
  }, [open, loaderData, onFinish]);

  if (!open) return null;

  return (
    <div className="ats-page loader" id="loader" ref={rootRef} role="dialog" aria-modal="true" aria-labelledby="ld-title">
      <div className="mq" aria-hidden="true">
        <div className="mq-row">
          <span />
        </div>
        <div className="mq-row rev">
          <span />
        </div>
        <div className="mq-row">
          <span />
        </div>
      </div>
      <div className="ld">
        <div className="ld-top">
          <div className="ld-brand">
            <span>Surely Placed · ATS scan</span>
            <span className="ld-stage" id="ld-stage">
              STAGE 01 / 06
            </span>
          </div>
          <div className="ld-hud">
            <div className="hud">
              <b id="ld-xp">0</b>
              <small>XP</small>
            </div>
            <div className="hud">
              <b id="ld-combo">x1</b>
              <small>COMBO</small>
            </div>
          </div>
        </div>
        <div>
          <h3 className="sr-only" id="ld-title">
            Running your resume through the bot
          </h3>
          <p className="ld-word" id="ld-word" aria-live="polite">
            Parsing.
          </p>
          <p className="ld-sub" id="ld-sub">
            Your file
          </p>
        </div>
        <div className="ld-arena" id="ld-arena" ref={arenaRef}>
          <div className="ld-doc" id="ld-doc">
            <pre id="ld-pre" />
            <i className="ld-laser" />
          </div>
          <div className="ld-bin found" id="bin-f">
            <small>Found</small>
            <b id="bin-f-n">
              0
            </b>
          </div>
          <div className="ld-bin missing" id="bin-m">
            <small>Missing</small>
            <b id="bin-m-n">
              0
            </b>
          </div>
        </div>
        <div className="ld-bottom">
          <div className="ld-pct">
            <span id="ld-pct">0</span>
            <small>%</small>
          </div>
          <div>
            <div className="ld-bar">
              <i id="ld-bar" />
            </div>
            <div className="ld-steps" id="ld-steps">
              {LOADER_STAGES.map((s, i) => (
                <span key={s} id={`lds-${i}`}>
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="ld-foot">
          <span className="ld-tip" id="ld-tip">
            Beat the bot.
          </span>
          <button type="button" className="ld-skip" onClick={onSkip}>
            Skip to score
          </button>
        </div>
      </div>
    </div>
  );
}
