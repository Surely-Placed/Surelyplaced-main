'use client';

import Link from 'next/link';
import { Box, Checkbox, FormControlLabel, Typography } from '@mui/material';
import {
  SMS_CALL_CONFIRMATION_NOTE,
  SMS_CONSENT_LABEL_BEFORE_LINKS,
} from '@/constants/smsConsent';

export default function SmsConsentCheckbox({ checked, onChange, id = 'sms-consent' }) {
  return (
    <Box sx={{ mt: 1 }}>
      <FormControlLabel
        sx={{ alignItems: 'flex-start', mx: 0 }}
        control={
          <Checkbox
            id={id}
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            sx={{ pt: 0.25 }}
          />
        }
        label={
          <Typography component="span" variant="caption" sx={{ fontSize: '0.6875rem', lineHeight: 1.45 }}>
            {SMS_CONSENT_LABEL_BEFORE_LINKS}
            <Link href="/privacy-policy" style={{ textDecoration: 'underline' }}>
              Privacy Policy
            </Link>
            {' and '}
            <Link href="/terms-and-conditions#sms" style={{ textDecoration: 'underline' }}>
              SMS Terms
            </Link>
            .
          </Typography>
        }
      />
      <Typography
        variant="caption"
        sx={{
          display: 'block',
          mt: 0.75,
          fontSize: '0.6875rem',
          lineHeight: 1.4,
          color: 'text.subText',
          pl: 4.25,
        }}
      >
        {SMS_CALL_CONFIRMATION_NOTE}
      </Typography>
    </Box>
  );
}
