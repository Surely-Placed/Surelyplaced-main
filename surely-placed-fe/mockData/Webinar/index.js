export const WEBINAR_FAQS = [
  {
    q: 'Is this beginner friendly?',
    a: 'Yes. No prior interview prep or AI experience is needed. The webinar starts from how hiring works today and builds up from there.',
  },
  {
    q: 'Will I receive the playbook?',
    a: 'Yes. The Software Career Playbook is emailed to you immediately after registration, before the webinar even starts.',
  },
  {
    q: 'Is the webinar live?',
    a: 'Yes. Live and instructor-led on Sunday, July 20, 2026 at 8 PM ET, with a live Q&A at the end.',
  },
  {
    q: 'Will there be Q&A?',
    a: 'Absolutely. Bring your specific questions on resume, visa timing, or interview prep and get them answered live.',
  },
  {
    q: 'Will the recording be shared?',
    a: 'Yes, registered attendees receive the recording, so you can rewatch or catch up if you miss a section.',
  },
  {
    q: 'Is this useful for international students?',
    a: 'Yes. It is built with international candidates in mind: F-1, OPT, STEM OPT, H-1B, green card holders, and US citizens alike.',
  },
  {
    q: 'Do I need AI experience?',
    a: 'No. Module 3 introduces AI tools from zero and shows exactly which ones recruiters expect you to know.',
  },
];

export const WEBINAR_TESTIMONIALS = [
  {
    quote:
      '"I sent 300+ applications and heard nothing. After fixing my resume and application strategy the way they taught, I had 4 interviews in 3 weeks."',
    initials: 'PK',
    name: 'Priya K.',
    role: 'SDE · Amazon',
    tone: 'blue',
  },
  {
    quote:
      '"As an F-1 student I thought my visa status was the problem. It wasn\'t. My positioning was. The roadmap changed how I applied, and I signed my offer before OPT even started."',
    initials: 'RS',
    name: 'Rahul S.',
    role: 'Data Engineer · Microsoft',
    tone: 'teal',
  },
  {
    quote:
      '"The mock interviews were harder than my actual Google interview. That\'s the point. I walked in prepared for everything they asked."',
    initials: 'AM',
    name: 'Ananya M.',
    role: 'Software Engineer · Google',
    tone: 'blue',
  },
];

export const WEBINAR_WALKAWAY_SECTIONS = [
  {
    label: '01',
    title: 'Understand How Companies Actually Hire for Tech Roles Today',
    intro:
      'The tech job market has changed dramatically, and applying the same way you did a year ago simply does not work anymore. During this webinar, you will discover:',
    bullets: [
      'What recruiters and hiring managers actually look for',
      'Why qualified candidates are not getting interview calls',
      'How AI is reshaping hiring across tech roles',
      'The biggest hiring trends that will define the next few years',
    ],
  },
  {
    label: '02',
    title: 'Learn How to Stand Out and Get More Interview Calls',
    intro:
      'Getting interviews is not about sending more applications—it is about presenting yourself the right way. We will show you how to:',
    bullets: [
      'Build a resume that gets shortlisted',
      'Optimize your LinkedIn and GitHub profile',
      'Navigate ATS systems with confidence',
      'Apply strategically instead of blindly sending hundreds of applications',
      'Position yourself as a stronger candidate for today’s competitive tech job market',
    ],
  },
  {
    label: '03',
    title: 'Master the Interview Process with Confidence',
    intro:
      'Whether you are interviewing for Software Development, Data, Cloud, AI, QA, Cybersecurity, DevOps, or other tech roles, you will understand what companies expect at every stage of the hiring journey. You will gain insights into:',
    bullets: [
      'Online coding assessments and technical evaluations',
      'Technical interview strategies and problem-solving approaches',
      'HR and behavioral interviews',
      'The most common mistakes candidates make—and how to avoid them',
      'Practical techniques to improve your interview performance and confidence',
    ],
  },
  {
    label: '04',
    title: 'Leave with a Clear Roadmap to Land Your Next Tech Role',
    intro:
      'Stop jumping between random YouTube videos, blogs, and conflicting advice. You will leave with a structured action plan that tells you exactly what to focus on—and what to ignore. Plus, you will receive:',
    bullets: [
      'Surely Placed Career Playbook',
      '30-60-90 Day Career Roadmap',
      'Resume and LinkedIn Optimization Checklists',
      'AI Learning Resources',
      'Job Application Tracker',
      'Curated Interview Preparation and Practice Resources',
    ],
  },
];

export const WEBINAR_AUDIENCE_PILLS = [
  "Final-year & master's students",
  'Fresh graduates',
  'Engineers, 0–5 years',
  'Career switchers & bootcamp grads',
  'F-1 · OPT · STEM OPT · H-1B',
  'US citizens & green card holders',
];

export const WEBINAR_COUNTRY_OPTIONS = ['United States', 'India', 'Canada', 'United Kingdom', 'Other'];
export const WEBINAR_STATUS_OPTIONS = [
  'Student',
  'Recent graduate',
  'Working professional',
  'Between jobs',
  'Career switcher',
];
export const WEBINAR_VISA_OPTIONS = ['F-1', 'OPT', 'STEM OPT', 'H-1B', 'Green Card', 'US Citizen', 'Other / N/A'];
export const WEBINAR_EXP_OPTIONS = ['0 (student / fresher)', '1–2 years', '3–5 years', '5+ years'];

export const WEBINAR_PLAN_SLUG = 'webinar-live';
export const WEBINAR_DATETIME_LABEL = 'Sunday, July 20, 2026 · 8 PM ET';

export const WEBINAR_YOUTUBE_URL = 'https://youtube.com/shorts/Hv2zcXPCpUQ?feature=share';
export const WEBINAR_YOUTUBE_VIDEO_ID = 'Hv2zcXPCpUQ';
export const WEBINAR_YOUTUBE_THUMBNAIL = '/webinar2.png';
export const WEBINAR_YOUTUBE_EMBED_URL = `https://www.youtube.com/embed/${WEBINAR_YOUTUBE_VIDEO_ID}?rel=0&modestbranding=1`;

export const WEBINAR_DEFAULTS = {
  price: 19.99,
  seatsLeft: 5,
  seatsTotal: 25,
  webinarDate: '2026-07-20T20:00:00-04:00',
  videoEmbedUrl: WEBINAR_YOUTUBE_EMBED_URL,
};

export const EMPTY_WEBINAR_FORM = {
  fullName: '',
  email: '',
  phone: '',
  country: '',
  status: '',
  visa: '',
  exp: '',
};
