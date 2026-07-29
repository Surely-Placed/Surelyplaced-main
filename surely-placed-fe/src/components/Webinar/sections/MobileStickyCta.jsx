'use client';

import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import { primaryCtaSx } from '../styles';

export function MobileStickyCta({
  webinarActive,
  datetimeLabel,
  seatsLeft,
  priceLabel,
  onReserve,
}) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) return null;

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        bgcolor: 'extremes.light',
        borderTop: '1px solid',
        borderColor: 'customBlue.light',
        p: '12px 16px calc(12px + env(safe-area-inset-bottom))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
      }}
    >
      <Box>
        <Typography variant="subtitle2" fontWeight={600}>
          {webinarActive ? datetimeLabel : 'Stay tuned · webinar TBD'}
        </Typography>
        {webinarActive && (
          <Typography variant="caption" color="secondary.main">
            {seatsLeft} seats left
          </Typography>
        )}
      </Box>
      <Button variant="filled" onClick={onReserve} sx={primaryCtaSx}>
        {webinarActive ? 'Reserve My Seat' : 'Notify Me'}
      </Button>
    </Box>
  );
}
