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
  /** False when the builder has paused new requests. */
  available: boolean;
  /** Average minutes to reply to a request, once known. */
  responseTimeMinutes: number | null;
  /** The builder's own description of their work. */
  bio: string | null;
  /** The person's name, when the listing is shown under a business name. */
  personName: string | null;
  /** Profile photo, if the builder added one. */
  avatarUrl: string | null;
  /** Other districts the builder travels to. */
  serviceAreas: string[];
  languages: string[];
  /** Typical minimum charge in Malawi kwacha. */
  startingPrice: number | null;
  /** Training, certificates and memberships, in the builder's words. */
  qualifications: string | null;
  /** Priced services, in the builder's order. */
  services: BuilderService[];
  /** Checks an administrator has confirmed, e.g. ID and phone. */
  checks: BuilderCheck[];
};

/** One service a builder offers, with an optional "from" price in kwacha. */
export type BuilderService = { name: string; price: number | null };

/** Things BuilderLink has confirmed about a builder. Written only by the backend. */
export type BuilderCheck = 'national_id' | 'phone' | 'certificate' | 'license';

export const CHECK_LABELS: Record<BuilderCheck, string> = {
  national_id: 'National ID confirmed',
  phone: 'Phone number verified',
  certificate: 'Trade certificate checked',
  license: 'Business licence checked',
};

const CHECK_ORDER: BuilderCheck[] = ['national_id', 'phone', 'certificate', 'license'];

/** Most services a builder can list. Keep in step with firestore.rules. */
export const MAX_SERVICES = 10;

const toServices = (raw: unknown): BuilderService[] =>
  Array.isArray(raw)
    ? raw
        .filter((item): item is { name: string; price?: number | null } => typeof item?.name === 'string' && item.name.trim() !== '')
        .map((item) => ({ name: item.name.trim(), price: typeof item.price === 'number' ? item.price : null }))
    : [];

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
  bio?: string | null;
  available?: boolean;
  response_time_minutes?: number | null;
  rejection_reason?: string | null;
  avatar_url?: string | null;
  service_areas?: string[];
  languages?: string[];
  starting_price?: number | null;
  qualifications?: string | null;
  services?: { name: string; price?: number | null }[];
  checks?: string[];
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
    available: raw.available ?? true,
    responseTimeMinutes: raw.response_time_minutes ?? null,
    bio: raw.bio?.trim() || null,
    personName: raw.business_name && raw.display_name ? raw.display_name : null,
    avatarUrl: raw.avatar_url ?? null,
    serviceAreas: raw.service_areas ?? [],
    languages: raw.languages ?? [],
    startingPrice: raw.starting_price ?? null,
    qualifications: raw.qualifications?.trim() || null,
    services: toServices(raw.services),
    checks: CHECK_ORDER.filter((check) => raw.checks?.includes(check)),
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
  /** Why an administrator didn't approve the listing, if they said. */
  rejectionReason: string | null;
  available: boolean;
  rating: number;
  completedJobs: number;
  responseTimeMinutes: number | null;
  avatarUrl: string | null;
  serviceAreas: string[];
  languages: string[];
  startingPrice: number | null;
  qualifications: string;
  services: BuilderService[];
};

export type OwnBuilderInput = Pick<
  OwnBuilder,
  'businessName' | 'bio' | 'yearsExperience' | 'trades' | 'district' | 'serviceAreas' | 'languages' | 'startingPrice' | 'qualifications' | 'services'
>;

/** The builder's own listing whatever its verification status, or null if not created yet. */
export async function fetchOwnBuilder(profileId: string): Promise<OwnBuilder | null> {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  const result = await getDoc(doc(firebaseDb, 'builders', profileId));
  if (!result.exists()) return null;
  const raw = result.data() as BuilderDocument;
  return {
    businessName: raw.business_name ?? '',
    bio: raw.bio ?? '',
    yearsExperience: raw.years_experience,
    trades: raw.trades ?? [],
    district: raw.district ?? null,
    verificationStatus: raw.verification_status,
    rejectionReason: raw.rejection_reason ?? null,
    available: raw.available ?? true,
    rating: raw.average_rating,
    completedJobs: raw.completed_jobs,
    responseTimeMinutes: raw.response_time_minutes ?? null,
    avatarUrl: raw.avatar_url ?? null,
    serviceAreas: raw.service_areas ?? [],
    languages: raw.languages ?? [],
    startingPrice: raw.starting_price ?? null,
    qualifications: raw.qualifications ?? '',
    services: toServices(raw.services),
  };
}

/** Pause or resume new booking requests. */
export async function setBuilderAvailability(profileId: string, available: boolean): Promise<void> {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  await updateDoc(doc(firebaseDb, 'builders', profileId), { available });
}

/** "Usually replies within 2 hours" */
export function formatResponseTime(minutes: number | null): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return 'Usually replies within an hour';
  const hours = Math.ceil(minutes / 60);
  if (hours < 24) return `Usually replies within ${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.ceil(hours / 24);
  return `Usually replies within ${days} day${days === 1 ? '' : 's'}`;
}

/**
 * Create or update the builder's own listing. New listings start as `pending`
 * and stay hidden from customers until an administrator verifies them.
 */
export async function saveOwnBuilder(
  profileId: string,
  displayName: string,
  input: OwnBuilderInput,
  avatarUrl: string | null = null,
): Promise<void> {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  const ref = doc(firebaseDb, 'builders', profileId);
  const editable = {
    business_name: input.businessName.trim() || null,
    bio: input.bio.trim() || null,
    years_experience: input.yearsExperience,
    trades: input.trades,
    district: input.district,
    service_areas: input.serviceAreas.filter((area) => area !== input.district),
    languages: input.languages,
    starting_price: input.startingPrice,
    qualifications: input.qualifications.trim() || null,
    services: input.services
      .map((service) => ({ name: service.name.trim(), price: service.price }))
      .filter((service) => service.name !== '')
      .slice(0, MAX_SERVICES),
  };
  const existing = await getDoc(ref);
  if (existing.exists()) {
    // A rejected listing goes back into the review queue when edited.
    const resubmit = existing.data().verification_status === 'rejected' ? { verification_status: 'pending' } : {};
    await updateDoc(ref, { ...editable, ...resubmit });
    return;
  }
  await setDoc(ref, {
    profile_id: profileId,
    display_name: displayName,
    ...editable,
    avatar_url: avatarUrl,
    verification_status: 'pending',
    average_rating: 0,
    completed_jobs: 0,
    available: true,
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

/** Languages a builder can say they work in. */
export const LANGUAGES = ['English', 'Chichewa', 'Tumbuka', 'Yao', 'Lomwe', 'Sena', 'Tonga'] as const;

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
