'use client';

import { useCallback, useRef } from 'react';
import { StickyBottomCta } from './StickyBottomCta';
import { HeroSection } from './sections/HeroSection';
import { PainPointsSection } from './sections/PainPointsSection';
import { ServicesSection } from './sections/ServicesSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { PricingSection, ClosingCtaSection } from './sections/PricingSection';
import { FaqSection } from './sections/FaqSection';

export default function EnrollPage() {
  const heroRef = useRef(null);
  const closingCtaRef = useRef(null);

  const scrollToForm = useCallback(() => {
    const form = document.getElementById('enrollment-form');
    form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <>
      <HeroSection sectionRef={heroRef} onScrollToForm={scrollToForm} />
      <TestimonialsSection />
      <PainPointsSection />
      <ServicesSection />
      <HowItWorksSection />
      <PricingSection onScrollToForm={scrollToForm} />
      <FaqSection />
      <ClosingCtaSection sectionRef={closingCtaRef} onScrollToForm={scrollToForm} />
      <StickyBottomCta
        heroRef={heroRef}
        ctaRef={closingCtaRef}
        onScrollToForm={scrollToForm}
      />
    </>
  );
}
