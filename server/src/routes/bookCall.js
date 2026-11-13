import { Router } from 'express';
import { createBookedCall } from '../services/bookedCalls.js';

const router = Router();

function validationDetail(errors) {
  const first = Object.values(errors)[0];
  if (typeof first === 'string' && first) return first;
  return 'Please check the form and try again.';
}

router.post('/', async (req, res, next) => {
  try {
    const row = await createBookedCall(req.body || {});

    return res.status(201).json({
      id: row.id,
      name: row.name,
      preferred_datetime: row.preferred_datetime,
      created_at: row.created_at,
    });
  } catch (error) {
    if (error.statusCode === 400 && error.details) {
      return res.status(400).json({
        detail: validationDetail(error.details),
        errors: error.details,
      });
    }
    return next(error);
  }
});

export default router;
