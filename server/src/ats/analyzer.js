const DICT = [
  'python',
  'java',
  'javascript',
  'typescript',
  'c++',
  'c#',
  'golang',
  'rust',
  'scala',
  'kotlin',
  'swift',
  'ruby',
  'php',
  'sql',
  'nosql',
  'postgresql',
  'mysql',
  'mongodb',
  'redis',
  'cassandra',
  'dynamodb',
  'snowflake',
  'bigquery',
  'redshift',
  'databricks',
  'spark',
  'pyspark',
  'hadoop',
  'kafka',
  'airflow',
  'dbt',
  'etl',
  'elt',
  'tableau',
  'power bi',
  'looker',
  'excel',
  'pandas',
  'numpy',
  'scikit-learn',
  'tensorflow',
  'pytorch',
  'keras',
  'machine learning',
  'deep learning',
  'nlp',
  'computer vision',
  'llm',
  'generative ai',
  'langchain',
  'rag',
  'mlops',
  'statistics',
  'a/b testing',
  'react',
  'angular',
  'vue',
  'next.js',
  'node.js',
  'express',
  'django',
  'flask',
  'fastapi',
  'spring boot',
  'spring',
  '.net',
  'graphql',
  'rest api',
  'microservices',
  'html',
  'css',
  'tailwind',
  'redux',
  'aws',
  'azure',
  'gcp',
  'docker',
  'kubernetes',
  'terraform',
  'ansible',
  'jenkins',
  'github actions',
  'ci/cd',
  'linux',
  'bash',
  'git',
  'prometheus',
  'grafana',
  'datadog',
  'splunk',
  'tcp/ip',
  'dns',
  'bgp',
  'ospf',
  'cisco',
  'firewall',
  'vpn',
  'load balancing',
  'cybersecurity',
  'siem',
  'iam',
  'agile',
  'scrum',
  'jira',
  'system design',
  'distributed systems',
  'data structures',
  'algorithms',
  'unit testing',
  'selenium',
  'cypress',
  'jest',
  'sap',
  'salesforce',
  'financial modeling',
  'fp&a',
  'forecasting',
  'budgeting',
  'gaap',
  'supply chain',
  'erp',
  'oracle',
  'data modeling',
  'data warehouse',
  'data pipelines',
  'data governance',
  'product management',
  'stakeholder management',
  'sql server',
  's3',
  'lambda',
  'ec2',
  'serverless',
  'oop',
  'devops',
  'sre',
  'observability',
  'networking',
  'glue',
  'dimensional modeling',
  'data quality',
];

const ALIAS = {
  kubernetes: ['k8s'],
  javascript: ['js', 'ecmascript'],
  gcp: ['google cloud'],
  postgresql: ['postgres'],
  'machine learning': ['ml'],
  'ci/cd': ['cicd', 'continuous integration', 'continuous delivery'],
  'node.js': ['nodejs'],
  'next.js': ['nextjs'],
  'power bi': ['powerbi'],
  aws: ['amazon web services'],
  golang: ['go lang'],
  'data pipelines': ['data pipeline', 'pipelines'],
  'rest api': ['rest apis', 'restful'],
  llm: ['llms', 'large language model'],
  'a/b testing': ['ab testing', 'experimentation'],
  nlp: ['natural language processing'],
  'scikit-learn': ['sklearn'],
  'dimensional modeling': ['dimensional models', 'dimensional model'],
  'data modeling': ['data models', 'data model'],
};

const STOP = new Set(
  'a an and are as at be been but by can could did do does for from had has have having he her his how i if in into is it its may me more most must my no not of on or our ours out over own she should so some such than that the their them then there these they this those through to too under until up very was we were what when where which while who whom why will with would you your yours about above after again against all am any because before being below between both down during each few further here just only other same nor once off'.split(
    ' '
  )
);

