import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
} from 'firebase/firestore';
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
  createdAt: Date | null;
};

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
  createdAt: raw.created_at?.toDate() ?? null,
});

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

/** Move a booking to a new status. Security rules enforce who may do which transition. */
export async function updateBookingStatus(bookingId: string, status: BookingStatus): Promise<void> {
  await updateDoc(doc(requireDb(), 'bookings', bookingId), { status, updated_at: serverTimestamp() });
}
