import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { BuilderCard } from '@/features/builders/components/builder-card';
import { useBuilders } from '@/features/builders/hooks/use-builders';
import { useFavoriteBuilderIds } from '@/features/favorites/hooks/use-favorites';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { ListSkeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState } from '@/shared/components/states';
import { useThemeColors } from '@/shared/theme';

export default function Saved() {
  const colors = useThemeColors();
  const session = useAuthStore((state) => state.session);
  const favorites = useFavoriteBuilderIds(session?.userId);
  const builders = useBuilders();

  const isLoading = favorites.isLoading || builders.isLoading;
  const isError = favorites.isError || builders.isError;
  // Saved builders who are no longer verified drop out of the catalogue, and so out of this list.
  const saved = (builders.data ?? []).filter((builder) => favorites.data?.includes(builder.id));
  const refetch = () => {
    favorites.refetch();
    builders.refetch();
  };

  return (
    <Protected>
      <Screen
        header={<ScreenHeader title="Saved professionals" />}
        refreshing={favorites.isRefetching || builders.isRefetching}
        onRefresh={refetch}
      >
        {isLoading ? (
          <ListSkeleton />
        ) : isError ? (
          <ErrorState error={favorites.error ?? builders.error} what="your saved professionals" onRetry={refetch} />
        ) : saved.length === 0 ? (
          <EmptyState
            icon={<Heart color={colors.muted} size={28} />}
            message="Tap the heart on a professional’s profile to save them here."
            actionLabel="Find a professional"
            onAction={() => router.push('/(tabs)/search')}
          />
        ) : (
          <View className="gap-3">
            {saved.map((builder) => (
              <BuilderCard key={builder.id} builder={builder} />
            ))}
          </View>
        )}
      </Screen>
    </Protected>
  );
}
