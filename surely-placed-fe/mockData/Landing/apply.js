export const APPLY_PERSONA_OPTS = [
  { v: 'grad', label: "I'm graduating soon and don't have a job lined up yet" },
  { v: 'switcher', label: "I'm employed on H-1B and looking for a better fit" },
  { v: 'layoff', label: "I was recently laid off and I'm on the visa clock" },
  { v: 'explorer', label: "I'm still abroad, exploring what a US move would take" },
];

export const APPLY_REGIONS = [
  { v: 'ET', label: 'US East (Eastern Time)', tz: 'America/New_York' },
  { v: 'CT', label: 'US Central (Central Time)', tz: 'America/Chicago' },
  { v: 'MT', label: 'US Mountain (Mountain Time)', tz: 'America/Denver' },
  { v: 'PT', label: 'US West (Pacific Time)', tz: 'America/Los_Angeles' },
  { v: 'ANY', label: 'Anywhere in the US / flexible', tz: 'America/New_York' },
];

export const APPLY_QUESTION_COUNT = 11;

export const APPLY_STATUS_VISA = {
  stemopt: 'STEM OPT',
  greencard: 'Green Card',
  citizen: 'US Citizen',
  h4: 'H4 EAD',
  l2: 'L2 EAD',
  o1a: 'O-1A',
  phd: 'PhD',
};

export const APPLY_EMPLOYED_VISAS = [
  'H-1B (current employer)',
  'H-1B (need a transfer)',
  'H4 EAD',
  'L2 EAD',
  'O-1A',
  'Green Card',
  'US Citizen',
];

export const APPLY_TIMELINE = [
  'Right now / within 60 days',
  'Within 3–6 months',
  '6–12 months',
  'Just exploring for now',
];

export const APPLY_INVEST = [
  {
    v: 'A',
    tag: 'invest-ready',
    label:
      "I'm ready to invest now if the program is the right fit — I just need to see if it makes sense",
  },
  {
    v: 'B',
    tag: 'roi-consult',
    label: "I'd want to understand pricing and ROI before deciding",
  },
  {
    v: 'C',
    tag: 'nurture-free',
    label: "I'm mainly exploring free options right now, not looking to pay",
  },
];

export const APPLY_COUNTRY_CODES = {
  1: 'US / Canada',
  7: 'Russia / Kazakhstan',
  20: 'Egypt',
  27: 'South Africa',
  33: 'France',
  34: 'Spain',
  44: 'United Kingdom',
  49: 'Germany',
  52: 'Mexico',
  55: 'Brazil',
  61: 'Australia',
  62: 'Indonesia',
  63: 'Philippines',
  64: 'New Zealand',
  65: 'Singapore',
  66: 'Thailand',
  81: 'Japan',
  82: 'South Korea',
  84: 'Vietnam',
  86: 'China',
  90: 'Türkiye',
  91: 'India',
  92: 'Pakistan',
  94: 'Sri Lanka',
  98: 'Iran',
  234: 'Nigeria',
  233: 'Ghana',
  254: 'Kenya',
  880: 'Bangladesh',
  886: 'Taiwan',
  852: 'Hong Kong',
  971: 'UAE',
  966: 'Saudi Arabia',
  977: 'Nepal',
  974: 'Qatar',
  353: 'Ireland',
  31: 'Netherlands',
  39: 'Italy',
  48: 'Poland',
  380: 'Ukraine',
  251: 'Ethiopia',
  212: 'Morocco',
  60: 'Malaysia',
  57: 'Colombia',
  54: 'Argentina',
  56: 'Chile',
  51: 'Peru',
};

export const APPLY_TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Europe/London', label: 'London (UK)' },
];

export const APPLY_SLOT_TIMES = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00', '18:30'];

export const APPLY_TONE_LINES = {
  grad: "Graduation is closer than it feels, but you're starting at the right time. Your coach will come ready to map your search to your OPT date.",
  switcher:
    'Nothing changes with your current job until you decide it should. Your coach will walk through what a well-planned transfer looks like.',
  layoff:
    "We know the clock is running. Your coach will come to the call with a plan for your first two weeks, so no day is wasted.",
  explorer:
    "There's no pressure here. Treat the call as a chance to ask anything and leave with a clear picture of your options.",
  stemopt:
    'Your coach will come ready to plan around your STEM OPT end date and focus you on E-Verified employers that sponsor.',
  greencard:
    "No visa questions on this call. Your coach will focus on positioning and the upgrade you're after.",
  citizen:
    'Your coach will look at where your applications stall and how your background can read as an edge.',
  h4: 'Bring your questions about the gap — your coach will help you explain it, and your EAD, with confidence.',
  l2: 'Your coach will plan around the assignment dates so the time you have here counts.',
  o1a: 'Your consultation will focus on your achievements, the roles that fit, and employers prepared to petition.',
  phd: 'Have your CV handy — your coach will start translating your research into an industry story on the call.',
};

export const APPLY_VISA_OPTIONS = [
  'F-1/OPT',
  'STEM OPT',
  'H-1B (current employer)',
  'H-1B (need a transfer)',
  'H4 EAD',
  'L2 EAD',
  'O-1A',
  'Green Card',
  'US Citizen',
  'Other / Not yet in the US',
];
