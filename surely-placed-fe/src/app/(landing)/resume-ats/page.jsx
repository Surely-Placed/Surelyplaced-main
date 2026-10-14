import { Anton, JetBrains_Mono, Jost, Plus_Jakarta_Sans } from 'next/font/google';
import AtsResumePage from '@/components/AtsResume/AtsResumePage';
import { buildPageMetadata } from '@/lib/seo';
import { SITE_URL } from '@/config/site';
import { ATS_RESUME_METADATA } from '../../../../mockData/AtsResume/metadata';
import { ATS_FAQ } from '../../../../mockData/AtsResume/content';
import '../../../../styles/AtsResume/index.scss';

const jost = Jost({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-ats-jost',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-ats-jakarta',
  display: 'swap',
});

const anton = Anton({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-ats-anton',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-ats-mono',
  display: 'swap',
});

export const metadata = buildPageMetadata({
  ...ATS_RESUME_METADATA,
  path: '/resume-ats',
});

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebApplication',
      '@id': `${SITE_URL}/resume-ats#app`,
      name: 'Surely Placed ATS Resume Checker',
      url: `${SITE_URL}/resume-ats`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any (web browser)',
      description:
        'Free ATS resume checker that scores your resume against a specific company and job description, or a general ATS readiness check. Returns an instant ATS score out of 100.',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      provider: { '@id': `${SITE_URL}/#org` },
    },
    {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#org`,
      name: 'Surely Placed',
      url: SITE_URL,
      email: 'contact@surelyplaced.com',
      telephone: '+91-97777-71281',
    },
    {
      '@type': 'HowTo',
      name: "How to check your resume's ATS score",
      totalTime: 'PT1M',
      step: [
        {
          '@type': 'HowToStep',
          name: 'Upload your resume',
          text: 'Upload a PDF, DOCX or TXT resume, or paste the text.',
        },
        {
          '@type': 'HowToStep',
          name: 'Add the job',
          text: 'Enter the company and target role and paste the job description, or choose the general ATS check.',
        },
        {
          '@type': 'HowToStep',
          name: 'Read your score',
          text: 'Review your ATS score out of 100, the band label and what it means for recruiter search.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: ATS_FAQ.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'ATS Resume Checker', item: `${SITE_URL}/resume-ats` },
      ],
    },
  ],
};

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AtsResumePage
        className={`${jost.variable} ${jakarta.variable} ${anton.variable} ${jetbrains.variable}`}
        fontVars={{
          '--f-display': 'var(--font-ats-jost), "Jost", system-ui, sans-serif',
          '--f-body': 'var(--font-ats-jakarta), "Plus Jakarta Sans", system-ui, sans-serif',
          '--f-cond': 'var(--font-ats-anton), "Anton", "Arial Narrow", sans-serif',
          '--f-mono': 'var(--font-ats-mono), "JetBrains Mono", ui-monospace, monospace',
        }}
      />
    </>
  );
}
