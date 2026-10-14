import { Router } from 'express';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import { extractTextFromFile } from '../ats/extractText.js';
import { scanResume } from '../ats/analyzer.js';
import { buildFreeScanResponse, newReportId } from '../ats/reportPayload.js';
import { createScanToken, verifyScanToken } from '../ats/scanToken.js';
import { persistAtsLead, validateAtsLead } from '../services/atsLeads.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

const atsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please wait a minute and try again.' },
});

function readField(body, name) {
  const v = body?.[name];
  if (v == null) return '';
  return String(v).trim();
}

const ALLOWED_MIMES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
]);

router.post('/scan', atsLimiter, upload.single('resume'), async (req, res, next) => {
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
      const mime = req.file.mimetype || '';
      const ext = (req.file.originalname?.split('.').pop() || '').toLowerCase();
      const okExt = ['pdf', 'docx', 'txt'].includes(ext);
      if (!okExt && !ALLOWED_MIMES.has(mime)) {
        return res.status(400).json({
          error: 'Upload a PDF, DOCX or TXT file. For an older .doc file, save it as .docx first.',
        });
      }
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

    const displayFile = req.file?.originalname || 'Pasted text';
    const analysis = scanResume(resumeText, { mode, company, role, jd });
    const reportId = newReportId();
    const { freeReport, fullReport } = buildFreeScanResponse(analysis, {
      reportId,
      mode,
      company,
      role,
      fileName: displayFile,
    });

    const scanId = createScanToken(fullReport, {
      mode,
      company,
      role,
      fileName: freeReport.fileName,
    });

    return res.json({ ...freeReport, scanId });
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

router.post('/lead', atsLimiter, async (req, res, next) => {
  try {
    const validated = validateAtsLead(req.body);
    if (validated.error) {
      return res.status(400).json({ error: validated.error });
    }

    const { report, meta } = verifyScanToken(validated.scanId);
    if (!report) {
      return res.status(400).json({ error: 'Invalid or expired scan. Run a new scan and try again.' });
    }

    await persistAtsLead(validated, {
      ats_score: report.score,
      target_role: meta.role || report.role,
      target_company: meta.company || report.company,
      mode: meta.mode || report.mode,
      report_id: report.reportId,
      missing_keywords: report.missing,
      file_name: meta.fileName || report.fileName,
    });

    return res.json({
      ...report,
      unlocked: true,
    });
  } catch (error) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

export default router;
