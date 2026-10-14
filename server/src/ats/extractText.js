import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

const MAX_BYTES = 5 * 1024 * 1024;

export function assertResumeFile(file) {
  if (!file) {
    const err = new Error('Upload a resume file or paste your resume text.');
    err.statusCode = 400;
    throw err;
  }
  if (file.size > MAX_BYTES) {
    const err = new Error('That file is over 5 MB. Export a smaller PDF or DOCX.');
    err.statusCode = 400;
    throw err;
  }
  const name = (file.originalname || '').toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() : '';
  const ok =
    ext === 'pdf' ||
    ext === 'docx' ||
    ext === 'txt' ||
    mime === 'application/pdf' ||
    mime === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mime === 'text/plain';
  if (!ok) {
    const err = new Error(
      'Upload a PDF, DOCX or TXT file. For an older .doc file, save it as .docx first.'
    );
    err.statusCode = 400;
    throw err;
  }
}

export async function extractTextFromFile(file) {
  assertResumeFile(file);
  const name = (file.originalname || '').toLowerCase();
  const ext = name.includes('.') ? name.split('.').pop() : '';
  const buf = file.buffer;

  if (ext === 'txt' || file.mimetype === 'text/plain') {
    return buf.toString('utf8');
  }
  if (ext === 'pdf' || file.mimetype === 'application/pdf') {
    const data = await pdfParse(buf, { max: 6 });
    return data.text || '';
  }
  if (
    ext === 'docx' ||
    file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    const result = await mammoth.extractRawText({ buffer: buf });
    return result.value || '';
  }

  const err = new Error(
    'Upload a PDF, DOCX or TXT file. For an older .doc file, save it as .docx first.'
  );
  err.statusCode = 400;
  throw err;
}
