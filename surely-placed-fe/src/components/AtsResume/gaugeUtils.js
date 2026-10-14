const GC = { cx: 160, cy: 160, r: 124 };

function polar(r, deg) {
  const a = (deg * Math.PI) / 180;
  return [GC.cx + r * Math.cos(a), GC.cy + r * Math.sin(a)];
}

function arc(r, a0, a1) {
  const [x0, y0] = polar(r, a0);
  const [x1, y1] = polar(r, a1);
  return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

export const ang = (v) => 150 + (240 * v) / 100;

export function zoneCol(v) {
  if (v < 50) return '#D2452F';
  if (v < 70) return '#E0A21F';
  if (v < 85) return '#38BDB1';
  return '#2857C4';
}

export function buildGaugeSvgMarkup() {
  let ticks = '';
  let labels = '';
  for (let v = 0; v <= 100; v += 5) {
    const big = v % 10 === 0;
    const [x0, y0] = polar(big ? 104 : 108, ang(v));
    const [x1, y1] = polar(114, ang(v));
    ticks += `<line class="gt" data-v="${v}" x1="${x0.toFixed(1)}" y1="${y0.toFixed(1)}" x2="${x1.toFixed(1)}" y2="${y1.toFixed(1)}" stroke="#DCE2EC" stroke-width="${big ? 2.6 : 1.6}" stroke-linecap="round"/>`;
    if (v % 20 === 0) {
      const [lx, ly] = polar(90, ang(v));
      labels += `<text x="${lx.toFixed(1)}" y="${(ly + 4).toFixed(1)}" text-anchor="middle" font-family="JetBrains Mono,monospace" font-size="11" font-weight="600" fill="#737D97">${v}</text>`;
    }
  }
  return `<svg viewBox="0 0 320 262" aria-hidden="true">
   <defs><linearGradient id="gg" gradientUnits="userSpaceOnUse" x1="36" y1="0" x2="284" y2="0"><stop offset="0" stop-color="#D2452F"/><stop offset=".45" stop-color="#E0A21F"/><stop offset=".7" stop-color="#38BDB1"/><stop offset="1" stop-color="#2857C4"/></linearGradient>
   <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter></defs>
   <path d="${arc(142, ang(0), ang(50))}" stroke="#F3C9C0" stroke-width="5" fill="none" stroke-linecap="round"/>
   <path d="${arc(142, ang(50.8), ang(70))}" stroke="#F1DDB0" stroke-width="5" fill="none"/>
   <path d="${arc(142, ang(70.8), ang(100))}" stroke="#BDE6E1" stroke-width="5" fill="none" stroke-linecap="round"/>
   <path d="${arc(GC.r, ang(0), ang(100))}" stroke="#EEF1F6" stroke-width="18" fill="none" stroke-linecap="round"/>
   <path id="g-glow" d="${arc(GC.r, ang(0), ang(100))}" stroke="url(#gg)" stroke-width="18" fill="none" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100" filter="url(#glow)" opacity=".45"/>
   <path id="g-arc" d="${arc(GC.r, ang(0), ang(100))}" stroke="url(#gg)" stroke-width="18" fill="none" stroke-linecap="round" pathLength="100" stroke-dasharray="0 100"/>
   ${ticks}${labels}
   <circle id="g-halo" r="16" fill="#38BDB1" opacity=".28" cx="${polar(GC.r, ang(0))[0]}" cy="${polar(GC.r, ang(0))[1]}" filter="url(#glow)"/>
   <circle id="g-tip" r="7" fill="#FFFFFF" stroke="#2857C4" stroke-width="3.5" cx="${polar(GC.r, ang(0))[0]}" cy="${polar(GC.r, ang(0))[1]}"/>
   <circle id="g-ring" r="${GC.r}" cx="160" cy="160" fill="none" stroke="#38BDB1" stroke-width="2" opacity="0"/>
  </svg>`;
}

export function gaugeSet(v, arcEl, glow, tip, halo, ticks) {
  const clamped = Math.max(0, Math.min(100, v));
  const d = `${clamped.toFixed(2)} 100`;
  if (arcEl) arcEl.setAttribute('stroke-dasharray', d);
  if (glow) glow.setAttribute('stroke-dasharray', d);
  const [x, y] = polar(GC.r, ang(clamped));
  if (tip) {
    tip.setAttribute('cx', x.toFixed(2));
    tip.setAttribute('cy', y.toFixed(2));
    tip.setAttribute('stroke', zoneCol(clamped));
  }
  if (halo) {
    halo.setAttribute('cx', x.toFixed(2));
    halo.setAttribute('cy', y.toFixed(2));
    halo.setAttribute('fill', zoneCol(clamped));
  }
  ticks?.forEach((t) => {
    const tv = +t.dataset.v;
    t.setAttribute('stroke', tv <= clamped ? zoneCol(tv) : '#DCE2EC');
  });
}

const easeOut = (t) => 1 - (1 - t) ** 3;

export function animateGauge(score, container, onDone, reducedMotion) {
  const arcEl = container.querySelector('#g-arc');
  const glow = container.querySelector('#g-glow');
  const num = container.querySelector('#g-num');
  const tip = container.querySelector('#g-tip');
  const halo = container.querySelector('#g-halo');
  const ticks = [...container.querySelectorAll('.gt')];
  const set = (v) => gaugeSet(v, arcEl, glow, tip, halo, ticks);

  if (reducedMotion) {
    set(score);
    if (num) num.textContent = String(score);
    onDone?.();
    return;
  }

  const T1 = 750;
  const T2 = 1500;
  const t0 = performance.now();
  let last = 0;

  function frame(now) {
    const t = now - t0;
    if (t < T1) {
      const v = easeOut(t / T1) * 100;
      set(v);
      if (now - last > 35 && num) {
        num.textContent = String(Math.floor(Math.random() * 100));
        last = now;
      }
      requestAnimationFrame(frame);
    } else if (t < T1 + T2) {
      const p = (t - T1) / T2;
      const v = score + (100 - score) * Math.exp(-4.6 * p) * Math.cos(8.5 * p);
      const clamped = Math.max(0, Math.min(100, v));
      set(clamped);
      if (num) num.textContent = String(Math.round(clamped));
      requestAnimationFrame(frame);
    } else {
      set(score);
      if (num) {
        num.textContent = String(score);
        num.classList.remove('flash');
        void num.offsetWidth;
        num.classList.add('flash');
      }
      const ring = container.querySelector('#g-ring');
      if (ring?.animate) {
        ring.animate(
          [
            { opacity: 0.9, transform: 'scale(1)', strokeWidth: 2 },
            { opacity: 0, transform: 'scale(1.18)', strokeWidth: 10 },
          ],
          { duration: 900, easing: 'cubic-bezier(.2,.8,.2,1)' }
        );
      }
      if (halo?.animate) {
        halo.animate(
          [
            { r: 16, opacity: 0.28 },
            { r: 34, opacity: 0.6 },
            { r: 16, opacity: 0.28 },
          ],
          { duration: 900 }
        );
      }
      onDone?.();
    }
  }
  requestAnimationFrame(frame);
}
