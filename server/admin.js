import { pool } from './db.js';

// Comma-separated list in .env, e.g. ADMIN_EMAILS=isats.sales1@gmail.com
const adminEmails = () =>
  (process.env.ADMIN_EMAILS || 'isats.sales@gmail.com')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

// Admin = listed email AND a verified email (i.e. signed in with Google).
// Unverified email/password accounts can never be admin, so nobody can gain
// access by simply registering with an admin address.
export function isAdminUser(row) {
  return Boolean(
    row &&
      row.email_verified === true &&
      adminEmails().includes(String(row.email || '').toLowerCase()),
  );
}

export async function listUsers() {
  const { rows } = await pool.query(
    `SELECT u.id, u.email, u.email_verified, u.account_status, u.profile_completed,
            u.created_at, p.full_name, p.phone, p.preferred_course,
            COALESCE((SELECT array_agg(i.provider ORDER BY i.provider)
                        FROM auth_identities i WHERE i.user_id = u.id), '{}') AS providers,
            (SELECT COUNT(*) FROM user_sessions s
              WHERE s.user_id = u.id AND s.revoked_at IS NULL AND s.expires_at > NOW())::int AS active_sessions,
            (SELECT MAX(s.created_at) FROM user_sessions s WHERE s.user_id = u.id) AS last_login
       FROM users u
       LEFT JOIN user_profiles p ON p.user_id = u.id
      ORDER BY u.created_at DESC
      LIMIT 1000`,
  );
  return {
    users: rows.map((r) => ({
      id: r.id,
      email: r.email,
      emailVerified: r.email_verified,
      accountStatus: r.account_status,
      profileCompleted: r.profile_completed,
      fullName: r.full_name || '',
      phone: r.phone || '',
      preferredCourse: r.preferred_course || '',
      providers: r.providers,
      activeSessions: r.active_sessions,
      lastLogin: r.last_login,
      createdAt: r.created_at,
    })),
  };
}
