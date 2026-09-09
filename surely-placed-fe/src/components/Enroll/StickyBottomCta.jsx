'use client';

import { Box, Button } from '@mui/material';
import { primaryCtaSx } from '../Webinar/styles';
import { useStickyCtaVisibility } from './hooks/useStickyCtaVisibility';

export function StickyBottomCta({ heroRef, ctaRef, onScrollToForm }) {
  const visible = useStickyCtaVisibility(heroRef, ctaRef);

  return (
    <Box
      component="aside"
      aria-label="Quick action"
      aria-hidden={!visible}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 10,
        bgcolor: 'extremes.light',
        borderTop: '1px solid',
        borderColor: 'customBlue.light',
        boxShadow: visible ? '0 -4px 20px rgba(0, 0, 0, 0.08)' : 'none',
        minHeight: { xs: 56, md: 60 },
        maxHeight: { xs: 64, md: 72 },
        py: { xs: 1, md: 1.25 },
        px: { xs: 2, sm: 3 },
        pb: 'calc(12px + env(safe-area-inset-bottom, 0px))',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: visible ? 'translateY(0)' : 'translateY(100%)',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'transform 200ms ease, opacity 200ms ease, box-shadow 200ms ease',
      }}
    >
      <Button
        variant="filled"
        onClick={onScrollToForm}
        sx={{
          ...primaryCtaSx,
          width: { xs: '100%', sm: 'auto' },
          maxWidth: { xs: '100%', sm: 420 },
          py: { xs: 1.125, md: 1.25 },
          minHeight: 44,
        }}
      >
        Book a Call
      </Button>
    </Box>
  );
}
