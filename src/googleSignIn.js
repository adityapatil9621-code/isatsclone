
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase.js';

export async function signInWithGoogle() {
  const credential = await signInWithPopup(auth, googleProvider);

  try {
    const idToken = await credential.user.getIdToken();

    const response = await fetch('/api/auth/firebase/google', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idToken }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Google sign-in failed.');
    }

    return result;
  } finally {
    // ISATS uses its own PostgreSQL session after Firebase verification.
    // Clear the temporary Firebase client session.
    await signOut(auth).catch(() => {});
  }
}
