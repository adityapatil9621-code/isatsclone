
import { pool } from './db.js';
import { getCurrentSession } from './auth.js';
import { isAdminUser } from './admin.js';

const ALLOWED_STATUSES = new Set([
  'new',
  'reviewing',
  'accepted',
  'rejected',
]);

export async function handleAdminApplications(
  req,
  res,
  url,
  { sendJson, readJson }
) {
  try {
    // 1. Check authentication
    const session = await getCurrentSession(req);

    if (!session) {
      return sendJson(res, 401, {
        ok: false,
        error: 'Sign in required.',
      });
    }

    // 2. Check admin permission
    if (!isAdminUser(session)) {
      return sendJson(res, 403, {
        ok: false,
        error: 'Admin access required.',
      });
    }

    // 3. GET ALL APPLICATIONS
    if (
      req.method === 'GET' &&
      url.pathname === '/api/admin/applications'
    ) {
      const result = await pool.query(`
        SELECT
          a.id,
          a.user_id,
          a.full_name,
          a.email,
          a.phone,
          a.academic_status,
          a.course,
          a.years,
          a.status,
          a.created_at,
          a.updated_at,
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', d.doc_key,
                  'label', d.label,
                  'fileName', d.file_name,
                  'size', d.size_bytes
                )
              )
              FROM application_documents d
              WHERE d.application_id = a.id
            ),
            '[]'::json
          ) AS documents
        FROM course_applications a
        ORDER BY a.created_at DESC
      `);

      return sendJson(res, 200, {
        ok: true,
        applications: result.rows,
      });
    }

    // 4. DOWNLOAD APPLICATION DOCUMENT
    const documentMatch = url.pathname.match(
      /^\/api\/admin\/applications\/([^/]+)\/documents\/([^/]+)$/
    );

    if (req.method === 'GET' && documentMatch) {
      const applicationId = decodeURIComponent(documentMatch[1]);
      const docKey = decodeURIComponent(documentMatch[2]);

      const result = await pool.query(
        `SELECT file_name, content, size_bytes
         FROM application_documents
         WHERE application_id = $1
           AND doc_key = $2
         LIMIT 1`,
        [applicationId, docKey]
      );

      if (!result.rowCount) {
        return sendJson(res, 404, {
          ok: false,
          error: 'Document not found.',
        });
      }

      const document = result.rows[0];

      res.writeHead(200, {
        'Content-Type': 'application/pdf',
        'Content-Length': document.size_bytes,
        'Content-Disposition':
          `attachment; filename="${String(document.file_name).replace(/["\\\r\n]/g, '_')}"`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      });

      return res.end(document.content);
    }

    // 5. UPDATE APPLICATION STATUS
    const statusMatch = url.pathname.match(
      /^\/api\/admin\/applications\/([^/]+)\/status$/
    );

    if (req.method === 'PATCH' && statusMatch) {
      const applicationId = decodeURIComponent(statusMatch[1]);
      const body = await readJson(req);

      if (!ALLOWED_STATUSES.has(body.status)) {
        return sendJson(res, 400, {
          ok: false,
          error: 'Invalid application status.',
        });
      }

      const result = await pool.query(
        `UPDATE course_applications
         SET status = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING id, status, updated_at`,
        [body.status, applicationId]
      );

      if (!result.rowCount) {
        return sendJson(res, 404, {
          ok: false,
          error: 'Application not found.',
        });
      }

      return sendJson(res, 200, {
        ok: true,
        application: result.rows[0],
        message: 'Application status updated successfully.',
      });
    }

    // 6. GET SINGLE APPLICATION
    const applicationMatch = url.pathname.match(
      /^\/api\/admin\/applications\/([^/]+)$/
    );

    if (req.method === 'GET' && applicationMatch) {
      const applicationId = decodeURIComponent(applicationMatch[1]);

      const result = await pool.query(
        `SELECT
           a.id,
           a.user_id,
           a.full_name,
           a.email,
           a.phone,
           a.academic_status,
           a.course,
           a.years,
           a.status,
           a.created_at,
           a.updated_at,
           COALESCE(
             (
               SELECT json_agg(
                 json_build_object(
                   'id', d.doc_key,
                   'label', d.label,
                   'fileName', d.file_name,
                   'size', d.size_bytes
                 )
               )
               FROM application_documents d
               WHERE d.application_id = a.id
             ),
             '[]'::json
           ) AS documents
         FROM course_applications a
         WHERE a.id = $1
         LIMIT 1`,
        [applicationId]
      );

      if (!result.rowCount) {
        return sendJson(res, 404, {
          ok: false,
          error: 'Application not found.',
        });
      }

      return sendJson(res, 200, {
        ok: true,
        application: result.rows[0],
      });
    }

    return sendJson(res, 404, {
      ok: false,
      error: 'Application route not found.',
    });

  } catch (error) {
    console.error(
      'Admin applications error:',
      error.code || '',
      error.message
    );

    return sendJson(res, 500, {
      ok: false,
      error: 'Could not process applications request.',
    });
  }
}
