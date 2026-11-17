import { router, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, Heart, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useBuilder } from '@/features/builders/hooks/use-builders';
import { useFavoriteBuilderIds, useToggleFavorite } from '@/features/favorites/hooks/use-favorites';
import { useBuilderReviews } from '@/features/reviews/hooks/use-reviews';
import { averageRating } from '@/features/reviews/services/review-service';
import { AppButton } from '@/shared/components/app-button';
import { Avatar } from '@/shared/components/chip';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { HeaderButton, ScreenHeader } from '@/shared/components/screen-header';
import { ListSkeleton, Skeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState, ErrorText } from '@/shared/components/states';
import { useThemeColors } from '@/shared/theme';

export default function BuilderDetail() {
  const colors = useThemeColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useAuthStore((state) => state.session);
  const { data: builder, isLoading, isError, error, refetch, isRefetching } = useBuilder(id);
  const reviews = useBuilderReviews(builder?.id);
  const { data: favoriteIds } = useFavoriteBuilderIds(session?.userId);
  const toggleFavorite = useToggleFavorite(session?.userId);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);

  const isSaved = Boolean(builder && favoriteIds?.includes(builder.id));
  const isOwnProfile = Boolean(builder && builder.id === session?.userId);
  const reviewCount = reviews.data?.length ?? 0;
  // Prefer the live average of published reviews over the stored catalogue figure.
  const rating = averageRating(reviews.data ?? []) ?? builder?.rating ?? 0;

  const onToggleFavorite = () => {
    if (!builder) return;
    setFavoriteError(null);
    toggleFavorite.mutate(
      { builderId: builder.id, saved: !isSaved },
      {
        onError: (failure) => {
          console.warn('Saving professional failed:', failure);
          setFavoriteError('We couldn’t update your saved list. Check your connection and try again.');
        },
      },
    );
  };

  return (
    <Protected>
      <Screen
        refreshing={isRefetching}
        onRefresh={() => {
          refetch();
          reviews.refetch();
        }}
        header={
          <ScreenHeader
            right={
              builder && favoriteIds && !isOwnProfile ? (
                <HeaderButton label={isSaved ? 'Remove from saved professionals' : 'Save this professional'} onPress={onToggleFavorite}>
                  <Heart color={isSaved ? colors.brand : colors.ink} fill={isSaved ? colors.brand : 'transparent'} size={22} />
                </HeaderButton>
              ) : undefined
            }
          />
        }
        footer={
          builder && !isOwnProfile ? (
            <AppButton
              label="Request a booking"
              onPress={() => router.push({ pathname: '/booking', params: { builderId: builder.id } })}
            />
          ) : undefined
        }
      >
        {isLoading ? (
          <View accessibilityLabel="Loading" className="items-center gap-4">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-5 w-64" />
            <Skeleton className="mt-4 h-20 w-80" />
          </View>
        ) : isError ? (
          <ErrorState error={error} what="this professional" onRetry={() => refetch()} />
        ) : !builder ? (
          <EmptyState message="This professional isn’t listed any more." actionLabel="Find a professional" onAction={() => router.replace('/(tabs)/search')} />
        ) : (
          <>
            <ErrorText>{favoriteError}</ErrorText>
            <View className="items-center">
              <Avatar name={builder.name} size="lg" />
              <Text className="mt-4 text-center font-heading text-3xl text-ink">{builder.name}</Text>
              {builder.verified ? (
                <View className="mt-2 flex-row items-center gap-1.5">
                  <BadgeCheck size={18} color={colors.success} />
                  <Text className="font-medium text-sm text-success">Verified professional</Text>
                </View>
              ) : null}
              <Text className="mt-2 text-center font-body text-base text-muted">
                {builder.trades.join(' · ') || 'Construction professional'} · {builder.district ?? 'Malawi'}
              </Text>
            </View>

            <View className="mt-8 flex-row rounded-2xl border border-line py-4">
              <Stat value={rating.toFixed(1)} label={reviewCount === 1 ? '1 review' : `${reviewCount} reviews`} star />
              <Stat value={`${builder.experience} yrs`} label="Experience" divider />
              <Stat value={String(builder.completedJobs)} label="Jobs done" divider />
            </View>

            <Text className="mb-3 mt-8 font-heading-semibold text-lg text-ink">Reviews</Text>
            {reviews.isLoading ? (
              <ListSkeleton count={2} />
            ) : reviews.isError ? (
              <ErrorState error={reviews.error} what="reviews" onRetry={() => reviews.refetch()} />
            ) : reviewCount === 0 ? (
              <EmptyState message="No reviews yet. Customers can review after a completed job." />
            ) : (
              <View className="gap-3">
                {reviews.data?.map((review) => (
                  <View key={review.id} className="rounded-2xl border border-line p-4">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text numberOfLines={1} className="flex-1 font-semibold text-base text-ink">
                        {review.customerName}
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Star size={15} color={colors.brand} fill={colors.brand} />
                        <Text className="font-semibold text-sm text-ink">{review.rating}</Text>
                      </View>
                    </View>
                    {review.createdAt ? (
                      <Text className="mt-0.5 font-medium text-xs text-faint">
                        {review.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    ) : null}
                    <Text className="mt-2 font-body text-base text-muted">{review.comment}</Text>
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

function Stat({ value, label, star = false, divider = false }: { value: string; label: string; star?: boolean; divider?: boolean }) {
  const colors = useThemeColors();
  return (
    <View className={`flex-1 items-center ${divider ? 'border-l border-line' : ''}`}>
      <View className="flex-row items-center gap-1">
        {star ? <Star size={15} color={colors.brand} fill={colors.brand} /> : null}
        <Text className="font-heading-semibold text-lg text-ink">{value}</Text>
      </View>
      <Text className="mt-0.5 font-body text-sm text-muted">{label}</Text>
    </View>
  );
}
