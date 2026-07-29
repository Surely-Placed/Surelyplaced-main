'use client';

import {
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import {
  WEBINAR_COUNTRY_OPTIONS,
  WEBINAR_EXP_OPTIONS,
  WEBINAR_STATUS_OPTIONS,
  WEBINAR_VISA_OPTIONS,
} from '../../../../mockData/Webinar';
import { primaryCtaSx } from '../styles';

export function validateRegistration(form) {
  if (!form.fullName.trim()) return 'Please enter your full name.';
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
    return 'Please enter a valid email address.';
  }
  const phone = String(form.phone || '').trim();
  if (!phone) return 'Please enter your phone number with country code (e.g. +1 555 000 0000).';
  // Require country code (+…) so the sheet always gets an international number
  if (!/^\+\d[\d\s\-()]{6,}$/.test(phone)) {
    return 'Phone must include country code, starting with + (e.g. +1 555 000 0000).';
  }
  if (!form.country) return 'Please select your country.';
  if (!form.status) return 'Please select your current status.';
  if (!form.visa) return 'Please select your visa status.';
  if (!form.exp) return 'Please select your years of experience.';
  return '';
}

export function RegistrationDialog({
  open,
  onClose,
  form,
  onFieldChange,
  formError,
  datetimeLabel,
  submitting,
  onSubmit,
}) {
  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="sm" disableScrollLock>
      <DialogContent sx={{ p: { xs: 2.5, md: 4 } }}>
        <Stack spacing={2}>
          <Typography component="h2" variant="h5" fontFamily={'var(--font-avantgarde), sans-serif'}>
            Register for the webinar
          </Typography>
          <Typography variant="body2" color="text.subText">
            Live webinar · {datetimeLabel} · Free
          </Typography>

          <TextField
            fullWidth
            required
            label="Full name"
            value={form.fullName}
            onChange={onFieldChange('fullName')}
          />
          <TextField
            fullWidth
            required
            label="Email"
            type="email"
            value={form.email}
            onChange={onFieldChange('email')}
          />
          <TextField
            fullWidth
            required
            label="Phone (with country code)"
            value={form.phone}
            onChange={onFieldChange('phone')}
            placeholder="+1 555 000 0000"
            helperText="Include country code, e.g. +1 or +91"
          />
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                required
                label="Country"
                value={form.country}
                onChange={onFieldChange('country')}
              >
                {WEBINAR_COUNTRY_OPTIONS.map((o) => (
                  <MenuItem key={o} value={o}>
                    {o}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                required
                label="Current status"
                value={form.status}
                onChange={onFieldChange('status')}
              >
                {WEBINAR_STATUS_OPTIONS.map((o) => (
                  <MenuItem key={o} value={o}>
                    {o}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                required
                label="Visa status"
                value={form.visa}
                onChange={onFieldChange('visa')}
              >
                {WEBINAR_VISA_OPTIONS.map((o) => (
                  <MenuItem key={o} value={o}>
                    {o}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                select
                fullWidth
                required
                label="Years of experience"
                value={form.exp}
                onChange={onFieldChange('exp')}
              >
                {WEBINAR_EXP_OPTIONS.map((o) => (
                  <MenuItem key={o} value={o}>
                    {o}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
          {formError && (
            <Typography variant="body2" color="error">
              {formError}
            </Typography>
          )}
          <Button
            variant="filled"
            fullWidth
            disabled={submitting}
            onClick={onSubmit}
            sx={primaryCtaSx}
          >
            {submitting ? (
              <CircularProgress size={24} sx={{ color: 'extremes.light' }} />
            ) : (
              'Reserve My Seat'
            )}
          </Button>

          <Typography variant="caption" color="text.subText" textAlign="center">
            Instant confirmation email · Limited seats
          </Typography>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}
