import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { firebaseDb } from '@/shared/services/firebase';

/**
 * Notifications are sent from the app through Expo's free push service, so
 * no paid server (Cloud Functions) is needed. Security rules only let a user
 * read the push tokens of someone they share a booking with: the sender first
 * records that "contact" (contacts/<me>_<other>), then reads the tokens.
 */

type Push = { title: string; body: string; data: Record<string, string> };

export type Notification = Push & {
  senderId: string;
  recipientId: string;
  /** A booking both people are part of; proves to the rules they're in contact. */
  bookingId: string;
};

/** Contacts already recorded this session, so it's one write per person, not per push. */
const knownContacts = new Set<string>();

async function ensureContact(senderId: string, recipientId: string, bookingId: string): Promise<void> {
  const id = `${senderId}_${recipientId}`;
  if (knownContacts.has(id) || !firebaseDb) return;
  await setDoc(doc(firebaseDb, 'contacts', id), {
    owner_id: senderId,
    contact_id: recipientId,
    booking_id: bookingId,
    updated_at: serverTimestamp(),
  });
  knownContacts.add(id);
}

/** Send a push to every device the recipient has registered. Never throws. */
export async function notifyUser({ senderId, recipientId, bookingId, ...push }: Notification): Promise<void> {
  if (!firebaseDb || !senderId || !recipientId || senderId === recipientId) return;
  try {
    await ensureContact(senderId, recipientId, bookingId);
    const snapshot = await getDoc(doc(firebaseDb, 'push_tokens', recipientId));
    const tokens = (snapshot.data()?.tokens as string[] | undefined) ?? [];
    if (tokens.length === 0) return;
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(tokens.map((to) => ({ to, sound: 'default', channelId: 'default', ...push }))),
    });
  } catch (error) {
    console.warn('Push notification failed:', error);
  }
}

// ---------------------------------------------------------------
// Message text, shared by the features that notify
// ---------------------------------------------------------------

export function formatShortDate(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  if (!year || !month || !day) return iso;
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
