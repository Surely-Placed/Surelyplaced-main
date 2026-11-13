export const SMS_DISCLOSURE_VERSION = 'sms_v1';

export function parseExplicitSmsConsent(value) {
  return value === true || value === 'true';
}

export const SMS_EVENT_TYPES = {
  OPT_IN: 'SMS_OPT_IN',
  OPT_OUT: 'SMS_OPT_OUT',
  CALL_CONFIRMATION: 'CALL_CONFIRMATION',
  CALL_CONFIRMATION_DECLINED: 'CALL_CONFIRMATION_DECLINED',
  CONSENT_UPDATED: 'CONSENT_UPDATED',
};
