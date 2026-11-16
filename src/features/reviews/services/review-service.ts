import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { firebaseDb } from '@/shared/services/firebase';

/** Detail ratings a customer gives alongside the overall score. Keys match the Firestore rules. */
export const REVIEW_CATEGORIES = [
  { key: 'communication', label: 'Communication' },
  { key: 'work_quality', label: 'Work quality' },
  { key: 'time_management', label: 'Time management' },
  { key: 'value_for_money', label: 'Value for money' },
  { key: 'professionalism', label: 'Professionalism' },
] as const;

export type ReviewCategoryKey = (typeof REVIEW_CATEGORIES)[number]['key'];
export type CategoryRatings = Record<ReviewCategoryKey, number>;

export type Review = {
  /** Same as the booking id: one review per completed booking. */
  id: string;
  bookingId: string;
  builderId: string;
  customerId: string;
  customerName: string;
  rating: number;
  categoryRatings: CategoryRatings;
  comment: string;
  createdAt: Date | null;
};

export type ReviewInput = {
  bookingId: string;
  builderId: string;
  customerId: string;
  /** Must equal the name stored on the booking; security rules check it. */
  customerName: string;
  rating: number;
  categoryRatings: CategoryRatings;
  comment: string;
};

type ReviewDocument = {
  booking_id: string;
  builder_id: string;
  customer_id: string;
  customer_name: string;
  rating: number;
  category_ratings: CategoryRatings;
  comment: string;
  created_at: Timestamp | null;
};

const requireDb = () => {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  return firebaseDb;
};

const toReview = (id: string, raw: ReviewDocument): Review => ({
  id,
  bookingId: raw.booking_id,
  builderId: raw.builder_id,
  customerId: raw.customer_id,
  customerName: raw.customer_name,
  rating: raw.rating,
  categoryRatings: raw.category_ratings,
  comment: raw.comment,
  createdAt: raw.created_at?.toDate() ?? null,
});

const newestFirst = (a: Review, b: Review) =>
  (b.createdAt?.getTime() ?? Date.now()) - (a.createdAt?.getTime() ?? Date.now());

/**
 * Publish a review for a completed booking. The review's document id is the
 * booking id, so a booking can only ever be reviewed once.
 */
export async function submitReview(input: ReviewInput): Promise<void> {
  await setDoc(doc(requireDb(), 'reviews', input.bookingId), {
    booking_id: input.bookingId,
    builder_id: input.builderId,
    customer_id: input.customerId,
    customer_name: input.customerName,
    rating: input.rating,
    category_ratings: input.categoryRatings,
    comment: input.comment.trim(),
    created_at: serverTimestamp(),
  });
}

/** Reviews left for a builder, newest first. */
export async function fetchBuilderReviews(builderId: string): Promise<Review[]> {
  const results = await getDocs(query(collection(requireDb(), 'reviews'), where('builder_id', '==', builderId)));
  return results.docs.map((result) => toReview(result.id, result.data() as ReviewDocument)).sort(newestFirst);
}

/** Ids of the bookings this customer has already reviewed. */
export async function fetchReviewedBookingIds(customerId: string): Promise<string[]> {
  const results = await getDocs(query(collection(requireDb(), 'reviews'), where('customer_id', '==', customerId)));
  return results.docs.map((result) => result.id);
}

/** Average overall rating, or null when there are no reviews yet. */
export function averageRating(reviews: Review[]): number | null {
  if (reviews.length === 0) return null;
  return reviews.reduce((total, review) => total + review.rating, 0) / reviews.length;
}
