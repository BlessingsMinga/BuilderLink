import { collection, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc, where, type Timestamp } from 'firebase/firestore';
import { firebaseDb } from '@/shared/services/firebase';
import type { BookingStatus } from './booking-service';

/** Inbox summary for one booking's chat. Maintained by the onMessageCreated function. */
export type Conversation = {
  bookingId: string;
  customerId: string;
  builderId: string;
  customerName: string;
  builderName: string;
  service: string;
  status: BookingStatus;
  lastMessage: string;
  lastSenderId: string;
  lastMessageAt: Date | null;
  unread: Record<string, number>;
  readAt: Record<string, Date>;
};

type ConversationDocument = {
  customer_id: string;
  builder_id: string;
  customer_name: string;
  builder_name: string;
  service: string;
  status: BookingStatus;
  last_message: string;
  last_sender_id: string;
  last_message_at: Timestamp | null;
  unread?: Record<string, number>;
  read_at?: Record<string, Timestamp | null>;
};

const requireDb = () => {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  return firebaseDb;
};

const toConversation = (id: string, raw: ConversationDocument): Conversation => ({
  bookingId: id,
  customerId: raw.customer_id,
  builderId: raw.builder_id,
  customerName: raw.customer_name,
  builderName: raw.builder_name,
  service: raw.service,
  status: raw.status,
  lastMessage: raw.last_message,
  lastSenderId: raw.last_sender_id,
  lastMessageAt: raw.last_message_at?.toDate() ?? null,
  unread: raw.unread ?? {},
  readAt: Object.fromEntries(
    Object.entries(raw.read_at ?? {}).flatMap(([uid, at]) => (at ? [[uid, at.toDate()]] : [])),
  ),
});

/** Live inbox for a user, most recent first. Returns the unsubscribe function. */
export function subscribeToConversations(
  userId: string,
  onChange: (conversations: Conversation[]) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    query(
      collection(requireDb(), 'conversations'),
      where('participants', 'array-contains', userId),
      orderBy('last_message_at', 'desc'),
    ),
    (snapshot) =>
      onChange(
        snapshot.docs.map((item) =>
          toConversation(item.id, item.data({ serverTimestamps: 'estimate' }) as ConversationDocument),
        ),
      ),
    onError,
  );
}

/** Live summary for one chat (null until the first message is sent). */
export function subscribeToConversation(
  bookingId: string,
  onChange: (conversation: Conversation | null) => void,
  onError: (error: unknown) => void,
): () => void {
  return onSnapshot(
    doc(requireDb(), 'conversations', bookingId),
    (snapshot) =>
      onChange(
        snapshot.exists()
          ? toConversation(snapshot.id, snapshot.data({ serverTimestamps: 'estimate' }) as ConversationDocument)
          : null,
      ),
    onError,
  );
}

/** Clear the user's unread count and stamp when they last read the chat. */
export async function markConversationRead(bookingId: string, userId: string): Promise<void> {
  await updateDoc(doc(requireDb(), 'conversations', bookingId), {
    [`unread.${userId}`]: 0,
    [`read_at.${userId}`]: serverTimestamp(),
  });
}
