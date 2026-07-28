import { signInWithPopup, onAuthStateChanged, User, signOut, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

let isSigningIn = false;
let cachedAccessToken: string | null = (typeof window !== 'undefined' ? localStorage.getItem('google_access_token') : null);

// Helper function to extract credential from Firebase GoogleAuthProvider
function GoogleAuthProvider_credentialFromResult(result: any) {
  return GoogleAuthProvider.credentialFromResult(result);
}

// Initialize auth state listener.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (!cachedAccessToken && typeof window !== 'undefined') {
        cachedAccessToken = localStorage.getItem('google_access_token');
      }
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      if (!cachedAccessToken && typeof window !== 'undefined') {
        cachedAccessToken = localStorage.getItem('google_access_token');
      }
      if (onAuthFailure && !cachedAccessToken) onAuthFailure();
    }
  });
};

// Must be called from a user interaction
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider_credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Tidak dapat memperoleh Access Token dari Google Sign-In.');
    }

    cachedAccessToken = credential.accessToken;
    if (typeof window !== 'undefined') {
      localStorage.setItem('google_access_token', cachedAccessToken);
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (error?.code !== 'auth/popup-closed-by-user' && error?.code !== 'auth/cancelled-popup-request') {
      console.error('Sign in error:', error);
    } else {
      console.info('Google Sign-in popup was closed by user.');
    }
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (!cachedAccessToken && typeof window !== 'undefined') {
    cachedAccessToken = localStorage.getItem('google_access_token');
  }
  return cachedAccessToken;
};

export const setAccessTokenManual = (token: string) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('google_access_token', token);
    } else {
      localStorage.removeItem('google_access_token');
    }
  }
};

export const clearAccessToken = () => {
  cachedAccessToken = null;
  if (typeof window !== 'undefined') {
    localStorage.removeItem('google_access_token');
  }
};

export const logoutUser = async () => {
  await signOut(auth);
  clearAccessToken();
};
