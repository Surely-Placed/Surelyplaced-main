import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { extractTextFromFile } from '../ats/extractText.js';
import { scanResume } from '../ats/analyzer.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const atsScanLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many scans. Please wait a minute and try again.' },
});

function readField(body, name) {
  const v = body?.[name];
  if (v == null) return '';
  return String(v).trim();
}

router.post('/scan', atsScanLimiter, upload.single('resume'), async (req, res, next) => {
  try {
    const mode = readField(req.body, 'mode') || 'match';
    if (mode !== 'match' && mode !== 'general') {
      return res.status(400).json({ error: 'mode must be "match" or "general".' });
    }

    const company = readField(req.body, 'company');
    const role = readField(req.body, 'role');
    const jd = readField(req.body, 'jd');
    let resumeText = readField(req.body, 'resumeText');

    if (req.file) {
      resumeText = await extractTextFromFile(req.file);
    }

    if (!resumeText || resumeText.trim().length < 40) {
      return res.status(400).json({
        error:
          "We couldn't find enough readable text (need at least 40 characters). Try a text-based PDF or DOCX, or paste your resume.",
      });
    }

    if (mode === 'match' && jd.length < 150) {
      return res.status(400).json({
        error:
          'Paste the full job description (at least a few lines) so we can match keywords, or switch to General ATS check.',
      });
    }

    const result = scanResume(resumeText, { mode, company, role, jd });
    return res.json(result);
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'That file is over 5 MB. Export a smaller PDF or DOCX.' });
      }
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

export default router;
