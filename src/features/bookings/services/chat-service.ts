import { addDoc, collection, onSnapshot, orderBy, query, serverTimestamp, type Timestamp } from 'firebase/firestore';
import type { ImagePickerAsset } from 'expo-image-picker';
import { PORTFOLIO_PRESET, upload } from '@/features/portfolio/services/portfolio-service';
import { firebaseDb } from '@/shared/services/firebase';

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

export async function sendMessage(bookingId: string, senderId: string, text: string): Promise<void> {
  await addDoc(messagesOf(bookingId), { sender_id: senderId, text: text.trim(), created_at: serverTimestamp() });
}

/**
 * Upload a photo and send it as a message, with an optional caption.
 * Chat photos use the public portfolio preset: anyone with the (unguessable)
 * URL can view it, so this is for job photos, not ID documents.
 */
export async function sendPhotoMessage(bookingId: string, senderId: string, asset: ImagePickerAsset, caption = ''): Promise<void> {
  const imageUrl = await upload(`chat/${bookingId}`, PORTFOLIO_PRESET, asset);
  await addDoc(messagesOf(bookingId), {
    sender_id: senderId,
    text: caption.trim(),
    image_url: imageUrl,
    created_at: serverTimestamp(),
  });
}
