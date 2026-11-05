
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import dotenv from 'dotenv';
import {
  applicationDefault,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, '..');

// Load the project's root .env file explicitly.
dotenv.config({
  path: path.join(projectRoot, '.env'),
});

// Resolve the service-account path relative to the project root.
const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? path.resolve(projectRoot, process.env.GOOGLE_APPLICATION_CREDENTIALS)
  : null;

let serviceAccount = null;

if (credentialPath && fs.existsSync(credentialPath)) {
  serviceAccount = JSON.parse(
    fs.readFileSync(credentialPath, 'utf8')
  );
}

const projectId =
  process.env.FIREBASE_PROJECT_ID ||
  serviceAccount?.project_id;

if (!projectId) {
  throw new Error(
    'Firebase project ID is missing. Set FIREBASE_PROJECT_ID in the root .env or provide a valid service-account JSON file.'
  );
}

if (
  !credentialPath ||
  !fs.existsSync(credentialPath)
) {
  throw new Error(
    'Firebase service-account file was not found. Check GOOGLE_APPLICATION_CREDENTIALS in the root .env.'
  );
}

if (serviceAccount.project_id !== projectId) {
  throw new Error(
    'FIREBASE_PROJECT_ID does not match the service-account project_id.'
  );
}

if (!getApps().length) {
  initializeApp({
    credential: applicationDefault(),
    projectId,
  });
}

export async function verifyFirebaseGoogleToken(idToken) {
  if (
    typeof idToken !== 'string' ||
    idToken.length === 0 ||
    idToken.length > 10000
  ) {
    throw new Error('Invalid Firebase ID token.');
  }

  const firebaseAuth = getAuth();

  // Verify token signature, expiry, revocation and project audience.
  const decoded = await firebaseAuth.verifyIdToken(idToken, true);

  if (
    decoded.firebase?.sign_in_provider !== 'google.com' ||
    decoded.email_verified !== true ||
    !decoded.email
  ) {
    throw new Error('A verified Google account is required.');
  }

  const firebaseUser = await firebaseAuth.getUser(decoded.uid);

  if (firebaseUser.disabled) {
    throw new Error('This Firebase account is disabled.');
  }

  const googleIdentity = firebaseUser.providerData.find(
    (provider) => provider.providerId === 'google.com'
  );

  if (
    !googleIdentity?.uid ||
    !googleIdentity.email ||
    googleIdentity.email.toLowerCase() !==
      decoded.email.toLowerCase()
  ) {
    throw new Error('Google account identity could not be verified.');
  }

  return {
    sub: googleIdentity.uid,
    email: decoded.email,
    name: firebaseUser.displayName || decoded.name || '',
  };
}
