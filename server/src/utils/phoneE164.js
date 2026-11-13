const E164_PATTERN = /^\+[1-9]\d{7,14}$/;

export function normalizeToE164(raw) {
  const trimmed = String(raw || '').trim();
  if (!trimmed) {
    return { error: 'Mobile number is required' };
  }

  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 8 || digits.length > 15) {
    return { error: 'Please enter a valid international phone number with country code' };
  }

  const e164 = `+${digits}`;
  if (!E164_PATTERN.test(e164)) {
    return { error: 'Please enter a valid international phone number with country code' };
  }

  return { e164 };
}

export function isValidE164(value) {
  return E164_PATTERN.test(String(value || '').trim());
}
