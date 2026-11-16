import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchBuilderReviews,
  fetchReviewedBookingIds,
  submitReview,
  type Review,
  type ReviewInput,
} from '../services/review-service';

const reviewsKey = ['reviews'] as const;

/** Reviews left for a builder, newest first. */
export function useBuilderReviews(builderId: string | undefined) {
  return useQuery<Review[]>({
    queryKey: [...reviewsKey, 'builder', builderId],
    queryFn: () => fetchBuilderReviews(builderId!),
    enabled: Boolean(builderId),
  });
}

/** Ids of the bookings the customer has already reviewed. */
export function useReviewedBookingIds(customerId: string | undefined) {
  return useQuery<string[]>({
    queryKey: [...reviewsKey, 'customer', customerId],
    queryFn: () => fetchReviewedBookingIds(customerId!),
    enabled: Boolean(customerId),
  });
}

export function useSubmitReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewInput) => submitReview(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: reviewsKey }),
  });
}
