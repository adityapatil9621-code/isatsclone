import nodemailer from 'nodemailer';
import { pool } from './db.js';
import { getCurrentSession } from './auth.js';

const MAX_BODY_BYTES = 24 * 1024 * 1024; // base64 of up to 15 MB of PDFs
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const MAX_TOTAL_BYTES = 15 * 1024 * 1024;

const STATUS_LABELS = { tenth: '10th pass', twelfth: '12th pass', graduate: 'Degree / Diploma' };

// ---- very small rate limit: 5 applications per IP per 15 minutes ----
const hits = new Map();
function tooManyRequests(ip) {
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 15 * 60 * 1000);
  if (recent.length >= 5) { hits.set(ip, recent); return true; }
  recent.push(now);
  hits.set(ip, recent);
  return false;
}

// Optional email copy to Titan. Returns null when TITAN_SMTP_PASS is not set.
let transporter;
function getTransporter() {
  if (!process.env.TITAN_SMTP_PASS) return null;
  if (!transporter) {
    const port = Number(process.env.TITAN_SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.TITAN_SMTP_HOST || 'smtp.titan.email',
      port,
      secure: port === 465,
      auth: {
        user: process.env.TITAN_SMTP_USER || 'admin@isatscosmetology.com',
        pass: process.env.TITAN_SMTP_PASS,
      },
    });
  }
  return transporter;
}

const clean = (value, max) =>
  typeof value === 'string' ? value.trim().replace(/[\u0000-\u001F]/g, ' ').slice(0, max) : '';

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const safeName = (value) => value.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '').slice(0, 60) || 'applicant';

// The documents each academic background must provide
function expectedDocs(status, years) {
  if (status === 'tenth') return { tenthCertificate: '10th passing certificate' };
  if (status === 'twelfth') return { twelfthCertificate: '12th passing certificate' };
  const docs = {};
  for (let i = 1; i <= years; i += 1) docs[`marksheet${i}`] = `Year ${i} marksheet`;
  docs.finalCertificate = 'Final degree / diploma certificate';
  return docs;
}

async function readBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error('Body too large');
      error.type = 'too_large';
      throw error;
    }
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

async function emailCopy(mailer, { fullName, email, phone, status, years, course, attachments }) {
  const sender = process.env.TITAN_SMTP_USER || 'admin@isatscosmetology.com';
  const to = process.env.APPLICATION_MAIL_TO || 'admin@isatscosmetology.com';
  const cell = 'padding:6px 12px;border:1px solid #e2e8f0';
  const detailRows = [
    ['Name', fullName],
    ['Email', email],
    ['Phone', phone],
    ['Academic background', STATUS_LABELS[status] + (status === 'graduate' ? ` (${years} year${years > 1 ? 's' : ''})` : '')],
    ['Course applied for', course],
  ]
    .map(([k, v]) => `<tr><td style="${cell}"><b>${k}</b></td><td style="${cell}">${escapeHtml(v)}</td></tr>`)
    .join('');
  const docRows = attachments
    .map((a) => `<tr><td style="${cell}">${escapeHtml(a.label)}</td><td style="${cell}">${escapeHtml(a.original)} (${Math.round(a.size / 1024)} KB)</td></tr>`)
    .join('');

  await mailer.sendMail({
    from: `"ISATS Website" <${sender}>`,
    to,
    replyTo: `"${fullName.replace(/"/g, '')}" <${email}>`,
    subject: `New application: ${fullName} - ${course} (${STATUS_LABELS[status]})`,
    html: `<div style="font-family:Arial,sans-serif;color:#0f172a;max-width:640px">
      <h2 style="margin:0 0 12px">New course application</h2>
      <table style="border-collapse:collapse;margin-bottom:16px">${detailRows}</table>
      <h3 style="margin:0 0 8px">Documents attached (${attachments.length})</h3>
      <table style="border-collapse:collapse">${docRows}</table>
      <p style="color:#475569;font-size:13px;margin-top:16px">Also available on the ISATS admin page. Reply to this email to contact the applicant.</p>
    </div>`,
    attachments: attachments.map(({ filename, content, contentType }) => ({ filename, content, contentType })),
  });

  try {
    await mailer.sendMail({
      from: `"ISATS" <${sender}>`,
      to: email,
      subject: 'We received your ISATS application',
      html: `<div style="font-family:Arial,sans-serif;color:#0f172a">
        <p>Hi ${escapeHtml(fullName.split(' ')[0])},</p>
        <p>Thank you for applying for <b>${escapeHtml(course)}</b> at ISATS. We have received your documents and our admissions team will verify them and get back to you soon.</p>
        <p>Regards,<br/>ISATS Admissions</p></div>`,
    });
  } catch (ackError) {
    console.warn('Acknowledgement email failed:', ackError.message);
  }
}

