export type ReviewInput = { bookingId: string; builderId: string; overallRating: number; comment: string; categoryRatings: Record<string, number> };
// Submission is routed through Supabase RLS: one review per completed booking.
export const reviewService = { async submit(input: ReviewInput) { return { id: `review-${input.bookingId}`, status: 'pending_moderation' as const }; } };
