import PersonaLandingPage from '@/components/Landing/PersonaLandingPage';
import { buildPageMetadata } from '@/lib/seo';
import { getPersonaPageMetadata } from '../../../../mockData/Landing/metadata';

const personaKey = 'citizen';

export const metadata = buildPageMetadata({
  ...getPersonaPageMetadata(personaKey),
  path: '/us-citizen',
});

export default function Page() {
  return <PersonaLandingPage personaKey={personaKey} />;
}
