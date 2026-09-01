import { supabase, isSupabaseConfigured } from '@/shared/services/supabase';

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

type BuilderRow = {
  profile_id: string;
  business_name: string | null;
  bio: string | null;
  years_experience: number;
  verification_status: 'pending' | 'verified' | 'rejected';
  average_rating: number;
  completed_jobs: number;
  // Supabase returns to-one joins (over a unique FK) as an object; but the
  // generic client types them as arrays, so we tolerate both shapes.
  profiles: { full_name: string; district: string | null } | { full_name: string; district: string | null }[] | null;
  builder_skills: { skills: { name: string } | { name: string }[] | null }[] | null;
};

const pick = <T,>(val: T | T[] | null | undefined): T | null =>
  Array.isArray(val) ? (val[0] ?? null) : (val ?? null);

const toSummary = (raw: BuilderRow): BuilderSummary => {
  const profile = pick(raw.profiles);
  return {
    id: raw.profile_id,
    name: raw.business_name || profile?.full_name || 'Professional',
    trades: (raw.builder_skills ?? [])
      .map((bs) => {
        const skill = pick(bs.skills);
        return skill?.name;
      })
      .filter((n): n is string => Boolean(n)),
    district: profile?.district ?? null,
    rating: raw.average_rating,
    experience: raw.years_experience,
    completedJobs: raw.completed_jobs,
    verified: raw.verification_status === 'verified',
  };
};

/**
 * Fetch the builder catalogue (verified professionals) with profile and
 * skill info. RLS on the builders table already restricts clients to
 * verified builders (or their own pending profile), so appending the
 * explicit `.eq('verification_status', 'verified')` is safe and expected.
 */
export async function fetchBuilders(): Promise<BuilderSummary[]> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('builders')
    .select(
      `
        profile_id,
        business_name,
        bio,
        years_experience,
        verification_status,
        average_rating,
        completed_jobs,
        profiles ( id, full_name, district ),
        builder_skills ( skills ( id, name ) )
      `,
    )
    .eq('verification_status', 'verified')
    .order('average_rating', { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => toSummary(row as unknown as BuilderRow));
}

/** Fetch a single builder by profile id (verified only / own profile). */
export async function fetchBuilder(profileId: string): Promise<BuilderSummary | null> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase
    .from('builders')
    .select(
      `
        profile_id,
        business_name,
        bio,
        years_experience,
        verification_status,
        average_rating,
        completed_jobs,
        profiles ( id, full_name, district ),
        builder_skills ( skills ( id, name ) )
      `,
    )
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) throw error;
  return data ? toSummary(data as unknown as BuilderRow) : null;
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
