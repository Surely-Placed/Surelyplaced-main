'use client';
import React from 'react';
import { Box, Typography } from '@mui/material';
import TitleContent from '@/common/TitleContent';
import SubtitleContent from '@/common/SubtitleContent';
import BulletContent from '@/common/BulletContent';
import SubContent from '@/common/SubContent';
import ContactPhones from '@/components/common/ContactPhones';
import {
  policyScope,
  informationProvided,
  personalInformation,
  automaticallyCollected,
  recordingTypes,
  recordingUsage,
  informationUsage,
  communityPlatforms,
  cookieUsage,
  dataSharingItems,
  dataRetention,
  smsCommunicationsParagraphs,
} from '../../../mockData/policy';

const PrivacyPolicy = () => {
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
        variant="h4"
      component={'h1'}
        fontWeight={500}
        fontFamily={'var(--font-avantgarde), sans-serif'}
        lineHeight={'normal'}
        sx={{
          mb: '0.75rem',
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' },
        }}
      >
        Privacy Policy
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

      <TitleContent content={'1. Introduction'} />
      <SubtitleContent
        content={
          <>
            Welcome to <strong>Surely Placed</strong> ("Surely Placed," "we," "our," or "us").
            <br /> We are committed to protecting your privacy and handling your personal
            information in a transparent, secure, and responsible manner.
          </>
        }
      />
      <SubtitleContent
        content={
          'This Privacy Policy explains how we collect, use, store, disclose, and protect your information when you access or use our website, services, cohorts, mentoring programs, application support, interview analytics, or community platforms (collectively, the “Services”).'
        }
      />
      <SubtitleContent
        content={
          'By using Surely Placed, you agree to the practices described in this Privacy Policy.'
        }
      />

      <TitleContent content={'2. Scope of This Policy'} />
      <SubtitleContent content={'This Privacy Policy applies to:'} />

      {policyScope.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}

      <SubtitleContent
        content={
          <>
            It does <strong>not</strong> apply to third-party websites or platforms linked from our
            website.
          </>
        }
      />

      <TitleContent content={'3. Information We Collect'} />
      <SubContent content={'a. Information You Provide Directly'} />
      <SubtitleContent content={'We may collect personal information when you:'} />
      {informationProvided.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}

      <SubtitleContent content={'This may include:'} />
      {personalInformation.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}

      <SubContent content={'b. Automatically Collected Information'} />

      <SubtitleContent content={'When you use our website, we may automatically collect:'} />
      {automaticallyCollected.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}

      <SubtitleContent
        content={'This data helps us improve performance, usability, and security.'}
      />

      <SubContent content={'c. Interview Recordings & Analytics (With Consent)'} />
      <SubtitleContent
        content={
          <>
            With your <strong>explicit consent</strong>, we may record:
          </>
        }
      />

      {recordingTypes.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}
      <SubtitleContent
        content={
          <>
            These recordings are used <strong>only</strong> for:
          </>
        }
      />

      {recordingUsage.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}
      <SubtitleContent content={'You may withdraw consent at any time.'} />

      <TitleContent content={'4. How We Use Your Information'} />
      <SubtitleContent content={'We use your information to:'} />
      {informationUsage.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}
      <SubtitleContent
        content={
          <>
            We do <strong>not</strong> sell your personal data.
          </>
        }
      />

      <TitleContent content={'SMS Communications'} />
      {smsCommunicationsParagraphs.map((item, i) => (
        <SubtitleContent key={i} content={item} />
      ))}

      <TitleContent content={'5. Community Platforms (WhatsApp, Groups, etc.)'} />
      <SubtitleContent content={'As part of program delivery:'} />
      {communityPlatforms.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}

      <TitleContent content={'6. Cookies & Tracking'} />
      <SubtitleContent content={'We use cookies and similar technologies to:'} />
      {cookieUsage.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}
      <SubtitleContent
        content={
          'You can manage or disable cookies through your browser settings. Some features may not function properly if cookies are disabled.'
        }
      />

      <TitleContent content={'7. Data Sharing & Disclosure'} />
      <SubtitleContent content={'We may share your information only:'} />
      {dataSharingItems.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}
      <SubtitleContent
        content={'All partners are required to maintain confidentiality and data security.'}
      />

      <TitleContent content={'8. Data Retention'} />
      <SubtitleContent content={'We retain personal data only as long as necessary:'} />
      {dataRetention.map((item, i) => (
        <BulletContent key={i} content={item} />
      ))}

      <TitleContent content={'9. Data Security'} />
      <SubtitleContent
        content={
          'We implement reasonable technical, administrative, and organizational safeguards to protect your information from unauthorized access, loss, or misuse.'
        }
      />
      <SubtitleContent
        content={
          'However, no system is completely secure. You are responsible for maintaining the confidentiality of your login credentials.'
        }
      />

      <TitleContent content={"10. Children's Privacy"} />
      <SubtitleContent
        content={
          <>
            Surely Placed is not intended for users under the age of 18.
            <br />
            If you are under 18, you may use our Services only with parental or legal guardian
            consent.
          </>
        }
      />

      <TitleContent content={'11. Third-Party Links'} />
      <SubtitleContent
        content={
          'Our website may contain links to third-party websites. We are not responsible for their privacy practices. Please review their policies separately.'
        }
      />

      <TitleContent content={'12. Changes to This Policy'} />
      <SubtitleContent
        content={
          'We may update this Privacy Policy from time to time. Updates will be reflected by the "Last Updated" date. Continued use of our Services constitutes acceptance of the updated policy.'
        }
      />

      <TitleContent content={'13. Contact Us'} />
      <SubtitleContent
        content={'If you have questions or concerns about this Privacy Policy, contact us at:'}
      />
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

export default PrivacyPolicy;
