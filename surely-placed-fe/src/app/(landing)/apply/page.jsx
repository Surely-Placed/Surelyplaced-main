import { Suspense } from 'react';
import ApplyWizardPage from '@/components/Landing/ApplyWizardPage';
import { buildPageMetadata } from '@/lib/seo';
import { APPLY_PAGE_METADATA } from '../../../../mockData/Landing/metadata';

export const metadata = buildPageMetadata({
  ...APPLY_PAGE_METADATA,
  path: '/apply',
});

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ApplyWizardPage />
    </Suspense>
  );
}
