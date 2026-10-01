import { LANDING_PERSONAS } from './personas';
import { EXPLAINER_INTRO } from './explainer';

export function getPersonaPageMetadata(personaKey) {
  const p = LANDING_PERSONAS[personaKey];
  if (!p) {
    return { title: 'Surely Placed', description: 'Career coaching for international talent.' };
  }
  const title = `${p.h1} ${p.h1b}`.replace(/\s+/g, ' ').trim();
  return { title, description: p.sub };
}

export function getExplainerMetadata(personaKey) {
  const intro = EXPLAINER_INTRO[personaKey] || EXPLAINER_INTRO.grad;
  return {
    title: 'The path from where you are to a US tech offer',
    description: intro,
  };
}

export const APPLY_PAGE_METADATA = {
  title: 'Apply for a free coaching call | Surely Placed',
  description:
    'Answer a few short questions, then pick a time for your free 30-minute call with a Surely Placed coach.',
};

export const PERSONAS_HUB_METADATA = getPersonaPageMetadata('grad');
