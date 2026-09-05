import React from 'react';
import EnrollPage from '@/components/Enroll/EnrollPage';
import JsonLd from '@/components/seo/JsonLd';
import { buildFaqSchema, buildPageMetadata } from '@/lib/seo';
import { ENROLL_FAQS } from '../../../../mockData/Enroll';

export const metadata = buildPageMetadata({
  title: 'Talent That Sticks | Surely Placed — Get Your Free Profile Review',
  description:
    'Surely Placed runs your entire US job search — resume, LinkedIn, daily applications, interview prep — so you stop drowning in rejections and start getting callbacks.',
  path: '/enroll',
});

const page = () => {
  return (
    <>
      <JsonLd data={buildFaqSchema(ENROLL_FAQS.map((f) => ({ question: f.q, answer: f.a })))} />
      <EnrollPage />
    </>
  );
};

export default page;
