import PersonaLandingPage from '@/components/Landing/PersonaLandingPage';
import { buildPageMetadata } from '@/lib/seo';
import { getPersonaPageMetadata } from '../../../../mockData/Landing/metadata';

const personaKey = 'greencard';

export const metadata = buildPageMetadata({
  ...getPersonaPageMetadata(personaKey),
  path: '/green-card',
});

export default function Page() {
  return <PersonaLandingPage personaKey={personaKey} />;
}
