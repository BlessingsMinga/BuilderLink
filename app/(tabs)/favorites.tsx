import { router } from 'expo-router';
import { Heart } from 'lucide-react-native';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { BuilderCard } from '@/features/builders/components/builder-card';
import { useBuilders } from '@/features/builders/hooks/use-builders';
import { useFavoriteBuilderIds } from '@/features/favorites/hooks/use-favorites';
import { Screen } from '@/shared/components/screen';

export default function Favorites() {
  const session = useAuthStore((state) => state.session);
  const favorites = useFavoriteBuilderIds(session?.userId);
  const builders = useBuilders();

  const isLoading = favorites.isLoading || builders.isLoading;
  const isError = favorites.isError || builders.isError;
  // Saved builders who are no longer verified drop out of the catalogue, and so out of this list.
  const saved = (builders.data ?? []).filter((builder) => favorites.data?.includes(builder.id));

  return (
    <Screen>
      <Text className="text-2xl font-extrabold text-ink">Saved professionals</Text>

      {isLoading ? (
        <View className="mt-16 items-center gap-3">
          <ActivityIndicator size="large" color="#F97316" />
          <Text className="text-slate-500">Loading saved professionals…</Text>
        </View>
      ) : isError ? (
        <View className="mt-10 items-center gap-4 rounded-3xl bg-white p-6">
          <Text className="text-base text-slate-500">We couldn’t load your saved professionals.</Text>
          <Pressable
            onPress={() => {
              favorites.refetch();
              builders.refetch();
            }}
            className="rounded-2xl bg-brand px-6 py-3"
          >
            <Text className="font-bold text-white">Try again</Text>
          </Pressable>
        </View>
      ) : saved.length === 0 ? (
        <View className="mt-10 items-center gap-4 rounded-3xl bg-white p-6">
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-orange-100">
            <Heart color="#F97316" size={30} />
          </View>
          <Text className="text-center text-base leading-6 text-slate-500">
            Tap the heart on a professional’s profile to save them here, ready whenever your project is.
          </Text>
          <Pressable onPress={() => router.push('/(tabs)/search')} className="rounded-2xl bg-brand px-6 py-3">
            <Text className="font-bold text-white">Find a professional</Text>
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
