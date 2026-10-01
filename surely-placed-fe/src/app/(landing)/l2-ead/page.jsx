import PersonaLandingPage from '@/components/Landing/PersonaLandingPage';
import { buildPageMetadata } from '@/lib/seo';
import { getPersonaPageMetadata } from '../../../../mockData/Landing/metadata';

const personaKey = 'l2';

export const metadata = buildPageMetadata({
  ...getPersonaPageMetadata(personaKey),
  path: '/l2-ead',
});

export default function Page() {
  return <PersonaLandingPage personaKey={personaKey} />;
}
