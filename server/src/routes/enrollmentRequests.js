import { Router } from 'express';
import { createEnrollmentRequest } from '../services/enrollmentRequests.js';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const row = await createEnrollmentRequest(req.body || {});

    return res.status(201).json({
      success: true,
      enrollment_request: {
        id: row.id,
        full_name: row.full_name,
        email: row.email,
        created_at: row.created_at,
      },
    });
  } catch (error) {
    if (error.statusCode === 400 && error.details) {
      return res.status(400).json({
        error: error.message,
        details: error.details,
      });
    }
    return next(error);
  }
});

export default router;
