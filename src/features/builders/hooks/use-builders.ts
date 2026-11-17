import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchBuilder,
  fetchBuilders,
  fetchOwnBuilder,
  saveOwnBuilder,
  setBuilderAvailability,
  type BuilderSummary,
  type OwnBuilder,
  type OwnBuilderInput,
} from '../services/builder-service';

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

/** The signed-in builder's own listing (null until they create it). */
export function useOwnBuilder(profileId: string | undefined, enabled = true) {
  return useQuery<OwnBuilder | null>({
    queryKey: ['builders', 'own', profileId],
    queryFn: () => fetchOwnBuilder(profileId!),
    enabled: Boolean(profileId) && enabled,
  });
}

export function useSaveOwnBuilder(profileId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ displayName, input }: { displayName: string; input: OwnBuilderInput }) =>
      saveOwnBuilder(profileId!, displayName, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: buildersKey }),
  });
}

/** Toggle "taking new jobs". Flips immediately and rolls back if the save fails. */
export function useSetAvailability(profileId: string | undefined) {
  const queryClient = useQueryClient();
  const ownKey = ['builders', 'own', profileId];
  return useMutation({
    mutationFn: (available: boolean) => setBuilderAvailability(profileId!, available),
    onMutate: async (available) => {
      await queryClient.cancelQueries({ queryKey: ownKey });
      const previous = queryClient.getQueryData<OwnBuilder | null>(ownKey);
      if (previous) queryClient.setQueryData<OwnBuilder>(ownKey, { ...previous, available });
      return { previous };
    },
    onError: (_error, _available, context) => queryClient.setQueryData(ownKey, context?.previous),
    onSettled: () => queryClient.invalidateQueries({ queryKey: buildersKey }),
  });
}
