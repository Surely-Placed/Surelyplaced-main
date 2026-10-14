'use client';

import { useEffect, useRef, useState } from 'react';
import { submitAtsLead } from '@/lib/atsScan';

const VISA_OPTIONS = [
  'F-1 (job searching)',
  'OPT',
  'STEM OPT',
  'Day-1 CPT',
  'H-1B',
  'H-4 EAD',
  'US citizen / green card',
  'Other',
];

export default function AtsLeadModal({
  open,
  pick,
  scanId,
  leadContext,
  onClose,
  onUnlocked,
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [visa, setVisa] = useState('');
  const [expertReview, setExpertReview] = useState(false);
  const [fullRevamp, setFullRevamp] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [okMsg, setOkMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const lastFocus = useRef(null);

  useEffect(() => {
    if (!open) return;
    lastFocus.current = document.activeElement;
    setError('');
    setOkMsg('');
    setExpertReview(pick === 'review');
    setFullRevamp(pick === 'revamp');
    const t = setTimeout(() => {
      document.getElementById('lead-name')?.focus();
    }, 40);
    return () => clearTimeout(t);
  }, [open, pick]);

  const title = pick === 'revamp' ? 'Book my resume revamp' : 'Get my full review';

  const handleClose = () => {
    document.body.style.overflow = '';
    onClose?.();
    lastFocus.current?.focus?.();
  };

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setOkMsg('');
    if (!name.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Add your name and a valid email so we can send your report.');
      return;
    }
    if (!consent) {
      setError('Tick the consent box so we can contact you.');
      return;
    }
    const addons = [];
    if (expertReview) addons.push('expert_review');
    if (fullRevamp) addons.push('full_revamp');

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      visa,
      addons,
      consent: true,
      scanId,
      ats_score: leadContext?.score,
      target_role: leadContext?.role,
      target_company: leadContext?.company,
      mode: leadContext?.mode,
      missing_keywords: leadContext?.missing,
      file_name: leadContext?.fileName,
      source: 'resume-ats',
    };

    setSubmitting(true);
    try {
      const fullReport = await submitAtsLead(payload);
      window.dispatchEvent(new CustomEvent('sp:lead', { detail: payload }));
      const addonNote =
        addons.length > 0
          ? ' Our team will follow up with pricing for the service you selected.'
          : '';
      setOkMsg(`Your full report is unlocked.${addonNote}`);
      setTimeout(() => {
        handleClose();
        onUnlocked?.(fullReport);
        document.getElementById('r-kw')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 1400);
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-title"
      onClick={handleClose}
    >
      <div className="sheet" onClick={(ev) => ev.stopPropagation()}>
        <div className="sheet-h">
          <div>
            <span className="eyebrow">Full report</span>
            <h3 id="lead-title">{title}</h3>
          </div>
          <button type="button" className="x" aria-label="Close" onClick={handleClose}>
            ×
          </button>
        </div>
        <form className="sheet-b" noValidate onSubmit={handleSubmit}>
          <div className="incl">
            <b>Free with your email</b>
            <span>✓ Every missing keyword, ranked by priority</span>
            <span>✓ Bullet-by-bullet impact audit with rewrite tips</span>
            <span>✓ Your complete, step-by-step action plan</span>
          </div>
          <div className="addon" role="group" aria-label="Add a resume expert">
            <p style={{ fontWeight: 700, fontSize: 14 }}>Want a person on it too?</p>
            <label>
              <input
                type="checkbox"
                name="addon"
                value="expert_review"
                checked={expertReview}
                onChange={(ev) => setExpertReview(ev.target.checked)}
              />
              <span>
                <b>Expert human review</b>
                <small>
                  A Surely Placed resume expert reviews your resume line by line for this role and sends a
                  written fix list.
                </small>
              </span>
            </label>
            <label>
              <input
                type="checkbox"
                name="addon"
                value="full_revamp"
                checked={fullRevamp}
                onChange={(ev) => setFullRevamp(ev.target.checked)}
              />
              <span>
                <b>Full resume revamp</b>
                <small>Rebuilt with an expert until it&apos;s ATS-ready for your target roles.</small>
              </span>
            </label>
            <p className="hint">Our team shares pricing before anything is charged.</p>
          </div>
          <div className="grid2">
            <div className="field">
              <label htmlFor="lead-name">Full name</label>
              <input id="lead-name" autoComplete="name" value={name} onChange={(ev) => setName(ev.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="lead-email">Email</label>
              <input
                id="lead-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
              />
            </div>
          </div>
          <div className="grid2">
            <div className="field">
              <label htmlFor="lead-phone">WhatsApp / phone</label>
              <input
                id="lead-phone"
                type="tel"
                autoComplete="tel"
                placeholder="+1 or +91"
                value={phone}
                onChange={(ev) => setPhone(ev.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="lead-visa">Current status</label>
              <select id="lead-visa" value={visa} onChange={(ev) => setVisa(ev.target.value)}>
                <option value="">Select</option>
                {VISA_OPTIONS.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <label className="consent">
            <input type="checkbox" checked={consent} onChange={(ev) => setConsent(ev.target.checked)} />
            <span>I agree that Surely Placed can contact me about my report and any service I selected.</span>
          </label>
          {error ? (
            <div className="err" role="alert">
              {error}
            </div>
          ) : null}
          <button className="btn btn-primary run" type="submit" disabled={submitting}>
            {submitting ? 'Unlocking…' : 'Unlock my full report'}
          </button>
          {okMsg ? (
            <div className="ok" role="status">
              {okMsg}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
