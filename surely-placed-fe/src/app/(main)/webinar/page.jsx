import React from 'react';
import WebinarPage from '@/components/Webinar/WebinarPage';
import JsonLd from '@/components/seo/JsonLd';
import { buildFaqSchema, buildPageMetadata } from '@/lib/seo';
import { WEBINAR_FAQS } from '../../../../mockData/Webinar';

export const metadata = buildPageMetadata({
  title: 'Live Webinar | Stop Mass-Applying, Start Getting Interviews | Surely Placed',
  description:
    'Join our live career webinar on Sunday, July 20, 2026 at 8 PM ET. Learn the system engineers use to get shortlisted, crack interviews, and stay ahead of AI-driven hiring.',
  path: '/webinar',
});

const page = () => {
  return (
    <>
      <JsonLd data={buildFaqSchema(WEBINAR_FAQS.map((f) => ({ question: f.q, answer: f.a })))} />
      <WebinarPage />
    </>
  );
};

export default page;
