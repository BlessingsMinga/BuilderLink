import { collection, doc, getDoc, getDocs, orderBy, query, where } from 'firebase/firestore';
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

/** A single candidate district, pulled from the browsable profile rows. */
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