const GENERIC = new Set(
  'experience experienced years year team teams work working ability able skills skill strong knowledge including across ensure role company candidate candidates required requirements preferred plus will help using use used build building develop developing support supporting within environment environments understanding excellent good great opportunity opportunities position responsibilities responsible qualifications job business new also well like based related equivalent degree bachelor bachelors master masters field minimum other etc highly join looking customers customer world best part apply applicants benefits salary location remote hybrid office time full level senior junior closely partner partners make making drive driving deliver delivering high quality solutions solution products product technical technology technologies tools tool systems system data hiring familiarity production reliable modern stack design write writing maintain documentation tests performance tuning'.split(
    ' '
  )
);

const VERBS =
  'achieved accelerated architected automated built boosted cut created decreased delivered deployed designed developed directed drove engineered enhanced established expanded generated grew implemented improved increased introduced launched led managed migrated modernized negotiated optimized orchestrated owned partnered pioneered processed produced reduced refactored resolved revamped saved scaled shipped simplified spearheaded streamlined trained transformed analyzed coordinated maintained mentored integrated configured tested wrote authored researched'.split(
    ' '
  );

const WEAK = [
  'responsible for',
  'worked on',
  'helped with',
  'helped',
  'assisted with',
  'duties included',
  'tasked with',
  'involved in',
  'participated in',
];

const rxCache = {};

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const norm = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\u00a0/g, ' ');
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));

function rxFor(f) {
  return rxCache[f] || (rxCache[f] = new RegExp(`(?:^|[^a-z0-9])${esc(f)}(?![a-z0-9])`, 'g'));
}

function hasTerm(text, term) {
  return [term].concat(ALIAS[term] || []).some((f) => {
    const r = rxFor(f);
    r.lastIndex = 0;
    return r.test(text);
  });
}

function countTerm(text, term) {
  let n = 0;
  [term].concat(ALIAS[term] || []).forEach((f) => {
    const r = rxFor(f);
    r.lastIndex = 0;
    const m = text.match(r);
    n += m ? m.length : 0;
  });
  return n;
}

