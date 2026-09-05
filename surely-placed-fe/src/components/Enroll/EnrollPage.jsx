'use client';

import { useCallback } from 'react';
import { HeroSection } from './sections/HeroSection';
import { PainPointsSection } from './sections/PainPointsSection';
import { ServicesSection } from './sections/ServicesSection';
import { HowItWorksSection } from './sections/HowItWorksSection';
import { TestimonialsSection } from './sections/TestimonialsSection';
import { PricingSection, ClosingCtaSection } from './sections/PricingSection';
import { FaqSection } from './sections/FaqSection';

export default function EnrollPage() {
  const scrollToForm = useCallback(() => {
    const form = document.getElementById('enrollment-form');
    form?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, []);

  return (
    <>
      <HeroSection onScrollToForm={scrollToForm} />
      <PainPointsSection />
      <ServicesSection />
      <HowItWorksSection />
      <TestimonialsSection />
      <PricingSection onScrollToForm={scrollToForm} />
      <FaqSection />
      <ClosingCtaSection onScrollToForm={scrollToForm} />
    </>
  );
}
