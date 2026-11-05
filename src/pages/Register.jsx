
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithGoogle } from '../googleSignIn.js';

export default function Register() {
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Use a password with at least 8 characters.');
      return;
    }

    setBusy(true);

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          password
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || 'Unable to create your account.'
        );
      }

      // Student registration redirects to Home.
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create your account.');
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogleSignIn() {
    setError('');
    setBusy(true);

    try {
      const result = await signInWithGoogle();

      if (!result?.user) {
        throw new Error('Unable to retrieve your account information.');
      }

      if (result.user.isAdmin) {
        navigate('/admin', {
          replace: true,
          state: { openAdmin: true }
        });
      } else {
        // Student Google registration redirects to Home.
        navigate('/', { replace: true });
      }
    } catch (err) {
      setError(
        err.code === 'auth/popup-closed-by-user'
          ? 'Google sign-in was cancelled.'
          : err.message || 'Unable to sign in with Google.'
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="register-title">
        <Link
          to="/"
          className="auth-brand"
          aria-label="ISATS home"
        >
          ISATS
        </Link>

        <div className="auth-header">
          <p className="auth-eyebrow">STUDENT REGISTRATION</p>
          <h1 id="register-title">Create your account</h1>
          <p>
            Join ISATS and begin your professional learning journey.
          </p>
        </div>

        {error && (
          <div className="auth-message auth-error" role="alert">
            {error}
          </div>
        )}

        <button
          className="auth-google"
          type="button"
          disabled={busy}
          onClick={handleGoogleSignIn}
        >
          <GoogleMark />
          {busy ? 'Please wait...' : 'Continue with Google'}
        </button>

        <div className="auth-divider">
          <span>or register with email</span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="register-name">Full name</label>
            <input
              id="register-name"
              type="text"
              autoComplete="name"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              placeholder="Enter your full name"
              required
              minLength={2}
              maxLength={120}
              disabled={busy}
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email address</label>
            <input
              id="register-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Enter your email address"
              required
              maxLength={254}
              disabled={busy}
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Create a password"
              required
              minLength={8}
              maxLength={128}
              disabled={busy}
            />
            <small>Use 8–128 characters.</small>
          </div>

          <div className="form-group">
            <label htmlFor="register-confirm-password">
              Confirm password
            </label>
            <input
              id="register-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Confirm your password"
              required
              maxLength={128}
              disabled={busy}
            />
          </div>

          <button
            className="auth-submit"
            type="submit"
            disabled={busy}
          >
            {busy ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="auth-legal">
          By creating an account, you acknowledge the ISATS{' '}
          <Link to="/privacy-policy">Privacy Policy</Link> and{' '}
          <Link to="/terms-and-conditions">
            Terms &amp; Conditions
          </Link>.
        </p>

        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>

        <Link to="/" className="auth-back">
          ← Back to website
        </Link>
      </section>
    </main>
  );
}

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 48 48"
      width="19"
      height="19"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5Z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.02 46.98 31.86 46.98 24.55Z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.94 23.94 0 0 0 0 21.56l7.98-6.19Z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.14 1.44-4.89 2.3-8.18 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48Z"
      />
    </svg>
  );
}
