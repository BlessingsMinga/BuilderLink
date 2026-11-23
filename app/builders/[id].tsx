import { router, useLocalSearchParams } from 'expo-router';
import { BadgeCheck, Heart, ImageIcon, MapPin, MessageSquareText, Star } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useBuilder } from '@/features/builders/hooks/use-builders';
import { formatResponseTime } from '@/features/builders/services/builder-service';
import { useFavoriteBuilderIds, useToggleFavorite } from '@/features/favorites/hooks/use-favorites';
import { usePortfolio } from '@/features/portfolio/hooks/use-portfolio';
import { thumbnailUrl } from '@/features/portfolio/services/portfolio-service';
import { useBuilderReviews } from '@/features/reviews/hooks/use-reviews';
import { averageRating, REVIEW_CATEGORIES, type Review } from '@/features/reviews/services/review-service';
import { AppButton } from '@/shared/components/app-button';
import { Avatar } from '@/shared/components/chip';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { HeaderButton, ScreenHeader } from '@/shared/components/screen-header';
import { ListSkeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState, ErrorText } from '@/shared/components/states';
import { useLayout } from '@/shared/hooks/use-layout';
import { useThemeColors } from '@/shared/theme';

/** Reviews shown before "Read all". */
const REVIEW_PREVIEW = 3;
/** Horizontal page padding (px-5) and grid gap (gap-3). */
const PAGE_PADDING = 20;
const GRID_GAP = 12;