export async function handleApply(req, res, sendJson) {
  try {
    if (tooManyRequests(req.socket.remoteAddress || 'unknown')) {
      return sendJson(res, 429, { ok: false, error: 'Too many applications. Please try again later.' });
    }

    let body;
    try {
      body = await readBody(req);
    } catch (error) {
      return sendJson(res, error.type === 'too_large' ? 413 : 400, {
        ok: false,
        error: error.type === 'too_large' ? 'Documents are too large (max 15 MB in total).' : 'Invalid request.',
      });
    }

    const fullName = clean(body.fullName, 120).replace(/\s+/g, ' ');
    const email = clean(body.email, 254).toLowerCase();
    const phone = clean(body.phone, 20).replace(/[\s()-]/g, '');
    const status = clean(body.academicStatus, 20);
    const course = clean(body.course, 180);
    const years = Number.parseInt(body.years, 10);

    if (fullName.length < 2) return sendJson(res, 400, { ok: false, error: 'Enter your full name.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendJson(res, 400, { ok: false, error: 'Enter a valid email address.' });
    if (!/^\+[1-9]\d{7,14}$/.test(phone)) return sendJson(res, 400, { ok: false, error: 'Enter a valid phone number with country code.' });
    if (!STATUS_LABELS[status]) return sendJson(res, 400, { ok: false, error: 'Select your academic background.' });
    if (course.length < 2) return sendJson(res, 400, { ok: false, error: 'Select a course.' });
    if (status === 'graduate' && !(years >= 1 && years <= 6)) {
      return sendJson(res, 400, { ok: false, error: 'Select the number of years of your degree or diploma.' });
    }

    const expected = expectedDocs(status, years);
    const docs = Array.isArray(body.documents) ? body.documents.slice(0, 12) : [];
    const byId = new Map(docs.map((d) => [d && d.id, d]));
    const attachments = [];
    let total = 0;

    for (const [id, label] of Object.entries(expected)) {
      const doc = byId.get(id);
      if (!doc) return sendJson(res, 400, { ok: false, error: `Missing document: ${label}.` });
      const buffer = Buffer.from(String(doc.data || ''), 'base64');
      if (!buffer.length || buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
        return sendJson(res, 400, { ok: false, error: `${label} is not a valid PDF.` });
      }
      if (buffer.length > MAX_FILE_BYTES) {
        return sendJson(res, 400, { ok: false, error: `${label} is larger than 5 MB.` });
      }
      total += buffer.length;
      attachments.push({
        id,
        filename: `${safeName(label)}_${safeName(fullName)}.pdf`,
        content: buffer,
        contentType: 'application/pdf',
        label,
        original: clean(doc.name, 120) || `${safeName(label)}.pdf`,
        size: buffer.length,
      });
    }
    if (total > MAX_TOTAL_BYTES) {
      return sendJson(res, 413, { ok: false, error: 'Documents are too large (max 15 MB in total).' });
    }

    // ---- save in the database (this is what the admin page shows) ----
    const session = await getCurrentSession(req, { touch: false }).catch(() => null);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const saved = await client.query(
        `INSERT INTO course_applications
           (user_id, full_name, email, phone, academic_status, course, years)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [session?.user_id || null, fullName, email, phone, status, course, status === 'graduate' ? years : null]
      );
      for (const a of attachments) {
        await client.query(
          `INSERT INTO application_documents
             (application_id, doc_key, label, file_name, size_bytes, content)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [saved.rows[0].id, a.id, a.label, a.original, a.size, a.content]
        );
      }
      await client.query('COMMIT');
    } catch (dbError) {
      await client.query('ROLLBACK');
      throw dbError;
    } finally {
      client.release();
    }

    // ---- optional email copy to Titan (never blocks the application) ----
    const mailer = getTransporter();
    if (mailer) {
      try {
        await emailCopy(mailer, { fullName, email, phone, status, years, course, attachments });
      } catch (mailError) {
        console.warn('Application saved, but the email copy failed:', mailError.code || '', mailError.message);
      }
    }

    return sendJson(res, 200, { ok: true });
  } catch (error) {
    console.error('Application failed:', error.code || '', error.message);
    return sendJson(res, 500, { ok: false, error: 'Could not send your application. Please try again.' });
  }
}