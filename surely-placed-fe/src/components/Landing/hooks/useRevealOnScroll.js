'use client';

import { useEffect } from 'react';

export function useRevealOnScroll(rootRef) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof IntersectionObserver === 'undefined') return undefined;

    const reduce =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const countUp = (el) => {
      const to = Number(el.dataset.count);
      if (!to) return;
      const suf = el.dataset.suffix || '';
      const t0 = performance.now();
      const dur = 1600;
      const step = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        el.textContent = Math.round(to * (1 - (1 - k) ** 3)) + suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          const el = en.target;
          io.unobserve(el);
          const delay = Number(el.dataset.delay || 0);
          setTimeout(() => {
            el.classList.add('is-visible');
            el.querySelectorAll('[data-count]').forEach(countUp);
          }, delay);
        });
      },
      { threshold: 0.15 },
    );

    root.querySelectorAll('.landing-reveal').forEach((el) => {
      if (reduce) {
        el.classList.add('is-visible');
        return;
      }
      io.observe(el);
    });

    return () => io.disconnect();
  }, [rootRef]);
}
