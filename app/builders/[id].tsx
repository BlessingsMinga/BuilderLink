import { router, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, BriefcaseBusiness, Heart, MapPin, MessageSquareText, Star, Timer, Trophy, type LucideIcon } from 'lucide-react-native';
import { useState } from 'react';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useBuilder } from '@/features/builders/hooks/use-builders';
import { formatResponseTime } from '@/features/builders/services/builder-service';
import { usePortfolio } from '@/features/portfolio/hooks/use-portfolio';
import { thumbnailUrl } from '@/features/portfolio/services/portfolio-service';
import { useFavoriteBuilderIds, useToggleFavorite } from '@/features/favorites/hooks/use-favorites';
import { useBuilderReviews } from '@/features/reviews/hooks/use-reviews';
import { averageRating } from '@/features/reviews/services/review-service';
import { AppButton } from '@/shared/components/app-button';
import { Avatar } from '@/shared/components/chip';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { HeaderButton, ScreenHeader } from '@/shared/components/screen-header';
import { ListSkeleton } from '@/shared/components/skeleton';
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
  const portfolio = usePortfolio(builder?.id);
  const [openPhoto, setOpenPhoto] = useState<string | null>(null);

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
          portfolio.refetch();
        }}
        header={
          <ScreenHeader
            onHero
            right={
              builder && favoriteIds && !isOwnProfile ? (
                <HeaderButton onHero label={isSaved ? 'Remove from saved professionals' : 'Save this professional'} onPress={onToggleFavorite}>
                  <Heart color="#FFFFFF" fill={isSaved ? '#FFFFFF' : 'transparent'} size={22} />
                </HeaderButton>
              ) : undefined
            }
          />
        }
        hero={
          <View className="items-center pb-10">
            <Avatar name={builder?.name ?? ''} size="lg" onHero />
            <View className="mt-4 flex-row items-center gap-2">
              <Text numberOfLines={2} className="shrink text-center font-heading text-3xl text-white">
                {builder?.name ?? ' '}
              </Text>
              {builder?.verified ? <BadgeCheck accessibilityLabel="Verified professional" size={24} color="#FFFFFF" /> : null}
            </View>
            {builder ? (
              <>
                <Text className="mt-1 text-center font-medium text-sm text-white/80">
                  {builder.trades.join(' · ') || 'Construction professional'}
                </Text>
                <View className="mt-2 flex-row items-center gap-1">
                  <MapPin size={16} color="#FFFFFF" />
                  <Text className="font-medium text-sm text-white">{builder.district ?? 'Malawi'}</Text>
                </View>
              </>
            ) : null}
          </View>
        }
        footer={
          builder && !isOwnProfile ? (
            <View>
              {!builder.available ? (
                <Text className="mb-3 text-center font-medium text-sm text-muted">
                  {builder.name} isn’t taking new jobs right now. Save them and check back later.
                </Text>
              ) : null}
              <AppButton
                label={builder.available ? 'Request a booking' : 'Not taking new jobs'}
                disabled={!builder.available}
                onPress={() => router.push({ pathname: '/booking', params: { builderId: builder.id } })}
              />
            </View>
          ) : undefined
        }
      >
        {isLoading ? (
          <ListSkeleton count={2} />
        ) : isError ? (
          <ErrorState error={error} what="this professional" onRetry={() => refetch()} />
        ) : !builder ? (
          <EmptyState message="This professional isn’t listed any more." actionLabel="Find a professional" onAction={() => router.replace('/(tabs)/search')} />
        ) : (
          <>
            {/* Pulled up to overlap the hero band. */}
            <View className="-mt-14 flex-row gap-3">
              <StatTile icon={Star} value={rating.toFixed(1)} label={reviewCount === 1 ? '1 review' : `${reviewCount} reviews`} iconColor={colors.star} filled />
              <StatTile icon={BriefcaseBusiness} value={`${builder.experience} yrs`} label="Experience" iconColor={colors.brand} />
              <StatTile icon={Trophy} value={String(builder.completedJobs)} label="Jobs done" iconColor={colors.brand} />
            </View>
            <ErrorText>{favoriteError}</ErrorText>
            {formatResponseTime(builder.responseTimeMinutes) ? (
              <View className="mt-3 flex-row items-center gap-2">
                <Timer size={16} color={colors.muted} />
                <Text className="font-medium text-sm text-muted">{formatResponseTime(builder.responseTimeMinutes)}</Text>
              </View>
            ) : null}

            {portfolio.data && portfolio.data.length > 0 ? (
              <>
                <Text className="mb-3 mt-8 font-heading-semibold text-lg text-ink">Work photos</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-5 flex-grow-0" contentContainerClassName="gap-3 px-5">
                  {portfolio.data.map((photo) => (
                    <Pressable key={photo.id} accessibilityRole="imagebutton" accessibilityLabel="Open work photo" onPress={() => setOpenPhoto(photo.url)}>
                      <Image source={{ uri: thumbnailUrl(photo.url, 480) }} className="h-40 w-40 rounded-2xl bg-subtle" />
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}

            <Text className="mb-3 mt-8 font-heading-semibold text-lg text-ink">Reviews</Text>
            {reviews.isLoading ? (
              <ListSkeleton count={2} />
            ) : reviews.isError ? (
              <ErrorState error={reviews.error} what="reviews" onRetry={() => reviews.refetch()} />
            ) : reviewCount === 0 ? (
              <EmptyState
                icon={<MessageSquareText size={26} color={colors.brand} />}
                message="No reviews yet. Customers can review after a completed job."
              />
            ) : (
              <View className="gap-3">
                {reviews.data?.map((review) => (
                  <View key={review.id} className="rounded-3xl border border-line bg-surface p-4">
                    <View className="flex-row items-center justify-between gap-3">
                      <Text numberOfLines={1} className="flex-1 font-bold text-base text-ink">
                        {review.customerName}
                      </Text>
                      <View className="flex-row gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={15} color={colors.star} fill={star <= review.rating ? colors.star : 'transparent'} />
                        ))}
                      </View>
                    </View>
                    {review.createdAt ? (
                      <Text className="font-medium text-xs text-faint">
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
      <Modal visible={openPhoto !== null} transparent animationType="fade" onRequestClose={() => setOpenPhoto(null)}>
        <Pressable accessibilityLabel="Close photo" onPress={() => setOpenPhoto(null)} className="flex-1 items-center justify-center bg-black/90 p-4">
          {openPhoto ? <Image source={{ uri: openPhoto }} resizeMode="contain" className="h-full w-full" /> : null}
        </Pressable>
      </Modal>
    </Protected>
  );
}

type StatTileProps = { icon: LucideIcon; value: string; label: string; iconColor: string; filled?: boolean };

function StatTile({ icon: Icon, value, label, iconColor, filled = false }: StatTileProps) {
  return (
    <View className="flex-1 items-center rounded-3xl border border-line bg-surface px-2 py-4">
      <Icon size={20} color={iconColor} fill={filled ? iconColor : 'transparent'} />
      <Text className="mt-2 font-heading-semibold text-lg text-ink">{value}</Text>
      <Text numberOfLines={1} className="font-body text-xs text-muted">
        {label}
      </Text>
    </View>
  );
}
