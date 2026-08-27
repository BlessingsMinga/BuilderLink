import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth';
import type { ForgotPasswordInput, RegistrationInput, SignInInput } from '../schemas/auth-schemas';
import { firebaseAuth, isFirebaseConfigured } from '@/shared/services/firebase';
import { supabase, isSupabaseConfigured } from '@/shared/services/supabase';
import type { AuthSession, UserRole } from '@/shared/types';

const requireAuth = () => {
  if (!firebaseAuth || !isFirebaseConfigured) throw new Error('Firebase has not been configured. Add the EXPO_PUBLIC_FIREBASE_* values to .env.');
  return firebaseAuth;
};

const session = (id: string, email: string, role: UserRole): AuthSession => ({ userId: id, email, role });

/** Fetch the user's role from the Supabase profiles table. Defaults to 'customer'. */
async function fetchUserRole(uid: string): Promise<UserRole> {
  if (!supabase || !isSupabaseConfigured) return 'customer';
  const { data, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single();
  if (error || !data) return 'customer';
  return (data.role as UserRole) ?? 'customer';
}

/** Create a profile row immediately after Firebase user creation so the role is persisted. */
async function ensureProfile(
  uid: string,
  email: string,
  role: UserRole,
  input: RegistrationInput,
): Promise<void> {
  if (!supabase || !isSupabaseConfigured) return;
  const { error } = await supabase.from('profiles').insert({
    id: uid,
    role,
    full_name: input.fullName,
    phone: input.phone || null,
    email,
    // Builder-specific fields are stored on the builders table once the user
    // completes their builder profile; the profile row only needs the basics.
  });
  if (error) {
    // If the profile already exists (e.g. re-registration edge case), ignore.
    if (!String(error.message).includes('duplicate')) {
      throw new Error('Could not create your profile. Please try again.');
    }
  }
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