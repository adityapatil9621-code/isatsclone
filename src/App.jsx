
import React, { useEffect, useState } from 'react';
import {
  Route,
  Routes,
  BrowserRouter as Router,
  Navigate
} from 'react-router-dom';

import ScrollToTop from '@/components/ScrollToTop.jsx';
import { AuthProvider, useAuth } from '@/context/AuthContext.jsx';

import HomePage from '@/pages/HomePage.jsx';
import AboutUsPage from '@/pages/AboutUsPage.jsx';
import CoursesPage from '@/pages/CoursesPage.jsx';
import TrichologyCourses from '@/pages/TrichologyCourses.jsx';
import AestheticsCourses from '@/pages/AestheticsCourses.jsx';
import ClinicalAestheticsCourses from '@/pages/ClinicalAestheticsCourses.jsx';
import ContactUsPage from '@/pages/ContactUsPage.jsx';

import Login from '@/pages/Login.jsx';
import Register from '@/pages/Register.jsx';
import Profile from '@/pages/Profile.jsx';
import Admin from '@/pages/Admin.jsx';

import { Toaster } from '@/components/ui/toaster.jsx';

const CONSENT_STORAGE_KEY = 'isats_website_consent_v1';
const CONSENT_VERSION = '2026-09-02';

const COOKIE_PREFERENCES_KEY = 'isats_cookie_preferences_v1';
const COOKIE_PREFERENCES_VERSION = '1';

/* =====================================================
   PRIVACY AND TERMS CONSENT
===================================================== */

function ConsentGate({ onAccepted }) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  const canContinue = termsAccepted && privacyAcknowledged;

  const handleContinue = () => {
    if (!canContinue) return;

    const consentRecord = {
      version: CONSENT_VERSION,
      termsAccepted: true,
      privacyAcknowledged: true,
      marketingOptIn,
      acceptedAt: new Date().toISOString()
    };

    localStorage.setItem(
      CONSENT_STORAGE_KEY,
      JSON.stringify(consentRecord)
    );

    onAccepted();
  };

  return (
    <div
      className="isats-consent-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="isats-consent-title"
    >
      <div className="isats-consent-backdrop" />

      <section className="isats-consent-card">
        <div className="isats-consent-brand" aria-hidden="true">
          ISATS
        </div>

        <p className="isats-consent-eyebrow">
          Before you continue
        </p>

        <h1 id="isats-consent-title">
          Privacy &amp; Terms Confirmation
        </h1>

        <p className="isats-consent-intro">
          Please review the applicable ISATS policies and confirm
          your choices before accessing the website. The required
          confirmations below are separate from any optional
          promotional consent.
        </p>

        <div
          className="isats-policy-links"
          aria-label="ISATS legal policies"
        >
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
          >
            Privacy Policy <span aria-hidden="true">↗</span>
          </a>

          <a
            href="/terms-and-conditions"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms &amp; Conditions <span aria-hidden="true">↗</span>
          </a>
        </div>

        <div className="isats-consent-options">
          <label className="isats-consent-option required">
            <input
              type="checkbox"
              checked={privacyAcknowledged}
              onChange={(event) =>
                setPrivacyAcknowledged(event.target.checked)
              }
            />

            <span>
              I acknowledge that my personal data may be collected,
              used, stored and otherwise processed as described in
              the{' '}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
              >
                Privacy Policy
              </a>.
            </span>
          </label>

          <label className="isats-consent-option required">
            <input
              type="checkbox"
              checked={termsAccepted}
              onChange={(event) =>
                setTermsAccepted(event.target.checked)
              }
            />

            <span>
              I have read and agree to the{' '}
              <a
                href="/terms-and-conditions"
                target="_blank"
                rel="noopener noreferrer"
              >
                Terms &amp; Conditions
              </a>{' '}
              applicable to my use of ISATS services and website.
            </span>
          </label>

          <label className="isats-consent-option optional">
            <input
              type="checkbox"
              checked={marketingOptIn}
              onChange={(event) =>
                setMarketingOptIn(event.target.checked)
              }
            />

            <span>
              I separately opt in to receive promotional updates,
              workshop information and marketing communications
              from ISATS. This is optional and is not required to
              continue.
            </span>
          </label>
        </div>

        <p className="isats-consent-note">
          Marketing consent is optional. Declining it will not
          prevent you from using the website or proceeding to the
          next stage. You can review the policies and applicable
          choices again at any time.
        </p>

        <button
          type="button"
          className="isats-consent-button"
          disabled={!canContinue}
          onClick={handleContinue}
        >
          Accept &amp; Continue
        </button>

        <p className="isats-consent-footer">
          ISATS Private Limited · Policy version {CONSENT_VERSION}
        </p>
      </section>
    </div>
  );
}

