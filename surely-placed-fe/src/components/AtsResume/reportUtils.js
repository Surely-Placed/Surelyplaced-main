export const PLACEHOLDER_KW = [
  { term: 'Stakeholder mgmt', type: 'Role term', jd: 2, has: false, w: 1 },
  { term: 'Terraform', type: 'Hard skill', jd: 1, has: false, w: 2 },
  { term: 'System design', type: 'Hard skill', jd: 1, has: true, w: 2 },
  { term: 'Cross-functional', type: 'Role term', jd: 2, has: false, w: 1 },
];

export const PLACEHOLDER_BULLETS = [
  {
    text: 'Led a cross-team initiative to improve pipeline reliability and reporting accuracy.',
    num: false,
    verb: true,
    weak: '',
  },
  {
    text: 'Responsible for helping with various tasks across the department as needed.',
    num: false,
    verb: false,
    weak: 'responsible for',
  },
];

export const PLACEHOLDER_FIXES = [
  {
    s: 'warn',
    t: 'Add missing tools to your skills section',
    d: 'Include relevant stack terms where they reflect your real experience.',
  },
  {
    s: 'warn',
    t: 'Quantify one more bullet',
    d: 'Add scale, time saved, or users impacted to strengthen impact.',
  },
];

export function colorOf(v) {
  if (v >= 75) return 'var(--good)';
  if (v >= 50) return 'var(--warn)';
  return 'var(--crit)';
}

export function stOf(v) {
  if (v >= 75) return ['good', 'Strong'];
  if (v >= 50) return ['warn', 'Improve'];
  return ['critical', 'Fix first'];
}

export function searchVisibility(result, mode) {
  const cat0 = result.cats?.[0]?.v ?? 0;
  if (mode === 'match') {
    if (cat0 >= 75) return ['High', 'var(--good)'];
    if (cat0 >= 50) return ['Medium', 'var(--warn)'];
    return ['Low', 'var(--crit)'];
  }
  if (result.score >= 75) return ['High', 'var(--good)'];
  if (result.score >= 50) return ['Medium', 'var(--warn)'];
  return ['Low', 'var(--crit)'];
}

export function executiveSummary(result) {
  const crit = result.fixes.filter((f) => f.s === 'critical');
  const warn = result.fixes.filter((f) => f.s === 'warn');
  const sorted = result.cats.slice().sort((a, b) => b.v - a.v);
  const risk = crit[0] ||
    warn[0] || {
      t: 'No critical blockers',
      d: 'Nothing is stopping the ATS from reading you. Focus on sharpening keywords.',
    };
  const win =
    warn.find((f) => /LinkedIn|verbs|summary|passive|pronoun/i.test(f.t)) ||
    warn[0] ||
    crit[1] || {
      t: 'Tailor for each application',
      d: 'Re-run this check against every new job description you apply to.',
    };
  const asset = sorted[0];
  return { risk, win, asset };
}
