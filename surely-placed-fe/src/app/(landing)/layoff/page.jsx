import PersonaLandingPage from '@/components/Landing/PersonaLandingPage';
import { buildPageMetadata } from '@/lib/seo';
import { getPersonaPageMetadata } from '../../../../mockData/Landing/metadata';

const personaKey = 'layoff';

export const metadata = buildPageMetadata({
  ...getPersonaPageMetadata(personaKey),
  path: '/layoff',
});

export default function Page() {
  return <PersonaLandingPage personaKey={personaKey} />;
}