/* =====================================================
   COOKIE CONSENT
===================================================== */

function CookieConsent() {
  const [preferences, setPreferences] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    try {
      const stored = JSON.parse(
        localStorage.getItem(COOKIE_PREFERENCES_KEY) || 'null'
      );

      if (stored?.version === COOKIE_PREFERENCES_VERSION) {
        setPreferences(stored);
        setAnalytics(stored.analytics === true);
        setMarketing(stored.marketing === true);
      } else {
        setShowBanner(true);
      }
    } catch {
      setShowBanner(true);
    }
  }, []);

  const savePreferences = (next) => {
    const record = {
      version: COOKIE_PREFERENCES_VERSION,
      necessary: true,
      analytics: next.analytics === true,
      marketing: next.marketing === true,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(
      COOKIE_PREFERENCES_KEY,
      JSON.stringify(record)
    );

    setPreferences(record);
    setAnalytics(record.analytics);
    setMarketing(record.marketing);
    setShowBanner(false);
    setShowSettings(false);

    window.dispatchEvent(
      new CustomEvent('isats-cookie-preferences-changed', {
        detail: record
      })
    );
  };

  if (!showBanner && !showSettings) {
    return (
      <button
        type="button"
        className="isats-cookie-reopen"
        onClick={() => setShowSettings(true)}
        aria-label="Open cookie settings"
      >
        Cookie settings
      </button>
    );
  }

  return (
    <div
      className="isats-cookie-layer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="isats-cookie-title"
    >
      <section className="isats-cookie-card">
        <p className="isats-consent-eyebrow">
          Your privacy choices
        </p>

        <h2 id="isats-cookie-title">
          {showSettings
            ? 'Cookie settings'
            : 'Your cookie preferences'}
        </h2>

        <p className="isats-cookie-description">
          ISATS uses necessary storage for core website and account
          functions. Optional analytics and marketing cookies remain
          off unless you choose to enable them. You can change your
          choice later using Cookie settings.
        </p>

        <div className="isats-cookie-option">
          <div>
            <strong>Necessary</strong>
            <p>
              Required for security, navigation and authentication.
              Always active.
            </p>
          </div>

          <span className="isats-cookie-required">
            Always on
          </span>
        </div>

        <label className="isats-cookie-option">
          <span>
            <strong>Analytics</strong>
            <p>
              Helps understand website usage and improve the site.
            </p>
          </span>

          <input
            type="checkbox"
            checked={analytics}
            onChange={(event) =>
              setAnalytics(event.target.checked)
            }
          />
        </label>

        <label className="isats-cookie-option">
          <span>
            <strong>Marketing</strong>
            <p>
              Allows optional marketing measurement and promotional
              tracking.
            </p>
          </span>

          <input
            type="checkbox"
            checked={marketing}
            onChange={(event) =>
              setMarketing(event.target.checked)
            }
          />
        </label>

        <div className="isats-cookie-actions">
          {!showSettings && (
            <button
              type="button"
              className="isats-cookie-button secondary"
              onClick={() =>
                savePreferences({
                  analytics: false,
                  marketing: false
                })
              }
            >
              Reject optional cookies
            </button>
          )}

          {!showSettings && (
            <button
              type="button"
              className="isats-cookie-button secondary"
              onClick={() => setShowSettings(true)}
            >
              Cookie settings
            </button>
          )}

          <button
            type="button"
            className="isats-cookie-button primary"
            onClick={() =>
              savePreferences({ analytics, marketing })
            }
          >
            {showSettings
              ? 'Save preferences'
              : 'Accept selected cookies'}
          </button>

          {!showSettings && (
            <button
              type="button"
              className="isats-cookie-text-button"
              onClick={() =>
                savePreferences({
                  analytics: true,
                  marketing: true
                })
              }
            >
              Accept optional cookies
            </button>
          )}

          {showSettings && preferences && (
            <button
              type="button"
              className="isats-cookie-text-button"
              onClick={() => setShowSettings(false)}
            >
              Cancel
            </button>
          )}
        </div>

        <p className="isats-cookie-footnote">
          Your selection is saved on this device. Necessary session
          cookies remain available for login and security.
        </p>
      </section>
    </div>
  );
}

