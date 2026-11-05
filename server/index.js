import http from 'node:http';
import crypto from 'node:crypto';
import { config } from './config.js';
import { pool, getCourses, getCourseById, testConnection } from './db.js';

import {
  hashToken,
  hashPassword,
  verifyPassword,
  createSession,
  getCurrentSession,
  revokeCurrentSession,
  publicUser,
  cleanupExpiredAuthRecords,
  createOrGetGoogleUser,
  linkGoogleIdentity,
  exchangeGoogleCode,
  startGoogleAuthorization,
  consumeOAuthState,
  parseCookies,
  clearSessionCookie,
  clearOAuthStateCookie,
} from './auth.js';

import { verifyFirebaseGoogleToken } from './firebaseAdmin.js';
import { isAdminUser, listUsers } from './admin.js';

const MAX_BODY_BYTES = 32 * 1024;
const SESSION_COOKIE = 'isats_session';

const server = http.createServer(async (req, res) => {
  const url = new URL(
    req.url,
    `http://${req.headers.host || 'localhost'}`
  );

  applySecurityHeaders(res);
  applyCors(req, res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  try {
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
      !isAllowedOrigin(req)
    ) {
      return sendJson(res, 403, {
        ok: false,
        error: 'Origin not allowed.',
      });
    }

    // API root
    if (req.method === 'GET' && url.pathname === '/') {
      return sendJson(res, 200, {
        ok: true,
        message: 'ISATS PostgreSQL API is running',
        endpoints: [
          '/api/health',
          '/api/courses',
          '/api/enquiries',
          '/api/admin/enquiries',
          '/api/auth/register',
          '/api/auth/login',
          '/api/auth/firebase/google',
          '/api/auth/google',
          '/api/auth/me',
          '/api/auth/logout',
          '/api/auth/sessions',
          '/api/profile',
        ],
      });
    }

    // Health check
    if (req.method === 'GET' && url.pathname === '/api/health') {
      const db = await testConnection();

      return sendJson(res, 200, {
        ok: true,
        database: db.database,
        user: db.user,
      });
    }

    // --------------------------------------------------
    // EMAIL/PASSWORD REGISTRATION
    // --------------------------------------------------
    if (
      req.method === 'POST' &&
      url.pathname === '/api/auth/register'
    ) {
      const body = await readJson(req);

      const fullName = cleanText(body.fullName, 120);
      const email = normalizeEmail(body.email);
      const password =
        typeof body.password === 'string' ? body.password : '';

      if (!fullName || fullName.length < 2) {
        return sendJson(res, 400, {
          ok: false,
          error: 'Enter your full name.',
        });
      }

      if (!isValidEmail(email)) {
        return sendJson(res, 400, {
          ok: false,
          error: 'Enter a valid email address.',
        });
      }

      if (password.length < 8 || password.length > 128) {
        return sendJson(res, 400, {
          ok: false,
          error: 'Password must be between 8 and 128 characters.',
        });
      }

      const passwordHash = await hashPassword(password);
      const client = await pool.connect();

      let user;

      try {
        await client.query('BEGIN');

        const created = await client.query(
          `INSERT INTO users
             (email, email_verified, profile_completed)
           VALUES ($1, FALSE, TRUE)
           RETURNING id, email, email_verified, profile_completed`,
          [email]
        );

        user = created.rows[0];

        await client.query(
          `INSERT INTO user_profiles (user_id, full_name)
           VALUES ($1, $2)`,
          [user.id, fullName]
        );

        await client.query(
          `INSERT INTO auth_identities
             (user_id, provider, provider_subject, password_hash)
           VALUES ($1, 'password', $2, $3)`,
          [user.id, email, passwordHash]
        );

        await client.query('COMMIT');
      } catch (error) {
        await client.query('ROLLBACK');

        if (error.code === '23505') {
          return sendJson(res, 409, {
            ok: false,
            error:
              'An account with this email already exists. Sign in instead.',
          });
        }

        throw error;
      } finally {
        client.release();
      }

      await revokeCurrentSession(req);

      const expiresAt = await createSession(res, req, user.id);

      return sendJson(res, 201, {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          emailVerified: false,
          profileCompleted: true,
          profile: {
            fullName,
            phone: '',
            preferredCourse: '',
          },
        },
        expiresAt,
        message:
          'Account created. Email verification has not been configured yet.',
      });
    }

    // --------------------------------------------------
    // EMAIL/PASSWORD LOGIN
    // --------------------------------------------------
    if (
      req.method === 'POST' &&
      url.pathname === '/api/auth/login'
    ) {
      const body = await readJson(req);

      const email = normalizeEmail(body.email);
      const password =
        typeof body.password === 'string' ? body.password : '';

      if (
        !isValidEmail(email) ||
        !password ||
        password.length > 128
      ) {
        return sendJson(res, 400, {
          ok: false,
          error: 'Enter a valid email and password.',
        });
      }

      const result = await pool.query(
        `SELECT
           u.id,
           u.email,
           u.email_verified,
           u.profile_completed,
           u.account_status,
           i.password_hash,
           p.full_name,
           p.phone,
           p.preferred_course
         FROM users u
         JOIN auth_identities i
           ON i.user_id = u.id
          AND i.provider = 'password'
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE LOWER(u.email) = $1
         LIMIT 1`,
        [email]
      );

      const user = result.rows[0];

      const passwordMatches = user
        ? await verifyPassword(password, user.password_hash)
        : false;

      if (
        !user ||
        !passwordMatches ||
        user.account_status !== 'active'
      ) {
        return sendJson(res, 401, {
          ok: false,
          error: 'Invalid email or password.',
        });
      }

      await revokeCurrentSession(req);

      const expiresAt = await createSession(res, req, user.id);

      return sendJson(res, 200, {
        ok: true,
        user: {
          id: user.id,
          email: user.email,
          isAdmin: isAdminUser(user),
          emailVerified: user.email_verified,
          profileCompleted: user.profile_completed,
          profile: {
            fullName: user.full_name || '',
            phone: user.phone || '',
            preferredCourse: user.preferred_course || '',
          },
        },
        expiresAt,
      });
    }

    // --------------------------------------------------
    // FIREBASE GOOGLE SIGN-IN
    // The frontend sends a Firebase ID token.
    // The backend verifies it before creating a session.
    // --------------------------------------------------
    if (
      req.method === 'POST' &&
      url.pathname === '/api/auth/firebase/google'
    ) {
      const body = await readJson(req);

      let googleProfile;

      try {
        googleProfile = await verifyFirebaseGoogleToken(body.idToken);
      } catch (error) {
        console.error(
          'Firebase token verification failed:',
          error.message
        );

        return sendJson(res, 401, {
          ok: false,
          error: 'Google authentication could not be verified.',
        });
      }

      let user;

      try {
        user = await createOrGetGoogleUser(googleProfile);
      } catch (error) {
        if (
          error.message?.includes('already uses this email')
        ) {
          return sendJson(res, 409, {
            ok: false,
            error:
              'An account already uses this email. Sign in with your existing method first, then link Google from your profile.',
          });
        }

        if (error.message?.includes('different Google account')) {
          return sendJson(res, 409, {
            ok: false,
            error:
              'A different Google account is already linked to this email.',
          });
        }

        if (error.message?.includes('not active')) {
          return sendJson(res, 403, {
            ok: false,
            error: 'This account is not active.',
          });
        }

        if (error.code === '23505') {
          return sendJson(res, 409, {
            ok: false,
            error:
              'This account could not be linked automatically. Please try signing in again.',
          });
        }

        throw error;
      }

      // Revoke the previous session and create a new session.
      await revokeCurrentSession(req);

      const expiresAt = await createSession(res, req, user.id);

      // IMPORTANT:
      // getCurrentSession(req) reads the incoming request cookie.
      // It cannot read the new cookie just added to the response.
      // Fetch the newly authenticated user's profile directly.
      const userResult = await pool.query(
        `SELECT
           u.id AS user_id,
           u.email,
           u.email_verified,
           u.profile_completed,
           p.full_name,
           p.phone,
           p.preferred_course
         FROM users u
         LEFT JOIN user_profiles p ON p.user_id = u.id
         WHERE u.id = $1
           AND u.account_status = 'active'
         LIMIT 1`,
        [user.id]
      );

      const sessionUser = userResult.rows[0];

      if (!sessionUser) {
        throw new Error(
          'User session could not be initialized.'
        );
      }

      return sendJson(res, 200, {
        ok: true,
        authenticated: true,
        user: publicUser(sessionUser),
        expiresAt,
      });
    }

    // --------------------------------------------------
    // EXISTING GOOGLE OAUTH START ROUTE
    // Retained for compatibility with the existing setup.
    // --------------------------------------------------
    if (
      req.method === 'GET' &&
      url.pathname === '/api/auth/google'
    ) {
      if (
        !config.google.clientId ||
        !config.google.clientSecret ||
        !config.google.redirectUri
      ) {
        return redirectToFrontend(
          res,
          '/login?authError=google_not_configured'
        );
      }

      const mode =
        url.searchParams.get('mode') === 'link'
          ? 'link'
          : 'login';

      let session = null;

      if (mode === 'link') {
        session = await getCurrentSession(req);

        if (!session) {
          return redirectToFrontend(
            res,
            '/login?authError=link_session_expired'
          );
        }
      }

      return startGoogleAuthorization(
        res,
        mode,
        session?.user_id || null
      );
    }

    // --------------------------------------------------
    // EXISTING GOOGLE OAUTH CALLBACK
    // --------------------------------------------------
    if (
      req.method === 'GET' &&
      url.pathname === '/api/auth/google/callback'
    ) {
      clearOAuthStateCookie(res);

      if (url.searchParams.get('error')) {
        return redirectToFrontend(
          res,
          '/login?authError=google_cancelled'
        );
      }

      const stateRecord = await consumeOAuthState(
        req,
        url.searchParams.get('state')
      );

      if (
        !stateRecord ||
        !url.searchParams.get('code')
      ) {
        return redirectToFrontend(
          res,
          '/login?authError=invalid_oauth_state'
        );
      }

      try {
        const googleProfile = await exchangeGoogleCode(
          url.searchParams.get('code')
        );

        if (stateRecord.purpose === 'link') {
          const activeSession = await getCurrentSession(req);

          if (
            !activeSession ||
            activeSession.user_id !== stateRecord.user_id
          ) {
            return redirectToFrontend(
              res,
              '/login?authError=link_session_expired'
            );
          }

          await linkGoogleIdentity(
            stateRecord.user_id,
            googleProfile
          );

          return redirectToFrontend(res, '/admin');
        }

        const user = await createOrGetGoogleUser(googleProfile);

        await revokeCurrentSession(req);
        await createSession(res, req, user.id);

        return redirectToFrontend(res, isAdminUser({ ...user, email_verified: true }) ? '/admin' : '/courses');
      } catch (error) {
        console.error(
          'Google OAuth callback failed:',
          error.message
        );

        const reason = error.message?.includes(
          'already uses this email'
        )
          ? 'account_link_required'
          : error.code === '23505' ||
              error.message?.includes('different Google account')
            ? 'google_already_linked'
            : 'google_failed';

        return redirectToFrontend(
          res,
          `/login?authError=${reason}`
        );
      }
    }

    // --------------------------------------------------
    // CURRENT AUTHENTICATION STATUS
    // --------------------------------------------------
    if (
      req.method === 'GET' &&
      url.pathname === '/api/auth/me'
    ) {
      const session = await getCurrentSession(req);

      if (!session) {
        clearSessionCookie(res);

        return sendJson(res, 200, {
          ok: true,
          authenticated: false,
          user: null,
        });
      }

      return sendJson(res, 200, {
        ok: true,
        authenticated: true,
        user: publicUser(session),
        session: {
          id: session.session_id,
          createdAt: session.session_created_at,
          lastActivityAt: session.last_activity_at,
          expiresAt: session.expires_at,
        },
      });
    }

    // --------------------------------------------------
    // LOGOUT
    // --------------------------------------------------
    if (
      req.method === 'POST' &&
      url.pathname === '/api/auth/logout'
    ) {
      await revokeCurrentSession(req);
      clearSessionCookie(res);

      return sendJson(res, 200, {
        ok: true,
        message: 'Signed out.',
      });
    }

    // --------------------------------------------------
    // LIST ACTIVE SESSIONS
    // --------------------------------------------------
    if (
      req.method === 'GET' &&
      url.pathname === '/api/auth/sessions'
    ) {
      const session = await getCurrentSession(req);

      if (!session) {
        return sendJson(res, 401, {
          ok: false,
          error: 'Sign in required.',
        });
      }

      const token = parseCookies(req)[SESSION_COOKIE];
      const currentHash = token ? hashToken(token) : '';

      const result = await pool.query(
        `SELECT
           id,
           user_agent,
           created_at,
           last_activity_at,
           expires_at,
           session_token_hash = $2 AS is_current
         FROM user_sessions
         WHERE user_id = $1
           AND revoked_at IS NULL
           AND expires_at > NOW()
         ORDER BY is_current DESC, last_activity_at DESC`,
        [session.user_id, currentHash]
      );

      return sendJson(res, 200, {
        ok: true,
        sessions: result.rows.map((item) => ({
          id: item.id,
          userAgent: item.user_agent || 'Unknown device',
          createdAt: item.created_at,
          lastActivityAt: item.last_activity_at,
          expiresAt: item.expires_at,
          current: item.is_current,
        })),
      });
    }

    // --------------------------------------------------
    // SIGN OUT ALL OTHER SESSIONS
    // --------------------------------------------------
    if (
      req.method === 'DELETE' &&
      url.pathname === '/api/auth/sessions'
    ) {
      const session = await getCurrentSession(req);

      if (!session) {
        return sendJson(res, 401, {
          ok: false,
          error: 'Sign in required.',
        });
      }

      const token = parseCookies(req)[SESSION_COOKIE];

      await pool.query(
        `UPDATE user_sessions
         SET revoked_at = NOW()
         WHERE user_id = $1
           AND session_token_hash <> $2
           AND revoked_at IS NULL
           AND expires_at > NOW()`,
        [session.user_id, hashToken(token)]
      );

      return sendJson(res, 200, {
        ok: true,
        message: 'All other sessions have been signed out.',
      });
    }

    // --------------------------------------------------
    // REVOKE A SPECIFIC SESSION
    // --------------------------------------------------
    const revokeSessionMatch = url.pathname.match(
      /^\/api\/auth\/sessions\/([0-9a-f-]{36})$/i
    );

    if (
      req.method === 'DELETE' &&
      revokeSessionMatch
    ) {
      const session = await getCurrentSession(req);

      if (!session) {
        return sendJson(res, 401, {
          ok: false,
          error: 'Sign in required.',
        });
      }

      const result = await pool.query(
        `UPDATE user_sessions
         SET revoked_at = NOW()
         WHERE id = $1
           AND user_id = $2
           AND revoked_at IS NULL
         RETURNING id`,
        [revokeSessionMatch[1], session.user_id]
      );

      if (!result.rowCount) {
        return sendJson(res, 404, {
          ok: false,
          error: 'Session not found or already revoked.',
        });
      }

      return sendJson(res, 200, {
        ok: true,
        message: 'Session signed out.',
      });
    }

    // --------------------------------------------------
    // GET PROFILE
    // --------------------------------------------------
    if (
      req.method === 'GET' &&
      url.pathname === '/api/profile'
    ) {
      const session = await getCurrentSession(req);

      if (!session) {
        return sendJson(res, 401, {
          ok: false,
          error: 'Sign in required.',
        });
      }

      const identities = await pool.query(
        `SELECT provider
         FROM auth_identities
         WHERE user_id = $1
         ORDER BY provider`,
        [session.user_id]
      );

      return sendJson(res, 200, {
        ok: true,
        user: publicUser(session),
        linkedProviders: identities.rows.map(
          (row) => row.provider
        ),
      });
    }

    // --------------------------------------------------
    // UPDATE PROFILE
    // --------------------------------------------------
    if (
      req.method === 'PATCH' &&
      url.pathname === '/api/profile'
    ) {
      const session = await getCurrentSession(req);

      if (!session) {
        return sendJson(res, 401, {
          ok: false,
          error: 'Sign in required.',
        });
      }

      const body = await readJson(req);

      const fullName = cleanText(body.fullName, 120);
      const phone = cleanText(body.phone, 20);
      const preferredCourse = cleanText(
        body.preferredCourse,
        150
      );
      if (phone && !/^\+[1-9]\d{7,14}$/.test(phone.replace(/[\s-]/g, ''))) {
        return sendJson(res, 400, { ok: false, error: 'Enter a valid phone number with country code.' });
      }

      if (!fullName || fullName.length < 2) {
        return sendJson(res, 400, {
          ok: false,
          error: 'Enter your full name.',
        });
      }

      await pool.query(
        `INSERT INTO user_profiles
           (user_id, full_name, phone, preferred_course, updated_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (user_id)
         DO UPDATE SET
           full_name = EXCLUDED.full_name,
           phone = EXCLUDED.phone,
           preferred_course = EXCLUDED.preferred_course,
           updated_at = NOW()`,
        [
          session.user_id,
          fullName,
          phone || null,
          preferredCourse || null,
        ]
      );

      await pool.query(
        `UPDATE users
         SET profile_completed = TRUE, updated_at = NOW()
         WHERE id = $1`,
        [session.user_id]
      );

      const updated = await getCurrentSession(req, {
        touch: false,
      });

      return sendJson(res, 200, {
        ok: true,
        user: publicUser(updated),
      });
    }

    // --------------------------------------------------
    // PUBLIC COURSE ENQUIRIES
    // Save first; the browser opens WhatsApp only after this succeeds.
    // --------------------------------------------------
    if (req.method === 'POST' && url.pathname === '/api/enquiries') {
      const body = await readJson(req);
      const fullName = cleanText(body.fullName, 120).replace(/\s+/g, ' ');
      const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
      const interestedCourse = cleanText(body.interestedCourse, 180);

      if (fullName.length < 2) {
        return sendJson(res, 400, { ok: false, error: 'Enter your full name.' });
      }
      if (!/^\+[1-9]\d{7,14}$/.test(phone)) {
        return sendJson(res, 400, { ok: false, error: 'Enter a valid phone number with country code.' });
      }
      if (interestedCourse.length < 2) {
        return sendJson(res, 400, { ok: false, error: 'Select a valid course.' });
      }
      const courseResult = await pool.query(
        'SELECT name FROM courses WHERE LOWER(name) = LOWER($1) LIMIT 1',
        [interestedCourse]
      );
      if (!courseResult.rowCount) {
        return sendJson(res, 400, { ok: false, error: 'The selected course is no longer available. Refresh the page and try again.' });
      }
      const canonicalCourseName = courseResult.rows[0].name;

      const saved = await pool.query(
        `INSERT INTO course_enquiries (full_name, phone, interested_course)
         VALUES ($1, $2, $3) RETURNING id, created_at`,
        [fullName, phone, canonicalCourseName]
      );
      return sendJson(res, 201, {
        ok: true,
        enquiryId: saved.rows[0].id,
        createdAt: saved.rows[0].created_at,
      });
    }

    // --------------------------------------------------
    // ADMIN: course enquiries (admin accounts only)
    // --------------------------------------------------
    if (req.method === 'GET' && url.pathname === '/api/admin/enquiries') {
      const session = await getCurrentSession(req);
      if (!session) return sendJson(res, 401, { ok: false, error: 'Sign in required.' });
      if (!isAdminUser(session)) return sendJson(res, 403, { ok: false, error: 'Admin access required.' });
      const result = await pool.query(
        `SELECT id, full_name, phone, interested_course, status, created_at, updated_at
           FROM course_enquiries ORDER BY created_at DESC LIMIT 2000`
      );
      return sendJson(res, 200, {
        ok: true,
        enquiries: result.rows.map((row) => ({
          id: row.id, fullName: row.full_name, phone: row.phone,
          interestedCourse: row.interested_course, status: row.status,
          createdAt: row.created_at, updatedAt: row.updated_at,
        })),
      });
    }

    const enquiryStatusMatch = url.pathname.match(/^\/api\/admin\/enquiries\/([0-9a-f-]{36})\/status$/i);
    if (req.method === 'PATCH' && enquiryStatusMatch) {
      const session = await getCurrentSession(req);
      if (!session) return sendJson(res, 401, { ok: false, error: 'Sign in required.' });
      if (!isAdminUser(session)) return sendJson(res, 403, { ok: false, error: 'Admin access required.' });
      const body = await readJson(req);
      const allowedStatuses = new Set(['new', 'contacted', 'follow_up', 'converted', 'closed']);
      if (!allowedStatuses.has(body.status)) {
        return sendJson(res, 400, { ok: false, error: 'Invalid enquiry status.' });
      }
      const updated = await pool.query(
        `UPDATE course_enquiries SET status = $1, updated_at = NOW()
          WHERE id = $2 RETURNING id, status`,
        [body.status, enquiryStatusMatch[1]]
      );
      if (!updated.rowCount) return sendJson(res, 404, { ok: false, error: 'Enquiry not found.' });
      return sendJson(res, 200, { ok: true, enquiry: updated.rows[0] });
    }

    // --------------------------------------------------
    // PUBLIC COURSE API
    // --------------------------------------------------
    if (
      req.method === 'GET' &&
      url.pathname === '/api/courses'
    ) {
      const courses = await getCourses();

      return sendJson(res, 200, {
        ok: true,
        courses,
      });
    }

    if (
      req.method === 'GET' &&
      url.pathname.startsWith('/api/courses/')
    ) {
      const id = decodeURIComponent(
        url.pathname.slice('/api/courses/'.length)
      );

      const course = await getCourseById(id);

      if (!course) {
        return sendJson(res, 404, {
          ok: false,
          error: 'Course not found',
        });
      }

      return sendJson(res, 200, {
        ok: true,
        course,
      });
    }

    // --------------------------------------------------
    // ADMIN: list registered users (admin accounts only)
    // --------------------------------------------------
    if (req.method === 'GET' && url.pathname === '/api/admin/users') {
      const session = await getCurrentSession(req);
      if (!session) return sendJson(res, 401, { ok: false, error: 'Sign in required.' });
      if (!isAdminUser(session)) return sendJson(res, 403, { ok: false, error: 'Admin access required.' });
      return sendJson(res, 200, { ok: true, ...(await listUsers()) });
    }

    // No matching route
    return sendJson(res, 404, {
      ok: false,
      error: 'Route not found',
    });
  } catch (error) {
    if (error?.type === 'body_too_large') {
      return sendJson(res, 413, {
        ok: false,
        error: 'Request body is too large.',
      });
    }

    if (error?.type === 'invalid_json') {
      return sendJson(res, 400, {
        ok: false,
        error: 'Invalid JSON request body.',
      });
    }

    console.error('API error:', error?.message || error);

    if (!res.headersSent) {
      return sendJson(res, 500, {
        ok: false,
        error: 'The request could not be completed.',
      });
    }

    if (!res.writableEnded) {
      res.end();
    }
  }
});

