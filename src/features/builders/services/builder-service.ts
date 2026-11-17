import { collection, doc, getDoc, getDocs, orderBy, query, setDoc, updateDoc, where } from 'firebase/firestore';
import { firebaseDb } from '@/shared/services/firebase';

/**
 * Presentation shape for a builder shown in browse/search lists.
 * Flattens the nested profiles + skills rows into what the UI needs.
 */
export type BuilderSummary = {
  id: string;
  name: string;
  trades: string[];
  district: string | null;
  rating: number;
  experience: number;
  completedJobs: number;
  verified: boolean;
};

type BuilderDocument = {
  profile_id: string;
  business_name: string | null;
  years_experience: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  average_rating: number;
  completed_jobs: number;
  display_name?: string;
  district?: string | null;
  trades?: string[];
};

const toSummary = (raw: BuilderDocument): BuilderSummary => {
  return {
    id: raw.profile_id,
    name: raw.business_name || raw.display_name || 'Professional',
    trades: raw.trades ?? [],
    district: raw.district ?? null,
    rating: raw.average_rating,
    experience: raw.years_experience,
    completedJobs: raw.completed_jobs,
    verified: raw.verification_status === 'verified',
  };
};

/**
 * Fetch the verified builder catalogue. This uses a one-time Firestore query;
 * public fields are denormalized on each builder document.
 */
export async function fetchBuilders(): Promise<BuilderSummary[]> {
  if (!firebaseDb) {
    throw new Error('Firestore is not configured.');
  }
  const results = await getDocs(query(
    collection(firebaseDb, 'builders'),
    where('verification_status', '==', 'verified'),
    orderBy('average_rating', 'desc'),
  ));
  return results.docs.map((result) => toSummary(result.data() as BuilderDocument));
}

/** Fetch a single builder by profile id (verified only / own profile). */
export async function fetchBuilder(profileId: string): Promise<BuilderSummary | null> {
  if (!firebaseDb) {
    throw new Error('Firestore is not configured.');
  }
  const result = await getDoc(doc(firebaseDb, 'builders', profileId));
  if (!result.exists()) return null;
  const builder = result.data() as BuilderDocument;
  return builder.verification_status === 'verified' ? toSummary(builder) : null;
}

export type VerificationStatus = 'pending' | 'verified' | 'rejected';

/** The signed-in builder's own listing, as edited in the builder workspace. */
export type OwnBuilder = {
  businessName: string;
  bio: string;
  yearsExperience: number;
  trades: string[];
  district: string | null;
  verificationStatus: VerificationStatus;
};

export type OwnBuilderInput = Omit<OwnBuilder, 'verificationStatus'>;

/** The builder's own listing whatever its verification status, or null if not created yet. */
export async function fetchOwnBuilder(profileId: string): Promise<OwnBuilder | null> {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  const result = await getDoc(doc(firebaseDb, 'builders', profileId));
  if (!result.exists()) return null;
  const raw = result.data() as BuilderDocument & { bio?: string | null };
  return {
    businessName: raw.business_name ?? '',
    bio: raw.bio ?? '',
    yearsExperience: raw.years_experience,
    trades: raw.trades ?? [],
    district: raw.district ?? null,
    verificationStatus: raw.verification_status,
  };
}

/**
 * Create or update the builder's own listing. New listings start as `pending`
 * and stay hidden from customers until an administrator verifies them.
 */
export async function saveOwnBuilder(profileId: string, displayName: string, input: OwnBuilderInput): Promise<void> {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  const ref = doc(firebaseDb, 'builders', profileId);
  const editable = {
    business_name: input.businessName.trim() || null,
    bio: input.bio.trim() || null,
    years_experience: input.yearsExperience,
    trades: input.trades,
    district: input.district,
  };
  const existing = await getDoc(ref);
  if (existing.exists()) {
    // Older listings may lack this field, which the security rules require to be present.
    const backfill = 'response_time_minutes' in existing.data() ? {} : { response_time_minutes: null };
    await updateDoc(ref, { ...editable, ...backfill });
    return;
  }
  await setDoc(ref, {
    profile_id: profileId,
    display_name: displayName,
    ...editable,
    verification_status: 'pending',
    average_rating: 0,
    completed_jobs: 0,
    response_time_minutes: null,
  });
}

/** Trades a builder can list, and customers can browse by. */
export const TRADES = [
  'Bricklayer',
  'Plumber',
  'Carpenter',
  'Electrician',
  'Painter',
  'Roofer',
  'Tiler',
  'Welder',
  'Plasterer',
  'General builder',
] as const;

/** Districts offered in pickers and filters. */
export const MALAWI_DISTRICTS = [
  'Lilongwe',
  'Blantyre',
  'Mzuzu',
  'Zomba',
  'Kasungu',
  'Salima',
  'Mangochi',
  'Mzimba',
] as const;
