'use client';

import Link from 'next/link';
import { SMS_CALL_CONFIRMATION_NOTE, SMS_CONSENT_LABEL_BEFORE_LINKS } from '@/constants/smsConsent';

export default function SmsConsentCheckboxPlain({ checked, onChange, id = 'sms-consent' }) {
  return (
    <div className="sms-consent-block">
      <label className="consent sms-consent" htmlFor={id}>
        <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span style={{ fontSize: '12.5px', lineHeight: 1.45 }}>
          {SMS_CONSENT_LABEL_BEFORE_LINKS}
          <Link href="/privacy-policy">Privacy Policy</Link>
          {' and '}
          <Link href="/terms-and-conditions#sms">SMS Terms</Link>.
        </span>
      </label>
      <p className="hint" style={{ marginTop: 8, marginLeft: 28, fontSize: '12px' }}>
        {SMS_CALL_CONFIRMATION_NOTE}
      </p>
    </div>
  );
}