/* =====================================================
   PRIVACY POLICY
===================================================== */

function PrivacyPolicyPage() {
  return (
    <main className="isats-legal-page">
      <div className="isats-legal-container">
        <p className="isats-consent-eyebrow">ISATS</p>

        <h1>Privacy Policy</h1>

        <p className="isats-legal-meta">
          Effective Date: September 2, 2026 · Last Updated:
          September 2, 2026
        </p>

        <h2>1. Introduction &amp; Statutory Scope</h2>
        <p>
          International School of Trichology and Aesthetics
          (ISATS) Private Limited (&quot;ISATS&quot;,
          &quot;Company&quot;, &quot;we&quot;, &quot;our&quot;,
          or &quot;us&quot;) operates an aesthetic medical clinic
          and vocational clinical training academy specializing
          in advanced procedures, including Botulinum Toxin,
          Medi-Facials, IV Nutrition Infusion, and Hair Restoration
          treatments.
        </p>
        <p>
          This Privacy Policy sets forth our policies and procedures
          regarding the collection, processing, storage, transfer,
          and protection of personal data obtained through our
          website, workshop registration portals, clinic
          consultation forms, and digital communication platforms.
          The policy is drafted with reference to the Digital
          Personal Data Protection (DPDP) Act, 2023, the Information
          Technology Act, 2000, and applicable data security
          regulations in India.
        </p>

        <h2>2. Categories of Personal Data Collected</h2>
        <p>
          ISATS follows data minimization and collects information
          necessary for educational training or safe aesthetic
          clinical care, including identity and demographic
          information, contact details, professional credentials,
          transaction records, clinical information, medical
          history and clinical imagery where applicable. Technical
          metadata and tracking identifiers may also be processed
          as described in the Privacy Policy.
        </p>

        <h2>3. Purpose Limitation &amp; Lawful Grounds for Processing</h2>
        <p>
          Processing purposes include workshop admissions and
          administration, aesthetic clinical care, financial and
          statutory accounting, and optional targeted outreach or
          advertising. Optional promotional processing is subject
          to affirmative opt-in.
        </p>

        <h2>4. Affirmative, Unbundled Consent Standards</h2>
        <p>
          ISATS states that optional permissions are unbundled,
          consent checkboxes are not pre-selected, and declining
          optional marketing communications does not restrict or
          delay enrollment or clinical appointments.
        </p>

        <h2>5. Cookies and Meta Pixel Tracking Controls</h2>
        <p>
          Strictly necessary cookies may support basic site
          navigation and authentication. Marketing and analytics
          trackers, including Meta Pixel, are stated to remain
          deactivated by default until affirmative acceptance
          through the consent management mechanism. Users may
          modify or revoke cookie preferences.
        </p>

        <h2>6. Data Sharing, Processors, and Third Parties</h2>
        <p>
          ISATS states that it does not sell, trade, rent, or lease
          personal information to commercial third parties or data
          brokers. Disclosures are limited to authorized service
          processors and legally required authorities as described
          in the Privacy Policy.
        </p>

        <h2>7. Retention Schedules &amp; Automated Data Purging</h2>
        <p>
          General leads and inactive inquiries are stated to be
          purged after twelve months of inactivity. Trainee
          certification records are retained for three years
          post-course completion, and patient medical files are
          preserved for a statutory minimum of seven years, subject
          to the applicable requirements stated by ISATS.
        </p>

        <h2>8. Information Security &amp; Technical Measures</h2>
        <p>
          ISATS describes SSL/TLS transmission security, role-based
          access controls and multi-factor authentication for
          administrative accounts, hosting dashboards and
          communication channels.
        </p>

        <h2>9. Rights of Data Principals</h2>
        <p>
          The Privacy Policy describes rights including access,
          correction and updating, erasure subject to statutory
          retention obligations, withdrawal of promotional consent,
          and nomination of an authorized individual in the event
          of death or legal incapacity.
        </p>

        <h2>10. Grievance Redressal Mechanism</h2>
        <p>
          Grievance contact: ISATS Private Limited, Makhija Royale
          Building, 404, Swami Vivekanand Rd, above Noble Chemist,
          Govind Dham, Ram Krishna Nagar, Khar West, Mumbai,
          Maharashtra 400052, India. Email: isats.sales1@gmail.com.
          Telephone: +91 98674 20241.
        </p>

        <h2>11. Governing Law &amp; Jurisdiction</h2>
        <p>
          This Privacy Policy is governed by the laws of India and
          states that disputes are subject to the competent civil
          courts located in Mumbai, Maharashtra.
        </p>

        <h2>12. Policy Review &amp; Modifications</h2>
        <p>
          ISATS reserves the right to update the policy
          periodically. Updates are published with a revised
          &quot;Last Updated&quot; date.
        </p>

        <a className="isats-back-link" href="/">
          ← Return to website
        </a>
      </div>
    </main>
  );
}

