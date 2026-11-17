import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';
import { firebaseDb } from '@/shared/services/firebase';
import type { UserRole } from '@/shared/types';

export type UserProfile = {
  fullName: string;
  role: UserRole;
  phone: string | null;
  district: string | null;
};

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  const snapshot = await getDoc(doc(firebaseDb, 'profiles', userId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    fullName: (data.full_name as string | undefined) ?? 'BuilderLink member',
    role: (data.role as UserRole | undefined) ?? 'customer',
    phone: (data.phone as string | null | undefined) ?? null,
    district: (data.district as string | null | undefined) ?? null,
  };
}

/** The signed-in user's private profile (name, role, contact details). */
export function useProfile(userId: string | undefined) {
  return useQuery<UserProfile | null>({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
  });
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  builder: 'Construction professional',
  administrator: 'Administrator',
};
