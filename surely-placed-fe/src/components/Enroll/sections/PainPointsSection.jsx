'use client';

import { Box, Grid, Typography } from '@mui/material';
import { ENROLL_PAIN_POINTS } from '../../../../mockData/Enroll';
import { bodySx, headingSx, sectionSx } from '../../Webinar/styles';
import { AnimatedItem, AnimatedSection } from '../../Webinar/ui/AnimatedSection';

export function PainPointsSection() {
  return (
    <AnimatedSection sx={{ ...sectionSx, bgcolor: '#F8FAFF' }}>
      <Typography variant="overline" color="primary.main" fontWeight={600} display="block" mb={1}>
        Sound familiar?
      </Typography>
      <Typography component="h2" sx={{ ...headingSx, mb: 1.5 }}>
        The international job search isn&apos;t broken because of you.
      </Typography>
      <Typography sx={{ ...bodySx, color: 'text.subText', mb: 4, maxWidth: 820 }}>
        It&apos;s broken because you&apos;re doing a full-time job — searching, applying, prepping
        — completely alone, on a clock most employers don&apos;t even think about.
      </Typography>
      <Grid container spacing={2.5}>
        {ENROLL_PAIN_POINTS.map((point, index) => (
          <Grid key={point.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <AnimatedItem delay={index * 0.08} sx={{ height: '100%' }}>
              <Box
                sx={{
                  p: 2.5,
                  height: '100%',
                  borderRadius: '0.75rem',
                  border: '1px solid #E4E4E4',
                  bgcolor: 'extremes.light',
                }}
              >
                <Typography fontSize="1.75rem" mb={1}>
                  {point.icon}
                </Typography>
                <Typography
                  component="h3"
                  fontSize={{ xs: '1.0625rem', sm: '1.125rem' }}
                  fontWeight={700}
                  lineHeight={1.35}
                  mb={1}
                >
                  {point.title}
                </Typography>
                <Typography sx={{ ...bodySx, color: 'text.subText' }}>
                  {point.description}
                </Typography>
              </Box>
            </AnimatedItem>
          </Grid>
        ))}
      </Grid>
    </AnimatedSection>
  );
}
