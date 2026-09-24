import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signOut as firebaseSignOut,
  type ApplicationVerifier,
  type ConfirmationResult,
  type User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import type { ForgotPasswordInput, RegistrationInput, SignInInput } from '../schemas/auth-schemas';
import { firebaseAuth, firebaseDb, isFirebaseConfigured } from '@/shared/services/firebase';
import type { AuthSession, UserRole } from '@/shared/types';

const requireAuth = () => {
  if (!firebaseAuth || !isFirebaseConfigured) throw new Error('Firebase has not been configured. Add the EXPO_PUBLIC_FIREBASE_* values to .env.');
  return firebaseAuth;
};

const session = (id: string, email: string, role: UserRole): AuthSession => ({ userId: id, email, role });

/** Fetch the user's role from their private Firestore profile. */
async function fetchUserRole(uid: string): Promise<UserRole> {
  if (!firebaseDb) return 'customer';
  const snapshot = await getDoc(doc(firebaseDb, 'profiles', uid));
  if (!snapshot.exists()) return 'customer';
  return (snapshot.data().role as UserRole) ?? 'customer';
}

/** Create a private Firestore profile immediately after Firebase user creation. */
async function ensureProfile(
  uid: string,
  email: string,
  role: UserRole,
  input: RegistrationInput,
): Promise<void> {
  if (!firebaseDb) throw new Error('Firestore has not been configured.');
  await setDoc(doc(firebaseDb, 'profiles', uid), {
    id: uid,
    role,
    full_name: input.fullName,
    phone: input.phone || null,
    email,
    avatar_path: null,
    district: null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

/**
 * Persist (or refresh) the Firestore profile for an account created via
 * Google. Google accounts carry a display name; we default the role to the
 * chosen registration role ('customer' unless a builder was selected).
 */
async function ensureGoogleProfile(
  uid: string,
  email: string,
  displayName: string | null,
  role: UserRole,
): Promise<void> {
  if (!firebaseDb) throw new Error('Firestore has not been configured.');
  const localPart = email.split('@')[0] || 'BuilderLink member';
  const resolvedName =
    displayName && displayName.trim().length >= 2
      ? displayName.trim()
      : localPart.trim().length >= 2
        ? localPart.trim()
        : 'BuilderLink member';

  const profileRef = doc(firebaseDb, 'profiles', uid);
  const existing = await getDoc(profileRef);
  await setDoc(profileRef, {
    id: uid,
    role: existing.exists() ? existing.data().role : role,
    full_name: resolvedName,
    email,
    phone: existing.exists() ? existing.data().phone ?? null : null,
    avatar_path: existing.exists() ? existing.data().avatar_path ?? null : null,
    district: existing.exists() ? existing.data().district ?? null : null,
    created_at: existing.exists() ? existing.data().created_at : serverTimestamp(),
    updated_at: serverTimestamp(),
  });
}

export const authService = {
  async signIn(input: SignInInput): Promise<AuthSession> {
    const auth = requireAuth();
    if (!input.identifier.includes('@')) throw new Error('Sign in with your email address. Phone sign-in is coming soon.');
    const credential = await signInWithEmailAndPassword(auth, input.identifier.trim(), input.password);
    const role = await fetchUserRole(credential.user.uid);
    return session(credential.user.uid, credential.user.email ?? input.identifier, role);
  },

  async register(input: RegistrationInput, role: UserRole): Promise<AuthSession> {
    const auth = requireAuth();
    const credential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
    // Persist the profile row so the role survives restarts and is visible to RLS.
    await ensureProfile(credential.user.uid, input.email.trim(), role, input);
    await sendEmailVerification(credential.user);
    return session(credential.user.uid, input.email, role);
  },

  /**
   * Sign in (or sign up) with a Google ID token from the OAuth flow.
   * Google-created accounts are already email-verified, so no verification
   * email is required. A profile row is upserted when one doesn't exist yet.
   * Throws the Firebase error (e.g. `auth/account-exists-with-different-credential`)
   * so callers can surface a helpful message.
   */
  async signInWithGoogle(idToken: string, role: UserRole = 'customer'): Promise<AuthSession> {
    const auth = requireAuth();
    const result = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    const user = result.user;
    await ensureGoogleProfile(user.uid, user.email ?? '', user.displayName, role);
    const resolvedRole = await fetchUserRole(user.uid);
    return session(user.uid, user.email ?? '', resolvedRole);
  },

  /** Send a Firebase SMS verification code after the React Native reCAPTCHA challenge. */
  async sendPhoneVerificationCode(phoneNumber: string, verifier: ApplicationVerifier): Promise<ConfirmationResult> {
    return signInWithPhoneNumber(requireAuth(), phoneNumber, verifier);
  },

  /** Confirm the SMS code and return the signed-in Firebase session. */
  async confirmPhoneSignIn(confirmation: ConfirmationResult, code: string): Promise<AuthSession> {
    const credential = await confirmation.confirm(code.trim());
    const role = await fetchUserRole(credential.user.uid);
    return session(credential.user.uid, credential.user.email ?? credential.user.phoneNumber ?? '', role);
  },

  async requestPasswordReset(input: ForgotPasswordInput): Promise<void> {
    await sendPasswordResetEmail(requireAuth(), input.email.trim());
  },

  async resendVerification(): Promise<void> {
    const user = requireAuth().currentUser;
    if (!user) throw new Error('Sign in again before requesting another verification email.');
    await sendEmailVerification(user);
  },

  async signOut(): Promise<void> {
    const auth = requireAuth();
    await firebaseSignOut(auth);
  },

  /** Returns true if the current user's email is verified. */
  isEmailVerified(): boolean {
    const user = firebaseAuth?.currentUser;
    return user?.emailVerified ?? false;
  },

  /** Reload the current Firebase user so emailVerified reflects the latest state. */
  async reloadUser(): Promise<void> {
    const user = requireAuth().currentUser;
    if (user) await user.reload();
  },

  /** Subscribe to Firebase auth state changes and resolve the full session (with role). */
  onAuthStateChange(callback: (session: AuthSession) => void): () => void {
    const auth = requireAuth();
    return onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        callback(null);
        return;
      }
      const role = await fetchUserRole(user.uid);
      callback(session(user.uid, user.email ?? '', role));
    });
  },
};
