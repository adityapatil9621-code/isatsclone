import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PhoneInput from '@/components/PhoneInput.jsx';
import { validatePhone } from '@/lib/phone.js';


export default function Profile({ completionOnly = false }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({ fullName: '', phone: '', preferredCourse: '' });
  const [phoneError, setPhoneError] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [providers, setProviders] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(new URLSearchParams(window.location.search).has('googleLinked') ? 'Google has been linked to your account.' : '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadSessions = useCallback(async () => {
    const response = await fetch('/api/auth/sessions', { credentials: 'include' });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Could not load active sessions.');
    setSessions(result.sessions || []);
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch('/api/profile', { credentials: 'include' });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Could not load profile.');
        if (!active) return;
        setEmail(result.user.email);
        setEmailVerified(Boolean(result.user.emailVerified));
        setProfile(result.user.profile || { fullName: '', phone: '', preferredCourse: '' });
        setProviders(result.linkedProviders || []);
        await loadSessions();
      } catch (err) {
        if (active) setError(err.message || 'Could not load profile.');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [loadSessions]);

  async function saveProfile(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    const phoneProblem = validatePhone(profile.phone);
    setPhoneError(phoneProblem);
    if (phoneProblem) return;
      
    setSaving(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not save profile.');
      setProfile(result.user.profile);
      setNotice('Profile saved.');
      if (completionOnly) navigate('/profile', { replace: true });
    } catch (err) {
      setError(err.message || 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      navigate('/', { replace: true });
      window.location.reload();
    }
  }

  async function revokeSession(id) {
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/auth/sessions/${encodeURIComponent(id)}`, { method: 'DELETE', credentials: 'include' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not sign out that device.');
      await loadSessions();
      setNotice('That session has been signed out.');
    } catch (err) {
      setError(err.message || 'Could not sign out that device.');
    }
  }

  async function logoutOtherSessions() {
    setError('');
    try {
      const response = await fetch('/api/auth/sessions', { method: 'DELETE', credentials: 'include' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Could not sign out other devices.');
      await loadSessions();
      setNotice('All other devices have been signed out.');
    } catch (err) {
      setError(err.message || 'Could not sign out other devices.');
    }
  }

  if (loading) return <main className="auth-page"><div className="auth-card auth-loading">Loading profile…</div></main>;

  return (
    <main className="profile-page">
      <div className="profile-shell">
        <header className="profile-header">
          <Link to="/" className="auth-brand">ISATS</Link>
          <div><p className="auth-eyebrow">YOUR ACCOUNT</p><h1>{completionOnly ? 'Complete your profile' : 'Profile settings'}</h1><p>Manage your personal information.</p></div>
          <button type="button" className="auth-secondary" onClick={logout}>Sign out</button>
        </header>
        {error && <div className="auth-message auth-error" role="alert">{error}</div>}
        {notice && <div className="auth-message auth-success" role="status">{notice}</div>}

        <section className="profile-panel">
          <div className="profile-panel-heading"><div><h2>Personal information</h2><p>Only provide details needed to communicate with ISATS.</p></div></div>
          <div className="profile-email-row"><div><span className="profile-label">Account email</span><strong>{email}</strong></div><span className={`profile-status ${emailVerified ? 'is-verified' : 'is-unverified'}`}>{emailVerified ? 'Verified' : 'Not verified'}</span></div>
          {!emailVerified && <p className="profile-note">Email verification email delivery is not configured yet. Google can be linked after signing in here with the same email and completing Google verification.</p>}
          <form onSubmit={saveProfile} className="profile-form">
            <div className="form-group"><label htmlFor="profile-full-name">Full name</label><input id="profile-full-name" value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} required minLength={2} maxLength={120} /></div>
            <div className="form-group"><label htmlFor="profile-phone">Phone number <span className="optional-label">Optional</span></label><PhoneInput id="profile-phone" value={profile.phone} onChange={(phone) => { setProfile({ ...profile, phone }); setPhoneError(''); }} error={phoneError} /></div>
            
            <button className="auth-submit profile-save" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button>
          </form>
        </section>

        <section className="profile-panel">
          <div className="profile-panel-heading"><div><h2>Sign-in methods</h2><p>Use Google or email and password to access your account.</p></div></div>
          <div className="provider-row"><div className="provider-icon">G</div><div className="provider-details"><strong>Google</strong><span>{providers.includes('google') ? 'Connected to this account' : 'Not connected'}</span></div>{providers.includes('google') ? <span className="profile-status is-verified">Connected</span> : <a className="auth-secondary auth-link-button" href="/api/auth/google?mode=link">Link Google</a>}</div>
          
          </section>

       
        <footer className="profile-footer"><Link to="/privacy-policy">Privacy Policy</Link><span>·</span><Link to="/terms-and-conditions">Terms &amp; Conditions</Link><span>·</span><Link to="/">Return to website</Link></footer>
      </div>
    </main>
  );
}

function formatDate(value) {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

function describeDevice(userAgent = '') {
  if (/iphone|ipad/i.test(userAgent)) return 'Apple mobile device';
  if (/android/i.test(userAgent)) return 'Android device';
  if (/windows/i.test(userAgent)) return 'Windows computer';
  if (/macintosh|mac os/i.test(userAgent)) return 'Mac computer';
  if (/linux/i.test(userAgent)) return 'Linux computer';
  return 'Other device';
}
