import { router, useLocalSearchParams, type Href } from 'expo-router';
import { ChevronLeft, Star } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, Text, TextInput, View } from 'react-native';
import { useAuthStore } from '@/features/authentication/store/auth-store';
import { useBooking } from '@/features/bookings/hooks/use-bookings';
import { useReviewedBookingIds, useSubmitReview } from '@/features/reviews/hooks/use-reviews';
import { REVIEW_CATEGORIES, type CategoryRatings } from '@/features/reviews/services/review-service';
import { AppButton } from '@/shared/components/app-button';
import { Protected } from '@/shared/components/protected';
import { Screen } from '@/shared/components/screen';

const MIN_COMMENT_LENGTH = 10;

const initialCategoryRatings = Object.fromEntries(
  REVIEW_CATEGORIES.map((category) => [category.key, 5]),
) as CategoryRatings;

export default function Review() {
  const { bookingId } = useLocalSearchParams<{ bookingId?: string }>();
  const session = useAuthStore((state) => state.session);
  const { data: booking, isLoading, isError, refetch } = useBooking(bookingId);
  const { data: reviewedIds = [], isLoading: isLoadingReviewed } = useReviewedBookingIds(session?.userId);
  const submitReview = useSubmitReview();

  const [rating, setRating] = useState(5);
  const [categoryRatings, setCategoryRatings] = useState<CategoryRatings>(initialCategoryRatings);
  const [comment, setComment] = useState('');

  const submit = async () => {
    if (!session || !booking) return;
    if (comment.trim().length < MIN_COMMENT_LENGTH) {
      return Alert.alert('Add a review', `Please write a short review (at least ${MIN_COMMENT_LENGTH} characters) to help future customers.`);
    }
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
      Alert.alert('Review published', `Thanks. Your review now appears on ${booking.builderName}’s profile.`, [
        { text: 'Done', onPress: () => router.replace('/bookings' as Href) },
      ]);
    } catch (error) {
      console.warn('Review submission failed:', error);
      Alert.alert('Could not publish review', 'We couldn’t publish your review. Check your connection and try again.');
    }
  };

  // Why the form can't be shown, if it can't.
  const blocked = !bookingId
    ? 'Open a completed booking under My bookings to leave a review.'
    : !booking
      ? null
      : booking.customerId !== session?.userId
        ? 'Only the customer who made this booking can review it.'
        : booking.status !== 'completed'
          ? 'You can leave a review once the builder marks this job as completed.'
          : reviewedIds.includes(booking.id)
            ? 'You’ve already reviewed this booking.'
            : null;

  return (
    <Protected>
      <Screen>
        <Pressable onPress={() => router.back()} className="h-11 w-11 items-center justify-center rounded-2xl bg-white">
          <ChevronLeft color="#1E293B" />
        </Pressable>
        <Text className="mt-6 text-3xl font-extrabold text-ink">Rate your experience</Text>

        {blocked ? (
          <View className="mt-10 items-center gap-4 rounded-3xl bg-white p-6">
            <Text className="text-center text-base text-slate-500">{blocked}</Text>
            <Pressable onPress={() => router.replace('/bookings' as Href)} className="rounded-2xl bg-brand px-6 py-3">
              <Text className="font-bold text-white">My bookings</Text>
            </Pressable>
          </View>
        ) : isLoading || isLoadingReviewed ? (
          <View className="mt-16 items-center gap-3">
            <ActivityIndicator size="large" color="#F97316" />
            <Text className="text-slate-500">Loading…</Text>
          </View>
        ) : isError || !booking ? (
          <View className="mt-10 items-center gap-4 rounded-3xl bg-white p-6">
            <Text className="text-base text-slate-500">We couldn’t load this booking.</Text>
            <Pressable onPress={() => refetch()} className="rounded-2xl bg-brand px-6 py-3">
              <Text className="font-bold text-white">Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <Text className="mt-2 text-slate-500">
              How was working with {booking.builderName} on {booking.service.toLowerCase()}?
            </Text>

            <View className="mt-8 items-center rounded-3xl bg-white p-6">
              <Text className="text-lg font-bold text-ink">Overall rating</Text>
              <View className="mt-4">
                <Stars value={rating} onChange={setRating} size={34} label="Overall rating" />
              </View>
              <Text className="mt-3 font-semibold text-slate-500">{rating} out of 5</Text>
            </View>

            <Text className="mt-8 text-lg font-bold text-ink">Rate the details</Text>
            <View className="mt-3 gap-2">
              {REVIEW_CATEGORIES.map((category) => (
                <View key={category.key} className="flex-row items-center justify-between rounded-2xl bg-white p-4">
                  <Text className="font-semibold text-ink">{category.label}</Text>
                  <Stars
                    value={categoryRatings[category.key]}
                    onChange={(value) => setCategoryRatings((current) => ({ ...current, [category.key]: value }))}
                    size={22}
                    label={category.label}
                  />
                </View>
              ))}
            </View>

            <Text className="mt-8 text-lg font-bold text-ink">Your review</Text>
            <TextInput
              value={comment}
              onChangeText={setComment}
              multiline
              textAlignVertical="top"
              maxLength={1000}
              className="mt-3 h-32 rounded-2xl bg-white px-4 pt-4 text-base"
              placeholder="Share what went well and what could improve."
            />
            <Text className="mt-3 text-sm text-slate-500">
              Your review is public and shows your name. It can’t be edited after you publish it.
            </Text>

            <View className="my-7">
              <AppButton label="Publish review" loading={submitReview.isPending} onPress={submit} />
            </View>
          </>
        )}
      </Screen>
    </Protected>
  );
}

function Stars({ value, onChange, size, label }: { value: number; onChange: (value: number) => void; size: number; label: string }) {
  return (
    <View className="flex-row gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Pressable
          key={star}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${star} out of 5`}
          accessibilityState={{ selected: star === value }}
          onPress={() => onChange(star)}
        >
          <Star size={size} color="#F97316" fill={star <= value ? '#F97316' : 'transparent'} />
        </Pressable>
      ))}
    </View>
  );
}
