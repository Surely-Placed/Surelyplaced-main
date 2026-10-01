import PersonaLandingPage from '@/components/Landing/PersonaLandingPage';
import { buildPageMetadata } from '@/lib/seo';
import { getPersonaPageMetadata } from '../../../../mockData/Landing/metadata';

const personaKey = 'grad';

export const metadata = buildPageMetadata({
  ...getPersonaPageMetadata(personaKey),
  path: '/grad',
});

export default function Page() {
  return <PersonaLandingPage personaKey={personaKey} />;
}
