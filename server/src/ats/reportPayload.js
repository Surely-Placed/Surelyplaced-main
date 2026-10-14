import crypto from 'crypto';
import { bandOf } from './analyzer.js';

export const FREE_KW_ROWS = 6;
export const FREE_BULLETS = 2;
export const FREE_PLAN_STEPS = 3;

function sortKeywords(kw) {
  return kw.slice().sort((a, b) => (a.has - b.has) || b.w - a.w || b.jd - a.jd);
}

function sortFixes(fixes) {
  const order = { critical: 0, warn: 1, good: 2 };
  return fixes.slice().sort((a, b) => order[a.s] - order[b.s]);
}

export function newReportId() {
  return `SP-ATS-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

export function buildFullReport(analysis, { reportId, mode, company, role, fileName }) {
  const [band, , message] = bandOf(analysis.score);
  const bullets = analysis.bullets.slice(0, 10);
  return {
    reportId,
    score: analysis.score,
    band,
    message,
    cats: analysis.cats,
    kw: analysis.kw,
    matched: analysis.matched,
    missing: analysis.missing,
    fixes: analysis.fixes,
    parsed: analysis.parsed,
    found: analysis.found,
    bullets,
    words: analysis.words,
    lineCount: analysis.lines.length,
    unlocked: true,
    mode,
    company,
    role,
    fileName,
  };
}

export function buildFreeScanResponse(analysis, meta) {
  const reportId = meta.reportId || newReportId();
  const full = buildFullReport(analysis, { ...meta, reportId });
  const kwSorted = sortKeywords(full.kw);
  const fx = sortFixes(full.fixes);
  const bl = full.bullets;

  const lockedKeywords = Math.max(0, kwSorted.length - FREE_KW_ROWS);
  const lockedBullets = Math.max(0, bl.length - FREE_BULLETS);
  const lockedPlanSteps = Math.max(0, fx.length - FREE_PLAN_STEPS);

  const freeReport = {
    reportId: full.reportId,
    score: full.score,
    band: full.band,
    message: full.message,
    cats: full.cats,
    kw: kwSorted.slice(0, FREE_KW_ROWS),
    kwTotal: kwSorted.length,
    matchedCount: full.matched.length,
    missingCount: full.missing.length,
    coveragePct: kwSorted.length
      ? Math.round((full.matched.length / kwSorted.length) * 100)
      : 0,
    fixes: fx.slice(0, FREE_PLAN_STEPS),
    parsed: full.parsed,
    found: full.found,
    bullets: bl.slice(0, FREE_BULLETS),
    bulletsTotal: bl.length,
    words: full.words,
    lineCount: full.lineCount,
    unlocked: false,
    locked: {
      keywords: lockedKeywords,
      bullets: lockedBullets,
      planSteps: lockedPlanSteps,
    },
    mode: full.mode,
    company: full.company,
    role: full.role,
    fileName: full.fileName,
  };

  return { freeReport, fullReport: full };
}
