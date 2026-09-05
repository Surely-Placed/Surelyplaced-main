'use client';

import { Box, Grid, Typography } from '@mui/material';
import { ENROLL_STEPS } from '../../../../mockData/Enroll';
import { bodySx, headingSx, sectionSx } from '../../Webinar/styles';
import { AnimatedItem, AnimatedSection } from '../../Webinar/ui/AnimatedSection';

export function HowItWorksSection() {
  return (
    <AnimatedSection sx={{ ...sectionSx, bgcolor: '#F8FAFF' }}>
      <Typography variant="overline" color="primary.main" fontWeight={600} display="block" mb={1}>
        How it works
      </Typography>
      <Typography component="h2" sx={{ ...headingSx, mb: 1.5 }}>
        Four steps from &quot;stuck&quot; to &quot;starting.&quot;
      </Typography>
      <Typography sx={{ ...bodySx, color: 'text.subText', mb: 4, maxWidth: 820 }}>
        No long onboarding maze. You talk to a real advisor within a day of filling the form above.
      </Typography>
      <Grid container spacing={2.5}>
        {ENROLL_STEPS.map((step, index) => (
          <Grid key={step.step} size={{ xs: 12, sm: 6, md: 3 }}>
            <AnimatedItem delay={index * 0.1} sx={{ height: '100%' }}>
              <Box
                sx={{
                  p: 2.5,
                  height: '100%',
                  borderRadius: '0.75rem',
                  border: '1px solid #E4E4E4',
                  bgcolor: 'extremes.light',
                }}
              >
                <Typography
                  variant="h4"
                  fontFamily="var(--font-avantgarde), sans-serif"
                  color="primary.main"
                  fontWeight={600}
                  mb={1.5}
                >
                  {step.step}
                </Typography>
                <Typography component="h3" variant="subtitle1" fontWeight={600} mb={1}>
                  {step.title}
                </Typography>
                <Typography sx={{ ...bodySx, color: 'text.subText' }}>
                  {step.description}
                </Typography>
              </Box>
            </AnimatedItem>
          </Grid>
        ))}
      </Grid>
    </AnimatedSection>
  );
}
