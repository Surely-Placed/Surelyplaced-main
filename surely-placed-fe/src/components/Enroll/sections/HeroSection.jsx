'use client';

import { Box, Button, Grid, Stack, Typography } from '@mui/material';
import { bodySx, headingSx, primaryCtaSx, sectionSx } from '../../Webinar/styles';
import { AnimatedSection } from '../../Webinar/ui/AnimatedSection';
import { EnrollmentForm } from '../EnrollmentForm';

const HERO_BULLETS = [
  '850+ international candidates placed, across every major visa status',
  'A dedicated team applying, marketing your profile, and prepping you daily',
  'Free profile review — a real advisor calls you within 24 hours',
];

export function HeroSection({ onScrollToForm, sectionRef }) {
  return (
    <Box
      ref={sectionRef}
      sx={{ bgcolor: 'extremes.light', pt: { xs: '6rem', lg: '6.5rem' } }}
    >
    <AnimatedSection sx={sectionSx}>
      <Grid container spacing={4} alignItems="center">
        <Grid size={{ xs: 12, lg: 6 }}>
          <Typography
            variant="overline"
            color="primary.main"
            fontWeight={600}
            letterSpacing="0.08em"
            display="block"
            mb={1.5}
          >
            Built for OPT · STEM OPT · CPT · H-1B · H-4 EAD candidates
          </Typography>
          <Typography
            component="h1"
            sx={{
              ...headingSx,
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.25rem' },
              mb: 2,
            }}
          >
            Your OPT clock is ticking. Your offer letter doesn&apos;t have to wait.
          </Typography>
          <Typography sx={{ ...bodySx, color: 'text.subText', mb: 2.5 }}>
            Surely Placed runs your entire US job search — resume, LinkedIn, daily applications,
            interview prep — so you stop drowning in rejections and start getting callbacks.
          </Typography>
          <Stack spacing={1.25} mb={3}>
            {HERO_BULLETS.map((bullet) => (
              <Typography key={bullet} sx={{ ...bodySx, color: 'text.dark' }}>
                • {bullet}
              </Typography>
            ))}
          </Stack>
          <Typography variant="subtitle2" color="text.subText" display="block" mb={2}>
            PRAM
          </Typography>
          <Typography sx={{ ...bodySx, color: 'text.subText' }} fontWeight={500}>
            Trusted by international students across 40+ universities
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <EnrollmentForm id="enrollment-form" />
        </Grid>
      </Grid>
      <Box textAlign="center" mt={4} sx={{ display: { xs: 'block', lg: 'none' } }}>
        <Button variant="filled" onClick={onScrollToForm} sx={primaryCtaSx}>
          Book a Call
        </Button>
      </Box>
    </AnimatedSection>
    </Box>
  );
}
