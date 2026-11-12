import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { signInWithGoogle } from '../googleSignIn.js';

const authErrors = {
  google_cancelled: 'Google sign-in was cancelled.',
  google_not_configured: 'Google sign-in is not configured yet. Use email and password or configure the Google OAuth credentials.',
  google_already_linked: 'That Google account is already linked to another ISATS account.',
  invalid_oauth_state: 'The sign-in request expired or could not be verified. Please try again.',
  account_link_required: 'An account already uses this email. Sign in with that account first, then link Google from your profile.',
  link_session_expired: 'Your session expired while linking Google. Sign in again and retry.',
  google_failed: 'Google sign-in could not be completed. Please try again.',
  admin_only: 'This sign-in is reserved for ISATS administrators.'
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(authErrors[new URLSearchParams(location.search).get('authError')] || '');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to sign in.');
      if (result.user?.isAdmin) {
        navigate('/admin', { replace: true, state: { openAdmin: true } });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'Unable to sign in.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setBusy(true);
    try {
      const result = await signInWithGoogle();
      if (!result?.user) throw new Error('Unable to retrieve your account information.');
      if (result.user.isAdmin) {
        navigate('/admin', { replace: true, state: { openAdmin: true } });
      } else {
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(err.code === 'auth/popup-closed-by-user' ? 'Google sign-in was cancelled.' : err.message || 'Google sign-in failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="isats-auth-layout">
      <section className="isats-auth-visual isats-login-visual">
        <Link to="/" className="isats-auth-logo" aria-label="ISATS home">ISATS<span>.</span></Link>
        <div className="isats-auth-visual-copy">
          <span className="isats-auth-kicker">YOUR NEXT CHAPTER STARTS HERE</span>
          <h1>Build skills.<br /><em>Shape futures.</em></h1>
          <p>Continue your learning journey with ISATS. Practical knowledge, professional confidence and new possibilities begin with one step.</p>
        </div>
        <div className="isats-auth-visual-footer"><span>INSTITUTE OF SKILL-BASED AESTHETIC & TRICHOLOGY SCIENCES</span><span>LEARN · PRACTICE · GROW</span></div>
      </section>

      <section className="isats-auth-form-side">
        <div className="isats-auth-form-wrap">
          <Link to="/" className="isats-auth-mobile-logo">ISATS<span>.</span></Link>
          <Link to="/" className="isats-auth-back"><ArrowLeft size={15} /> Back to website</Link>
          <div className="isats-auth-heading">
            
            <p>Sign in to continue to your ISATS account.</p>
          </div>

          {error && <div className="auth-message auth-error" role="alert">{error}</div>}

          <button className="isats-auth-google" type="button" disabled={busy} onClick={handleGoogleSignIn}>
            <GoogleMark /> {busy ? 'Please wait...' : 'Continue with Google'}
          </button>
          <div className="isats-auth-divider"><span>or sign in with email</span></div>

          <form onSubmit={handleSubmit} className="isats-auth-form">
            <div className="isats-auth-field">
              <label htmlFor="login-email">Email address</label>
              <input id="login-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} disabled={busy} />
            </div>
            <div className="isats-auth-field">
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} required maxLength={128} disabled={busy} />
            </div>
            <button className="isats-auth-submit" type="submit" disabled={busy}>{busy ? 'Signing in...' : <>Sign in <ArrowRight size={17} /></>}</button>
          </form>

          <p className="isats-auth-switch">Don't have an account? <Link to="/register">Create an account</Link></p>
          <div className="isats-auth-security"><ShieldCheck size={16} /><span>Your account information is handled securely.</span></div>
        </div>
      </section>
    </main>
  );
}

function GoogleMark() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" width="19" height="19"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.02 46.98 31.86 46.98 24.55Z"/><path fill="#FBBC05" d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.94 23.94 0 0 0 0 21.56l7.98-6.19Z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"/></svg>;
}
