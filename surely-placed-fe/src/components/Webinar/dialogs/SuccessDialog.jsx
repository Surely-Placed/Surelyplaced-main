'use client';

import { Box, Button, Dialog, DialogContent, Typography } from '@mui/material';
import { primaryCtaSx } from '../styles';

export function SuccessDialog({ open, onClose, email, datetimeLabel }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogContent sx={{ p: { xs: 3, md: 4 }, textAlign: 'center' }}>
        <Typography
          component="h2"
          variant="h5"
          fontFamily={'var(--font-avantgarde), sans-serif'}
          mb={1}
        >
          You&apos;re in. Congratulations!
        </Typography>
        <Typography variant="body1" color="text.subText" mb={2}>
          You&apos;re registered. A confirmation email with your one-device Zoom access link is on its way
          to{' '}
          <Typography component="span" fontWeight={600} color="text">
            {email || 'your email'}
          </Typography>
          .
        </Typography>
        <Box
          sx={{
            bgcolor: 'customBlue.secondary',
            borderRadius: '1rem',
            p: 2.5,
            textAlign: 'left',
            mb: 2,
          }}
        >
          {[
            'Webinar access · ' + datetimeLabel,
            'One-device Zoom access link (check your email)',
            'Opening the link on a second device is blocked',
            'Software Career Playbook (instant download)',
          ].map((item) => (
            <Typography key={item} variant="body2" color="text.subText" mb={0.75}>
              ✓ {item}
            </Typography>
          ))}
        </Box>
        <Button variant="filled" onClick={onClose} sx={primaryCtaSx}>
          Back to the Page
        </Button>
      </DialogContent>
    </Dialog>
  );
}
