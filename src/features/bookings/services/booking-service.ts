import {
  collection,
  doc,
  getDoc,
  getDocs,
  increment,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentReference,
  type Timestamp,
} from 'firebase/firestore';
import { formatShortDate, notifyUser } from '@/features/notifications/push-service';
import { firebaseDb } from '@/shared/services/firebase';

export type BookingStatus = 'pending' | 'accepted' | 'declined' | 'cancelled' | 'completed';

/** Which side of a booking the signed-in user is looking at. */
export type BookingPerspective = 'customer' | 'builder';

export type Booking = {
  id: string;
  customerId: string;
  builderId: string;
  customerName: string;
  builderName: string;
  service: string;
  /** ISO calendar date, `YYYY-MM-DD`. */
  preferredDate: string;
  location: string;
  description: string;
  status: BookingStatus;
  /** A different date the builder offered; the customer can agree to it. */
  proposedDate: string | null;
  /** The builder's price in Malawian kwacha, if given. */
  quoteAmount: number | null;
  /** Why the builder declined, if they said. */
  declineReason: string | null;
  /** Why the customer cancelled, if they said. */
  cancelReason: string | null;
  /** The builder's itemised quote, if they sent one. */
  quote: Quote | null;
  quoteStatus: QuoteStatus | null;
  /** What the customer wants changed when asking for a revised quote. */
  quoteFeedback: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type QuoteItem = { label: string; amount: number };

/** Prices are whole Malawian kwacha; `total` is always the sum of the items. */
export type Quote = { items: QuoteItem[]; total: number; note: string | null };

/** `sent`: waiting on the customer. `revision_requested`: back with the builder. */
export type QuoteStatus = 'sent' | 'accepted' | 'revision_requested';

export const MAX_QUOTE_ITEMS = 10;

/** True when a pending booking is waiting for the customer to answer a counter-offer. */
export function awaitsCustomer(booking: Booking): boolean {
  return booking.status === 'pending' && (Boolean(booking.proposedDate) || booking.quoteStatus === 'sent');
}

export type CreateBookingInput = {
  customerId: string;
  builderId: string;
  builderName: string;
  service: string;
  /** ISO calendar date, `YYYY-MM-DD`. */
  preferredDate: string;
  location: string;
  description: string;
};

type BookingDocument = {
  customer_id: string;
  builder_id: string;
  customer_name: string;
  builder_name: string;
  service: string;
  preferred_date: string;
  location: string;
  description: string;
  status: BookingStatus;
  proposed_date?: string | null;
  quote_amount?: number | null;
  decline_reason?: string | null;
  cancel_reason?: string | null;
  quote?: { items: QuoteItem[]; total: number; note?: string | null } | null;
  quote_status?: QuoteStatus | null;
  quote_feedback?: string | null;
  created_at: Timestamp | null;
  updated_at: Timestamp | null;
};

const requireDb = () => {
  if (!firebaseDb) throw new Error('Firestore is not configured.');
  return firebaseDb;
};

const toBooking = (id: string, raw: BookingDocument): Booking => ({
  id,
  customerId: raw.customer_id,
  builderId: raw.builder_id,
  customerName: raw.customer_name,
  builderName: raw.builder_name,
  service: raw.service,
  preferredDate: raw.preferred_date,
  location: raw.location,
  description: raw.description,
  status: raw.status,
  proposedDate: raw.proposed_date ?? null,
  quoteAmount: raw.quote_amount ?? null,
  declineReason: raw.decline_reason ?? null,
  cancelReason: raw.cancel_reason ?? null,
  quote: raw.quote ? { items: raw.quote.items, total: raw.quote.total, note: raw.quote.note ?? null } : null,
  quoteStatus: raw.quote_status ?? null,
  quoteFeedback: raw.quote_feedback ?? null,
  createdAt: raw.created_at?.toDate() ?? null,
  updatedAt: raw.updated_at?.toDate() ?? null,
});

/** "MWK 150,000" */
export function formatMoney(amount: number): string {
  return `MWK ${amount.toLocaleString('en-GB')}`;
}

/**
 * Convert a user-typed `DD/MM/YYYY` date into ISO `YYYY-MM-DD`.
 * Returns null when the text isn't a real calendar date.
 */
export function parseBookingDate(text: string): string | null {
  const match = /^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/.exec(text.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/** True when an ISO `YYYY-MM-DD` date is before today (device local time). */
export function isPastDate(isoDate: string): boolean {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return isoDate < today;
}

/** Human-readable form of an ISO `YYYY-MM-DD` date, e.g. "4 Dec 2026". */
export function formatBookingDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Create a pending booking request from the signed-in customer to a builder. */
export async function createBooking(input: CreateBookingInput): Promise<string> {
  const db = requireDb();
  // The builder can't read the customer's private profile, so the name is
  // copied onto the booking. Security rules check it matches the profile.
  const profile = await getDoc(doc(db, 'profiles', input.customerId));
  if (!profile.exists()) throw new Error('Your profile could not be found. Sign out and back in, then try again.');
  const customerName = (profile.data().full_name as string | undefined) ?? 'BuilderLink member';

  const ref = doc(collection(db, 'bookings'));
  await setDoc(ref, {
    customer_id: input.customerId,
    builder_id: input.builderId,
    customer_name: customerName,
    builder_name: input.builderName,
    service: input.service,
    preferred_date: input.preferredDate,
    location: input.location.trim(),
    description: input.description.trim(),
    status: 'pending',
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  void notifyUser({
    senderId: input.customerId,
    recipientId: input.builderId,
    bookingId: ref.id,
    title: 'New booking request',
    body: `${customerName} needs a ${input.service.toLowerCase()} on ${formatShortDate(input.preferredDate)}.`,
    data: { bookingId: ref.id },
  });
  return ref.id;
}

/**
 * Bookings the user sent (`customer`) or received (`builder`), newest first.
 * Sorted on the device so no composite Firestore index is needed.
 */
export async function fetchBookings(userId: string, perspective: BookingPerspective): Promise<Booking[]> {
  const db = requireDb();
  const field = perspective === 'customer' ? 'customer_id' : 'builder_id';
  const results = await getDocs(query(collection(db, 'bookings'), where(field, '==', userId)));
  return results.docs
    .map((result) => toBooking(result.id, result.data() as BookingDocument))
    .sort((a, b) => (b.createdAt?.getTime() ?? Date.now()) - (a.createdAt?.getTime() ?? Date.now()));
}

/**
 * Every change a party can make to a booking. Each one maps to exactly one
 * transition allowed by the Firestore security rules.
 */
export type BookingAction =
  | { type: 'accept'; quoteAmount: number | null }
  | { type: 'decline'; reason: string }
  | { type: 'propose'; date: string; quoteAmount: number | null }
  /** Builder sends or revises an itemised quote, optionally for another date. */
  | { type: 'sendQuote'; items: QuoteItem[]; note: string; date: string | null }
  /** Customer accepts the quote; the booking is confirmed. */
  | { type: 'acceptQuote' }
  /** Customer asks the builder to change the quote. */
  | { type: 'requestRevision'; feedback: string }
  | { type: 'complete' }
  | { type: 'cancel'; reason: string }
  /** Customer agrees to the builder's proposed date. */
  | { type: 'acceptProposal'; date: string }
  /** Customer picks a new date. The builder has to confirm it again. */
  | { type: 'reschedule'; date: string };

const optionalText = (text: string) => (text.trim() ? text.trim() : null);

/** The booking fields each action changes (matches the security rules). */
function changesFor(action: BookingAction, before: BookingDocument): Partial<BookingDocument> {
  switch (action.type) {
    case 'accept':
      return { status: 'accepted', quote_amount: action.quoteAmount, proposed_date: null };
    case 'sendQuote': {
      const items = action.items.map((item) => ({ label: item.label.trim(), amount: item.amount }));
      const total = items.reduce((sum, item) => sum + item.amount, 0);
      return {
        quote: { items, total, note: optionalText(action.note) },
        quote_amount: total,
        quote_status: 'sent',
        quote_feedback: null,
        proposed_date: action.date,
      };
    }
    case 'acceptQuote':
      return {
        status: 'accepted',
        quote_status: 'accepted',
        preferred_date: before.proposed_date ?? before.preferred_date,
        proposed_date: null,
      };
    case 'requestRevision':
      return { quote_status: 'revision_requested', quote_feedback: optionalText(action.feedback), proposed_date: null };
    case 'decline':
      return { status: 'declined', decline_reason: optionalText(action.reason), proposed_date: null };
    case 'propose':
      return { proposed_date: action.date, quote_amount: action.quoteAmount };
    case 'complete':
      return { status: 'completed' };
    case 'cancel':
      return { status: 'cancelled', cancel_reason: optionalText(action.reason) };
    case 'acceptProposal':
      return { status: 'accepted', preferred_date: action.date, proposed_date: null };
    case 'reschedule':
      return { status: 'pending', preferred_date: action.date, proposed_date: null };
  }
}

/**
 * Update the booking and the builder's stats in one transaction; the rules
 * only accept the stats change alongside the booking change it counts. If
 * the stats are refused (e.g. the phone's clock is far off), the booking
 * change still goes through on its own: it matters more than the stat.
 */
async function updateWithStats(
  bookingRef: DocumentReference,
  changes: Record<string, unknown>,
  builderId: string,
  stats: (builder: Record<string, unknown>) => Record<string, unknown>,
): Promise<void> {
  const db = requireDb();
  const builderRef = doc(db, 'builders', builderId);
  try {
    await runTransaction(db, async (transaction) => {
      const builder = await transaction.get(builderRef);
      transaction.update(bookingRef, changes);
      if (builder.exists()) transaction.update(builderRef, stats(builder.data()));
    });
  } catch (error) {
    console.warn('Saving builder stats failed; saving the booking change alone:', error);
    await updateDoc(bookingRef, changes);
  }
}

export async function applyBookingAction(bookingId: string, action: BookingAction): Promise<void> {
  const db = requireDb();
  const ref = doc(db, 'bookings', bookingId);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) throw new Error('This booking no longer exists.');
  const before = snapshot.data() as BookingDocument;
  const changes = { ...changesFor(action, before), updated_at: serverTimestamp() };

  const isBuilderReply = ['accept', 'decline', 'propose', 'sendQuote'].includes(action.type);
  const firstReply =
    isBuilderReply && before.status === 'pending' && !before.proposed_date && before.quote_status !== 'sent' && !before.quote;

  if (firstReply && before.created_at) {
    // Running average of how fast the builder replies to new requests.
    const minutes = Math.max(0, Math.round((Date.now() - before.created_at.toMillis()) / 60_000));
    await updateWithStats(ref, changes, before.builder_id, (builder) => {
      const count = (builder.response_count as number | undefined) ?? 0;
      const average = (builder.response_time_minutes as number | null | undefined) ?? 0;
      return {
        response_time_minutes: Math.round((average * count + minutes) / (count + 1)),
        response_count: count + 1,
        last_response_booking_id: bookingId,
      };
    });
  } else if (action.type === 'complete') {
    await updateWithStats(ref, changes, before.builder_id, () => ({
      completed_jobs: increment(1),
      last_completed_booking_id: bookingId,
    }));
  } else {
    await updateDoc(ref, changes);
  }

  const after = { ...before, ...changesFor(action, before) } as BookingDocument;
  if (after.status !== before.status) {
    // Keep the inbox in step. Fails harmlessly when nobody has messaged yet.
    updateDoc(doc(db, 'conversations', bookingId), { status: after.status }).catch(() => undefined);
  }
  void notifyBookingChange(bookingId, before, after);
}

/** Tell the other party what just happened to their booking. */
function notifyBookingChange(bookingId: string, before: BookingDocument, after: BookingDocument): Promise<void> {
  const data = { bookingId };
  const toCustomer = (title: string, body: string) =>
    notifyUser({ senderId: after.builder_id, recipientId: after.customer_id, bookingId, title, body, data });
  const toBuilder = (title: string, body: string) =>
    notifyUser({ senderId: after.customer_id, recipientId: after.builder_id, bookingId, title, body, data });
  const quote = after.quote_amount != null ? ` Quote: ${formatMoney(after.quote_amount)}.` : '';

  if (after.preferred_date !== before.preferred_date && after.status === 'pending') {
    return toBuilder('Booking moved', `${after.customer_name} moved their ${after.service.toLowerCase()} booking to ${formatShortDate(after.preferred_date)}. Please confirm.`);
  }
  if (before.status === after.status) {
    if (after.quote_status === 'sent' && after.quote !== before.quote && after.quote) {
      const when = after.proposed_date ? ` for ${formatShortDate(after.proposed_date)}` : '';
      return toCustomer(
        before.quote ? 'Quote updated' : 'New quote',
        `${after.builder_name} quoted ${formatMoney(after.quote.total)}${when}. Tap to review and accept.`,
      );
    }
    if (after.quote_status === 'revision_requested' && before.quote_status === 'sent') {
      return toBuilder(
        'Quote changes requested',
        after.quote_feedback
          ? `${after.customer_name}: “${after.quote_feedback}”`
          : `${after.customer_name} asked you to revise your quote.`,
      );
    }
    if (after.proposed_date && after.proposed_date !== before.proposed_date) {
      return toCustomer('New date proposed', `${after.builder_name} can do ${formatShortDate(after.proposed_date)} instead.${quote}`);
    }
    return Promise.resolve();
  }
  switch (after.status) {
    case 'accepted':
      if (before.quote_status === 'sent' && after.quote) {
        return toBuilder(
          'Quote accepted',
          `${after.customer_name} accepted your ${formatMoney(after.quote.total)} quote. The job is confirmed for ${formatShortDate(after.preferred_date)}.`,
        );
      }
      return before.proposed_date
        ? toBuilder('New date agreed', `${after.customer_name} agreed to ${formatShortDate(after.preferred_date)}. The job is confirmed.`)
        : toCustomer('Booking accepted', `${after.builder_name} accepted your ${after.service.toLowerCase()} request.${quote}`);
    case 'declined':
      return toCustomer(
        'Booking declined',
        after.decline_reason
          ? `${after.builder_name} declined: “${after.decline_reason}”`
          : `${after.builder_name} can’t take this job. Try another professional.`,
      );
    case 'cancelled':
      return toBuilder(
        'Booking cancelled',
        after.cancel_reason ? `${after.customer_name} cancelled: “${after.cancel_reason}”` : `${after.customer_name} cancelled their booking.`,
      );
    case 'completed':
      return toCustomer('Job completed', `${after.builder_name} marked the job as done. Leave a review to help others.`);
    default:
      return Promise.resolve();
  }
}

/** A single booking the signed-in user is a party to, or null if it doesn't exist. */
export async function fetchBooking(bookingId: string): Promise<Booking | null> {
  const result = await getDoc(doc(requireDb(), 'bookings', bookingId));
  return result.exists() ? toBooking(result.id, result.data() as BookingDocument) : null;
}

/** A local calendar date as ISO `YYYY-MM-DD`. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export type BookingGroups = { needsAction: Booking[]; upcoming: Booking[]; past: Booking[] };

/**
 * Split bookings by what the viewer should do about them.
 * - Builders must respond to pending requests; accepted jobs are upcoming.
 * - Customers are asked to review completed jobs; open requests are upcoming.
 * `reviewedIds` is undefined while still loading, so nothing is flagged prematurely.
 */
export function groupBookings(
  bookings: Booking[],
  perspective: BookingPerspective,
  reviewedIds: string[] | undefined,
): BookingGroups {
  const groups: BookingGroups = { needsAction: [], upcoming: [], past: [] };
  for (const booking of bookings) {
    if (perspective === 'builder') {
      // A pending request with a counter-offer is waiting on the customer, not the builder.
      if (booking.status === 'pending' && !awaitsCustomer(booking)) groups.needsAction.push(booking);
      else if (booking.status === 'pending') groups.upcoming.push(booking);
      else if (booking.status === 'accepted') groups.upcoming.push(booking);
      else groups.past.push(booking);
    } else if (awaitsCustomer(booking)) {
      groups.needsAction.push(booking);
    } else if (booking.status === 'pending' || booking.status === 'accepted') {
      groups.upcoming.push(booking);
    } else if (booking.status === 'completed' && reviewedIds && !reviewedIds.includes(booking.id)) {
      groups.needsAction.push(booking);
    } else {
      groups.past.push(booking);
    }
  }
  // Soonest job first for anything still ahead.
  groups.upcoming.sort((a, b) => a.preferredDate.localeCompare(b.preferredDate));
  return groups;
}
