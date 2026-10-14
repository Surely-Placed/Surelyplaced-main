const GENERIC_ATS_TERMS = [
  'python',
  'sql',
  'kubernetes',
  'aws',
  'docker',
  'agile',
  'scrum',
  'stakeholder',
  'etl',
  'airflow',
  'postgresql',
  'react',
  'java',
  'terraform',
  'ci/cd',
  'microservices',
  'rest api',
  'machine learning',
  'data pipeline',
  'system design',
  'jira',
  'excel',
  'tableau',
  'snowflake',
  'spark',
  'git',
  'linux',
  'security',
  'networking',
  'leadership',
];

export function buildLoaderData({ fileName }) {
  const shuffled = GENERIC_ATS_TERMS.slice().sort(() => Math.random() - 0.5);
  const matched = shuffled.filter((_, i) => i % 2 === 0);
  const missing = shuffled.filter((_, i) => i % 2 === 1);

  return {
    lines: fileName ? [`Scanning ${fileName}…`, 'Extracting text…', 'Running ATS checks…'] : ['Scanning your resume…'],
    matched,
    missing,
    kwTerms: shuffled,
    mode: 'match',
    fileName,
  };
}

export const LOADER_STAGES = [
  'Parsing file',
  'Mapping sections',
  'Reading contact info',
  'Matching keywords',
  'Scoring impact',
  'Building report',
];

export const LOADER_WORDS = [
  ['Parsing.', 'Your file'],
  ['Mapping.', 'Your sections'],
  ['Reading.', 'Your contact info'],
  ['Matching.', 'Every keyword'],
  ['Scoring.', 'Your impact'],
  ['Building.', 'Your report'],
];

export const LOADER_TIPS = [
  'Beat the bot.',
  'Tap to catch keywords.',
  'Every catch = faster report.',
  'Combo it. Don\'t drop it.',
  'Get seen. Get hired.',
];

export const LOADER_TIMEOUT_MS = 30_000;
