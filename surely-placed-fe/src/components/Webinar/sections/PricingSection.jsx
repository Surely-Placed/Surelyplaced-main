'use client';

import { Box, Typography } from '@mui/material';
import { headingSx, sectionSx } from '../styles';
import { AnimatedSection } from '../ui/AnimatedSection';
import { ReserveButton } from '../ui/ReserveButton';

const PRICING_ITEMS = [
  ['Live webinar + recording + Q&A', '$99'],
  ['Software Career Playbook: resume, ATS template, LinkedIn & GitHub', '$39'],
  ['30/60/90-day roadmap + application tracker', '$29'],
  ['Curated resource library: DSA, system design, AI', '$49'],
];

export function PricingSection({
  webinarActive,
  priceLabel,
  seatsLeft,
  seatsTotal,
  onReserve,
}) {
  return (
    <AnimatedSection sx={{ ...sectionSx, bgcolor: 'extremes.light' }}>
      <Typography component="h2" sx={{ ...headingSx, mb: 3 }}>
        Everything you need to land more interviews.
      </Typography>
      <Box
        sx={{
          maxWidth: 600,
          mx: 'auto',
          p: { xs: 2.5, md: 4 },
          borderRadius: '1.25rem',
          border: '2px solid',
          borderColor: 'primary.main',
          bgcolor: 'extremes.light',
        }}
      >
        {PRICING_ITEMS.map(([item, val]) => (
          <Box key={item} display="flex" justifyContent="space-between" gap={2} mb={1.5}>
            <Typography variant="body2" color="text">
              ✓ {item}
            </Typography>
            <Typography variant="body2" color="text.subText">
              {val}
            </Typography>
          </Box>
        ))}
        <Box
          display="flex"
          alignItems="baseline"
          justifyContent="center"
          gap={2}
          flexWrap="wrap"
          borderTop="1px solid"
          borderColor="customBlue.light"
          pt={2.5}
          mt={2}
          mb={2.5}
          textAlign="center"
        >
          <Typography variant="body1" color="text.subText">
            Total value
          </Typography>
          <Typography sx={{ textDecoration: 'line-through', color: 'text.subText' }}>$216</Typography>
          <Typography
            fontFamily={'var(--font-avantgarde), sans-serif'}
            fontSize="2.75rem"
            fontWeight={700}
            color="primary.main"
          >
            Free
          </Typography>
        </Box>
        <ReserveButton
          webinarActive={webinarActive}
          priceLabel={priceLabel}
          onClick={onReserve}
          fullWidth
        />
        <Typography
          variant="caption"
          color="text.subText"
          display="block"
          textAlign="center"
          mt={1.5}
        >
          Instant email confirmation · Only {seatsLeft} of {seatsTotal} seats left
        </Typography>
      </Box>
    </AnimatedSection>
  );
}