// --------------------------------------------------
// SECURITY HEADERS
// --------------------------------------------------
function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader(
    'Referrer-Policy',
    'strict-origin-when-cross-origin'
  );
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
}

// --------------------------------------------------
// CORS
// --------------------------------------------------
function applyCors(req, res) {
  const origin = req.headers.origin;

  if (origin && origin === config.appOrigin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader(
      'Access-Control-Allow-Credentials',
      'true'
    );
    res.setHeader('Vary', 'Origin');
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PATCH, DELETE, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type'
    );
  }
}

function isAllowedOrigin(req) {
  const origin = req.headers.origin;

  // Browser requests carrying cookies must use the configured origin.
  return !origin || origin === config.appOrigin;
}

// --------------------------------------------------
// JSON RESPONSE
// --------------------------------------------------
function sendJson(res, statusCode, payload) {
  if (res.writableEnded) return;

  const body = JSON.stringify(payload);

  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
  });

  res.end(body);
}

// --------------------------------------------------
// REDIRECT TO FRONTEND
// --------------------------------------------------
function redirectToFrontend(res, path) {
  res.writeHead(302, {
    Location: `${config.frontendUrl}${path}`,
    'Cache-Control': 'no-store',
  });

  res.end();
}

// --------------------------------------------------
// READ JSON REQUEST BODY
// --------------------------------------------------
async function readJson(req) {
  const chunks = [];
  let size = 0;

  for await (const chunk of req) {
    size += chunk.length;

    if (size > MAX_BODY_BYTES) {
      const error = new Error('Body too large');
      error.type = 'body_too_large';
      throw error;
    }

    chunks.push(chunk);
  }

  if (!size) return {};

  try {
    const body = JSON.parse(
      Buffer.concat(chunks).toString('utf8')
    );

    if (
      !body ||
      typeof body !== 'object' ||
      Array.isArray(body)
    ) {
      throw new Error('Expected object');
    }

    return body;
  } catch {
    const error = new Error('Invalid JSON');
    error.type = 'invalid_json';
    throw error;
  }
}

