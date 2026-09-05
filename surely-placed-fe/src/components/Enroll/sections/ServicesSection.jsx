'use client';

import { Box, Grid, Typography } from '@mui/material';
import { ENROLL_SERVICES } from '../../../../mockData/Enroll';
import { bodySx, headingSx, sectionSx } from '../../Webinar/styles';
import { AnimatedItem, AnimatedSection } from '../../Webinar/ui/AnimatedSection';

export function ServicesSection() {
  return (
    <AnimatedSection sx={sectionSx}>
      <Typography variant="overline" color="primary.main" fontWeight={600} display="block" mb={1}>
        What you get
      </Typography>
      <Typography component="h2" sx={{ ...headingSx, mb: 1.5 }}>
        One team running every part of the search.
      </Typography>
      <Typography sx={{ ...bodySx, color: 'text.subText', mb: 4, maxWidth: 820 }}>
        Not a resume template. Not a course. A done-for-you engine that applies, prepares, and
        markets you until you&apos;re placed.
      </Typography>
      <Grid container spacing={2.5}>
        {ENROLL_SERVICES.map((service, index) => (
          <Grid key={service.title} size={{ xs: 12, sm: 6, md: 4 }}>
            <AnimatedItem delay={index * 0.08} sx={{ height: '100%' }}>
              <Box
                sx={{
                  p: 2.5,
                  height: '100%',
                  borderRadius: '0.75rem',
                  border: '1px solid #91E4DD',
                  bgcolor: 'customGreen.main',
                }}
              >
                <Typography fontSize="1.75rem" mb={1}>
                  {service.icon}
                </Typography>
                <Typography component="h3" variant="subtitle1" fontWeight={600} mb={1}>
                  {service.title}
                </Typography>
                <Typography sx={{ ...bodySx, color: 'text.dark' }}>
                  {service.description}
                </Typography>
              </Box>
            </AnimatedItem>
          </Grid>
        ))}
      </Grid>
    </AnimatedSection>
  );
}
