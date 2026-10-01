import { ENROLL_MONTHS_OPTIONS } from '../../../mockData/Enroll';

const VISA_MAP = {
  'F-1/OPT': 'OPT',
  'STEM OPT': 'STEM OPT',
  'H-1B (current employer)': 'H-1B',
  'H-1B (need a transfer)': 'H-1B',
  'H4 EAD': 'H-4 EAD',
  'L2 EAD': 'Other visa status',
  'O-1A': 'Other visa status',
  'Green Card': 'Other visa status',
  'US Citizen': 'Other visa status',
  'Other / Not yet in the US': 'Other visa status',
};

const TIMELINE_MAP = {
  'Right now / within 60 days': 'Less than 1 month',
  'Within 3–6 months': '3–6 months',
  '6–12 months': '6+ months',
  'Just exploring for now': 'Not on a ticking clock',
};

export function mapApplyAnswersToEnrollmentPayload(answers) {
  const visaRaw = answers.visa || '';
  const visa_status = VISA_MAP[visaRaw] || visaRaw || 'Other visa status';

  const timeline = answers.timeline || '';
  const months_of_authorization_left =
    ENROLL_MONTHS_OPTIONS.find((o) => o === TIMELINE_MAP[timeline]) ||
    TIMELINE_MAP[timeline] ||
    ENROLL_MONTHS_OPTIONS[2];

  return {
    full_name: (answers.fullName || '').trim(),
    email: (answers.email || '').trim(),
    whatsapp: answers.phone || '',
    visa_status,
    months_of_authorization_left,
  };
}
