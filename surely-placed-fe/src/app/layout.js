import localFont from 'next/font/local';
import '../../styles/index.scss';
import ThemeRegistry from './theme-registry';
import { Box } from '@mui/material';
import ClientToastContainer from '@/components/ClientToastContainer';
import { Providers } from './providers';
import GoogleTagManager from '@/components/seo/GoogleTagManager';
import MetaPixel from '@/components/seo/MetaPixel';
import MetaPixelEnrollViewContent from '@/components/seo/MetaPixelEnrollViewContent';
import JsonLd from '@/components/seo/JsonLd';
import { ORGANIZATION_SCHEMA, SITE_NAME, SITE_URL, WEBSITE_SCHEMA } from '@/config/site';

const avantGarde = localFont({
  src: [
    {
      path: '../../public/fonts/AvantGarde-Bold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/avantgarde_demi.ttf',
      weight: '600',
      style: 'normal',
    },
    { path: '../../public/fonts/ITC_MEDIUM.otf', weight: '500', style: 'normal' },
  ],
  variable: '--font-avantgarde',
});

const nexa = localFont({
  src: [
    {
      path: '../../public/fonts/NexaBook.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/NexaBold.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../../public/fonts/NexaLight.otf',
      weight: '300',
      style: 'normal',
    },
  ],
  variable: '--font-nexa',
});

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Career Coaching & Interview Analytics`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    'Move from rejections to offers with mentor-led career coaching, application support, and interview analytics from Surely Placed.',
  icons: {
    icon: '/favicon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${avantGarde.variable} ${nexa.variable}`}>
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.googletagmanager.com" />
        <MetaPixel />
        <MetaPixelEnrollViewContent />
        <JsonLd data={ORGANIZATION_SCHEMA} />
        <JsonLd data={WEBSITE_SCHEMA} />
      </head>
      <body>
        <GoogleTagManager />
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <Providers>
          <ThemeRegistry>
            <ClientToastContainer />
            <Box component="main" id="main-content">
              {children}
            </Box>
          </ThemeRegistry>
        </Providers>
      </body>
    </html>
  );
}
