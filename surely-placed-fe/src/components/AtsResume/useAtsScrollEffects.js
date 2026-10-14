'use client';

import { useEffect } from 'react';

const easeOut = (t) => 1 - (1 - t) ** 3;

function countTo(el) {
  const to = +el.dataset.to;
  const dec = +el.dataset.dec || 0;
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) {
    el.textContent = to.toFixed(dec);
    return;
  }
  const t0 = performance.now();
  const d = 1300;
  function frame(n) {
    const p = Math.min(1, (n - t0) / d);
    el.textContent = (to * easeOut(p)).toFixed(dec);
    if (p < 1) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}

export function useAtsScrollEffects(rootSelector = '.ats-page') {
  useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return undefined;

    const reduced =
      window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const h1Main = root.querySelector('#h1-main');
    if (h1Main && !reduced) {
      let i = 0;
      const walk = (n) => {
        Array.from(n.childNodes).forEach((c) => {
          if (c.nodeType === 3) {
            const frag = document.createDocumentFragment();
            c.textContent.split(/(\s+)/).forEach((w) => {
              if (!w) return;
              if (/^\s+$/.test(w)) {
                frag.appendChild(document.createTextNode(w));
                return;
              }
              const s = document.createElement('span');
              s.className = 'w';
              s.style.animationDelay = `${0.12 + i * 0.07}s`;
              i += 1;
              s.textContent = w;
              frag.appendChild(s);
            });
            c.replaceWith(frag);
          } else if (c.nodeType === 1) {
            c.classList.add('w');
            c.style.animationDelay = `${0.12 + i * 0.07}s`;
            i += 1;
          }
        });
      };
      walk(h1Main);
    }

    if ('IntersectionObserver' in window && !reduced) {
      const vh = innerHeight;
      root.querySelectorAll('.pre-able').forEach((el) => {
        if (el.getBoundingClientRect().top > vh * 0.92) el.classList.add('pre');
      });
      const io = new IntersectionObserver(
        (es) =>
          es.forEach((en) => {
            if (!en.isIntersecting) return;
            const el = en.target;
            if (el.classList.contains('pre')) {
              const sib = Array.from(el.parentElement.children).filter((x) =>
                x.classList.contains('pre-able')
              );
              const d = Math.max(0, sib.indexOf(el)) * 90;
              setTimeout(() => {
                el.classList.add('in');
                el.classList.remove('pre');
              }, d);
            }
            el.querySelectorAll('.cnt').forEach(countTo);
            if (el.classList.contains('cnt')) countTo(el);
            io.unobserve(el);
          }),
        { threshold: 0.18 }
      );
      root.querySelectorAll('.pre-able').forEach((el) => io.observe(el));

      const funnel = root.querySelector('#funnel');
      if (funnel) {
        const fio = new IntersectionObserver(
          (es) => {
            es.forEach((en) => {
              if (en.isIntersecting) {
                funnel.querySelectorAll('.b').forEach((b, idx) => {
                  setTimeout(() => {
                    b.style.width = b.dataset.w;
                  }, idx * 180);
                });
                fio.disconnect();
              }
            });
          },
          { threshold: 0.3 }
        );
        fio.observe(funnel);
      }
    } else {
      root.querySelectorAll('#funnel .b').forEach((b) => {
        b.style.width = b.dataset.w;
      });
    }

    const mbar = root.querySelector('#mbar');
    const checker = root.querySelector('#checker');
    const report = root.querySelector('#report');
    if (mbar && 'IntersectionObserver' in window) {
      const vis = new Set();
      const io2 = new IntersectionObserver(
        (es) => {
          es.forEach((en) => {
            if (en.isIntersecting) vis.add(en.target);
            else vis.delete(en.target);
          });
          mbar.classList.toggle('show', vis.size === 0 && scrollY > 200);
        },
        { threshold: 0.05 }
      );
      [checker, report].filter(Boolean).forEach((el) => io2.observe(el));
      const onScroll = () => {
        if (scrollY < 200) mbar.classList.remove('show');
      };
      addEventListener('scroll', onScroll, { passive: true });
      return () => {
        io2.disconnect();
        removeEventListener('scroll', onScroll);
      };
    }
    return undefined;
  }, [rootSelector]);
}
