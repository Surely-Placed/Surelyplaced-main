export const SMS_DISCLOSURE_VERSION = 'sms_v1';

export const SMS_CALL_CONFIRMATION_NOTE =
  'Our team will also confirm your SMS permission during a call before texting you.';

export const SMS_CONSENT_LABEL_BEFORE_LINKS =
  'I agree to receive SMS from Surely Placed about requested program information, related follow-ups and payment options. Message frequency varies: up to one proactive follow-up daily, with additional messages during active conversations. Message and data rates may apply. Reply STOP to unsubscribe or HELP for assistance. Consent is optional and is not a condition of purchase. See our ';

export const SMS_CONSENT_LABEL =
  `${SMS_CONSENT_LABEL_BEFORE_LINKS}Privacy Policy and SMS Terms.`;

export function buildSmsConsentPayload(checked, source) {
  return {
    sms_consent: Boolean(checked),
    sms_consent_source: source,
    sms_consent_disclosure_version: SMS_DISCLOSURE_VERSION,
  };
}
