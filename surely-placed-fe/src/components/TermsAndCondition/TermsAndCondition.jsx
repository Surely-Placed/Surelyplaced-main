'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import TitleContent from '@/common/TitleContent';
import SubtitleContent from '@/common/SubtitleContent';
import BulletContent from '@/common/BulletContent';
import ContactPhones from '@/components/common/ContactPhones';
import {
  termsServicesOverview,
  userResponsibilities,
  noEmploymentGuarantee,
  paymentsAccess,
  terminationReasons,
  liabilityItems,
} from '../../../mockData/terms';

const TermsAndCondition = () => {
  return (
    <Box
      sx={{
        maxWidth: 1200,
        mx: 'auto',
        px: { xs: 2, sm: 1 },
        py: { xs: 2, sm: '6rem' },
        mt: { xs: 10, sm: 10, md: 10 },
      }}
    >
      {/* Main Heading */}
      <Typography
        component={'h1'}
        variant="h4"
        fontWeight={500}
        fontFamily={'var(--font-avantgarde), sans-serif'}
        lineHeight={'normal'}
        sx={{
          mb: '0.75rem',
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
        }}
      >
        Terms And Conditions
      </Typography>

      <Typography
        variant="subtitle1"
        fontFamily={'var(--font-avantgarde), sans-serif'}
        lineHeight={'normal'}
        sx={{
          mb: { xs: 3, sm: '2.81rem' },
        }}
      >
        Last updated: November 14, 2026
      </Typography>

      <TitleContent content={'1. Acceptance of Terms'} />
      <SubtitleContent content="By accessing and using the Surely Placed website and services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services." />

      <TitleContent content={'2. Services Overview'} />
      <SubtitleContent content={'Surely Placed provides:'} />

      {termsServicesOverview.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}

      <SubtitleContent
        content={
          <>
            We provide <strong>guidance and support</strong>, not guaranteed employment.
          </>
        }
      />

      <TitleContent content={'3. User Responsibilities'} />
      <SubtitleContent content={'You agree to:'} />
      {userResponsibilities.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}

      <SubtitleContent
        content={'Violation may result in suspension or termination without refund.'}
      />

      <TitleContent content={'4. No Guarantee of Employment'} />
      <SubtitleContent
        content={
          <>
            Surely Placed does <strong>not</strong> guarantee:
          </>
        }
      />
      {noEmploymentGuarantee.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}
      <SubtitleContent
        content={'Outcomes depend on individual effort, market conditions, and participation.'}
      />

      <TitleContent content={'5. Payments & Access'} />
      {paymentsAccess.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}

      <TitleContent content={'6. Intellectual Property'} />
      <SubtitleContent
        content={
          'All content, frameworks, materials, recordings, and methodologies belong to Surely Placed and may not be copied, redistributed, or resold without written permission.'
        }
      />

      <TitleContent content={'7. Termination'} />
      <SubtitleContent content={'We may suspend or terminate access if:'} />
      {terminationReasons.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}

      <TitleContent content={'8. Limitation of Liability'} />
      <SubtitleContent content={'Surely Placed is not liable for:'} />
      {liabilityItems.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}
      <SubtitleContent content={'Our liability is limited to the amount paid for Services.'} />

      <TitleContent content={'9. Governing Law'} />
      <SubtitleContent
        content={
          'These Terms are governed by applicable laws in the jurisdictions where Surely Placed operates'
        }
      />

      <TitleContent content={'SMS Program'} anchorId="sms" />
      <SubtitleContent content="After you provide SMS consent and confirm permission during a call, Surely Placed may text you about requested program information, related follow-ups and payment options." />
      <SubtitleContent content="Message frequency varies: up to one proactive follow-up daily, with additional messages during active conversations. Message and data rates may apply." />
      <SubtitleContent content="Reply STOP to unsubscribe or HELP for assistance. For support, contact support@surelyplaced.com or +1 (917) 755-0774." />
      <SubtitleContent content="SMS consent is optional and is not a condition of purchase. You may request services through other channels." />
      <SubtitleContent content="Delivery depends on network availability. Carriers are not responsible for delayed or undelivered messages." />
      <SubtitleContent content="SMS consent does not authorize a credit application or enroll you in a financing provider's messaging program. Payment and credit agreements require separate acceptance." />
      <SubtitleContent content="Please see our Privacy Policy for information about personal information handling." />

      <TitleContent content={'10. Contact'} />
      <SubtitleContent
        content={
          <>
            <strong>Email:</strong> support@surelyplaced.com
            <br />
            <strong>Phone:</strong> <ContactPhones variant="subtitle1" color="text.subText" separator=", " />
          </>
        }
      />
    </Box>
  );
};

export default TermsAndCondition;