/* =====================================================
   TERMS AND CONDITIONS
===================================================== */

function TermsAndConditionsPage() {
  return (
    <main className="isats-legal-page">
      <div className="isats-legal-container">
        <p className="isats-consent-eyebrow">ISATS</p>

        <h1>Terms &amp; Conditions</h1>

        <p className="isats-legal-meta">
          Effective Date: September 2, 2026
        </p>

        <h2>1. Introduction and Scope of Agreement</h2>
        <p>
          These Terms and Conditions govern access to and use of
          ISATS clinical aesthetic services, educational courses,
          training workshops, websites, digital communications,
          and facilities. By enrolling, booking or receiving
          clinical treatments, or accessing online platforms, a
          user agrees to be legally bound by these Terms. If the
          Terms are not accepted in full, the user must not
          register for courses or schedule procedures.
        </p>

        <h2>2. Dual-Function Operational Nature</h2>
        <p>
          ISATS operates as an educational academy offering
          vocational and skill-based clinical training workshops
          and as an aesthetic clinic providing patient-centered
          cosmetology, skincare and hair restoration procedures.
          Specific provisions apply distinctly to educational
          workshops and clinical treatments.
        </p>

        <h2>3. Educational Academy and Workshop Provisions</h2>
        <p>
          Clinical, semi-invasive or injectable workshops require
          demonstrable medical, dental or clinical qualifications
          as prescribed by applicable Indian medical regulations.
          Applicants must submit accurate credential information.
          Hands-on training is conducted under qualified clinical
          supervision, and procedures may not be performed without
          the required authorization and supervision.
        </p>

        <h2>4. Clinical Aesthetic Procedures and Patient Care</h2>
        <p>
          Clinical treatments are preceded by consultation and a
          specific Procedure Informed Consent Form. Patients must
          disclose relevant medical history and review documented
          risks, side effects and recovery timelines before
          treatment.
        </p>

        <h2>5. Fee Schedules, Cancellations, and Refund Policies</h2>
        <p>
          Fees are quoted in INR and subject to applicable GST.
          Workshop and appointment cancellation, transfer and
          refund rules are governed by the notice windows and
          conditions specified in the full Terms and Conditions
          document, including the stated treatment and course
          non-refundability provisions.
        </p>

        <h2>6. Intellectual Property and Proprietary Training Materials</h2>
        <p>
          ISATS training curricula, clinical slide decks,
          procedural protocols, video recordings, dosage matrices,
          branded manuals, brochures and digital assets remain the
          exclusive intellectual property of ISATS. Unauthorized
          reproduction, recording, resale or public dissemination
          is prohibited.
        </p>

        <h2>7. Photography, Video Recording, and Consent</h2>
        <p>
          Clinical and educational sessions may involve
          documentation for educational case studies or promotional
          materials. An explicit Media Consent Form is presented
          before photography or filming, and facial identifiers
          are anonymized or masked unless affirmative consent has
          been granted.
        </p>

        <h2>8. Limitation of Liability and Indemnification</h2>
        <p>
          The Terms contain limitations of liability and
          indemnification provisions to the maximum extent
          permitted by Indian law, including provisions relating
          to unauthorized practice, willful misconduct, breach of
          the Terms and third-party rights.
        </p>

        <h2>9. Data Privacy and DPDP Act Alignment</h2>
        <p>
          Personal information and clinical data collected during
          registration, inquiry or consultation are governed by the
          ISATS Privacy Policy. The Terms state that engagement
          with ISATS involves consent to lawful processing,
          storage and handling of data as set out in that Privacy
          Policy.
        </p>

        <h2>10. Dispute Resolution, Governing Law, and Jurisdiction</h2>
        <p>
          The Terms are governed by the laws of India. Parties are
          to first attempt good-faith mediation, with disputes
          that are not informally settled within thirty days of
          written notice submitted to the competent civil courts
          situated in Mumbai, Maharashtra.
        </p>

        <h2>11. Contact and Corporate Details</h2>
        <p>
          Legal &amp; Compliance Department, International School
          of Trichology and Aesthetics (ISATS) Private Limited,
          Makhija Royale Building, 404, Swami Vivekanand Rd, above
          Noble Chemist, Govind Dham, Ram Krishna Nagar, Khar West,
          Mumbai, Maharashtra 400052. Telephone: +91 98674 20241.
          Email: isats.sales1@gmail.com.
        </p>

        <a className="isats-back-link" href="/">
          ← Return to website
        </a>
      </div>
    </main>
  );
}

