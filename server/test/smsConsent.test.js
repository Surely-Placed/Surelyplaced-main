import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeToE164 } from '../src/utils/phoneE164.js';
import { parseExplicitSmsConsent } from '../src/services/smsConsentConstants.js';

test('normalizeToE164 accepts international numbers', () => {
  const result = normalizeToE164('+1 (917) 555-0774');
  assert.equal(result.e164, '+19175550774');
});

test('normalizeToE164 rejects short numbers', () => {
  const result = normalizeToE164('+123');
  assert.ok(result.error);
});

test('parseExplicitSmsConsent only treats explicit affirmative values as true', () => {
  assert.equal(parseExplicitSmsConsent(true), true);
  assert.equal(parseExplicitSmsConsent('true'), true);
  assert.equal(parseExplicitSmsConsent(false), false);
  assert.equal(parseExplicitSmsConsent(undefined), false);
  assert.equal(parseExplicitSmsConsent('false'), false);
});
