import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchFavoriteBuilderIds, setFavorite } from '../services/favorite-service';

const favoritesKey = (userId: string | undefined) => ['favorites', userId] as const;

/** Ids of the builders the user has saved. */
export function useFavoriteBuilderIds(userId: string | undefined) {
  return useQuery<string[]>({
    queryKey: favoritesKey(userId),
    queryFn: () => fetchFavoriteBuilderIds(userId!),
    enabled: Boolean(userId),
  });
}

/** Save or unsave a builder, updating the heart immediately and rolling back on failure. */
export function useToggleFavorite(userId: string | undefined) {
  const queryClient = useQueryClient();
  const key = favoritesKey(userId);
  return useMutation({
    mutationFn: ({ builderId, saved }: { builderId: string; saved: boolean }) => setFavorite(userId!, builderId, saved),
    onMutate: async ({ builderId, saved }) => {
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<string[]>(key);
      queryClient.setQueryData<string[]>(key, (current = []) =>
        saved ? [...new Set([...current, builderId])] : current.filter((id) => id !== builderId),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      queryClient.setQueryData(key, context?.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  });
}
