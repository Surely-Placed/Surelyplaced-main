import { Suspense } from 'react';
import ExplainerPage from '@/components/Landing/ExplainerPage';
import { buildPageMetadata } from '@/lib/seo';
import { getExplainerMetadata } from '../../../../mockData/Landing/metadata';

export const metadata = buildPageMetadata({
  ...getExplainerMetadata('grad'),
  path: '/how-it-works',
});

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ExplainerPage />
    </Suspense>
  );
}
