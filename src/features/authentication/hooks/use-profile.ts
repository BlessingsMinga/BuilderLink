import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ImagePickerAsset } from 'expo-image-picker';
import { doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { PORTFOLIO_PRESET, upload } from '@/features/portfolio/services/portfolio-service';
import { firebaseDb } from '@/shared/services/firebase';
import type { UserRole } from '@/shared/types';

export type UserProfile = {
  fullName: string;
  role: UserRole;
  phone: string | null;
  district: string | null;
  /** Public profile photo (Cloudinary URL). */
  avatarUrl: string | null;
};

export type ProfileInput = Pick<UserProfile, 'fullName' | 'phone' | 'district'>;

const requireDb = () => {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  return firebaseDb;
};

async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const snapshot = await getDoc(doc(requireDb(), 'profiles', userId));
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  const avatar = data.avatar_path as string | null | undefined;
  return {
    fullName: (data.full_name as string | undefined) ?? 'BuilderLink member',
    role: (data.role as UserRole | undefined) ?? 'customer',
    phone: (data.phone as string | null | undefined) ?? null,
    district: (data.district as string | null | undefined) ?? null,
    avatarUrl: avatar?.startsWith('https://') ? avatar : null,
  };
}

/** Save name and contact details. Builders' public display name follows the profile name. */
async function saveProfile(userId: string, input: ProfileInput): Promise<void> {
  const db = requireDb();
  const fullName = input.fullName.trim();
  await updateDoc(doc(db, 'profiles', userId), {
    full_name: fullName,
    phone: input.phone?.trim() || null,
    district: input.district,
    updated_at: serverTimestamp(),
  });
  const builder = await getDoc(doc(db, 'builders', userId));
  if (builder.exists()) await updateDoc(builder.ref, { display_name: fullName });
}

/** Upload a new profile photo and show it on the profile (and the builder listing, if any). */
async function saveProfilePhoto(userId: string, asset: ImagePickerAsset | null): Promise<void> {
  const db = requireDb();
  const url = asset ? await upload(`users/${userId}/avatar`, PORTFOLIO_PRESET, asset) : null;
  await updateDoc(doc(db, 'profiles', userId), { avatar_path: url, updated_at: serverTimestamp() });
  const builder = await getDoc(doc(db, 'builders', userId));
  if (builder.exists()) await updateDoc(builder.ref, { avatar_url: url });
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

export function useSaveProfile(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => saveProfile(userId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['builders'] });
    },
  });
}

/** Pass an asset to set a new photo, or null to remove it. */
export function useSaveProfilePhoto(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (asset: ImagePickerAsset | null) => saveProfilePhoto(userId!, asset),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
      queryClient.invalidateQueries({ queryKey: ['builders'] });
    },
  });
}

export const ROLE_LABELS: Record<UserRole, string> = {
  customer: 'Customer',
  builder: 'Construction professional',
  administrator: 'Administrator',
};