/** "~45 min", "~2 h", "~1 day": a compact reply time for the stat tile. */
function shortResponseTime(minutes: number | null): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `~${Math.max(5, Math.round(minutes / 5) * 5)} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `~${hours} h`;
  const days = Math.round(hours / 24);
  return `~${days} day${days === 1 ? '' : 's'}`;
}

/** Average of each detail rating across reviews, in REVIEW_CATEGORIES order. */
function categoryAverages(reviews: Review[]) {
  return REVIEW_CATEGORIES.map(({ key, label }) => {
    const scores = reviews.map((review) => review.categoryRatings?.[key]).filter((score): score is number => typeof score === 'number');
    const average = scores.length ? scores.reduce((sum, score) => sum + score, 0) / scores.length : null;
    return { key, label, average };
  }).filter((item) => item.average !== null) as { key: string; label: string; average: number }[];
}

export default function BuilderDetail() {
  const colors = useThemeColors();
  const { contentWidth, gridColumns, isCompact } = useLayout();
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useAuthStore((state) => state.session);
  const { data: builder, isLoading, isError, error, refetch, isRefetching } = useBuilder(id);
  const reviews = useBuilderReviews(builder?.id);
  const { data: favoriteIds } = useFavoriteBuilderIds(session?.userId);
  const toggleFavorite = useToggleFavorite(session?.userId);
  const [favoriteError, setFavoriteError] = useState<string | null>(null);
  const portfolio = usePortfolio(builder?.id);
  const [openPhoto, setOpenPhoto] = useState<string | null>(null);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const isSaved = Boolean(builder && favoriteIds?.includes(builder.id));
  const isOwnProfile = Boolean(builder && builder.id === session?.userId);
  const reviewList = reviews.data ?? [];
  const reviewCount = reviewList.length;
  // Prefer the live average of published reviews over the stored catalogue figure.
  const rating = averageRating(reviewList) ?? builder?.rating ?? 0;
  const categories = useMemo(() => categoryAverages(reviewList), [reviewList]);
  const replyTime = shortResponseTime(builder?.responseTimeMinutes ?? null);
  const replyText = formatResponseTime(builder?.responseTimeMinutes ?? null);

  // Square-ish tiles that fill the content width in 2 (phone) or 3 (wide) columns.
  const tileWidth = Math.floor((contentWidth - PAGE_PADDING * 2 - GRID_GAP * (gridColumns - 1)) / gridColumns);
  const photos = portfolio.data ?? [];
  const photoLimit = gridColumns * 2;
  const visiblePhotos = showAllPhotos ? photos : photos.slice(0, photoLimit);
  const visibleReviews = showAllReviews ? reviewList : reviewList.slice(0, REVIEW_PREVIEW);

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
        // An empty band the profile card overlaps.
        hero={<View className="h-16" />}
        footer={
          builder && !isOwnProfile ? (
            <View>
              {!builder.available ? (
                <Text className="mb-3 text-center font-medium text-sm text-muted">
                  {builder.name} isn’t taking new jobs right now. Save them and check back later.
                </Text>
              ) : null}
              <View className="flex-row flex-wrap items-center gap-x-4 gap-y-3">
                {replyText && builder.available ? (
                  <View className="min-w-[120px] flex-1">
                    <Text className="font-body text-xs text-muted">Usually replies</Text>
                    <Text className="font-bold text-base text-ink">{replyText.replace('Usually replies ', '')}</Text>
                  </View>
                ) : null}
                <View className="min-w-[180px] flex-[1.4]">
                  <AppButton
                    label={builder.available ? 'Request booking' : 'Not taking new jobs'}
                    disabled={!builder.available}
                    onPress={() => router.push({ pathname: '/booking', params: { builderId: builder.id } })}
                  />
                </View>
              </View>
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
            {/* Profile card, pulled up to overlap the hero band. */}
            <View className="-mt-16 rounded-3xl border border-line bg-surface p-5" style={{ elevation: 3, shadowColor: '#10201E', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } }}>
              <View className="flex-row items-center gap-4">
                <Avatar name={builder.name} photoUrl={builder.avatarUrl} />
                <View className="flex-1">
                  <View className="flex-row flex-wrap items-center gap-x-1.5">
                    <Text accessibilityRole="header" className={`shrink font-heading text-ink ${isCompact ? 'text-lg' : 'text-xl'}`}>
                      {builder.name}
                    </Text>
                    {builder.verified ? <BadgeCheck accessibilityLabel="Verified professional" size={20} color={colors.onPrimary} fill={colors.brand} /> : null}
                  </View>
                  <View className="mt-0.5 flex-row flex-wrap items-center gap-1">
                    {builder.personName ? <Text className="font-body text-sm text-muted">{builder.personName} ·</Text> : null}
                    <MapPin size={14} color={colors.muted} />
                    <Text className="font-body text-sm text-muted">{builder.district ?? 'Malawi'}</Text>
                  </View>
                  <View className={`mt-2 flex-row items-center gap-1.5 self-start rounded-full px-2.5 py-1 ${builder.available ? 'bg-brand-soft' : 'bg-subtle'}`}>
                    <View className={`h-2 w-2 rounded-full ${builder.available ? 'bg-primary' : 'bg-faint'}`} />
                    <Text className={`font-bold text-xs ${builder.available ? 'text-brand' : 'text-muted'}`}>
                      {builder.available ? 'Available for new jobs' : 'Not taking new jobs'}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="mt-5 flex-row gap-2">
                <StatTile
                  value={reviewCount ? rating.toFixed(1) : '–'}
                  label={reviewCount === 1 ? '1 review' : `${reviewCount} reviews`}
                  icon={<Star size={15} color={colors.star} fill={colors.star} />}
                />
                <StatTile value={String(builder.completedJobs)} label="Jobs done" />
                {replyTime ? (
                  <StatTile value={replyTime} label="Replies in" />
                ) : (
                  <StatTile value={`${builder.experience} yrs`} label="Experience" />
                )}
              </View>
            </View>
            <ErrorText>{favoriteError}</ErrorText>

            <Section title="About">
              <Text className="font-body text-base leading-6 text-ink">
                {builder.bio ?? `${builder.experience} years’ experience in ${builder.trades.join(', ').toLowerCase() || 'construction'}.`}
              </Text>
              {builder.trades.length ? (
                <View className="mt-3 flex-row flex-wrap gap-2">
                  {builder.trades.map((trade) => (
                    <View key={trade} className="rounded-full border border-line bg-surface px-3 py-1.5">
                      <Text className="font-semibold text-sm text-ink">{trade}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
            </Section>

            {builder.serviceAreas.length || builder.languages.length || builder.startingPrice != null || builder.qualifications ? (
              <Section title="Work details">
                <View className="overflow-hidden rounded-2xl border border-line bg-surface">
                  {[
                    builder.startingPrice != null ? ['Starting from', `MWK ${builder.startingPrice.toLocaleString('en-US')}`] : null,
                    builder.serviceAreas.length ? ['Also works in', builder.serviceAreas.join(', ')] : null,
                    builder.languages.length ? ['Languages', builder.languages.join(', ')] : null,
                    builder.qualifications ? ['Qualifications', builder.qualifications] : null,
                  ]
                    .filter((row): row is string[] => row !== null)
                    .map(([label, value], index) => (
                      <View key={label} className={`p-4 ${index > 0 ? 'border-t border-line' : ''}`}>
                        <Text className="font-medium text-xs text-muted">{label}</Text>
                        <Text className="mt-0.5 font-body text-base text-ink">{value}</Text>
                      </View>
                    ))}
                </View>
              </Section>
            ) : null}

            <Section
              title="Recent work"
              action={
                photos.length > photoLimit ? (
                  <Pressable accessibilityRole="button" onPress={() => setShowAllPhotos((value) => !value)} hitSlop={12}>
                    <Text className="font-bold text-sm text-brand">{showAllPhotos ? 'Show less' : `See all ${photos.length}`}</Text>
                  </Pressable>
                ) : null
              }
            >
              {portfolio.isLoading ? (
                <ListSkeleton count={1} />
              ) : photos.length === 0 ? (
                <View className="flex-row items-center gap-3 rounded-2xl border border-line bg-surface p-4">
                  <ImageIcon size={20} color={colors.muted} />
                  <Text className="flex-1 font-body text-sm text-muted">No work photos yet.</Text>
                </View>
              ) : (
                <View className="flex-row flex-wrap" style={{ gap: GRID_GAP }}>
                  {visiblePhotos.map((photo) => (
                    <Pressable
                      key={photo.id}
                      accessibilityRole="imagebutton"
                      accessibilityLabel={photo.caption ? `Work photo: ${photo.caption}` : 'Open work photo'}
                      onPress={() => setOpenPhoto(photo.url)}
                      style={{ width: tileWidth }}
                      className="overflow-hidden rounded-2xl active:opacity-85"
                    >
                      <Image source={{ uri: thumbnailUrl(photo.url, 480) }} style={{ width: tileWidth, height: tileWidth }} className="bg-subtle" />
                      {photo.caption ? (
                        <View className="absolute bottom-2 left-2 right-2 rounded-lg bg-black/70 px-2 py-1">
                          <Text numberOfLines={1} className="font-semibold text-xs text-white">
                            {photo.caption}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
              )}
            </Section>

            <Section title="Ratings">
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
                  {categories.length ? (
                    <View className="gap-3 rounded-3xl border border-line bg-surface p-4">
                      {categories.map((category) => (
                        <View
                          key={category.key}
                          accessible
                          accessibilityLabel={`${category.label}: ${category.average.toFixed(1)} out of 5`}
                          className="flex-row items-center gap-3"
                        >
                          <Text className={`font-body text-sm text-ink ${isCompact ? 'w-24' : 'w-32'}`}>{category.label}</Text>
                          <View className="h-2 flex-1 overflow-hidden rounded-full bg-subtle">
                            <View className="h-2 rounded-full bg-primary" style={{ width: `${(category.average / 5) * 100}%` }} />
                          </View>
                          <Text className="w-8 text-right font-bold text-sm text-ink">{category.average.toFixed(1)}</Text>
                        </View>
                      ))}
                    </View>
                  ) : null}

                  {visibleReviews.map((review) => (
                    <View key={review.id} className="rounded-3xl border border-line bg-surface p-4">
                      <View className="flex-row items-center justify-between gap-3">
                        <Text numberOfLines={1} className="flex-1 font-bold text-base text-ink">
                          {review.customerName}
                        </Text>
                        {review.createdAt ? (
                          <Text className="font-medium text-xs text-muted">
                            {review.createdAt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </Text>
                        ) : null}
                      </View>
                      <View accessible accessibilityLabel={`${review.rating} out of 5 stars`} className="mt-1 flex-row gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} size={14} color={colors.star} fill={star <= review.rating ? colors.star : 'transparent'} />
                        ))}
                      </View>
                      {review.comment ? <Text className="mt-2 font-body text-sm leading-5 text-ink">{review.comment}</Text> : null}
                    </View>
                  ))}

                  {reviewCount > REVIEW_PREVIEW ? (
                    <AppButton
                      variant="outline"
                      label={showAllReviews ? 'Show fewer reviews' : `Read all ${reviewCount} reviews`}
                      onPress={() => setShowAllReviews((value) => !value)}
                    />
                  ) : null}
                </View>
              )}
            </Section>
          </>
        )}
      </Screen>

      <Modal visible={openPhoto !== null} transparent animationType="fade" onRequestClose={() => setOpenPhoto(null)}>
        <View className="flex-1 bg-black">
          <SafeAreaView edges={['top']} className="items-end px-4 py-2">
            <HeaderButton onHero label="Close photo" onPress={() => setOpenPhoto(null)}>
              <Text className="font-bold text-2xl text-white">×</Text>
            </HeaderButton>
          </SafeAreaView>
          {openPhoto ? <Image source={{ uri: openPhoto }} resizeMode="contain" className="flex-1" accessibilityLabel="Work photo" /> : null}
        </View>
      </Modal>
    </Protected>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <View className="mt-8">
      <View className="mb-3 flex-row items-baseline justify-between gap-3">
        <Text accessibilityRole="header" className="font-heading text-lg text-ink">
          {title}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function StatTile({ value, label, icon }: { value: string; label: string; icon?: React.ReactNode }) {
  return (
    <View accessible accessibilityLabel={`${label}: ${value}`} className="flex-1 items-center rounded-2xl bg-canvas px-1 py-3">
      <View className="flex-row items-center gap-1">
        {icon}
        <Text numberOfLines={1} adjustsFontSizeToFit className="font-heading text-xl text-ink">
          {value}
        </Text>
      </View>
      <Text numberOfLines={1} className="mt-0.5 font-body text-xs text-muted">
        {label}
      </Text>
    </View>
  );
}