// --------------------------------------------------
// INPUT HELPERS
// --------------------------------------------------
function normalizeEmail(value) {
  return typeof value === 'string'
    ? value.trim().toLowerCase()
    : '';
}

function isValidEmail(email) {
  return (
    email.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return '';

  return value
    .trim()
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .slice(0, maxLength);
}

// --------------------------------------------------
// START SERVER AND CHECK DATABASE
// --------------------------------------------------
server.listen(config.port, async () => {
  console.log(
    `ISATS PostgreSQL API running at http://localhost:${config.port}`
  );

  console.log(
    `Database: ${config.pg.database} @ ${config.pg.host}:${config.pg.port}`
  );

  try {
    const db = await testConnection();

    console.log(
      `PostgreSQL connected successfully: ${db.database}`
    );

    await cleanupExpiredAuthRecords();

    console.log('Expired authentication records cleaned.');
  } catch (error) {
    console.error(
      'PostgreSQL startup check failed:',
      error.message
    );
  }

  const cleanupTimer = setInterval(() => {
    cleanupExpiredAuthRecords().catch((error) =>
      console.error(
        'Session cleanup failed:',
        error.message
      )
    );
  }, 60 * 60 * 1000);

  cleanupTimer.unref();

  console.log('GET /api/auth/me');
  console.log(
    'POST /api/auth/login, POST /api/auth/register, POST /api/auth/logout'
  );
});

// --------------------------------------------------
// CONNECTION AND SHUTDOWN HANDLING
// --------------------------------------------------
server.on('clientError', (_error, socket) => {
  if (socket.writable) {
    socket.end(
      'HTTP/1.1 400 Bad Request\r\nConnection: close\r\n\r\n'
    );
  }
});

async function shutdown() {
  server.close();

  try {
    await pool.end();
  } finally {
    process.exit(0);
  }
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);