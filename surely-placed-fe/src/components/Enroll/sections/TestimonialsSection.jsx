'use client';

import { Box, Typography } from '@mui/material';
import { ENROLL_TESTIMONIALS } from '../../../../mockData/Enroll';
import { bodySx, headingSx, sectionSx } from '../../Webinar/styles';
import { AnimatedItem, AnimatedSection } from '../../Webinar/ui/AnimatedSection';

export function TestimonialsSection() {
  return (
    <AnimatedSection sx={{ ...sectionSx, bgcolor: 'extremes.light' }}>
      <Typography variant="overline" color="primary.main" fontWeight={600} display="block" mb={1}>
        Results
      </Typography>
      <Typography component="h2" sx={{ ...headingSx, mb: 3 }}>
        Candidates who stopped applying alone.
      </Typography>
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          WebkitOverflowScrolling: 'touch',
          pb: 1,
          mx: { xs: -2, sm: -3, md: -4 },
          px: { xs: 2, sm: 3, md: 4 },
          '&::-webkit-scrollbar': { display: 'none' },
          scrollbarWidth: 'none',
        }}
      >
        {ENROLL_TESTIMONIALS.map((t, index) => (
          <AnimatedItem
            key={t.name}
            delay={index * 0.12}
            sx={{
              flex: '0 0 auto',
              width: { xs: '85vw', sm: 320, md: 360 },
              maxWidth: 360,
              scrollSnapAlign: 'start',
            }}
          >
            <Box
              sx={{
                p: 2.5,
                height: '100%',
                minHeight: 220,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '0.5rem',
                border: '1px solid #91E4DD',
                bgcolor: 'customGreen.main',
              }}
            >
              <Typography sx={{ ...bodySx, color: 'text.dark', mb: 2 }}>
                &ldquo;{t.quote}&rdquo;
              </Typography>
              <Box display="flex" alignItems="center" gap={1.5} sx={{ mt: 'auto', pt: 2 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    bgcolor: t.tone === 'blue' ? 'customBlue.secondary' : 'customGreen.background',
                    color: t.tone === 'blue' ? 'primary.main' : 'secondary.main',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  {t.initials}
                </Box>
                <Box>
                  <Typography variant="subtitle2" color="text.dark">
                    {t.name}
                  </Typography>
                  <Typography variant="subtitle1" color="text.dark">
                    {t.role}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </AnimatedItem>
        ))}
      </Box>
      <Typography variant="subtitle2" color="text.subText" display="block" mt={2.5}>
        Illustrative candidate outcomes based on typical engagements. Names abbreviated for privacy
        — replace with verified candidate quotes before publishing.
      </Typography>
    </AnimatedSection>
  );
}
