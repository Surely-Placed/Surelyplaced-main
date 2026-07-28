'use client';

import { Box, Typography } from '@mui/material';
import CustomDivider from '@/common/CustomDivider';
import { WEBINAR_YOUTUBE_EMBED_URL } from '../../../../mockData/Webinar';
import { bodySx, headingSx, sectionSx } from '../styles';
import { AnimatedSection } from '../ui/AnimatedSection';

export function YoutubeSection() {
  return (
    <AnimatedSection sx={{ ...sectionSx, bgcolor: 'extremes.light' }}>
      <CustomDivider text="2-Minute Preview" />
      <Typography component="h2" sx={{ ...headingSx, mt: 2, mb: 2 }}>
        Watch this before your next application
      </Typography>
      <Typography color="text.subText" sx={{ ...bodySx, mb: 3, maxWidth: 720 }}>
        Quick roadmap from the webinar — plays right here on the page.
      </Typography>

      <Box
        sx={{
          maxWidth: { xs: 340, sm: 380 },
          width: '100%',
          mx: 'auto',
          borderRadius: '1rem',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'customBlue.light',
          boxShadow: '0 10px 30px rgba(19, 58, 126, 0.18)',
        }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '9 / 16',
            bgcolor: '#000',
            overflow: 'hidden',
          }}
        >
          <Box
            component="iframe"
            src={`${WEBINAR_YOUTUBE_EMBED_URL}&fs=0&iv_load_policy=3`}
            title="Webinar preview video"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            sx={{
              position: 'absolute',
              // Crop YouTube’s title/channel header (not removable via embed params)
              top: '-14%',
              left: 0,
              width: '100%',
              height: '128%',
              border: 0,
            }}
          />
        </Box>
      </Box>
    </AnimatedSection>
  );
}
