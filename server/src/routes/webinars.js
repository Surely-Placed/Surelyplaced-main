import { Router } from 'express';
import { getPublicWebinarConfig } from '../services/webinarEvents.js';
import { addToWaitlist } from '../services/webinarWaitlist.js';
import { claimWebinarJoin, registerWebinarFree, requestWebinarJoinOtp } from '../services/orders.js';

const router = Router();

router.get('/active', async (_req, res, next) => {
  try {
    const webinar = await getPublicWebinarConfig();
    res.json({ webinar });
  } catch (error) {
    next(error);
  }
});

router.post('/join/request-otp', async (req, res, next) => {
  try {
    const { token, email, deviceId } = req.body || {};
    const result = await requestWebinarJoinOtp({ token, email, deviceId });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/join', async (req, res, next) => {
  try {
    const { token, deviceId, email, otp } = req.body || {};
    const result = await claimWebinarJoin({ token, deviceId, email, otp });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, contact, registration } = req.body || {};

    if (!name?.trim() || !email?.trim()) {
      return res.status(400).json({
        error: 'name and email are required',
      });
    }

    const result = await registerWebinarFree({
      name,
      email,
      contact,
      registration,
    });

    return res.status(201).json({
      success: true,
      order: result.order,
      plan: result.plan,
      customer: result.customer,
      payment: result.payment,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/waitlist', async (req, res, next) => {
  try {
    const result = await addToWaitlist(req.body || {});
    res.status(201).json({
      ok: true,
      alreadyJoined: result.alreadyJoined,
      message: result.alreadyJoined
        ? 'You are already on the waitlist. We will email you when seats open.'
        : 'You are on the waitlist. We will email you when the next webinar is scheduled.',
    });
  } catch (error) {
    next(error);
  }
});

export default router;