/* =====================================================
   ADMIN ROUTE PROTECTION
===================================================== */

function RequireAdmin({ children }) {
  const { status, isAdmin } = useAuth();

  if (status === 'checking') {
    return (
      <main className="auth-page">
        <div className="auth-card auth-loading">
          Checking your session…
        </div>
      </main>
    );
  }

  if (status === 'anonymous') {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{ from: '/admin' }}
      />
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function RequireAuth({ children }) {
  const { status, isAuthenticated } = useAuth();

  if (status === 'checking') {
    return (
      <main className="auth-page">
        <div className="auth-card auth-loading">
          Checking your session…
        </div>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
/* =====================================================
   WEBSITE ROUTES
===================================================== */

function MainWebsite() {
  return (
    <>
      <ScrollToTop />

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutUsPage />} />

        <Route path="/courses" element={<CoursesPage />} />

        <Route
          path="/courses/trichology"
          element={<TrichologyCourses />}
        />

        <Route
          path="/courses/aesthetics"
          element={<AestheticsCourses />}
        />

        <Route
          path="/courses/clinical-aesthetics"
          element={<ClinicalAestheticsCourses />}
        />

        <Route path="/contact" element={<ContactUsPage />} />

        {/* Legal pages */}
        <Route
          path="/privacy-policy"
          element={<PrivacyPolicyPage />}
        />

        <Route
          path="/terms-and-conditions"
          element={<TermsAndConditionsPage />}
        />

        {/* Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Administrator */}
        <Route path="/admin/login" element={<Login />} />

        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <Admin />
            </RequireAdmin>
          }
        />

        {/* Student profile */}
        <Route
          path="/profile"
          element={
            <RequireAuth>
              <Profile />
            </RequireAuth>
          }
        />

        {/* Student profile completion */}
        <Route
          path="/profile/complete"
          element={
            <RequireAuth>
              <Profile completionOnly />
            </RequireAuth>
          }
        />

        {/* Unknown routes */}
        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </>
  );
}

/* =====================================================
   MAIN APP
===================================================== */

function App() {
  const [hasConsented, setHasConsented] = useState(false);
  const [checkedConsent, setCheckedConsent] = useState(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem(
      CONSENT_STORAGE_KEY
    );

    if (storedConsent) {
      try {
        const parsedConsent = JSON.parse(storedConsent);

        setHasConsented(
          parsedConsent?.version === CONSENT_VERSION &&
          parsedConsent?.termsAccepted === true &&
          parsedConsent?.privacyAcknowledged === true
        );
      } catch {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
      }
    }

    setCheckedConsent(true);
  }, []);

  if (!checkedConsent) return null;

  const isPolicyPage =
    window.location.pathname === '/privacy-policy' ||
    window.location.pathname === '/terms-and-conditions';

  return (
    <Router>
      {isPolicyPage || hasConsented ? (
        <>
          <AuthProvider>
            <MainWebsite />
            
          </AuthProvider>
          {hasConsented && <CookieConsent />}
        </>
      ) : (
        <ConsentGate
          onAccepted={() => setHasConsented(true)}
        />
      )}

      <Toaster />
    </Router>
  );
}

export default App;
