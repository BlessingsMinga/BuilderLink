import { router, useLocalSearchParams } from 'expo-router';
import { ChevronDown, ChevronUp, Star } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useBooking } from '@/features/bookings/hooks/use-bookings';
import { useReviewedBookingIds, useSubmitReview } from '@/features/reviews/hooks/use-reviews';
import { REVIEW_CATEGORIES, type CategoryRatings } from '@/features/reviews/services/review-service';
import { AppButton } from '@/shared/components/app-button';
import { FormField } from '@/shared/components/form-field';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';
import { ScreenHeader } from '@/shared/components/screen-header';
import { Skeleton } from '@/shared/components/skeleton';
import { EmptyState, ErrorState, ErrorText, isOfflineError } from '@/shared/components/states';
import { useThemeColors } from '@/shared/theme';

const MIN_COMMENT_LENGTH = 10;

export default function Review() {
  const colors = useThemeColors();
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const session = useAuthStore((state) => state.session);
  const { data: booking, isLoading, isError, error, refetch } = useBooking(bookingId);
  const reviewed = useReviewedBookingIds(session?.userId);
  const submitReview = useSubmitReview();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [showDetail, setShowDetail] = useState(false);
  // Only the detail ratings the customer actually set; the rest follow the overall rating.
  const [detailRatings, setDetailRatings] = useState<Partial<CategoryRatings>>({});
  const [attempted, setAttempted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const commentError =
    attempted && comment.trim().length < MIN_COMMENT_LENGTH
      ? `Write at least ${MIN_COMMENT_LENGTH} characters to help future customers.`
      : null;

  const submit = async () => {
    setAttempted(true);
    setSubmitError(null);
    if (!session || !booking || comment.trim().length < MIN_COMMENT_LENGTH) return;
    const categoryRatings = Object.fromEntries(
      REVIEW_CATEGORIES.map(({ key }) => [key, detailRatings[key] ?? rating]),
    ) as CategoryRatings;
    try {
      await submitReview.mutateAsync({
        bookingId: booking.id,
        builderId: booking.builderId,
        customerId: session.userId,
        customerName: booking.customerName,
        rating,
        categoryRatings,
        comment,
      });
      router.replace('/(tabs)/bookings' as never);
    } catch (failure) {
      console.warn('Review submission failed:', failure);
      setSubmitError(
        isOfflineError(failure)
          ? 'You’re offline. Reconnect and publish your review again.'
          : 'We couldn’t publish your review. Please try again.',
      );
    }
  };

  // Why the form can't be shown, if it can't.
  const blocked = !bookingId
    ? 'Open a completed booking under Bookings to leave a review.'
    : !booking
      ? null
      : booking.customerId !== session?.userId
        ? 'Only the customer who made this booking can review it.'
        : booking.status !== 'completed'
          ? 'You can leave a review once the builder marks this job as completed.'
          : reviewed.data?.includes(booking.id)
            ? 'You’ve already reviewed this booking.'
            : null;
  const canShowForm = Boolean(booking) && !blocked && !reviewed.isLoading;

  return (
    <Protected>
      <Screen
        header={<ScreenHeader title="Leave a review" />}
        footer={
          canShowForm ? (
            <View>
              <ErrorText>{submitError}</ErrorText>
              <View className={submitError ? 'mt-3' : ''}>
                <AppButton label="Publish review" loading={submitReview.isPending} onPress={submit} />
              </View>
            </View>
          ) : undefined
        }
      >
        {blocked ? (
          <EmptyState message={blocked} actionLabel="My bookings" onAction={() => router.replace('/(tabs)/bookings' as never)} />
        ) : isLoading || reviewed.isLoading ? (
          <View accessibilityLabel="Loading" className="gap-4">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-12 w-1/2" />
            <Skeleton className="h-28 w-full" />
          </View>
        ) : isError ? (
          <ErrorState error={error} what="this booking" onRetry={() => refetch()} />
        ) : !booking ? (
          <EmptyState message="This booking no longer exists." />
        ) : (
          <>
            <Text className="font-body text-base text-muted">
              How was working with {booking.builderName} on {booking.service.toLowerCase()}?
            </Text>

            <View className="mt-8 items-center">
              <Stars value={rating} onChange={setRating} size={36} label="Overall rating" />
              <Text className="mt-3 font-medium text-sm text-muted">{rating} out of 5</Text>
            </View>

            <View className="mt-8">
              <FormField
                label="Your review"
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={1000}
                placeholder="Share what went well and what could improve."
                error={commentError}
              />
              <Text className="mt-2 font-body text-sm text-muted">
                Your review is public and shows your name. It can’t be edited after you publish it.
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showDetail }}
              onPress={() => setShowDetail((open) => !open)}
              className="mt-6 h-12 flex-row items-center justify-between"
            >
              <Text className="font-semibold text-base text-ink">Add detail (optional)</Text>
              {showDetail ? <ChevronUp color={colors.muted} size={20} /> : <ChevronDown color={colors.muted} size={20} />}
            </Pressable>
            {showDetail ? (
              <View className="rounded-2xl border border-line px-4">
                {REVIEW_CATEGORIES.map((category, index) => (
                  <View
                    key={category.key}
                    className={`h-14 flex-row items-center justify-between ${index > 0 ? 'border-t border-line' : ''}`}
                  >
                    <Text className="font-body text-base text-ink">{category.label}</Text>
                    <Stars
                      value={detailRatings[category.key] ?? rating}
                      onChange={(value) => setDetailRatings((current) => ({ ...current, [category.key]: value }))}
                      size={22}
                      label={category.label}
                    />
                  </View>
                ))}
              </View>
            ) : null}
          </>
        )}
      </Screen>
    </Protected>
  );
}

function Stars({ value, onChange, size, label }: { value: number; onChange: (value: number) => void; size: number; label: string }) {
  const colors = useThemeColors();
  return (
    <View className="flex-row gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${star} out of 5`}
          accessibilityState={{ selected: star === value }}
          onPress={() => onChange(star)}
        >
          <Star size={size} color={colors.brand} fill={star <= value ? colors.brand : 'transparent'} />
        </Pressable>
      ))}
    </View>
  );
}
