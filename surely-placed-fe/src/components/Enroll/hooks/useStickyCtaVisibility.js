'use client';

import { useEffect, useState } from 'react';

function observeSection(el, onChange) {
  const observer = new IntersectionObserver(([entry]) => onChange(entry), { threshold: 0 });
  observer.observe(el);
  return observer;
}

/**
 * Shows sticky CTA after the hero leaves the viewport, hides when the real CTA
 * section is visible or has been scrolled past (permanently).
 */
export function useStickyCtaVisibility(heroRef, ctaRef) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const heroEl = heroRef.current;
    const ctaEl = ctaRef.current;
    if (!heroEl || !ctaEl) return;

    let pastHero = false;
    let ctaInView = false;
    let ctaPassed = false;

    const sync = () => {
      setVisible(pastHero && !ctaInView && !ctaPassed);
    };

    const heroObserver = observeSection(heroEl, (entry) => {
      if (entry.isIntersecting) {
        pastHero = false;
      } else if (entry.boundingClientRect.top < 0) {
        pastHero = true;
      }
      sync();
    });

    const ctaObserver = observeSection(ctaEl, (entry) => {
      ctaInView = entry.isIntersecting;
      if (!entry.isIntersecting && entry.boundingClientRect.top < 0) {
        ctaPassed = true;
      }
      sync();
    });

    return () => {
      heroObserver.disconnect();
      ctaObserver.disconnect();
    };
  }, [heroRef, ctaRef]);

  return visible;
}
