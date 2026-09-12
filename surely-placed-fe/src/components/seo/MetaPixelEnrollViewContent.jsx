'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackMetaEvent } from '@/components/seo/MetaPixel';

/** ViewContent for /enroll only — mounted in the global `<head>` after the base pixel. */
export default function MetaPixelEnrollViewContent() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== '/enroll') return;
    trackMetaEvent('ViewContent', {
      content_name: 'Enroll Page',
      content_category: 'Enrollment',
    });
  }, [pathname]);

  return null;
}
