const STOP = new Set(
  'the and for with from this that your have will are our not but can all any'.split(' ')
);

export function buildLoaderData({ mode, jd, resumeText, fileName }) {
  const lines = (resumeText || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const resumeNorm = (resumeText || '').toLowerCase();
  let matched = [];
  let missing = [];
  let kwTerms = [];

  if (mode === 'match' && jd) {
    const words = [...new Set((jd.toLowerCase().match(/[a-z][a-z0-9+#\-]{3,}/g) || []))].filter(
      (w) => !STOP.has(w)
    );
    kwTerms = words.slice(0, 24);
    kwTerms.forEach((t) => {
      if (resumeNorm.includes(t)) matched.push(t);
      else missing.push(t);
    });
  } else {
    kwTerms = ['python', 'sql', 'aws', 'experience', 'education', 'skills'];
    matched = kwTerms.filter((t) => resumeNorm.includes(t));
    missing = kwTerms.filter((t) => !resumeNorm.includes(t));
  }

  return {
    lines: lines.length ? lines : fileName ? [`Scanning ${fileName}…`] : ['Your resume'],
    matched,
    missing,
    kwTerms,
    mode,
    fileName,
  };
}

export const LOADER_STAGES = [
  'Parsing file',
  'Mapping sections',
  'Reading contact info',
  'Matching keywords',
  'Scoring impact',
  'Building score',
];

export const LOADER_WORDS = [
  ['Parsing.', 'Your file'],
  ['Mapping.', 'Your sections'],
  ['Reading.', 'Your contact info'],
  ['Matching.', 'Every keyword'],
  ['Scoring.', 'Your impact'],
  ['Building.', 'Your score'],
];

export const LOADER_TIPS = [
  'Beat the bot.',
  'Tap to catch keywords.',
  'Every catch = faster score.',
  'Combo it. Don\'t drop it.',
  'Get seen. Get hired.',
];
