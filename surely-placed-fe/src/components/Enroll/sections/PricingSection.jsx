'use client';

import { Box, Button, Stack, Typography } from '@mui/material';
import { bodySx, headingSx, primaryCtaSx, sectionSx } from '../../Webinar/styles';
import { AnimatedSection } from '../../Webinar/ui/AnimatedSection';

export function PricingSection({ onScrollToForm }) {
  return (
    <AnimatedSection sx={sectionSx}>
      <Typography variant="overline" color="primary.main" fontWeight={600} display="block" mb={1}>
        Plans start at $349
      </Typography>
      <Typography component="h2" sx={{ ...headingSx, mb: 1.5 }}>
        Pay a one-time upfront fee. Pay the big fee only when you&apos;re placed.
      </Typography>
      <Typography sx={{ ...bodySx, color: 'text.subText', mb: 4, maxWidth: 820 }}>
        Every plan follows the same promise: a single upfront fee to fund real work — daily
        applications, prep, and marketing — and a success fee due only once you land the offer. No
        placement, no big bill.
      </Typography>
      <Box
        sx={{
          p: { xs: 3, md: 4 },
          borderRadius: '1rem',
          border: '2px solid',
          borderColor: 'primary.main',
          bgcolor: '#F8FAFF',
          maxWidth: 560,
        }}
      >
        <Typography variant="subtitle1" color="text.subText" mb={1}>
          See which plan fits me
        </Typography>
        <Typography variant="overline" color="text.subText">
          Starting from
        </Typography>
        <Typography
          variant="h3"
          fontFamily="var(--font-avantgarde), sans-serif"
          fontWeight={600}
          color="primary.main"
          mb={0.5}
        >
          $349 upfront
        </Typography>
        <Typography sx={{ ...bodySx, color: 'text.subText', mb: 3 }}>
          + success fee, due only on placement
        </Typography>
        <Button variant="filled" onClick={onScrollToForm} sx={primaryCtaSx}>
          Get my free review
        </Button>
      </Box>
    </AnimatedSection>
  );
}

export function ClosingCtaSection({ onScrollToForm }) {
  return (
    <AnimatedSection sx={{ px: { xs: 2, sm: 3, md: 4 }, pb: { xs: 4, md: 8 } }}>
      <Box
        sx={{
          maxWidth: 1200,
          mx: 'auto',
          p: { xs: '3rem 2rem', sm: '4rem 3rem', md: '5rem 4rem' },
          borderRadius: { xs: '1rem', md: '1.5rem' },
          overflow: 'hidden',
          textAlign: 'center',
          backgroundImage: "url('/HomePage/Container.webp')",
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <Typography
          component="h2"
          fontFamily="var(--font-avantgarde), sans-serif"
          fontSize={{ xs: '1.5rem', sm: '2rem', md: '2.5rem' }}
          fontWeight={600}
          color="extremes.light"
          mb={1.5}
          maxWidth={720}
          mx="auto"
        >
          Stop applying alone. Start today.
        </Typography>
        <Typography color="text.light" sx={{ ...bodySx, maxWidth: 640, mx: 'auto', mb: 3 }}>
          Your free profile review takes 15 minutes and tells you exactly where you stand — no
          pressure, no obligation.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button variant="filled" onClick={onScrollToForm} sx={primaryCtaSx}>
            Get My Free Profile Review
          </Button>
        </Stack>
      </Box>
    </AnimatedSection>
  );
}
