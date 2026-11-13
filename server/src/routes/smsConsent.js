import { Router } from 'express';
import { submitStandaloneSmsConsent } from '../services/smsConsent.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const body = req.body || {};
    const record = await submitStandaloneSmsConsent({
      full_name: body.full_name,
      mobile_number: body.mobile_number,
      sms_consent: body.sms_consent,
      consent_source: body.consent_source,
      disclosure_version: body.disclosure_version,
    });

    res.status(201).json({
      ok: true,
      record: {
        id: record.id,
        mobile_number: record.mobile_number,
        sms_consent: record.sms_consent,
        consent_timestamp: record.consent_timestamp,
        consent_source: record.consent_source,
        disclosure_version: record.disclosure_version,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
