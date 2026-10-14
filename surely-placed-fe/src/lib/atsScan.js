const PAYMENTS_API_URL =
  process.env.NEXT_PUBLIC_PAYMENTS_API_URL || process.env.PAYMENTS_API_URL || 'http://localhost:8080';

function getApiUrl() {
  return PAYMENTS_API_URL.replace(/\/$/, '');
}

/** Normalize scan/lead payloads so the report UI never assumes optional arrays exist. */
export function normalizeAtsScanResult(raw) {
  if (!raw || typeof raw !== 'object') return raw;
  const nested = raw.freeReport && typeof raw.freeReport === 'object' ? raw.freeReport : null;
  const base = nested ? { ...nested, scanId: raw.scanId ?? nested.scanId } : { ...raw };
  return {
    ...base,
    fixes: Array.isArray(base.fixes) ? base.fixes : [],
    cats: Array.isArray(base.cats) ? base.cats : [],
    kw: Array.isArray(base.kw) ? base.kw : [],
    bullets: Array.isArray(base.bullets) ? base.bullets : [],
    matched: Array.isArray(base.matched) ? base.matched : undefined,
    missing: Array.isArray(base.missing) ? base.missing : undefined,
    parsed: base.parsed && typeof base.parsed === 'object' ? base.parsed : {},
    found: base.found && typeof base.found === 'object' ? base.found : {},
    locked: base.locked && typeof base.locked === 'object' ? base.locked : base.locked,
  };
}

export async function scanAtsResume({ file, resumeText, mode, company, role, jd }) {
  const formData = new FormData();
  formData.append('mode', mode);
  formData.append('company', company || '');
  formData.append('role', role || '');
  formData.append('jd', jd || '');

  if (file) {
    formData.append('resume', file);
  } else if (resumeText) {
    formData.append('resumeText', resumeText);
  }

  const response = await fetch(`${getApiUrl()}/api/ats/scan`, {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Scan failed (${response.status})`);
  }
  return normalizeAtsScanResult(data);
}

export async function submitAtsLead(payload) {
  const response = await fetch(`${getApiUrl()}/api/ats/lead`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Could not unlock report (${response.status})`);
  }
  return normalizeAtsScanResult(data);
}
