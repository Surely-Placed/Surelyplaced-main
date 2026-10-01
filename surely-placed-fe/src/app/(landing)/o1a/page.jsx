import PersonaLandingPage from '@/components/Landing/PersonaLandingPage';
import { buildPageMetadata } from '@/lib/seo';
import { getPersonaPageMetadata } from '../../../../mockData/Landing/metadata';

const personaKey = 'o1a';

export const metadata = buildPageMetadata({
  ...getPersonaPageMetadata(personaKey),
  path: '/o1a',
});

export default function Page() {
  return <PersonaLandingPage personaKey={personaKey} />;
}
