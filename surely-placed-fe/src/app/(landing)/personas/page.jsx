import PersonaLandingPage from '@/components/Landing/PersonaLandingPage';
import { buildPageMetadata } from '@/lib/seo';
import { PERSONAS_HUB_METADATA } from '../../../../mockData/Landing/metadata';

const personaKey = 'grad';

export const metadata = buildPageMetadata({
  ...PERSONAS_HUB_METADATA,
  path: '/personas',
});

export default function Page() {
  return <PersonaLandingPage personaKey={personaKey} />;
}
