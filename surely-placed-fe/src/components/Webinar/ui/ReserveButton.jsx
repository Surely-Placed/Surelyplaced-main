'use client';

import { Button } from '@mui/material';
import { primaryCtaSx } from '../styles';

export function ReserveButton({ webinarActive, priceLabel, onClick, fullWidth = false }) {
  return (
    <Button
      variant="filled"
      disableElevation
      onClick={onClick}
      sx={{ ...primaryCtaSx, width: fullWidth ? '100%' : 'auto' }}
    >
      {webinarActive ? 'Reserve My Seat' : 'Notify Me When Seats Open'}
    </Button>
  );
}
