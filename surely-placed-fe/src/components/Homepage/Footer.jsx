import { Box, Divider, Grid, Typography } from '@mui/material';
import React from 'react';
import { WebLogo } from '../../../public/images';
import { navLinks } from '../../../mockData/navbar';
import Link from 'next/link';
import { contactInfo } from '../../../mockData/Profile';
import { footerInfo } from '../../../mockData/footer';
import { SOCIAL_LINKS, SUPPORT_EMAIL } from '@/config/site';
import ContactPhones from '@/components/common/ContactPhones';
import dayjs from 'dayjs';

const footerSocialLinks = [
  { label: 'LinkedIn', href: SOCIAL_LINKS.linkedin },
  { label: 'Instagram', href: SOCIAL_LINKS.instagram },
];

const Footer = () => {
  return (
    <Box component="footer" role="contentinfo" px={{ xs: '2rem', md: '6rem' }}>
      <Grid
        container
        justifyContent={'space-between'}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        mb={4}
        flexDirection={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 3, md: 0 }}
      >
        <Grid size={{ xs: 12, sm: 6 }}>
          <WebLogo />
          <Typography
            fontSize={{ xs: '0.875rem', md: '1rem' }}
            fontWeight={400}
            color="customGray"
            mt={2}
          >
            A career transformation platform combining mentorship, applications, and analytics for
            measurable outcomes.
          </Typography>
          <Box display="flex" gap={2} mt={2} flexWrap="wrap" alignItems="center">
            <ContactPhones className="link-styles touch-target" />
            <Link href={`mailto:${SUPPORT_EMAIL}`} className="link-styles touch-target">
              <Typography variant="body2" color="text.subText">
                {SUPPORT_EMAIL}
              </Typography>
            </Link>
            {footerSocialLinks.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="link-styles touch-target"
                aria-label={`Follow Surely Placed on ${item.label}`}
              >
                <Typography variant="body2" color="primary.main">
                  {item.label}
                </Typography>
              </Link>
            ))}
          </Box>
        </Grid>
        <Grid
          size={{ xs: 12, sm: 5 }}
          display={'flex'}
          justifyContent={{ xs: 'space-between', md: 'flex-end' }}
          flexWrap={{ xs: 'wrap', md: 'nowrap' }}
          gap={2}
        >
          {navLinks.map((item, i) => (
            <Link key={i} href={item.link} style={{ textDecoration: 'none' }} className="touch-target">
              <Typography
                fontSize={{ xs: '0.875rem', md: '1rem' }}
                fontWeight={400}
                color="text.contrastText"
              >
                {item.text}
              </Typography>
            </Link>
          ))}
        </Grid>
      </Grid>
      <Box
        display={'flex'}
        flexDirection={{ xs: 'column', md: 'row' }}
        alignItems={{ xs: 'flex-start', md: 'center' }}
        gap={{ xs: 1, sm: 3 }}
        mt={0.5}
        mb={2}
      >
        {footerInfo.map((item, i) => (
          <Box key={i} display={'flex'} gap={3} alignItems={'center'}>
            <Box display={'flex'} gap={1} alignItems={'center'}>
              {item.icon}
              <Typography variant="body1" color="text.subText" mt={0.5}>
                {item.text}
              </Typography>
            </Box>
            <Typography
              variant="body1"
              color="text.subText"
              display={{ xs: 'none', sm: i !== contactInfo.length - 1 ? 'inline' : 'none' }}
              mt={0.5}
            >
              |
            </Typography>
          </Box>
        ))}
      </Box>
      <Divider />
      <Box
        display={'flex'}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={{ xs: 2, sm: 0 }}
        justifyContent={'space-between'}
        alignItems={'center'}
        my={4}
      >
        <Typography
          fontSize={{ xs: '0.75rem', sm: '0.875rem' }}
          fontWeight={400}
          color="text.contrastText"
        >
          © {dayjs().year()} Surely Placed. All rights reserved.
        </Typography>
        <Box display={'flex'} gap={1} flexWrap="wrap">
          <Link href={'/privacy-policy'} className="link-styles touch-target">
            <Typography variant="body2" color="text">
              Privacy Policy
            </Typography>
          </Link>
          <Link href={'/terms-and-conditions'} className="link-styles touch-target">
            <Typography variant="body2" color="text">
              Terms of Service
            </Typography>
          </Link>
          <Link href={'/terms-and-conditions#sms'} className="link-styles touch-target">
            <Typography variant="body2" color="text">
              SMS Terms
            </Typography>
          </Link>
          <Link href={'/sms-consent'} className="link-styles touch-target">
            <Typography variant="body2" color="text">
              SMS Consent
            </Typography>
          </Link>
          <Link href={'/refund-cancellation-policy'} className="link-styles touch-target">
            <Typography variant="body2" color="text">
              Refund & Cancellation Policy
            </Typography>
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default Footer;
