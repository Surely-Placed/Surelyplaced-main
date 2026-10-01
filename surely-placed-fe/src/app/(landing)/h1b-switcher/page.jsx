import PersonaLandingPage from '@/components/Landing/PersonaLandingPage';
import { buildPageMetadata } from '@/lib/seo';
import { getPersonaPageMetadata } from '../../../../mockData/Landing/metadata';

const personaKey = 'switcher';

export const metadata = buildPageMetadata({
  ...getPersonaPageMetadata(personaKey),
  path: '/h1b-switcher',
});

export default function Page() {
  return <PersonaLandingPage personaKey={personaKey} />;
}
