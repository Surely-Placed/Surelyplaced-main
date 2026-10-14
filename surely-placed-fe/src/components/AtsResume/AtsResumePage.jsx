'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { scanAtsResume } from '@/lib/atsScan';
import { ATS_FAQ, ATS_INCLUDES, ATS_SOURCES } from '../../../mockData/AtsResume/content';
import AtsLoader from './AtsLoader';
import AtsScoreResult from './AtsScoreResult';
import { buildLoaderData } from './loaderUtils';
import { useAtsScrollEffects } from './useAtsScrollEffects';

function SpMark() {
  return (
    <svg aria-hidden="true" viewBox="150 85 585 715">
      <g transform="translate(155 90)">
        <path
          fill="#2857c4"
          d="M395.99 149.23C413.79 131.32 514.1 26.03 533.08 12.41c14.14-10.15 23.860-18.44 39.770-3.6 4.39 4.08 0 98.64-1.64 148.36-.61 18.63-8.14 36.34-21.1 49.74C437.76 322.89 325.16 437.84 209.58 550.77c-22.27 17.08-42.71 10.33-62.29-6.27-48.65-41.27-94.1-97.89-140.51-142.31-8.27-12.66-7.27-31.37.39-44.34 4.85-8.21 50.41-52.56 58.66-56.63 17.37-8.55 29.81-7.09 44.54 4.8 9.81 7.94 62.73 66.39 67.38 65.57 73.57-73.29 145.06-148.72 218.22-222.35z"
        />
      </g>
      <g transform="translate(395 388)">
        <path
          fill="#38bdb1"
          d="M306.39.35c12.02-2.47 22.85 9.19 24.78 20.99-1.3 164.23 11.24 147.51-36.93 199.8C239.77 280.25 178.46 334.49 123.74 393.950c-17.28 14.09-28.99 17.37-50.13 6.94-12.78-6.32-56.97-50.2-65.14-62.78-7.65-11.77-11.89-25.36-4.3-38.25C96.82 202.58 193.97 108.87 287.88 12.5 293.3 8.81 299.87 1.69 306.39.36z"
        />
      </g>
    </svg>
  );
}

