import { signInWithPopup, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase';

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener.
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
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

// Helper function to extract credential from Firebase GoogleAuthProvider
import { GoogleAuthProvider } from 'firebase/auth';
function GoogleAuthProvider_credentialFromResult(result: any) {
  return GoogleAuthProvider.credentialFromResult(result);
}

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessTokenManual = (token: string) => {
  cachedAccessToken = token;
};

export const logoutUser = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
