'use client';

import Script from 'next/script';

export const META_PIXEL_ID = '1542444291014468';

/** Fire a Meta Pixel standard event (no-op if `fbq` is unavailable). */
export function trackMetaEvent(eventName, params) {
  if (typeof window === 'undefined' || typeof window.fbq !== 'function') return;
  try {
    if (params !== undefined) {
      window.fbq('track', eventName, params);
    } else {
      window.fbq('track', eventName);
    }
  } catch {
    // ignore tracking errors
  }
}

/** Meta Pixel base snippet + PageView — install once in the global layout `<head>`. */
export default function MetaPixel({ pixelId = META_PIXEL_ID }) {
  if (!pixelId) return null;

  return (
    <>
      <Script id="meta-pixel" strategy="afterInteractive">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window,document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
      </Script>
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
