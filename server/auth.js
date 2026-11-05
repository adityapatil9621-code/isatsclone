import crypto from 'node:crypto';
import { isAdminUser } from './admin.js';
import { promisify } from 'node:util';
import { pool } from './db.js';
import { config } from './config.js';

const scrypt = promisify(crypto.scrypt);
const SESSION_COOKIE = 'isats_session';
const OAUTH_STATE_COOKIE = 'isats_oauth_state';
const SESSION_MS =  24 * 60 * 60 * 1000;
const STATE_MS = 10 * 60 * 1000;

export function hashToken(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function randomToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

function cookieOptions({ maxAge, httpOnly = true, sameSite = 'Lax', secure = config.isProduction } = {}) {
  return [
    'Path=/',
    'HttpOnly',
    `SameSite=${sameSite}`,
    ...(secure ? ['Secure'] : []),
    ...(Number.isFinite(maxAge) ? [`Max-Age=${Math.max(0, Math.floor(maxAge / 1000))}`] : []),
  ].join('; ');
}

function appendCookie(res, value) {
  const current = res.getHeader('Set-Cookie');
  res.setHeader('Set-Cookie', current ? [...(Array.isArray(current) ? current : [current]), value] : value);
}

export function setSessionCookie(res, token) {
  appendCookie(res, `${SESSION_COOKIE}=${encodeURIComponent(token)}; ${cookieOptions({ maxAge: SESSION_MS })}`);
}

export function clearSessionCookie(res) {
  appendCookie(res, `${SESSION_COOKIE}=; ${cookieOptions({ maxAge: 0 })}`);
}

export function setOAuthStateCookie(res, state) {
  appendCookie(res, `${OAUTH_STATE_COOKIE}=${encodeURIComponent(state)}; ${cookieOptions({ maxAge: STATE_MS })}`);
}

export function clearOAuthStateCookie(res) {
  appendCookie(res, `${OAUTH_STATE_COOKIE}=; ${cookieOptions({ maxAge: 0 })}`);
}

export function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};
  for (const part of header.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();
    try { cookies[name] = decodeURIComponent(value); } catch { cookies[name] = ''; }
  }
  return cookies;
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  return `scrypt$16384$8$1$${salt}$${Buffer.from(derived).toString('hex')}`;
}

export async function verifyPassword(password, stored) {
  if (typeof stored !== 'string') return false;
  const parts = stored.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, n, r, p, salt, expectedHex] = parts;
  if (Number(n) !== 16384 || Number(r) !== 8 || Number(p) !== 1 || !/^[a-f0-9]{32}$/.test(salt) || !/^[a-f0-9]{128}$/.test(expectedHex)) return false;
  const actual = Buffer.from(await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }));
  const expected = Buffer.from(expectedHex, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export async function createSession(res, req, userId) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + SESSION_MS);
  await pool.query(
    `INSERT INTO user_sessions (user_id, session_token_hash, user_agent, expires_at)
     VALUES ($1, $2, $3, $4)`,
    [userId, hashToken(token), String(req.headers['user-agent'] || '').slice(0, 500) || null, expiresAt],
  );
  setSessionCookie(res, token);
  return expiresAt;
}

export async function getCurrentSession(req, { touch = true } = {}) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token || token.length > 200) return null;
  const result = await pool.query(
    `SELECT s.id AS session_id, s.user_id, s.created_at AS session_created_at,
            s.last_activity_at, s.expires_at, u.email, u.email_verified,
            u.account_status, u.profile_completed, p.full_name, p.phone,
            p.preferred_course
       FROM user_sessions s
       JOIN users u ON u.id = s.user_id
       LEFT JOIN user_profiles p ON p.user_id = u.id
      WHERE s.session_token_hash = $1
        AND s.revoked_at IS NULL
        AND s.expires_at > NOW()
        AND u.account_status = 'active'
      LIMIT 1`,
    [hashToken(token)],
  );
  const session = result.rows[0] || null;
  if (session && touch) {
    await pool.query('UPDATE user_sessions SET last_activity_at = NOW() WHERE id = $1', [session.session_id]);
  }
  return session;
}

export async function revokeCurrentSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token || token.length > 200) return;
  await pool.query(
    'UPDATE user_sessions SET revoked_at = NOW() WHERE session_token_hash = $1 AND revoked_at IS NULL',
    [hashToken(token)],
  );
}

export function publicUser(session) {
  return {
    isAdmin: isAdminUser(session),
    id: session.user_id,
    email: session.email,
    emailVerified: session.email_verified,
    profileCompleted: session.profile_completed,
    profile: {
      fullName: session.full_name || '',
      phone: session.phone || '',
      preferredCourse: session.preferred_course || '',
    },
  };
}

export async function cleanupExpiredAuthRecords() {
  await pool.query("DELETE FROM user_sessions WHERE expires_at <= NOW() OR (revoked_at IS NOT NULL AND revoked_at < NOW() - INTERVAL '30 days')");
  await pool.query('DELETE FROM oauth_states WHERE expires_at <= NOW()');
}

