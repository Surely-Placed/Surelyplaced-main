import { Router } from 'express';
import {
  issueAdminToken,
  requireAdmin,
  validateAdminCredentials,
} from '../middleware/adminAuth.js';
import {
  clearWebinarTestData,
  createWebinarEvent,
  deleteWebinarEvent,
  getPublicWebinarConfig,
  listWebinarAttendees,
  listWebinarEventsPaginated,
  updateWebinarEvent,
  updateWebinarSeats,
} from '../services/webinarEvents.js';
import { listWaitlist } from '../services/webinarWaitlist.js';
import { deleteWebinarAttendee, resetWebinarJoinDevice } from '../services/orders.js';
import { isZoomAuthConfigured } from '../services/zoom.js';
import {
  recordCallConfirmation,
  recordCallConfirmationDeclined,
  recordSmsOptOut,
} from '../services/smsConsent.js';

const router = Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!validateAdminCredentials(email, password)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  const token = issueAdminToken();
  return res.json({
    token,
    email: String(email).trim().toLowerCase(),
  });
});

router.delete('/attendees/:orderId', requireAdmin, async (req, res, next) => {
  try {
    const result = await deleteWebinarAttendee(req.params.orderId);
    res.json({ ok: true, ...result });
  } catch (error) {
    next(error);
  }
});

router.post('/attendees/:orderId/reset-device', requireAdmin, async (req, res, next) => {
  try {
    const result = await resetWebinarJoinDevice(req.params.orderId);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/me', requireAdmin, (_req, res) => {
  res.json({
    ok: true,
    zoomConfigured: isZoomAuthConfigured(),
    timezone: 'America/New_York',
    currency: 'USD',
  });
});

router.get('/webinars', requireAdmin, async (req, res, next) => {
  try {
    const result = await listWebinarEventsPaginated({
      page: req.query.page,
      pageSize: req.query.pageSize,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/webinars/:id', requireAdmin, async (req, res, next) => {
  try {
    const result = await deleteWebinarEvent(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/webinars/active', requireAdmin, async (_req, res, next) => {
  try {
    // Sync seats/start time from Zoom (same source as public landing page)
    const live = await getPublicWebinarConfig({ forceRefresh: true });
    if (!live?.active) {
      return res.json({ webinar: null });
    }
    res.json({
      webinar: {
        id: live.id,
        title: live.title,
        description: null,
        startsAt: live.startsAt,
        datetimeLabel: live.datetimeLabel,
        seatsTotal: live.seatsTotal,
        seatsLeft: live.seatsLeft,
        priceCents: live.priceCents,
        currency: live.currency || 'USD',
        zoomMeetingId: live.zoomMeetingId || null,
        zoomStartUrl: null,
        active: true,
        metadata: {},
        syncedFromZoom: live.syncedFromZoom,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/webinars', requireAdmin, async (req, res, next) => {
  try {
    const webinar = await createWebinarEvent(req.body || {});
    res.status(201).json({ webinar });
  } catch (error) {
    next(error);
  }
});

router.patch('/webinars/:id', requireAdmin, async (req, res, next) => {
  try {
    const webinar = await updateWebinarEvent(req.params.id, req.body || {});
    res.json({ webinar });
  } catch (error) {
    next(error);
  }
});

router.patch('/webinars/:id/seats', requireAdmin, async (req, res, next) => {
  try {
    const { seatsTotal, seatsLeft } = req.body || {};
    const webinar = await updateWebinarSeats({
      eventId: req.params.id,
      seatsTotal,
      seatsLeft,
    });
    res.json({ webinar });
  } catch (error) {
    next(error);
  }
});

router.get('/attendees', requireAdmin, async (req, res, next) => {
  try {
    const result = await listWebinarAttendees({
      page: req.query.page,
      pageSize: req.query.pageSize,
      status: req.query.status || undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/waitlist', requireAdmin, async (req, res, next) => {
  try {
    const result = await listWaitlist({
      page: req.query.page,
      pageSize: req.query.pageSize,
      pendingOnly: req.query.pendingOnly === '1' || req.query.pendingOnly === 'true',
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/sms-consent/opt-out', requireAdmin, async (req, res, next) => {
  try {
    const { mobile_number: mobileNumber, source } = req.body || {};
    const record = await recordSmsOptOut({ mobileNumber, source: source || 'admin' });
    res.json({ ok: true, record });
  } catch (error) {
    next(error);
  }
});

router.post('/sms-consent/call-confirmation', requireAdmin, async (req, res, next) => {
  try {
    const { mobile_number: mobileNumber, source, status } = req.body || {};
    const record = await recordCallConfirmation({
      mobileNumber,
      source: source || 'call',
      status: status || 'confirmed',
    });
    res.json({ ok: true, record });
  } catch (error) {
    next(error);
  }
});

router.post('/sms-consent/call-confirmation-declined', requireAdmin, async (req, res, next) => {
  try {
    const { mobile_number: mobileNumber, source } = req.body || {};
    const record = await recordCallConfirmationDeclined({
      mobileNumber,
      source: source || 'call',
    });
    res.json({ ok: true, record });
  } catch (error) {
    next(error);
  }
});

router.post('/cleanup-test-data', requireAdmin, async (_req, res, next) => {
  try {
    const result = await clearWebinarTestData();
    res.json({
      ok: true,
      ...result,
      message:
        'Removed webinar events, waitlist, and non-paid webinar orders. Paid orders were kept.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
