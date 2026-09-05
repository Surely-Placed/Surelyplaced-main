'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { ExpandIcon } from '../../../../public/images';
import { ENROLL_FAQS } from '../../../../mockData/Enroll';
import { bodySx, headingSx, sectionSx } from '../../Webinar/styles';
import { AnimatedSection } from '../../Webinar/ui/AnimatedSection';

export function FaqSection() {
  const theme = useTheme();
  const isTabScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [faqOpen, setFaqOpen] = useState(0);

  return (
    <AnimatedSection sx={{ ...sectionSx, bgcolor: '#F8FAFF' }}>
      <Typography variant="overline" color="primary.main" fontWeight={600} display="block" mb={1}>
        Before you ask
      </Typography>
      <Typography component="h2" sx={{ ...headingSx, mb: 3 }}>
        Straight answers, no sales pitch.
      </Typography>
      {ENROLL_FAQS.map((faq, i) => (
        <Accordion
          key={faq.q}
          elevation={0}
          expanded={faqOpen === i}
          onChange={() => setFaqOpen(faqOpen === i ? -1 : i)}
          sx={{ borderBottom: '1px solid #E4E4E4', '&:before': { display: 'none' }, bgcolor: 'transparent' }}
        >
          <AccordionSummary expandIcon={<ExpandIcon size={isTabScreen ? 24 : 32} />}>
            <Typography component="h3" variant="subtitle1" fontWeight={500}>
              {faq.q}
            </Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography sx={{ ...bodySx, color: 'text.subText' }}>
              {faq.a}
            </Typography>
          </AccordionDetails>
        </Accordion>
      ))}
    </AnimatedSection>
  );
}
