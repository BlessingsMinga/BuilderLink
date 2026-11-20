import { collection, doc, increment, onSnapshot, orderBy, query, serverTimestamp, writeBatch, type Timestamp } from 'firebase/firestore';
import type { ImagePickerAsset } from 'expo-image-picker';
import { notifyUser } from '@/features/notifications/push-service';
import { PORTFOLIO_PRESET, upload } from '@/features/portfolio/services/portfolio-service';
import { firebaseDb } from '@/shared/services/firebase';
import type { Booking } from './booking-service';

export type ChatMessage = {
  id: string;
  senderId: string;
  text: string;
  /** Cloudinary URL for a photo message. */
  imageUrl: string | null;
  /** Null for a moment after sending, until the server stamps it. */
  createdAt: Date | null;
  /** True while the write hasn't reached the server yet. */
  pending: boolean;
};

type MessageDocument = { sender_id: string; text: string; image_url?: string; created_at: Timestamp | null };

const requireDb = () => {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  return firebaseDb;
};

const messagesOf = (bookingId: string) => collection(requireDb(), 'bookings', bookingId, 'messages');

/** Listen to a booking's messages, oldest first. Returns the unsubscribe function. */
export function subscribeToMessages(
  bookingId: string,
  onChange: (messages: ChatMessage[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    query(messagesOf(bookingId), orderBy('created_at', 'asc')),
    { includeMetadataChanges: true },
    (snapshot) =>
      onChange(
        snapshot.docs.map((message) => {
          const raw = message.data({ serverTimestamps: 'estimate' }) as MessageDocument;
          return {
            id: message.id,
            senderId: raw.sender_id,
            text: raw.text,
            imageUrl: raw.image_url ?? null,
            createdAt: raw.created_at?.toDate() ?? null,
            pending: message.metadata.hasPendingWrites,
          };
        }),
      ),
    onError,
  );
}

/** Inbox and notification text for a message. */
function previewOf(text: string, hasPhoto: boolean): string {
  const short = text.length > 120 ? `${text.slice(0, 117)}…` : text;
  return hasPhoto ? (short ? `📷 ${short}` : '📷 Photo') : short;
}

/**
 * Save a message and its inbox summary in one batch (the security rules check
 * they match), then notify the other party. Offline, the batch is queued and
 * the notification goes out once it reaches the server.
 */
async function postMessage(booking: Booking, senderId: string, text: string, imageUrl?: string): Promise<void> {
  const db = requireDb();
  const otherId = senderId === booking.customerId ? booking.builderId : booking.customerId;
  const preview = previewOf(text, Boolean(imageUrl));
  const batch = writeBatch(db);
  batch.set(doc(messagesOf(booking.id)), {
    sender_id: senderId,
    text,
    ...(imageUrl ? { image_url: imageUrl } : {}),
    created_at: serverTimestamp(),
  });
  batch.set(
    doc(db, 'conversations', booking.id),
    {
      participants: [booking.customerId, booking.builderId],
      customer_id: booking.customerId,
      builder_id: booking.builderId,
      customer_name: booking.customerName,
      builder_name: booking.builderName,
      service: booking.service,
      status: booking.status,
      last_message: preview,
      last_sender_id: senderId,
      last_message_at: serverTimestamp(),
      unread: { [otherId]: increment(1), [senderId]: 0 },
    },
    { merge: true },
  );
  await batch.commit();
  void notifyUser({
    senderId,
    recipientId: otherId,
    bookingId: booking.id,
    title: senderId === booking.customerId ? booking.customerName : booking.builderName,
    body: preview,
    data: { bookingId: booking.id, chat: '1' },
  });
}

export async function sendMessage(booking: Booking, senderId: string, text: string): Promise<void> {
  await postMessage(booking, senderId, text.trim());
}

/**
 * Upload a photo and send it as a message, with an optional caption.
 * Chat photos use the public portfolio preset: anyone with the (unguessable)
 * URL can view it, so this is for job photos, not ID documents.
 */
export async function sendPhotoMessage(booking: Booking, senderId: string, asset: ImagePickerAsset, caption = ''): Promise<void> {
  const imageUrl = await upload(`chat/${booking.id}`, PORTFOLIO_PRESET, asset);
  await postMessage(booking, senderId, caption.trim(), imageUrl);
}