export function extractKeywords(jd, company) {
  const t = norm(jd);
  const hits = DICT.filter((k) => hasTerm(t, k));
  const skills = hits.filter((k) => !hits.some((o) => o !== k && o.includes(k) && o.length > k.length));
  const coWords = new Set(norm(company).split(/\W+/));
  const counts = {};
  (t.match(/[a-z][a-z0-9+#\-]{3,}/g) || []).forEach((w) => {
    w = w.replace(/-+$/, '');
    if (STOP.has(w) || GENERIC.has(w) || coWords.has(w)) return;
    if (skills.some((s) => s.includes(w))) return;
    counts[w] = (counts[w] || 0) + 1;
  });
  const freq = Object.entries(counts)
    .filter(([, c]) => c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([w]) => w);
  return skills
    .map((term) => ({ term, w: 2, type: 'Hard skill', jd: countTerm(t, term) }))
    .concat(freq.map((term) => ({ term, w: 1, type: 'Role term', jd: counts[term] })))
    .slice(0, 30);
}

export function bandOf(s) {
  return s >= 85
    ? [
        'Strong match',
        'good',
        "You're very likely to surface in recruiter searches for this role.",
      ]
    : s >= 70
      ? [
          'Competitive',
          'good',
          'Solid foundation. A few targeted fixes could move you to the top of the stack.',
        ]
      : s >= 50
        ? [
            'Needs work',
            'warn',
            'You may pass parsing but rank low when recruiters filter by keyword.',
          ]
        : [
            'Likely buried',
            'critical',
            "As written, this resume probably isn't showing up when recruiters search.",
          ];
}

export function analyze(resume, o) {
  const raw = resume || '';
  const text = norm(raw);
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const words = (raw.match(/[A-Za-z0-9][\w'+#.\-/]*/g) || []).length;
  const parseLow = words < 150;
  const SEC = {
    experience: /\b(experience|employment|work history|professional background)\b/i,
    education: /\b(education|academic)\b/i,
    skills: /\b(skills|competencies|tech stack|technologies|toolkit)\b/i,
    summary: /\b(summary|profile|objective|about me)\b/i,
    projects: /\bprojects?\b/i,
    certs: /\b(certifications?|licenses?|certificates?)\b/i,
  };
  const found = {};
  Object.keys(SEC).forEach((k) => {
    found[k] = lines.some((l) => l.length <= 48 && SEC[k].test(l))
      ? 1
      : SEC[k].test(raw)
        ? 0.5
        : 0;
  });
  const secScore =
    found.experience * 35 +
    found.education * 25 +
    found.skills * 25 +
    found.summary * 7.5 +
    Math.max(found.projects, found.certs) * 7.5;
  const email = (raw.match(/[\w.+-]+@[\w-]+\.[\w.-]+/) || [])[0] || '';
  const phone = (raw.match(/(\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/) || [])[0] || '';
  const linkedin = (raw.match(/linkedin\.com\/[\w\/-]+/i) || [])[0] || '';
  const site = (raw.match(/(github\.com\/[\w-]+|[\w-]+\.(?:dev|io|me)\b)/i) || [])[0] || '';
  const contactScore = (email ? 40 : 0) + (phone ? 30 : 0) + (linkedin ? 20 : 0) + (site ? 10 : 0);
  const startsVerb = (l) => VERBS.includes(norm(l).replace(/^[^a-z]+/, '').split(/\s+/)[0]);
  let bl = lines.filter((l) => l.length > 25 && (/^[•\-*▪●◦–·]/.test(l) || startsVerb(l)));
  if (bl.length < 3) bl = lines.filter((l) => l.length > 45);
  const isQuant = (b) =>
    /(\d+\s?%|\$\s?\d|\d+\s?(k|m|mm|x|tb|gb)\b|\b\d{2,}\b|\b\d+\+)/i.test(
      b.replace(/\b(19|20)\d{2}\b/g, '')
    );
  const bullets = bl.map((b) => {
    const t = b.replace(/^[•\-*▪●◦–·]\s*/, '');
    const w = WEAK.find((x) => norm(t).includes(x));
    return { text: t, num: isQuant(t), verb: startsVerb(t), weak: w || '' };
  });
  const quant = bullets.filter((b) => b.num).length;
  const verbStart = bullets.filter((b) => b.verb).length;
  const qRatio = bullets.length ? quant / bullets.length : 0;
  const vRatio = bullets.length ? verbStart / bullets.length : 0;
  const impactScore = bullets.length ? clamp((qRatio / 0.5) * 100) : 10;
  const weakHits = WEAK.filter((w) => text.includes(w));
  const pron = (text.match(/(^|\s)(i|me|my)\s/g) || []).length;
  const langScore = clamp(30 + (vRatio / 0.6) * 70 - weakHits.length * 8 - (pron > 3 ? 15 : 0));
  let lenScore =
    words >= 400 && words <= 850
      ? 100
      : (words >= 250 && words < 400) || (words > 850 && words <= 1100)
        ? 75
        : words < 250
          ? 40
          : 55;
  if (parseLow) lenScore = Math.min(lenScore, 20);
  let kwScore = 0;
  let kw = [];
  if (o.mode === 'match') {
    kw = extractKeywords(o.jd, o.company).map((k) => Object.assign(k, { has: hasTerm(text, k.term) }));
    const tot = kw.reduce((a, k) => a + k.w, 0);
    const got = kw.reduce((a, k) => a + (k.has ? k.w : 0), 0);
    kwScore = tot ? (got / tot) * 100 : 0;
  } else {
    let m = DICT.filter((k) => hasTerm(text, k));
    m = m.filter((k) => !m.some((x) => x !== k && x.includes(k)));
    kw = m.map((term) => ({ term, w: 2, type: 'Hard skill', jd: 0, has: true }));
    kwScore = clamp((m.length / 12) * 85 + (found.skills === 1 ? 15 : 0));
  }
  const matched = kw.filter((k) => k.has).map((k) => k.term);
  const missing = kw.filter((k) => !k.has).map((k) => k.term);
  const roleHit = o.role ? hasTerm(text, norm(o.role).trim()) : true;
  if (o.mode === 'match' && o.role && !roleHit) kwScore = Math.max(0, kwScore - 8);
  const W = o.mode === 'match' ? [0.4, 0.15, 0.15, 0.1, 0.1, 0.1] : [0.2, 0.2, 0.2, 0.15, 0.15, 0.1];
  const contactNote = parseLow
    ? `Only ${words} words could be read`
    : [email && 'Email', phone && 'Phone', linkedin && 'LinkedIn', site && 'Portfolio']
        .filter(Boolean)
        .join(' · ') || 'No contact details found';
  const cats = [
    {
      k: 'kw',
      label: o.mode === 'match' ? 'Keyword match' : 'Skills coverage',
      v: kwScore,
      note:
        o.mode === 'match'
          ? `${matched.length} of ${kw.length} job keywords found`
          : `${matched.length} recognized skills`,
      why: "Recruiters search by keyword. Missing terms mean you don't show up.",
    },
    {
      k: 'sec',
      label: 'Standard sections',
      v: secScore,
      note: `${['experience', 'education', 'skills'].filter((k) => found[k] === 1).length} of 3 core headings detected`,
      why: 'Parsers map content by heading. Non-standard labels can scramble fields.',
    },
    {
      k: 'imp',
      label: 'Measurable impact',
      v: impactScore,
      note: `${quant} of ${bullets.length} bullets include a number`,
      why: 'Numbers prove scope and results in the few seconds a human reads.',
    },
    {
      k: 'con',
      label: 'Contact & parsability',
      v: parseLow ? Math.min(contactScore, 30) : contactScore,
      note: contactNote,
      why: "If the ATS can't read your contact info, a recruiter can't reach you.",
    },
    {
      k: 'lang',
      label: 'Action language',
      v: langScore,
      note: `${verbStart} of ${bullets.length} bullets open with a strong verb`,
      why: 'Strong verbs read as ownership; passive phrasing reads as task lists.',
    },
    {
      k: 'len',
      label: 'Length & readability',
      v: lenScore,
      note: `${words} words · about ${Math.max(0.5, Math.round((words / 500) * 2) / 2)} page${words > 750 ? 's' : ''}`,
      why: 'One to two pages keeps key details visible in a fast skim.',
    },
  ];
  let score = Math.round(cats.reduce((a, c, i) => a + c.v * W[i], 0));
  if (parseLow) score = Math.min(score, 35);

  const fixes = [];
  if (parseLow) {
    fixes.push({
      s: 'critical',
      t: "Most of your file couldn't be read",
      d: `We extracted only ${words} words. Image-based PDFs, text boxes and multi-column templates often lose text in an ATS. Export a single-column, text-based version.`,
    });
  }
  if (o.mode === 'match' && missing.length) {
    fixes.push({
      s: 'critical',
      t: `Add missing job keywords (${missing.length})`,
      d: `Work these into your skills and experience where they're true: ${missing.slice(0, 5).join(', ')}${missing.length > 5 ? '…' : ''}.`,
    });
  }
  if (o.mode === 'match' && o.role && !roleHit) {
    fixes.push({
      s: 'critical',
      t: `Use the title "${o.role}" on your resume`,
      d: 'Recruiters often search by exact job title. Put it in your headline or summary if it matches your experience.',
    });
  }
  if (!email || !phone) {
    fixes.push({
      s: 'critical',
      t: 'Contact details missing or unreadable',
      d: 'Put your email and phone in the main body at the top, not in a page header, footer or image.',
    });
  }
  if (found.experience < 1) {
    fixes.push({
      s: 'critical',
      t: 'Add a clear "Experience" heading',
      d: 'Use a standard heading like "Experience" or "Work Experience" so the ATS maps your jobs correctly.',
    });
  }
  if (found.skills < 1) {
    fixes.push({
      s: 'warn',
      t: 'Add a "Skills" section',
      d: 'A dedicated skills list is the easiest place for an ATS and a recruiter to find your tools and stack.',
    });
  }
  if (found.education < 1) {
    fixes.push({
      s: 'warn',
      t: 'Add an "Education" heading',
      d: 'Degrees are a common filter, especially for new grads and visa-sponsored roles.',
    });
  }
  if (qRatio < 0.5 && bullets.length) {
    fixes.push({
      s: 'warn',
      t: 'Put numbers in more bullets',
      d: `Only ${quant} of ${bullets.length} bullets show a result. Add scale, %, $, time saved or users served.`,
    });
  }
  if (weakHits.length) {
    fixes.push({
      s: 'warn',
      t: 'Replace passive phrasing',
      d: `Swap "${weakHits[0]}" for an action verb such as built, led, reduced or shipped.`,
    });
  }
  if (vRatio < 0.6 && bullets.length > 2) {
    fixes.push({
      s: 'warn',
      t: 'Start bullets with action verbs',
      d: 'Open each bullet with what you did: Designed, Automated, Migrated, Scaled.',
    });
  }
  if (!linkedin) {
    fixes.push({
      s: 'warn',
      t: 'Add your LinkedIn URL',
      d: 'Recruiters cross-check profiles; a custom linkedin.com/in/ URL in your header helps.',
    });
  }
  if (found.summary < 1) {
    fixes.push({
      s: 'warn',
      t: 'Add a two-line summary',
      d: 'A short headline with your target title and core stack helps both the parser and the skim.',
    });
  }
  if (words > 1100) {
    fixes.push({
      s: 'warn',
      t: 'Trim to two pages',
      d: `At ${words} words, key details get buried. Cut older or less relevant roles.`,
    });
  }
  if (pron > 3) {
    fixes.push({
      s: 'warn',
      t: 'Drop first-person pronouns',
      d: 'Resumes read better without "I" and "my" in bullets.',
    });
  }
  if (o.mode === 'match' && kwScore >= 75) {
    fixes.push({
      s: 'good',
      t: 'Strong keyword alignment',
      d: `You match ${matched.length} of ${kw.length} terms from this job.`,
    });
  }
  if (qRatio >= 0.5) {
    fixes.push({
      s: 'good',
      t: 'Impact is quantified',
      d: 'Most of your bullets show measurable results.',
    });
  }
  if (email && phone && linkedin) {
    fixes.push({
      s: 'good',
      t: 'Contact details are clean',
      d: 'Email, phone and LinkedIn were all extracted.',
    });
  }

  const nameLine =
    lines.find(
      (l) =>
        l.length < 40 &&
        !/[@\d|]/.test(l) &&
        l.split(/\s+/).length <= 5 &&
        !Object.values(SEC).some((r) => r.test(l))
    ) || '';
  const TITLE_RX =
    /\b(engineer|developer|analyst|scientist|manager|intern|consultant|architect|administrator|specialist|associate|lead|designer|programmer|technician|coordinator)\b/i;
  const titles = [
    ...new Set(
      lines
        .filter(
          (l) => l.length < 90 && TITLE_RX.test(l) && !/^[•\-*▪●◦–·]/.test(l)
        )
        .map((l) => l.split(/[|,–—]| - /)[0].trim())
        .filter((l) => l.length < 50)
    ),
  ].slice(0, 3);
  const skillsFound = DICT.filter((k) => hasTerm(text, k));
  const parsed = {
    Name: nameLine,
    Email: email,
    Phone: phone,
    LinkedIn: linkedin,
    Titles: titles.join(' · '),
    Skills: skillsFound.slice(0, 14).join(', '),
  };

  return {
    score,
    cats,
    kw,
    matched,
    missing,
    fixes,
    parsed,
    found,
    bullets,
    words,
    lines,
  };
}

export function scanResume(resumeText, options) {
  return analyze(resumeText, options);
}
