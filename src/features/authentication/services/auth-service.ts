import type { ForgotPasswordInput, RegistrationInput, SignInInput } from '../schemas/auth-schemas';
import type { AuthSession, UserRole } from '@/shared/types';
const pause = () => new Promise((resolve) => setTimeout(resolve, 500));
// Milestone 3 replaces this adapter with Firebase Authentication calls.
export const authService = { async signIn(input: SignInInput): Promise<AuthSession> { await pause(); return { userId: 'local-user', role: 'customer', email: input.identifier.includes('@') ? input.identifier : 'member@builderlink.mw' }; }, async register(input: RegistrationInput, role: UserRole): Promise<AuthSession> { await pause(); return { userId: 'local-user', role, email: input.email }; }, async requestPasswordReset(_input: ForgotPasswordInput): Promise<void> { await pause(); }, async resendVerification(): Promise<void> { await pause(); } };
