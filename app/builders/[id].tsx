import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, BadgeCheck, Heart, MapPin, Star } from 'lucide-react-native';
import { ActivityIndicator, Alert, Pressable, Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useBuilder } from '@/features/builders/hooks/use-builders';
import { useFavoriteBuilderIds, useToggleFavorite } from '@/features/favorites/hooks/use-favorites';
import { useBuilderReviews } from '@/features/reviews/hooks/use-reviews';
import { averageRating } from '@/features/reviews/services/review-service';
import { AppButton } from '@/shared/components/app-button';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { useThemeColors } from '@/shared/theme';

export default function BuilderDetail() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useAuthStore((state) => state.session);
  const { data: builder, isLoading, isError, refetch } = useBuilder(id);
  const reviews = useBuilderReviews(builder?.id);
  const { data: favoriteIds } = useFavoriteBuilderIds(session?.userId);
  const toggleFavorite = useToggleFavorite(session?.userId);

  const isSaved = Boolean(builder && favoriteIds?.includes(builder.id));
  // Prefer the live average of published reviews over the stored catalogue figure.
  const rating = averageRating(reviews.data ?? []) ?? builder?.rating ?? 0;

  const onToggleFavorite = () => {
    if (!builder) return;
    toggleFavorite.mutate(
      { builderId: builder.id, saved: !isSaved },
      {
        onError: (error) => {
          console.warn('Saving professional failed:', error);
          Alert.alert('Could not update saved list', 'Please check your connection and try again.');
        },
      },
    );
  };

  return (
    <Protected>
      <Screen>
        <View className="flex-row items-center justify-between">
          <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface">
            <ArrowLeft color={colors.ink} />
          </Pressable>
          {builder && favoriteIds ? (
            <Pressable
              onPress={onToggleFavorite}
              accessibilityRole="button"
              accessibilityLabel={isSaved ? 'Remove from saved professionals' : 'Save this professional'}
              className="h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface"
            >
              <Heart color={colors.brand} fill={isSaved ? colors.brand : 'transparent'} />
            </Pressable>
          ) : null}
        </View>

        {isLoading ? (
          <View className="mt-16 items-center gap-3">
            <ActivityIndicator size="large" color={colors.ink} />
            <Text className="text-muted">Loading profile…</Text>
          </View>
        ) : isError || !builder ? (
          <View className="mt-16 items-center gap-4 rounded-2xl border border-line bg-surface p-6">
            <Text className="text-base text-muted">We couldn’t load this professional.</Text>
            <Pressable onPress={() => refetch()} className="rounded-xl bg-ink px-6 py-3">
              <Text className="font-bold text-canvas">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View className="mt-6 h-28 w-28 items-center justify-center self-center rounded-full bg-subtle">
              <Text className="text-3xl font-bold text-muted">
                {builder.name.slice(0, 2).toUpperCase()}
              </Text>
            </View>
            <View className="mt-5 items-center">
              <Text className="text-2xl font-bold text-ink">{builder.name}</Text>
              {builder.verified ? (
                <View className="mt-2 flex-row items-center gap-2">
                  <BadgeCheck size={18} color={colors.success} />
                  <Text className="font-semibold text-success">Verified professional</Text>
                </View>
              ) : null}
              <Text className="mt-2 text-muted">
                {builder.trades.join(' · ') || 'Construction professional'} · {builder.district ?? 'Malawi'}
              </Text>
            </View>
            <View className="mt-8 flex-row justify-around rounded-2xl border border-line bg-surface p-5">
              <Stat value={rating.toFixed(1)} label="Rating" />
              <Stat value={`${builder.experience} yrs`} label="Experience" />
              <Stat value={String(builder.completedJobs)} label="Jobs done" />
            </View>
            <View className="mt-8">
              <AppButton label="Request a booking" onPress={() => router.push({ pathname: '/booking', params: { builderId: builder.id } })} />
            </View>
            <View className="mt-4 flex-row items-center gap-1">
              <MapPin size={16} color={colors.muted} />
              <Text className="text-sm text-muted">Based in {builder.district ?? 'Malawi'}</Text>
            </View>

            <Text className="mt-8 text-lg font-bold text-ink">
              Reviews{reviews.data?.length ? ` (${reviews.data.length})` : ''}
            </Text>
            {reviews.isLoading ? (
              <ActivityIndicator className="mt-4" color={colors.ink} />
            ) : reviews.isError ? (
              <Pressable onPress={() => reviews.refetch()} className="mt-3 rounded-xl border border-line bg-surface p-4">
                <Text className="text-muted">We couldn’t load reviews. Tap to try again.</Text>
              </Pressable>
            ) : !reviews.data?.length ? (
              <View className="mt-3 rounded-xl border border-line bg-surface p-4">
                <Text className="text-muted">No reviews yet. Customers can review after a completed job.</Text>
              </View>
            ) : (
              <View className="mt-3 gap-3 pb-6">
                {reviews.data.map((review) => (
                  <View key={review.id} className="rounded-xl border border-line bg-surface p-4">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="flex-1 font-bold text-ink">{review.customerName}</Text>
                      <View className="flex-row items-center gap-1">
                        <Star size={15} color={colors.brand} fill={colors.brand} />
                        <Text className="font-bold text-ink">{review.rating}</Text>
                      </View>
                    </View>
                    {review.createdAt ? (
                      <Text className="mt-0.5 text-xs text-faint">
                        {review.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    ) : null}
                    <Text className="mt-2 leading-5 text-muted">{review.comment}</Text>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </Screen>
    </Protected>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View className="items-center">
      <Text className="text-lg font-bold text-ink">{value}</Text>
      <Text className="text-sm text-muted">{label}</Text>
    </View>
  );
}
