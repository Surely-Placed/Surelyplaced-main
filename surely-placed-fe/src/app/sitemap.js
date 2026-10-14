import { SITE_URL } from '@/config/site';
import { careersOpenings, getCareerSlug } from '../../mockData/Careers';

const staticRoutes = [
  '',
  '/meet-cohorts',
  '/our-story',
  '/become-mentor',
  '/careers',
  '/webinar',
  '/book-a-call',
  '/resume-ats',
  '/privacy-policy',
  '/terms-and-conditions',
  '/refund-cancellation-policy',
  '/homepage',
  '/ssg-privacy-policy',
  '/ssg-terms-and-conditions',
];

export default function sitemap() {
  const lastModified = new Date();

  const pages = staticRoutes.map((route) => ({
    url: `${SITE_URL}${route}`,
    lastModified,
    changeFrequency: route === '' || route.includes('cohorts') ? 'weekly' : 'monthly',
    priority: route === '' ? 1 : 0.8,
  }));

  const careerPages = careersOpenings.map((job) => ({
    url: `${SITE_URL}/careers/${getCareerSlug(job.title)}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...pages, ...careerPages];
}
