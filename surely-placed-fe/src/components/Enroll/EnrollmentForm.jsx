'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  EMPTY_ENROLL_FORM,
  ENROLL_HERO_STATS,
  ENROLL_MONTHS_OPTIONS,
  ENROLL_SUCCESS_STATS,
  ENROLL_VISA_OPTIONS,
} from '../../../mockData/Enroll';
import { submitEnrollmentRequest } from '@/lib/payments';
import { bodySx, primaryCtaSx } from '../Webinar/styles';

function validateForm(form) {
  const errors = {};

  if (!form.full_name.trim()) {
    errors.full_name = 'Please enter your full name.';
  }

  if (!form.email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!form.whatsapp.trim()) {
    errors.whatsapp = 'Please enter your WhatsApp or phone number.';
  }

  if (!form.visa_status) {
    errors.visa_status = 'Please select your visa status.';
  }

  if (!form.months_of_authorization_left) {
    errors.months_of_authorization_left = 'Please select your authorization runway.';
  }

  return errors;
}

function StatsRow({ stats }) {
  const colSize = stats.length === 4 ? { xs: 6, sm: 3 } : { xs: 4 };

  return (
    <Grid container spacing={2} sx={{ mt: 2 }}>
      {stats.map((stat) => (
        <Grid key={stat.label} size={colSize}>
          <Box textAlign="center">
            <Typography
              variant="h5"
              fontFamily="var(--font-avantgarde), sans-serif"
              fontWeight={600}
              color="primary.main"
            >
              {stat.value}
            </Typography>
            <Typography variant="subtitle2" color="text.subText">
              {stat.label}
            </Typography>
          </Box>
        </Grid>
      ))}
    </Grid>
  );
}

export function EnrollmentForm({ id = 'enrollment-form', compact = false }) {
  const [form, setForm] = useState(EMPTY_ENROLL_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const setField = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setFieldErrors((prev) => ({ ...prev, [key]: undefined }));
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const clientErrors = validateForm(form);
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      return;
    }

    setLoading(true);
    setFormError('');
    setFieldErrors({});

    try {
      await submitEnrollmentRequest(form);
      setSuccess(true);
    } catch (error) {
      const message = error.message || 'Something went wrong. Please try again.';
      if (error.details && typeof error.details === 'object') {
        setFieldErrors(error.details);
      }
      setFormError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        id={id}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: '1rem',
          border: '1px solid #E4E4E4',
          bgcolor: 'extremes.light',
        }}
      >
        <Typography
          component="h3"
          variant="h5"
          fontFamily="var(--font-avantgarde), sans-serif"
          fontWeight={600}
          mb={1.5}
        >
          You&apos;re on the list.
        </Typography>
        <Typography sx={{ ...bodySx, color: 'text.subText' }} mb={2.5}>
          A Surely Placed advisor will reach out within 24 hours on WhatsApp or phone with your
          free profile review. Keep your phone close.
        </Typography>
        <StatsRow stats={ENROLL_SUCCESS_STATS} />
      </Box>
    );
  }

  return (
    <Box
      id={id}
      component="form"
      onSubmit={handleSubmit}
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: '1rem',
        border: '1px solid #E4E4E4',
        bgcolor: 'extremes.light',
      }}
    >
      <Typography
        component="h3"
        variant={compact ? 'h6' : 'h5'}
        fontFamily="var(--font-avantgarde), sans-serif"
        fontWeight={600}
        mb={0.5}
      >
        Get your free profile review
      </Typography>
      <Typography sx={{ ...bodySx, color: 'text.subText' }} mb={2}>
        Tell us where you stand — a real person reviews it and calls you within 24 hours. No
        obligation.
      </Typography>

      <Stack spacing={2}>
        <TextField
          fullWidth
          required
          label="Full name"
          name="full_name"
          value={form.full_name}
          onChange={setField('full_name')}
          error={Boolean(fieldErrors.full_name)}
          helperText={fieldErrors.full_name}
        />
        <TextField
          fullWidth
          required
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={setField('email')}
          error={Boolean(fieldErrors.email)}
          helperText={fieldErrors.email}
        />
        <TextField
          fullWidth
          required
          label="WhatsApp / Phone"
          name="whatsapp"
          value={form.whatsapp}
          onChange={setField('whatsapp')}
          error={Boolean(fieldErrors.whatsapp)}
          helperText={fieldErrors.whatsapp}
        />
        <TextField
          select
          fullWidth
          required
          label="Current visa / student status"
          name="visa_status"
          value={form.visa_status}
          onChange={setField('visa_status')}
          error={Boolean(fieldErrors.visa_status)}
          helperText={fieldErrors.visa_status}
        >
          {ENROLL_VISA_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          fullWidth
          required
          label="Months of work-authorization runway left"
          name="months_of_authorization_left"
          value={form.months_of_authorization_left}
          onChange={setField('months_of_authorization_left')}
          error={Boolean(fieldErrors.months_of_authorization_left)}
          helperText={fieldErrors.months_of_authorization_left}
        >
          {ENROLL_MONTHS_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>

        {formError && !Object.values(fieldErrors).some(Boolean) && (
          <Typography sx={{ ...bodySx, color: 'error.main' }}>
            {formError}
          </Typography>
        )}

        <Button type="submit" variant="filled" fullWidth disabled={loading} sx={primaryCtaSx}>
          {loading ? (
            <CircularProgress size={24} sx={{ color: 'extremes.light' }} />
          ) : (
            'Book a Call'
          )}
        </Button>

        <Typography variant="subtitle2" color="text.subText" textAlign="center">
          Takes about 45 seconds. No spam — just a real review of your job search.
        </Typography>
      </Stack>

      <StatsRow stats={ENROLL_HERO_STATS} />
      <Typography
        variant="caption"
        color="text.subText"
        display="block"
        textAlign="center"
        mt={1}
        sx={{ fontSize: '0.6875rem', lineHeight: 1.4 }}
      >
        T&amp;C apply.
      </Typography>
    </Box>
  );
}
