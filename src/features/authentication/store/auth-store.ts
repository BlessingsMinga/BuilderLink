import { create } from 'zustand';
import type { AuthSession, UserRole } from '@/shared/types';
type AuthState = { session: AuthSession; setSession: (session: AuthSession) => void; signOut: () => void };
export const useAuthStore = create<AuthState>((set) => ({ session: null, setSession: (session) => set({ session }), signOut: () => set({ session: null }) }));
