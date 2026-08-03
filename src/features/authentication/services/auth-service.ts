import { createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, signInWithEmailAndPassword, signInWithCredential, GoogleAuthProvider, PhoneAuthProvider } from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import type { ForgotPasswordInput, RegistrationInput, SignInInput } from '../schemas/auth-schemas';
import { firebaseAuth, isFirebaseConfigured } from '@/shared/services/firebase';
import type { AuthSession, UserRole } from '@/shared/types';

const requireAuth = () => {
  if (!firebaseAuth || !isFirebaseConfigured) throw new Error('Firebase has not been configured. Add the EXPO_PUBLIC_FIREBASE_* values to .env.');
  return firebaseAuth;
};

const session = (id: string, email: string, role: UserRole): AuthSession => ({ userId: id, email, role });

// Configure Google Sign-in
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_FIREBASE_WEB_CLIENT_ID,
  offlineAccess: false,
});

export const authService = {
  async signIn(input: SignInInput): Promise<AuthSession> {
    const auth = requireAuth();
    if (!input.identifier.includes('@')) {
      // Phone number sign-in with verification code
      return this.signInWithPhone(input.identifier, input.password);
    }
    const credential = await signInWithEmailAndPassword(auth, input.identifier.trim(), input.password);
    return session(credential.user.uid, credential.user.email ?? input.identifier, 'customer');
  },

  async register(input: RegistrationInput, role: UserRole): Promise<AuthSession> {
    const auth = requireAuth();
    const credential = await createUserWithEmailAndPassword(auth, input.email.trim(), input.password);
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

  async signInWithGoogle(): Promise<AuthSession> {
    const auth = requireAuth();
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (response.type !== 'success') {
      throw new Error('Google sign-in was cancelled.');
    }
    const idToken = response.data.idToken;
    if (!idToken) {
      throw new Error('Google sign-in failed: no ID token received.');
    }
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const credential = await signInWithCredential(auth, googleCredential);
    return session(credential.user.uid, credential.user.email ?? '', 'customer');
  },

  async signInWithPhone(phoneNumber: string, verificationCode: string): Promise<AuthSession> {
    const auth = requireAuth();
    // Phone sign-in requires a verification ID from a prior sendPhoneVerification call.
    // In this simplified flow, the verification ID is stored in the auth instance.
    const verificationId = (auth as unknown as { _verificationId?: string })._verificationId;
    if (!verificationId) {
      throw new Error('No verification in progress. Please request a verification code first.');
    }
    const credential = PhoneAuthProvider.credential(verificationId, verificationCode);
    const userCredential = await signInWithCredential(auth, credential);
    return session(userCredential.user.uid, userCredential.user.email ?? '', 'customer');
  },
};