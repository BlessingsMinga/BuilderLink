import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { BuilderCard } from '@/features/builders/components/builder-card';
import { useBuilders } from '@/features/builders/hooks/use-builders';
import { useFavoriteBuilderIds } from '@/features/favorites/hooks/use-favorites';
import { Screen } from '@/shared/components/screen';
import { useThemeColors } from '@/shared/theme';

export default function Favorites() {
  const colors = useThemeColors();
  const session = useAuthStore((state) => state.session);
  const favorites = useFavoriteBuilderIds(session?.userId);
  const builders = useBuilders();

  const isLoading = favorites.isLoading || builders.isLoading;
  const isError = favorites.isError || builders.isError;
  // Saved builders who are no longer verified drop out of the catalogue, and so out of this list.
  const saved = (builders.data ?? []).filter((builder) => favorites.data?.includes(builder.id));

  return (
    <Screen>
      <Text className="text-2xl font-bold text-ink">Saved professionals</Text>

      {isLoading ? (
        <View className="mt-16 items-center gap-3">
          <ActivityIndicator size="large" color={colors.ink} />
          <Text className="text-muted">Loading saved professionals…</Text>
        </View>
      ) : isError ? (
        <View className="mt-10 items-center gap-4 rounded-2xl border border-line bg-surface p-6">
          <Text className="text-base text-muted">We couldn’t load your saved professionals.</Text>
          <Pressable
            onPress={() => {
              favorites.refetch();
              builders.refetch();
            }}
            className="rounded-xl bg-ink px-6 py-3"
          >
            <Text className="font-bold text-canvas">Try again</Text>
          </Pressable>
        </View>
      ) : saved.length === 0 ? (
        <View className="mt-10 items-center gap-4 rounded-2xl border border-line bg-surface p-6">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-brand-soft">
            <Heart color={colors.brand} size={30} />
          </View>
          <Text className="text-center text-base leading-6 text-muted">
            Tap the heart on a professional’s profile to save them here, ready whenever your project is.
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/search')} className="rounded-xl bg-ink px-6 py-3">
            <Text className="font-bold text-canvas">Find a professional</Text>
          </Pressable>
        </View>
      ) : (
        <View className="mt-6 gap-3">
          {saved.map((builder) => (
            <BuilderCard key={builder.id} builder={builder} />
          ))}
        </View>
      )}
    </Screen>
  );
}
