import { table } from '../db.js';
import { config } from '../config.js';

const VISA_OPTIONS = new Set([
  'F-1 (job searching)',
  'OPT',
  'STEM OPT',
  'Day-1 CPT',
  'H-1B',
  'H-4 EAD',
  'US citizen / green card',
  'Other',
  '',
]);

function normalizeEmail(email) {
  return String(email || '')
    .trim()
    .toLowerCase();
}

export function validateAtsLead(body = {}) {
  const name = String(body.name || '').trim();
  const email = normalizeEmail(body.email);
  const consent = body.consent === true || body.consent === 'true';

  if (!name) {
    return { error: 'Add your name and a valid email so we can send your report.' };
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Add your name and a valid email so we can send your report.' };
  }
  if (!consent) {
    return { error: 'Tick the consent box so we can contact you.' };
  }

  const phone = String(body.phone || '').trim();
  const visa = String(body.visa || '').trim();
  if (visa && !VISA_OPTIONS.has(visa)) {
    return { error: 'Please select a valid visa status.' };
  }

  let addons = body.addons;
  if (!Array.isArray(addons)) {
    addons = addons ? [String(addons)] : [];
  }
  addons = addons.map((a) => String(a).trim()).filter(Boolean);
  const allowedAddons = new Set(['expert_review', 'full_revamp']);
  if (addons.some((a) => !allowedAddons.has(a))) {
    return { error: 'Invalid add-on selection.' };
  }

  return {
    name,
    email,
    phone,
    visa,
    addons,
    scanId: String(body.scanId || '').trim(),
  };
}

async function notifyViaEmail(lead, reportMeta) {
  try {
    const { sendAtsLeadNotification } = await import('../mail.js');
    await sendAtsLeadNotification(lead, reportMeta);
  } catch (err) {
    console.error('[atsLeads] Email notify failed:', err?.message || err);
  }
}

async function logToEnrollmentSheet(lead, reportMeta) {
  const webhookUrl = config.googleSheets?.webhookUrl;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      redirect: 'follow',
      body: JSON.stringify({
        source: 'resume-ats',
        full_name: lead.name,
        email: lead.email,
        whatsapp: lead.phone || '',
        visa_status: lead.visa || '',
        addons: lead.addons.join(', '),
        ats_score: reportMeta.ats_score,
        target_role: reportMeta.target_role,
        target_company: reportMeta.target_company,
        mode: reportMeta.mode,
        report_id: reportMeta.report_id,
      }),
    });
  } catch (err) {
    console.error('[atsLeads] Sheet webhook failed:', err?.message || err);
  }
}

async function persistEnrollmentRow(lead) {
  const whatsapp = lead.phone || 'Not provided';
  const visaStatus = lead.visa || 'Not provided';
  const months = 'Not on a ticking clock';

  const [row] = await table('enrollment_requests')
    .insert({
      full_name: lead.name,
      email: lead.email,
      whatsapp,
      visa_status: visaStatus,
      months_of_authorization_left: months,
    })
    .returning(['id', 'email', 'created_at']);

  return row;
}

export async function persistAtsLead(lead, reportMeta = {}) {
  const row = await persistEnrollmentRow(lead);
  await Promise.allSettled([notifyViaEmail(lead, reportMeta), logToEnrollmentSheet(lead, reportMeta)]);
  return row;
}
