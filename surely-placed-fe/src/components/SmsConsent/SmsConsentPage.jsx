'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SmsConsentCheckbox from '@/components/common/SmsConsentCheckbox';
import { buildSmsConsentPayload, SMS_DISCLOSURE_VERSION } from '@/constants/smsConsent';
import { submitSmsConsent } from '@/lib/payments';

export default function SmsConsentPage() {
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [smsConsent, setSmsConsent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!mobileNumber.trim()) {
      setError('Please enter your mobile number including country code.');
      return;
    }
    if (!smsConsent) {
      setError('Please select the SMS consent checkbox to save an opt-in preference.');
      return;
    }

    setLoading(true);
    try {
      await submitSmsConsent({
        full_name: fullName.trim(),
        mobile_number: mobileNumber.trim(),
        sms_consent: true,
        consent_source: '/sms-consent',
        disclosure_version: SMS_DISCLOSURE_VERSION,
      });
      setSuccess(true);
      setFullName('');
      setMobileNumber('');
      setSmsConsent(false);
    } catch (err) {
      setError(err.message || 'Could not save your SMS preference. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ pt: { xs: 12, md: 14 }, pb: 8 }}>
      <Container maxWidth="sm">
        <Typography component="h1" variant="h4" sx={{ mb: 1, fontFamily: 'var(--font-avantgarde), sans-serif' }}>
          SMS Consent
        </Typography>
        <Typography variant="body2" color="text.subText" sx={{ mb: 3 }}>
          Update how Surely Placed may text you about program information, follow-ups, and payment options.
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            p: { xs: 2, md: 3 },
            borderRadius: 3,
            bgcolor: 'extremes.light',
            boxShadow: '0px 6px 24px rgba(0,0,0,0.06)',
          }}
        >
          <Stack spacing={2.25}>
            <TextField
              label="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              fullWidth
            />
            <TextField
              label="Mobile Number (with country code)"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="+1 917 555 0774"
              required
              fullWidth
            />
            <SmsConsentCheckbox checked={smsConsent} onChange={setSmsConsent} id="standalone-sms-consent" />
            {error ? (
              <Typography variant="body2" color="error">
                {error}
              </Typography>
            ) : null}
            {success ? (
              <Typography variant="body2" color="success.main" role="status">
                Your SMS preference was saved successfully.
              </Typography>
            ) : null}
            <Button type="submit" variant="filled" fullWidth disabled={loading} sx={{ height: 48 }}>
              {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Save SMS Preference'}
            </Button>
          </Stack>
        </Box>

        <Stack direction="row" spacing={2} sx={{ mt: 3 }} flexWrap="wrap">
          <Link href="/privacy-policy">Privacy Policy</Link>
          <Link href="/terms-and-conditions#sms">SMS Terms</Link>
        </Stack>
      </Container>
    </Box>
  );
}