export default function AtsResumePage({ className = '', fontVars = {} }) {
  useAtsScrollEffects();

  const [mode, setMode] = useState('match');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [jd, setJd] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [loaderOpen, setLoaderOpen] = useState(false);
  const [loaderData, setLoaderData] = useState(null);

  const [scanResult, setScanResult] = useState(null);
  const [scanMeta, setScanMeta] = useState(null);
  const [animateGauge, setAnimateGauge] = useState(false);
  const [sourcesOpen, setSourcesOpen] = useState(false);

  const apiResultRef = useRef(null);
  const loaderDoneRef = useRef(false);

  const tryShowResults = useCallback(() => {
    if (apiResultRef.current && loaderDoneRef.current) {
      setLoaderOpen(false);
      setScanResult(apiResultRef.current);
      setAnimateGauge(true);
      requestAnimationFrame(() => {
        document.getElementById('report')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }, []);

  const onLoaderFinish = useCallback(() => {
    loaderDoneRef.current = true;
    tryShowResults();
  }, [tryShowResults]);

  const skipLoader = useCallback(() => {
    loaderDoneRef.current = true;
    setLoaderOpen(false);
    tryShowResults();
  }, [tryShowResults]);

  const clearFile = () => {
    setFile(null);
    setFileName('');
    setResumeText('');
  };

  const onFileChange = (f) => {
    if (!f) return;
    setError('');
    if (f.size > 5 * 1024 * 1024) {
      setError('That file is over 5 MB. Export a smaller PDF or DOCX.');
      return;
    }
    setFile(f);
    setFileName(f.name);
    setResumeText('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const pasted = resumeText.trim();
    const hasPaste = pasteOpen && pasted.length >= 40;

    if (!file && !hasPaste && pasted.length < 40) {
      setError('Add your resume first: upload a file or paste the text.');
      return;
    }

    if (mode === 'match' && jd.trim().length < 150) {
      setError(
        'Paste the full job description (at least a few lines) so we can match keywords, or switch to General ATS check.'
      );
      return;
    }

    const meta = {
      mode,
      company: company.trim(),
      role: role.trim(),
      fileName: file ? fileName : hasPaste || pasted ? 'Pasted text' : fileName,
    };
    setScanMeta(meta);
    setScanResult(null);
    setAnimateGauge(false);
    apiResultRef.current = null;
    loaderDoneRef.current = false;

    const previewText = hasPaste ? pasted : pasted.length >= 40 ? pasted : '';
    setLoaderData(
      buildLoaderData({
        mode,
        jd: jd.trim(),
        resumeText: previewText,
        fileName: file?.name || fileName,
      })
    );
    setLoaderOpen(true);
    setSubmitting(true);

    try {
      const data = await scanAtsResume({
        file: file && !hasPaste ? file : null,
        resumeText: hasPaste ? pasted : pasted.length >= 40 ? pasted : undefined,
        mode,
        company: meta.company,
        role: meta.role,
        jd: jd.trim(),
      });
      apiResultRef.current = data;
      window.dispatchEvent(
        new CustomEvent('sp:ats_scan', {
          detail: { score: data.score, mode, role: meta.role, company: meta.company },
        })
      );
      tryShowResults();
    } catch (err) {
      setLoaderOpen(false);
      loaderDoneRef.current = false;
      setError(err.message || 'Something went wrong. Try again or paste your resume text.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`ats-page ${className}`.trim()} style={fontVars}>
      <header className="top">
        <div className="wrap">
          <Link className="brand" href="/" aria-label="Surely Placed home">
            <SpMark />
            <b>
              Surely
              <br />
              Placed
            </b>
          </Link>
          <nav className="nav" aria-label="Page">
            <a className="nl" href="#why">
              Why ATS matters
            </a>
            <a className="nl" href="#revamp">
              Resume revamp
            </a>
            <a className="nl" href="#faq">
              FAQ
            </a>
            <a className="btn btn-primary btn-sm" href="#checker">
              Check my resume
            </a>
          </nav>
        </div>
      </header>

      <main id="main">
        <section className="hero" aria-labelledby="h1">
          <i className="blob b1" />
          <i className="blob b2" />
          <div className="wrap">
            <div className="hero-copy">
              <h1 id="h1">
                <span className="h1-kicker anim-rise">
                  <i className="live" />
                  Free ATS resume checker
                </span>
                <span className="h1-main" id="h1-main">
                  See what the bot sees <span className="acc">before</span> a recruiter does.
                </span>
              </h1>
              <p className="lede anim-rise d3">
                Most rejections happen before a human opens your resume. Upload it, add the job you want,
                and get an instant ATS score weighted the way recruiter keyword search works.
              </p>
              <ul className="hooks">
                <li className="anim-rise d3">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="11" fill="#E2F5F3" />
                    <path
                      d="m7 12.5 3 3 7-7"
                      stroke="#137168"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>
                    <strong>Scored against your target job,</strong> not a generic template. Every company
                    and role screens for different words.
                  </span>
                </li>
                <li className="anim-rise d4">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="11" fill="#E2F5F3" />
                    <path
                      d="m7 12.5 3 3 7-7"
                      stroke="#137168"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>
                    <strong>Six weighted checks</strong> — keyword match, sections, impact, contact
                    parsability, action language and length — rolled into one score out of 100.
                  </span>
                </li>
                <li className="anim-rise d5">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="12" cy="12" r="11" fill="#E2F5F3" />
                    <path
                      d="m7 12.5 3 3 7-7"
                      stroke="#137168"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span>
                    <strong>Free and instant</strong> — no sign-up to see your score. Know where you stand
                    before your next application.
                  </span>
                </li>
              </ul>
              <div className="trust anim-rise d5">
                <span>
                  <i className="dot" />
                  No sign-up to see your score
                </span>
                <span>
                  <i className="dot" />
                  PDF, DOCX or TXT
                </span>
                <span>
                  <i className="dot" />
                  Processed securely, not stored
                </span>
              </div>
            </div>

            <form className="checker anim-rise d2" id="checker" noValidate onSubmit={handleSubmit}>
              <i className="beam" aria-hidden="true" />
              <div className="ck-head">
                <h2 id="ck-title">Score my resume</h2>
                <span className="badge">Free · 60 sec</span>
              </div>
              <div className="step-label">
                <i>1</i>Your resume
              </div>
              {!fileName ? (
                <label id="drop-zone" className="drop" htmlFor="resume-file">
                  <input
                    type="file"
                    id="resume-file"
                    accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                    onChange={(ev) => onFileChange(ev.target.files?.[0])}
                  />
                  <span className="ico" aria-hidden="true">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2857C4" strokeWidth="2">
                      <path d="M12 16V4M7 9l5-5 5 5" />
                      <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
                    </svg>
                  </span>
                  <strong>Drop your resume or tap to upload</strong>
                  <small>PDF, DOCX or TXT · up to 5 MB</small>
                </label>
              ) : (
                <div className="file-chip">
                  <span>{fileName}</span>
                  <button type="button" className="linkbtn" onClick={clearFile}>
                    Change
                  </button>
                </div>
              )}
              {pasteOpen && (
                <div className="field" id="paste-wrap">
                  <label htmlFor="resume-text">Resume text</label>
                  <textarea
                    id="resume-text"
                    placeholder="Paste the full text of your resume"
                    value={resumeText}
                    onChange={(ev) => setResumeText(ev.target.value)}
                  />
                </div>
              )}
              <button
                type="button"
                className="linkbtn"
                style={{ alignSelf: 'flex-start' }}
                onClick={() => setPasteOpen((v) => !v)}
              >
                {pasteOpen ? 'Hide pasted text' : 'Paste text instead'}
              </button>

              <div className="step-label">
                <i>2</i>What are you applying for?
              </div>
              <div className="seg" role="group" aria-label="Scan type">
                <button
                  type="button"
                  aria-pressed={mode === 'match'}
                  onClick={() => setMode('match')}
                >
                  Match a job
                  <small>Recommended</small>
                </button>
                <button
                  type="button"
                  aria-pressed={mode === 'general'}
                  onClick={() => setMode('general')}
                >
                  General ATS check
                  <small>No job yet</small>
                </button>
              </div>
              <div className="grid2">
                <div className="field">
                  <label htmlFor="target-company">Company</label>
                  <input
                    id="target-company"
                    autoComplete="organization"
                    placeholder="e.g. Amazon"
                    value={company}
                    onChange={(ev) => setCompany(ev.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="target-role">Target role</label>
                  <input
                    id="target-role"
                    placeholder="e.g. Data Engineer"
                    value={role}
                    onChange={(ev) => setRole(ev.target.value)}
                  />
                </div>
              </div>
              {mode === 'match' && (
                <div className="field" id="jd-wrap">
                  <label htmlFor="jd-text">Job description</label>
                  <textarea
                    id="jd-text"
                    placeholder="Paste the full job description. We pull the skills, tools and terms the recruiter will search for."
                    value={jd}
                    onChange={(ev) => setJd(ev.target.value)}
                  />
                  <span className="hint">
                    Every company and role screens for different keywords. The JD is how we know which ones.
                  </span>
                </div>
              )}
              {error ? (
                <div className="err" role="alert">
                  {error}
                </div>
              ) : null}
              <button type="submit" className="btn btn-primary run" disabled={submitting}>
                {submitting ? 'Scanning…' : scanResult ? 'Scan again' : 'Get my ATS score'}
              </button>
              <p className="privacy">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="4" y="11" width="16" height="10" rx="2" />
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" />
                </svg>
                Your file is processed on our server to calculate your score. It is not stored or shared.
              </p>
            </form>
          </div>
        </section>

        {scanResult && scanMeta ? (
          <AtsScoreResult result={scanResult} scanMeta={scanMeta} animate={animateGauge} />
        ) : null}

        <section className="block" id="includes" aria-labelledby="inc-title" style={{ paddingTop: 20 }}>
          <div className="wrap">
            <div className="sec-head pre-able">
              <span className="eyebrow">What your score reflects</span>
              <h2 id="inc-title">Six checks recruiters&apos; software runs on you.</h2>
              <p className="lede">
                Your ATS score combines these signals — the same categories applicant tracking systems and
                recruiters lean on when they parse and search your resume.
              </p>
            </div>
            <div className="includes">
              {ATS_INCLUDES.map((item) => (
                <div key={item.title} className="inc pre-able">
                  <span className="ico2" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2857C4" strokeWidth="2">
                      <path d="m5 12 4 4 10-10" />
                    </svg>
                  </span>
                  <h3>{item.title}</h3>
                  <p>{item.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="block" id="why" aria-labelledby="why-title" style={{ background: 'var(--surface)', borderBlock: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sec-head pre-able">
              <span className="eyebrow">Why your applications go quiet</span>
              <h2 id="why-title">Qualified isn&apos;t the same as findable.</h2>
              <p className="lede">
                An applicant tracking system rarely &quot;rejects&quot; you outright. It stores and ranks your resume,
                and recruiters search it by keyword. If the words they type aren&apos;t on your page, you never come up.
              </p>
            </div>
            <div className="stats">
              {[
                ['97.4', '1', '%', 'of Fortune 500 companies run a detectable applicant tracking system.'],
                ['99.7', '1', '%', 'of recruiters surveyed use keyword filters inside their ATS to find and sort candidates.'],
                ['88', '0', '%', 'of employers agree qualified high-skill candidates get vetted out for not matching the exact job criteria.'],
                ['7.4', '1', 's', 'average time a recruiter spends on a resume\'s first screen once it reaches a human.'],
              ].map(([n, dec, suf, text]) => (
                <div key={n} className="stat pre-able">
                  <span className="big">
                    <span className="cnt" data-to={n} data-dec={dec}>
                      {n}
                    </span>
                    <small>{suf}</small>
                  </span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
            <div className="funnel-wrap pre-able">
              <div style={{ display: 'grid', gap: 12 }}>
                <span className="eyebrow">The math of one job post</span>
                <h3 style={{ fontSize: 'clamp(22px,3vw,30px)' }}>250 applicants. About 5 interviews. Be one of the five.</h3>
                <p style={{ color: 'var(--ink-2)', fontSize: 15 }}>
                  A typical corporate opening draws around 250 resumes. Four to six people get interviewed, and one gets the offer.
                </p>
              </div>
              <div className="funnel" id="funnel" role="img" aria-label="Funnel: 250 resumes, about 5 interviews, 1 offer">
                <div className="f-row">
                  <span className="n">250</span>
                  <div className="b" data-w="100%" style={{ background: 'var(--blue)' }}>
                    resumes submitted
                  </div>
                </div>
                <div className="f-row">
                  <span className="n">4–6</span>
                  <div className="b" data-w="34%" style={{ minWidth: 0, background: 'var(--teal)' }}>
                    interviewed
                  </div>
                </div>
                <div className="f-row">
                  <span className="n">1</span>
                  <div className="b" data-w="16%" style={{ background: 'var(--ink)' }}>
                    offer
                  </div>
                </div>
              </div>
            </div>
            <div className="src-row">
              <button type="button" className="src-btn" onClick={() => setSourcesOpen(true)}>
                Sources for these numbers
              </button>
            </div>
          </div>
        </section>

        <section className="block" aria-labelledby="myth-title">
          <div className="wrap">
            <div className="sec-head pre-able">
              <span className="eyebrow">ATS, explained straight</span>
              <h2 id="myth-title">Three things most resume advice gets wrong.</h2>
            </div>
            <div className="myth">
              {[
                ['It ranks and filters. It rarely deletes.', 'Most ATS platforms parse your resume into fields and store it. Recruiters then search and filter.'],
                ['Every job post is its own keyword list.', 'Matching the job description is what moves you up the ranking.'],
                ['Simple layouts parse; clever ones break.', 'A clean, single-column file with standard headings keeps every keyword readable.'],
              ].map(([title, body], idx) => (
                <article key={title} className="pre-able">
                  <span className="m">
                    <s>Myth</s> · {['auto-deletes 75%', 'one great resume works everywhere', 'fancy templates stand out'][idx]}
                  </span>
                  <h3>{title}</h3>
                  <p>{body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="block" aria-labelledby="role-title" style={{ paddingTop: 0 }}>
          <div className="wrap compare">
            <div style={{ display: 'grid', gap: 16 }} className="pre-able">
              <span className="eyebrow">Why we ask for the company and JD</span>
              <h2 id="role-title">Same resume. Three jobs. Three different scores.</h2>
              <p className="lede">
                Recruiters build their searches from the job description, and each company writes theirs differently.
              </p>
              <a className="btn btn-primary" href="#checker" style={{ justifySelf: 'start' }}>
                Match my resume to a job
              </a>
            </div>
            <div className="jd-stack" aria-label="Illustrative example">
              <div className="jd pre-able">
                <span className="co">Enterprise bank</span>
                <span className="role">Data Engineer</span>
                <span className="pct cnt" data-to="82" data-dec="0" style={{ color: 'var(--good)' }}>
                  82
                </span>
                <div className="kws">
                  <span className="on">SQL</span>
                  <span className="on">Python</span>
                  <span className="on">Airflow</span>
                  <span>Data governance</span>
                  <span className="on">ETL</span>
                </div>
              </div>
              <div className="jd pre-able">
                <span className="co">Series B startup</span>
                <span className="role">Data Engineer</span>
                <span className="pct cnt" data-to="61" data-dec="0" style={{ color: 'var(--warn)' }}>
                  61
                </span>
                <div className="kws">
                  <span className="on">Python</span>
                  <span>dbt</span>
                  <span>Snowflake</span>
                  <span className="on">SQL</span>
                  <span>Terraform</span>
                </div>
              </div>
              <div className="jd pre-able">
                <span className="co">Big Tech</span>
                <span className="role">Data Engineer II</span>
                <span className="pct cnt" data-to="47" data-dec="0" style={{ color: 'var(--crit)' }}>
                  47
                </span>
                <div className="kws">
                  <span>Spark</span>
                  <span>Scala</span>
                  <span className="on">SQL</span>
                  <span>Distributed systems</span>
                  <span>Kafka</span>
                </div>
              </div>
              <span className="illus">Illustrative example. Scores depend on the full resume and JD.</span>
            </div>
          </div>
        </section>

        <section className="block" aria-labelledby="proof-title" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="proof pre-able">
              <div>
                <span className="eyebrow">What a rebuild changes</span>
                <h2 id="proof-title">Stop applying into a black hole.</h2>
                <p>We rebuild your resume around the roles you&apos;re actually targeting.</p>
              </div>
              <div className="proof-nums">
                <div className="pn">
                  <div className="big">
                    <span className="cnt" data-to="60" data-dec="0">
                      60
                    </span>
                    %
                  </div>
                  <p>higher resume acceptance rate for candidates on a Surely Placed–rebuilt resume.</p>
                </div>
                <div className="pn">
                  <div className="big">
                    <span className="cnt" data-to="56" data-dec="0">
                      56
                    </span>
                    %
                  </div>
                  <p>of our enrollments come through a referral from someone we&apos;ve already worked with.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="block" id="revamp" aria-labelledby="revamp-title" style={{ background: 'var(--surface)', borderBlock: '1px solid var(--line)' }}>
          <div className="wrap">
            <div className="sec-head pre-able">
              <span className="eyebrow">Expert review &amp; full revamp</span>
              <h2 id="revamp-title">Your score is the diagnosis. The revamp is the fix.</h2>
              <p className="lede">
                When you want a person on it, a Surely Placed resume expert reviews or rebuilds your resume until it&apos;s ATS-ready.
              </p>
            </div>
            <div className="offer pre-able">
              <p>Want hands-on help after your score? Talk to our team about a resume revamp.</p>
              {/* TODO: dedicated ATS lead capture — enrollment flow requires full apply wizard fields */}
              <Link className="btn btn-primary" href="/apply">
                Book my resume revamp
              </Link>
            </div>
          </div>
        </section>

        <section className="block" id="faq" aria-labelledby="faq-title">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow">Questions</span>
              <h2 id="faq-title">ATS resume checker FAQ</h2>
            </div>
            <div className="faq">
              {ATS_FAQ.map((item, i) => (
                <details key={item.question} open={i === 0}>
                  <summary>{item.question}</summary>
                  <div className="a">
                    <p>{item.answer}</p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="block" aria-labelledby="final-title" style={{ paddingTop: 0 }}>
          <div className="wrap pre-able" style={{ textAlign: 'center', display: 'grid', gap: 18, justifyItems: 'center' }}>
            <h2 id="final-title" style={{ maxWidth: '20ch' }}>
              Your next application deserves to be seen.
            </h2>
            <p className="lede">Sixty seconds to find out what the bot sees. Free, no sign-up.</p>
            <a className="btn btn-primary" href="#checker">
              Check my ATS score
            </a>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <Link className="brand" href="/">
            <SpMark />
            <b>
              Surely
              <br />
              Placed
            </b>
          </Link>
          <div style={{ display: 'grid', gap: 2 }}>
            <span>contact@surelyplaced.com</span>
            <span>+91 97777 71281</span>
            <span>www.surelyplaced.com</span>
          </div>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <button type="button" className="src-btn" onClick={() => setSourcesOpen(true)}>
              Sources
            </button>
            <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>© 2026 Surely Placed</span>
          </div>
        </div>
      </footer>

      <div className={`mbar ${scanResult ? '' : ''}`.trim()} id="mbar">
        <a className="btn btn-primary" href="#checker">
          Get my free ATS score
        </a>
      </div>

      <AtsLoader open={loaderOpen} loaderData={loaderData} onFinish={onLoaderFinish} onSkip={skipLoader} />

      {sourcesOpen ? (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="src-title" onClick={() => setSourcesOpen(false)}>
          <div className="sheet" onClick={(ev) => ev.stopPropagation()}>
            <div className="sheet-h">
              <div>
                <span className="eyebrow">Research</span>
                <h3 id="src-title">Sources</h3>
              </div>
              <button type="button" className="x" aria-label="Close" onClick={() => setSourcesOpen(false)}>
                ×
              </button>
            </div>
            <div className="sheet-b">
              <ol className="src-list">
                {ATS_SOURCES.map((s) => (
                  <li key={s.what}>
                    <span className="what">{s.what}</span>
                    {s.href ? (
                      <a href={s.href} target="_blank" rel="noopener noreferrer">
                        {s.label}
                      </a>
                    ) : (
                      <span style={{ fontWeight: 700, fontSize: 14.5 }}>{s.label}</span>
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
