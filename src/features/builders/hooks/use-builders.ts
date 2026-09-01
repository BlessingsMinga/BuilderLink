import { useQuery } from '@tanstack/react-query';
import { fetchBuilders, fetchBuilder, type BuilderSummary } from '../services/builder-service';

const buildersKey = ['builders'] as const;

/** All verified builders (client-side filtering happens in the screen). */
export function useBuilders() {
  return useQuery<BuilderSummary[]>({
    queryKey: buildersKey,
    queryFn: fetchBuilders,
    // Fresh while browsing; refetch on focus so new verifications appear.
    staleTime: 60_000,
  });
}

/** A single builder by profile id. */
export function useBuilder(profileId: string | undefined) {
  return useQuery<BuilderSummary | null>({
    queryKey: ['builders', profileId],
    queryFn: () => fetchBuilder(profileId!),
    enabled: Boolean(profileId),
  });
}
