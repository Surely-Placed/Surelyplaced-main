import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import db from './db.js';
import paymentsRouter from './routes/payments.js';
import webhooksRouter from './routes/webhooks.js';
import adminRouter from './routes/admin.js';
import webinarsRouter from './routes/webinars.js';
import enrollmentRequestsRouter from './routes/enrollmentRequests.js';

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

const allowedOrigins = new Set(
  [
    config.frontendOrigin,
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:3001',
    'https://www.surelyplaced.com',
    'https://surelyplaced.com',
  ].filter(Boolean)
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'Idempotency-Key',
      'paypal-transmission-id',
      'paypal-transmission-time',
      'paypal-cert-url',
      'paypal-auth-algo',
      'paypal-transmission-sig',
    ],
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get('/health', async (_req, res) => {
  try {
    await db.raw('SELECT 1');
    res.json({ ok: true, service: 'surelyplaced-payments' });
  } catch (error) {
    res.status(503).json({ ok: false, error: error.message });
  }
});

app.use(
  '/api/webhooks',
  express.raw({ type: 'application/json' }),
  (req, _res, next) => {
    req.rawBody = req.body;
    next();
  },
  webhooksRouter
);

app.use(express.json({ limit: '1mb' }));
app.use('/api/payments', paymentsRouter);
app.use('/api/webinars', webinarsRouter);
app.use('/api/enrollment-requests', enrollmentRequestsRouter);
app.use('/api/admin', adminRouter);

// Public assets for transactional emails (logo, etc.)
app.use(
  express.static(path.join(__dirname, '../public'), {
    maxAge: '7d',
    index: false,
  })
);

app.use((error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  console.error(error);
  res.status(statusCode).json({
    error: error.message || 'Internal server error',
  });
});

async function start() {
  try {
    await db.raw('SELECT 1');
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`Surely Placed payments API listening on 0.0.0.0:${config.port} (${config.nodeEnv})`);
  });
}

start();
