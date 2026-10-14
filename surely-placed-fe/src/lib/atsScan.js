const PAYMENTS_API_URL =
  process.env.NEXT_PUBLIC_PAYMENTS_API_URL || process.env.PAYMENTS_API_URL || 'http://localhost:8080';

function getApiUrl() {
  return PAYMENTS_API_URL.replace(/\/$/, '');
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
  return data;
}
