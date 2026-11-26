import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, type Timestamp } from 'firebase/firestore';
import type { ImagePickerAsset } from 'expo-image-picker';
import { notifyUser } from '@/features/notifications/push-service';
import { PORTFOLIO_PRESET, upload } from '@/features/portfolio/services/portfolio-service';
import { firebaseDb } from '@/shared/services/firebase';
import type { Booking } from './booking-service';

/** A progress report the builder posts while the job is under way. */
export type ProgressUpdate = {
  id: string;
  text: string;
  /** Cloudinary URL of a site photo. */
  imageUrl: string | null;
  /** How far along the job is, 0-100, if the builder said. */
  percent: number | null;
  createdAt: Date | null;
};

export type NewProgressUpdate = { text: string; asset: ImagePickerAsset | null; percent: number | null };

type UpdateDocument = { author_id: string; text: string; image_url?: string; percent?: number | null; created_at: Timestamp | null };

const requireDb = () => {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  return firebaseDb;
};

const updatesOf = (bookingId: string) => collection(requireDb(), 'bookings', bookingId, 'updates');

/** Listen to a booking's progress updates, newest first. Returns the unsubscribe function. */
export function subscribeToProgress(
  bookingId: string,
  onChange: (updates: ProgressUpdate[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    query(updatesOf(bookingId), orderBy('created_at', 'desc')),
    (snapshot) =>
      onChange(
        snapshot.docs.map((item) => {
          const raw = item.data({ serverTimestamps: 'estimate' }) as UpdateDocument;
          return {
            id: item.id,
            text: raw.text,
            imageUrl: raw.image_url ?? null,
            percent: raw.percent ?? null,
            createdAt: raw.created_at?.toDate() ?? null,
          };
        }),
      ),
    onError,
  );
}

/** Latest percentage the builder reported, if any. */
export function latestPercent(updates: ProgressUpdate[]): number | null {
  return updates.find((update) => update.percent !== null)?.percent ?? null;
}

/**
 * Post an update (text, photo or both) and tell the customer. Only the builder
 * can post, and only while the booking is accepted; the security rules enforce it.
 */
export async function postProgressUpdate(booking: Booking, update: NewProgressUpdate): Promise<void> {
  const text = update.text.trim();
  if (!text && !update.asset) throw new Error('Add a note or a photo.');
  const imageUrl = update.asset ? await upload(`bookings/${booking.id}/updates`, PORTFOLIO_PRESET, update.asset) : null;
  await addDoc(updatesOf(booking.id), {
    author_id: booking.builderId,
    text,
    ...(imageUrl ? { image_url: imageUrl } : {}),
    ...(update.percent !== null ? { percent: update.percent } : {}),
    created_at: serverTimestamp(),
  });
  const progress = update.percent !== null ? ` (${update.percent}% done)` : '';
  const preview = text ? (text.length > 100 ? `${text.slice(0, 97)}…` : text) : 'New site photo';
  void notifyUser({
    senderId: booking.builderId,
    recipientId: booking.customerId,
    bookingId: booking.id,
    title: `Job update from ${booking.builderName}${progress}`,
    body: preview,
    data: { bookingId: booking.id },
  });
}
