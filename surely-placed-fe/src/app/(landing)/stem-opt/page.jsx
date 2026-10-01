import PersonaLandingPage from '@/components/Landing/PersonaLandingPage';
import { buildPageMetadata } from '@/lib/seo';
import { getPersonaPageMetadata } from '../../../../mockData/Landing/metadata';

const personaKey = 'stemopt';

export const metadata = buildPageMetadata({
  ...getPersonaPageMetadata(personaKey),
  path: '/stem-opt',
});

export default function Page() {
  return <PersonaLandingPage personaKey={personaKey} />;
}
