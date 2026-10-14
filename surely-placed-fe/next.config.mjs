/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://www.paypal.com https://*.paypal.com https://www.sandbox.paypal.com https://www.paypalobjects.com https://*.paypalobjects.com https://source.zoom.us https://*.zoom.us https://www.googletagmanager.com https://connect.facebook.net https://*.facebook.net https://accounts.google.com",
              "img-src 'self' data: blob: https: http:",
              "media-src 'self' blob: mediastream: https://*.zoom.us",
              "worker-src 'self' blob: https://source.zoom.us https://*.zoom.us",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://source.zoom.us https://*.zoom.us",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' http://localhost:8080 https://localhost:8080 http://127.0.0.1:8080 https://api.surelyplaced.com https://surelyplaced-payments.fly.dev https://www.paypal.com https://*.paypal.com https://www.sandbox.paypal.com https://api-m.paypal.com https://api-m.sandbox.paypal.com https://www.paypalobjects.com https://*.paypalobjects.com https://*.zoom.us wss://*.zoom.us https://www.facebook.com https://*.facebook.com https://connect.facebook.net https://*.facebook.net https://www.googletagmanager.com https://accounts.google.com https://oauth2.googleapis.com https://www.googleapis.com https://*.a.run.app https://*.on.aws",
              "frame-src 'self' blob: https://www.paypal.com https://*.paypal.com https://www.sandbox.paypal.com https://www.paypalobjects.com https://*.paypalobjects.com https://*.zoom.us https://www.youtube.com https://www.facebook.com https://*.facebook.com https://accounts.google.com",
            ].join('; ') + ';',
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'surelyplaced.com' }],
        destination: 'https://www.surelyplaced.com/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