export async function createOrGetGoogleUser({ sub, email, name }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!sub || !normalizedEmail) throw new Error('Google account did not provide a verified email.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const identity = await client.query(
      `SELECT u.id, u.email, u.account_status FROM auth_identities i
       JOIN users u ON u.id = i.user_id
       WHERE i.provider = 'google' AND i.provider_subject = $1 FOR UPDATE`, [sub],
    );
    if (identity.rows[0]) {
      if (identity.rows[0].account_status !== 'active') throw new Error('This account is not active.');
      await client.query('COMMIT');
      return identity.rows[0];
    }
    const existing = await client.query('SELECT id, email, email_verified, account_status FROM users WHERE LOWER(email) = $1 FOR UPDATE', [normalizedEmail]);
    let user;
    if (existing.rows[0]) {
      user = existing.rows[0];
      if (user.account_status !== 'active') throw new Error('This account is not active.');
      const linked = await client.query("SELECT 1 FROM auth_identities WHERE user_id = $1 AND provider = 'google'", [user.id]);
      if (linked.rows.length) throw new Error('A different Google account is already linked to this email.');
      // Google has just proved ownership of this email, so attach it to the existing account.
      if (!user.email_verified) {
        // Unverified password account: anyone could have registered this email,
        // so the old password is removed and old sessions are signed out.
        await client.query("DELETE FROM auth_identities WHERE user_id = $1 AND provider = 'password'", [user.id]);
        await client.query('UPDATE user_sessions SET revoked_at = NOW() WHERE user_id = $1 AND revoked_at IS NULL', [user.id]);
      }
      await client.query("INSERT INTO auth_identities (user_id, provider, provider_subject) VALUES ($1, 'google', $2)", [user.id, sub]);
      await client.query('UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1', [user.id]);
      if (name) await client.query('UPDATE user_profiles SET full_name = COALESCE(full_name, $2), updated_at = NOW() WHERE user_id = $1', [user.id, String(name).trim().slice(0, 120)]);
    } else {
      const created = await client.query(
        `INSERT INTO users (email, email_verified, profile_completed)
         VALUES ($1, TRUE, $2) RETURNING id, email, account_status`,
        [normalizedEmail, Boolean(String(name || '').trim())],
      );
      user = created.rows[0];
      await client.query(
        `INSERT INTO user_profiles (user_id, full_name) VALUES ($1, $2)`,
        [user.id, String(name || '').trim().slice(0, 120) || null],
      );
      await client.query(
        `INSERT INTO auth_identities (user_id, provider, provider_subject)
         VALUES ($1, 'google', $2)`, [user.id, sub],
      );
    }
    await client.query('COMMIT');
    return user;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}


export async function linkGoogleIdentity(userId, { sub, email, name }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!sub || !normalizedEmail) throw new Error('Google did not return a valid verified identity.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const userResult = await client.query('SELECT id, email, email_verified FROM users WHERE id = $1 FOR UPDATE', [userId]);
    const user = userResult.rows[0];
    if (!user) throw new Error('Account not found.');
    if (user.email.toLowerCase() !== normalizedEmail) {
      throw new Error('The verified Google email must match the email on your ISATS account.');
    }
    const alreadyLinked = await client.query("SELECT id FROM auth_identities WHERE user_id = $1 AND provider = 'google'", [userId]);
    if (alreadyLinked.rows.length) throw new Error('A Google account is already linked to this profile.');
    await client.query("INSERT INTO auth_identities (user_id, provider, provider_subject) VALUES ($1, 'google', $2)", [userId, sub]);
    await client.query('UPDATE users SET email_verified = TRUE, updated_at = NOW() WHERE id = $1', [userId]);
    if (name) await client.query('UPDATE user_profiles SET full_name = COALESCE(full_name, $2), updated_at = NOW() WHERE user_id = $1', [userId, String(name).trim().slice(0, 120)]);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function exchangeGoogleCode(code) {
  if (!config.google.clientId || !config.google.clientSecret || !config.google.redirectUri) {
    throw new Error('Google sign-in is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET and GOOGLE_REDIRECT_URI.');
  }
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.google.clientId,
      client_secret: config.google.clientSecret,
      redirect_uri: config.google.redirectUri,
      grant_type: 'authorization_code',
    }),
    signal: AbortSignal.timeout(10000),
  });
  const tokenData = await tokenResponse.json();
  if (!tokenResponse.ok || !tokenData.access_token) throw new Error('Google sign-in could not be completed. Please try again.');
  const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
    signal: AbortSignal.timeout(10000),
  });
  const profile = await userResponse.json();
  if (!userResponse.ok || !profile.sub || !profile.email || profile.email_verified !== true) {
    throw new Error('Google must provide a verified email address to continue.');
  }
  return { sub: profile.sub, email: profile.email, name: profile.name || '' };
}

export async function startGoogleAuthorization(res, purpose, userId = null) {
  if (!config.google.clientId || !config.google.redirectUri) {
    throw new Error('Google sign-in is not configured. Set GOOGLE_CLIENT_ID and GOOGLE_REDIRECT_URI.');
  }
  const state = randomToken(32);
  await pool.query(
    'INSERT INTO oauth_states (state_hash, purpose, user_id, expires_at) VALUES ($1, $2, $3, $4)',
    [hashToken(state), purpose, userId, new Date(Date.now() + STATE_MS)],
  );
  setOAuthStateCookie(res, state);
  const authorize = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  authorize.search = new URLSearchParams({
    client_id: config.google.clientId,
    redirect_uri: config.google.redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  }).toString();
  res.writeHead(302, { Location: authorize.toString(), 'Cache-Control': 'no-store' });
  res.end();
}

export async function consumeOAuthState(req, state) {
  const cookieState = parseCookies(req)[OAUTH_STATE_COOKIE];
  if (!state || !cookieState || state !== cookieState) return null;
  const result = await pool.query(
    'DELETE FROM oauth_states WHERE state_hash = $1 AND expires_at > NOW() RETURNING purpose, user_id',
    [hashToken(state)],
  );
  return result.rows[0] || null;
}


export const sessionPolicy = { maxAgeMs: SESSION_MS, maxAgeDays: 1 };
