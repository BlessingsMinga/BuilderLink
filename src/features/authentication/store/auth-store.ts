import { create } from 'zustand';
import type { AuthSession, UserRole } from '@/shared/types';
type AuthState = { session: AuthSession; setDemoSession: (role: UserRole) => void; signOut: () => void };
export const useAuthStore = create<AuthState>((set) => ({ session: null, setDemoSession: (role) => set({ session: { userId: 'demo-user', role, email: 'demo@builderlink.mw' } }), signOut: () => set({ session: null }) }));
